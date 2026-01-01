
import { LEVEL_MULT, SHOW_LEVELS, daysBetween, todayISO, formatDateDMY, difficultyD, getTarget, rankLabel, addNotification, uuid } from "./state.js";

// تطور مستويات البطاقات محلياً:
// - مستوى البطاقة يتغير فقط بناءً على (مرور الأيام) و(تقييم لعبة التقييم).
// - جدول الأيام منذ الإضافة (progressDays) → مستوى:
//   0→0, 1→1, 2→2, 3→3, 4→4, 5→5, 6→6, 14→7, 30→8
//   (أي: الأيام 7-13 تبقى على مستوى 6، والأيام 14-29 تبقى على مستوى 7، وبعد 30 تبقى 8)
// - تأثير الغياب:
//   إذا كان مستوى البطاقة من مستويات الظهور (1/3/6/7/8) وسُجل غياب: تتجمد ولا تتقدم
//   حتى يحدد المستخدم الإجراء عند العودة.

export function levelFromProgressDays(pd){
  const d = Math.max(0, Math.floor(Number(pd) || 0));
  if(d <= 0) return 0;
  if(d === 1) return 1;
  if(d === 2) return 2;
  if(d === 3) return 3;
  if(d === 4) return 4;
  if(d === 5) return 5;
  if(d >= 6 && d < 14) return 6;
  if(d >= 14 && d < 30) return 7;
  return 8;
}

function ensureProgressDays(card, today){
  if(typeof card.progressDays === "number") return;

  // إذا كانت البطاقة قد تم تقييمها سابقاً، نعتمد المستوى الحالي كمرجع (لتجنب قفزات خاطئة بسبب createdAt).
  if(card.lastReviewedIso || card.lastRating){
    const lv = Number(card.level) || 0;
    if(lv === 0) card.progressDays = 0;
    else if(lv === 1) card.progressDays = 1;
    else if(lv === 2) card.progressDays = 2;
    else if(lv === 3) card.progressDays = 3;
    else if(lv === 4) card.progressDays = 4;
    else if(lv === 5) card.progressDays = 5;
    else if(lv === 6) card.progressDays = 6;
    else if(lv === 7) card.progressDays = 14;
    else card.progressDays = 30;
    return;
  }

  // بطاقات جديدة/غير مُقيّمة: نُقدر الأيام منذ الإضافة.
  if(card.createdAt && card.createdAt !== today){
    const ds = Math.max(0, daysBetween(card.createdAt, today));
    card.progressDays = ds;

    // إذا كان المستوى موجوداً مسبقاً، نثبت التوافق ضمن نطاق هذا المستوى.
    const lv = Number(card.level);
    if(Number.isFinite(lv)){
      if(lv === 6) card.progressDays = Math.min(13, Math.max(6, ds));
      else if(lv === 7) card.progressDays = Math.min(29, Math.max(14, ds));
      else if(lv === 8) card.progressDays = Math.max(30, ds);
      else card.progressDays = Math.min(6, Math.max(0, lv));
    }
  } else {
    card.progressDays = Number(card.level) || 0;
  }
}

export function applyDailyCardProgress(state){
  const today = todayISO();
  // ضمان وجود progressDays للبطاقات الحالية
  for(const id of state.cards.order){
    const c = state.cards.byId[id];
    if(!c || c.ignored || c.completed) continue;
    ensureProgressDays(c, today);
    c.level = levelFromProgressDays(c.progressDays);
  }
  const lastTick = state.attendance.lastTickIso || state.attendance.lastOpenedIso || today;
  const gap = daysBetween(lastTick, today);

  if(gap <= 0){
    state.attendance.lastTickIso = today;
    state.attendance.lastOpenedIso = today;
    return;
  }

  for(let i=0;i<gap;i++){
    const dayEnded = addDaysISO(lastTick, i); // هذا اليوم انتهى بالفعل
    const attended = !!state.attendance.days[dayEnded]?.completed;

    for(const id of state.cards.order){
      const c = state.cards.byId[id];
      if(!c || c.ignored || c.completed) continue;
      if(c.frozen) continue;

      // مستوى البطاقة خلال اليوم الذي انتهى
      const lv = levelFromProgressDays(c.progressDays);
      c.level = lv;

      const wouldShow = SHOW_LEVELS.has(lv);
      if(!attended && wouldShow){
        c.frozen = true;
        state.attendance.missedPending.push({ iso: dayEnded });
        continue;
      }

      // مرور يوم طبيعي: نتقدم يوماً واحداً في progressDays ثم نحسب المستوى وفق الجدول
      c.progressDays = (Number(c.progressDays) || 0) + 1;
      c.level = levelFromProgressDays(c.progressDays);
    }
  }

  // إزالة التكرار
  const seen = new Set();
  state.attendance.missedPending = (state.attendance.missedPending||[]).filter(x=>{
    if(!x?.iso) return false;
    if(seen.has(x.iso)) return false;
    seen.add(x.iso);
    return true;
  });

  state.attendance.lastTickIso = today;
  state.attendance.lastOpenedIso = today;
}

export function dailyResetIfNeeded(state){
  const iso = todayISO();
  if(state.economy.lastDailyReset !== iso){
    // --- استرداد نصف ثمن "بطاقة إضافية" غير المستخدمة ---
    // إذا اشترى المستخدم بطاقات إضافية في اليوم السابق ولم يستعملها
    // (أي لم يتجاوز حد 8 بطاقات بإضافته اليومية)، يُعاد 50% من ثمنها
    // في اليوم التالي.
    try{
      const prevIso = state.economy.lastDailyReset;
      const purchased = Number(state.economy.dailyExtraCardsPurchased || 0);
      if(prevIso && purchased > 0){
        const baseMax = 8;
        const prevGroup = state.cards?.dailyGroups?.[prevIso];
        const prevCount = prevGroup?.cardIds?.length || 0;
        const usedExtra = Math.max(0, prevCount - baseMax);
        const unused = Math.max(0, purchased - usedExtra);
        if(unused > 0){
          const refundPerCard = 50; // 50% من 100
          const refund = unused * refundPerCard;
          state.economy.gold = Math.max(0, Number(state.economy.gold || 0) + refund);
          addNotification(state, {
            type: "system",
            title: "استرداد بطاقات إضافية",
            body: `تم استرداد ${refund} ذهب لبطاقات إضافية لم تُستخدم في ${formatDateDMY(prevIso)}.`,
            claimable: false,
          });
        }
      }
    }catch(_){/* ignore */}

    state.economy.lastDailyReset = iso;
    state.economy.dailyExtraCardsPurchased = 0;
    state.economy.dailyGoldEarned = 0;
  }
}

export function seasonCheckAndReset(state){
  const iso = todayISO();
  const passed = daysBetween(state.season.startedAt, iso);
  if(passed < state.season.lengthDays) return;

  // archive season accuracy
  const acc = state.rating.accuracySeason;
  state.rating.history.push({
    season: state.season.season,
    rankKey: state.rating.rankKey,
    subLevel: state.rating.subLevel,
    progress: state.rating.progress,
    correct: acc.correct,
    total: acc.total,
  });

  // next season
  state.season.season += 1;
  state.season.startedAt = iso;

  // reset accuracy counters
  state.rating.accuracySeason = { season: state.season.season, correct: 0, total: 0 };

  // season reset algorithm (local)
  const rk = state.rating.rankKey;
  const elite = new Set(["inspirer","sage","thinker"]);
  const pro = new Set(["master","diamond"]);
  const strivers = new Set(["platinum","emerald"]); // resolving overlap

  if(elite.has(rk)){
    state.rating.rankKey = "platinum";
    state.rating.subLevel = 1;
    state.rating.progress = 0;
  } else if(pro.has(rk)){
    state.rating.rankKey = "emerald";
    state.rating.subLevel = 1;
    state.rating.progress = 0;
  } else if(strivers.has(rk)){
    state.rating.rankKey = "gold";
    state.rating.subLevel = 1;
    state.rating.progress = 0;
  } else {
    // keep tier, reset sublevel and progress
    state.rating.subLevel = 1;
    state.rating.progress = 0;
  }

  addNotification(state, { type:"system", title:"بداية موسم جديد", body:"تم تصفير الموسم.", claimable:false });
}

export function newDailyGroup(state){
  const iso = todayISO();
  if(state.cards.dailyGroups[iso]) return state.cards.dailyGroups[iso];
  const g = { iso, titleDMY: formatDateDMY(iso), cardIds: [] };
  state.cards.dailyGroups[iso] = g;
  return g;
}

export function canAddMoreCardsToday(state){
  const baseMax = 8;
  const extra = state.economy.dailyExtraCardsPurchased;
  const max = baseMax + extra;
  const g = state.cards.dailyGroups[todayISO()];
  const count = g?.cardIds?.length || 0;
  return { max, count, can: count < max };
}

export function addCard(state, {a,b,hint}){
  const iso = todayISO();
  const g = newDailyGroup(state);
  const id = uuid();
  const card = {
    id,
    a, b, hint,
    createdAt: iso,
    groupIso: iso,
    level: 0,
    progressDays: 0,
    lastRating: null,
    ignored: false,
    completed: false,
    lastReviewedIso: null,
    frozen: false,
  };
  state.cards.byId[id] = card;
  state.cards.order.unshift(id);
  g.cardIds.push(id);
  return card;
}

export function dueCardsForToday(state){
  // تطبيق مرور الأيام + منطق الغياب فوراً
  applyDailyCardProgress(state);

  // due cards are those not ignored/completed and level in show levels
  const due = [];
  for(const id of state.cards.order){
    const c = state.cards.byId[id];
    if(!c || c.ignored || c.completed) continue;
    if(SHOW_LEVELS.has(c.level)) due.push(c);
  }
  return due;
}

export function evolveByAbsence(state){
  const today = todayISO();
  const last = state.attendance.lastOpenedIso || today;
  const gap = daysBetween(last, today);
  if(gap <= 0){
    state.attendance.lastOpenedIso = today;
    return;
  }
  // for each missed day (excluding today)
  for(let i=1;i<=gap;i++){
    const dayIso = addDaysISO(last, i);
    if(dayIso === today) break;

    const attended = !!state.attendance.days[dayIso]?.completed;
    if(attended) continue;

    // absence day: cards evolve depending on whether they would be shown
    for(const id of state.cards.order){
      const c = state.cards.byId[id];
      if(!c || c.ignored || c.completed) continue;

      if(SHOW_LEVELS.has(c.level)){
        // freeze until return action
        c.frozen = true;
        state.attendance.missedPending.push({ iso: dayIso });
      } else {
        c.level = Math.min(8, c.level + 1);
      }
    }
  }
  // dedupe pending
  const seen = new Set();
  state.attendance.missedPending = state.attendance.missedPending.filter(x=>{
    if(seen.has(x.iso)) return false;
    seen.add(x.iso);
    return true;
  });
  state.attendance.lastOpenedIso = today;
}

function addDaysISO(iso, days){
  const d = new Date(iso+"T00:00:00");
  d.setDate(d.getDate()+days);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${dd}`;
}

export function applyReturnChoice(state, choice){
  // choice: "continue"|"restart"|"ignore"
  // apply to all frozen cards
  for(const id of state.cards.order){
    const c = state.cards.byId[id];
    if(!c || !c.frozen) continue;
    if(choice === "continue"){
      c.frozen = false;
    } else if(choice === "restart"){
      c.frozen = false;
      // يعود مستوى البطاقة إلى 1 ويُعتبر هذا اليوم هو "اليوم الثاني" للإضافة
      c.progressDays = 1;
      c.level = 1;
      c.lastReviewedIso = todayISO();
    } else if(choice === "ignore"){
      c.ignored = true;
      c.frozen = false;
      state.cards.ignored.unshift(id);
    }
  }
  state.attendance.missedPending = [];
}

export function speedFactor(sec){
  if(sec <= 5) return 1.30;
  if(sec <= 7) return 1.15;
  if(sec <= 10) return 1.00;
  if(sec <= 15) return 0.80;
  return 0.60;
}

export function errorFactor(errors){
  if(errors < 6) return 1.0;
  if(errors <= 9) return 1.3;
  return 1.7;
}

export function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }

export function computeRewardsForGame({gameKey, pairsOrCards, successCount, wrongCount, avgSec, usedHelp, levelAvg, rankKey, subLevel, priceExtraCard}){
  const L = LEVEL_MULT[levelAvg] ?? 1.0;
  const S = speedFactor(avgSec);
  const D = difficultyD(rankKey, subLevel);
  const rankIdx = Math.max(0, ["wood","iron","copper","silver","gold","emerald","platinum","diamond","master","thinker","sage","inspirer"].indexOf(rankKey));

  const spec = {
    match: { BaseXP:12, BaseRating:6, BaseGold:3, MinXP:2, BaseLoss:8, minGold:8 },
    memory:{ BaseXP:10, BaseRating:5, BaseGold:3.5, MinXP:2, BaseLoss:0, minGold:8 },
    anagram:{ BaseXP:14, BaseRating:7, BaseGold:4, MinXP:2, BaseLoss:9, minGold:6 },
    typing:{ BaseXP:16, BaseRating:8, BaseGold:5, MinXP:2, BaseLoss:10, minGold:6 },
  }[gameKey];

  let xp = 0;
  let rating = 0;
  let goldRaw = 0;

  // correct
  const xpCorrect = spec.BaseXP * S * L * (1 + 0.01*rankIdx);
  const ratingCorrect = (spec.BaseRating * S * L) / D;
  xp += xpCorrect * successCount;
  rating += ratingCorrect * successCount;
  goldRaw += spec.BaseGold * S * L * successCount;

  // wrong
  const xpWrong = spec.MinXP * L;
  xp += xpWrong * wrongCount;

  if(gameKey !== "memory"){
    const ef = errorFactor(wrongCount);
    const ratingWrong = - (spec.BaseLoss * ef * L * D);
    rating += ratingWrong * wrongCount;
  } else {
    // optional slow penalty: if too slow, - once
    if(avgSec > 15) rating -= (8 * L * D);
  }

  // gold penalties
  let gold = goldRaw;
  if(gameKey !== "memory"){
    const pairs = Math.max(1, pairsOrCards);
    const ER = wrongCount / Math.max(1, pairs);
    if(ER > 0.50) gold *= 0.55;
    else if(ER > 0.25) gold *= 0.75;
    else if(ER > 0.10) gold *= 0.90;
  }
  if(usedHelp) gold *= 0.85;

  const maxGold = priceExtraCard; // 100 default
  gold = clamp(gold, spec.minGold, maxGold);

  return { xp: Math.round(xp), rating: Math.round(rating), gold: Math.round(gold) };
}

export function applyRatingDelta(state, delta){
  state.rating.progress += delta;

  // Handle up/down
  while(state.rating.progress >= getTarget(state.rating.rankKey, state.rating.subLevel)){
    state.rating.progress -= getTarget(state.rating.rankKey, state.rating.subLevel);
    state.rating.subLevel += 1;
    const r = state.rating.rankKey;
    const max = maxLevels(r);
    if(state.rating.subLevel > max){
      // promote tier
      const next = nextRankKey(r);
      state.rating.rankKey = next;
      state.rating.subLevel = 1;
    }
  }
  while(state.rating.progress < 0){
    // demote
    state.rating.subLevel -= 1;
    if(state.rating.subLevel < 1){
      const prev = prevRankKey(state.rating.rankKey);
      if(prev){
        state.rating.rankKey = prev;
        state.rating.subLevel = maxLevels(prev);
        state.rating.progress = getTarget(state.rating.rankKey, state.rating.subLevel) + state.rating.progress;
      }else{
        state.rating.rankKey = "wood";
        state.rating.subLevel = 1;
        state.rating.progress = 0;
        break;
      }
    }else{
      state.rating.progress = getTarget(state.rating.rankKey, state.rating.subLevel) + state.rating.progress;
    }
  }
}

function order(){
  return ["wood","iron","copper","silver","gold","emerald","platinum","diamond","master","thinker","sage","inspirer"];
}
function nextRankKey(k){
  const arr = order();
  const i = arr.indexOf(k);
  return arr[Math.min(arr.length-1, i+1)];
}
function prevRankKey(k){
  const arr = order();
  const i = arr.indexOf(k);
  if(i<=0) return null;
  return arr[i-1];
}
function maxLevels(k){
  if(k==="diamond") return 4;
  if(k==="master") return 5;
  if(k==="thinker") return 6;
  if(k==="sage") return 7;
  if(k==="inspirer") return 9999;
  return 3;
}

export function recordAttendance(state){
  const iso = todayISO();
  state.attendance.days[iso] = { completed:true, completedAt: Date.now() };
  // streak segments
  if(!state.streak.lastAttendanceIso){
    state.streak.segments = [{ startIso: iso, length: 1, missed: [] }];
    state.streak.current = 1;
    state.streak.lastAttendanceIso = iso;
    return;
  }
  const gap = daysBetween(state.streak.lastAttendanceIso, iso);
  if(gap === 1){
    const seg = state.streak.segments[state.streak.segments.length-1];
    seg.length += 1;
    state.streak.current = seg.length;
    state.streak.lastAttendanceIso = iso;
  } else if(gap > 1){
    // record missed barrier
    const prevSeg = state.streak.segments[state.streak.segments.length-1];
    const missed = [];
    for(let i=1;i<gap;i++){
      missed.push(addDaysISO(state.streak.lastAttendanceIso, i));
    }
    prevSeg.missed = missed;
    // new segment
    state.streak.segments.push({ startIso: iso, length: 1, missed: [] });
    state.streak.current = 1;
    state.streak.lastAttendanceIso = iso;
  } else {
    // same day repeat
  }
}

export function reconnectStreak(state, fromMissedIndex){
  // reconnect by consuming fuel equal to missed days count for barrier
  const seg = state.streak.segments[state.streak.segments.length-2];
  const missed = seg?.missed || [];
  if(missed.length === 0) return { ok:false };
  const cost = missed.length;
  if(state.economy.fuel < cost) return { ok:false, need:cost };
  state.economy.fuel -= cost;

  // merge segments: add missed + current segment length
  const old = state.streak.segments[state.streak.segments.length-2];
  const cur = state.streak.segments[state.streak.segments.length-1];

  old.length = old.length + missed.length + cur.length;
  old.missed = [];
  state.streak.segments.pop();
  state.streak.current = old.length;
  // update lastAttendance stays as is
  return { ok:true, newLen: old.length };
}

export function computeAvatarLayers(state){
  const frame = state.library.frames.items.find(x=>x.id===state.library.frames.selected);
  const bg = state.library.backgrounds.items.find(x=>x.id===state.library.backgrounds.selected);
  const av = state.library.avatars.items.find(x=>x.id===state.library.avatars.selected);
  return { frame, bg, av };
}

