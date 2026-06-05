
import { LEVEL_MULT, SHOW_LEVELS, daysBetween, todayISO, formatDateDMY, difficultyD, getTarget, rankLabel, addNotification, uuid } from "./state.js";

// ---------------- Normalization (shared by check + hint) ----------------
// Keep this EXACTLY in sync for all answer checking and hint generation.
export function normalizeText(input){
  let s = String(input ?? "");
  try{ s = s.normalize("NFKC"); }catch(_){ /* older engines */ }
  s = s.toLowerCase();
  s = s.trim();
  // collapse internal whitespace (prevents "a   b" vs "a b" mismatches)
  s = s.replace(/\s+/g, " ");
  return s;
}

// ---------------- Tasks (Daily / Weekly / Achievements) ----------------

function addDaysISO(iso, add){
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + add);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

function mondayISO(iso){
  const d = new Date(iso + "T00:00:00");
  // JS: 0=Sunday..6=Saturday. We want Monday as week start.
  const day = d.getDay();
  const diff = (day === 0) ? -6 : (1 - day);
  d.setDate(d.getDate() + diff);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

// ---------------- Mastery Path ----------------

function _addDaysISO(iso, addDays){
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + Number(addDays||0));
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function _masteryIsCompleteToday(state){
  const iso = todayISO();
  const mp = state.masteryPath;
  const t = mp?.today || {};
  const streakSafe = !!(state.streak && state.streak.lastAttendanceIso === iso);
  return !!(t.dueOpened && t.playDone && t.ratingDone && t.trainingDone && streakSafe);
}

function _masteryTodayProgressPercent(state, iso){
  const mp = state?.masteryPath;
  const t = mp?.today || {};
  const streakSafe = !!(state?.streak && state.streak.lastAttendanceIso === iso);
  // same weights as the Mastery Path UI
  let p = 0;
  if(t.dueOpened) p += 15;
  if(t.playDone) p += 40;
  if(t.ratingDone) p += 15;
  if(t.trainingDone) p += 20;
  if(streakSafe) p += 10;
  return Math.max(0, Math.min(100, p));
}

function _sumWeekProgress(progressMap, weekStartIso){
  let sum = 0;
  for(let d=0; d<7; d++){
    const iso = _addDaysISO(weekStartIso, d);
    sum += Math.max(0, Math.min(100, Number(progressMap?.[iso] || 0)));
  }
  return sum;
}

function _isSunday(iso){
  const d = new Date(String(iso) + "T00:00:00");
  return d.getDay() === 0;
}

export function ensureMasteryPath(state){
  if(!state || typeof state !== "object") return;
  const iso = todayISO();

  state.masteryPath = state.masteryPath || {};
  const mp = state.masteryPath;

  mp.dayIso = mp.dayIso || iso;
  mp.today = mp.today || { dueOpened:false, playDone:false, ratingDone:false, trainingDone:false };
  mp.claimed = !!mp.claimed;

  mp.week = mp.week || { weekStartIso: mondayISO(iso), days:{}, progress:{}, claimed:false, skipGranted:false };
  mp.week.weekStartIso = mp.week.weekStartIso || mondayISO(iso);
  mp.week.days = mp.week.days || {};
  mp.week.progress = mp.week.progress || {};
  mp.week.claimed = !!mp.week.claimed;
  mp.week.skipGranted = !!mp.week.skipGranted;

  // migration: older builds used `days` as boolean-only
  try{
    for(const k of Object.keys(mp.week.days||{})){
      if(mp.week.progress[k] == null) mp.week.progress[k] = 100;
    }
  }catch(_){ }

  mp.stats = mp.stats || { totalDaysCompleted: 0, doneDays:{} };
  mp.stats.doneDays = mp.stats.doneDays || {};
  mp.stats.totalDaysCompleted = Math.max(0, Number(mp.stats.totalDaysCompleted || 0));
  mp.stats.weeklySkipGrantedFor = mp.stats.weeklySkipGrantedFor || null;

  // Week rollover
  const ws = mondayISO(iso);
  if(mp.week.weekStartIso !== ws){
    // Week rollover: before resetting, evaluate previous week reward.
    try{
      const prevWeekStart = mp.week.weekStartIso;
      const prevSum = _sumWeekProgress(mp.week.progress, prevWeekStart);
      const qualifies = prevSum >= 630; // 90% of 7*100
      if(qualifies && !mp.week.skipGranted && mp.stats.weeklySkipGrantedFor !== prevWeekStart){
        state.economy = state.economy || {};
        state.economy.skips = Math.max(0, Number(state.economy.skips||0)) + 1;
        // persistent notification
        addNotification(state, {
          id: uuid(),
          type: "reward",
          at: Date.now(),
          title: "مكافأة الأسبوع",
          body: "ربحت (تخطي لعبة) لأنك أنهيت 90% من طريق الإتقان هذا الأسبوع.",
        });
        // allow UI to show a toast once
        mp.week._justGrantedSkip = true;
        mp.stats.weeklySkipGrantedFor = prevWeekStart;
      }
    }catch(_){ }

    mp.week.weekStartIso = ws;
    mp.week.days = {};
    mp.week.progress = {};
    mp.week.claimed = false;
    mp.week.skipGranted = false;
  }

  // Day rollover (record yesterday if completed)
  if(mp.dayIso !== iso){
    const prevIso = mp.dayIso;
    // consider previous day completed if it was fully completed at the time
    // (streak safe implies attendance was recorded on that day)
    const prevStreakSafe = !!(state.streak && state.streak.lastAttendanceIso === prevIso);
    const prevT = mp.today || {};
    const prevDone = !!(prevT.dueOpened && prevT.playDone && prevT.ratingDone && prevT.trainingDone && prevStreakSafe);

    if(prevDone){
      // record for weekly view if inside current week
      if(prevIso >= mp.week.weekStartIso && prevIso <= _addDaysISO(mp.week.weekStartIso, 6)){
        mp.week.days[prevIso] = 1;
      }
      if(!mp.stats.doneDays[prevIso]){
        mp.stats.doneDays[prevIso] = 1;
        mp.stats.totalDaysCompleted += 1;
      }
    }

    // record previous day's progress percent for weekly 90% rule
    try{
      const prevPercent = Math.max(0, Math.min(100, Number(_masteryTodayProgressPercent(state, prevIso) || 0)));
      if(prevIso >= mp.week.weekStartIso && prevIso <= _addDaysISO(mp.week.weekStartIso, 6)){
        mp.week.progress[prevIso] = prevPercent;
        if(prevPercent >= 100) mp.week.days[prevIso] = 1;
      }
    }catch(_){ }

    mp.dayIso = iso;
    mp.today = { dueOpened:false, playDone:false, ratingDone:false, trainingDone:false };
    mp.claimed = false;
  }

  // Keep today's mark synced for weekly view
  const todayPercent = _masteryTodayProgressPercent(state, iso);
  mp.week.progress[iso] = todayPercent;
  if(todayPercent >= 100){
    mp.week.days[iso] = 1;
  }else{
    if(mp.week.days[iso]) delete mp.week.days[iso];
  }

  // Weekly reward: on Sunday, grant "Skip game" if week progress >= 90%.
  // Also granted on week rollover above if user didn't open on Sunday.
  try{
    if(_isSunday(iso)){
      const sum = _sumWeekProgress(mp.week.progress, mp.week.weekStartIso);
      if(sum >= 630 && !mp.week.skipGranted && mp.stats.weeklySkipGrantedFor !== mp.week.weekStartIso){
        state.economy = state.economy || {};
        state.economy.skips = Math.max(0, Number(state.economy.skips||0)) + 1;
        addNotification(state, {
          id: uuid(),
          type: "reward",
          at: Date.now(),
          title: "مكافأة الأسبوع",
          body: "ربحت (تخطي لعبة) لأنك وصلت إلى 90% من طريق الإتقان هذا الأسبوع.",
        });
        mp.week.skipGranted = true;
        mp.week._justGrantedSkip = true;
        mp.stats.weeklySkipGrantedFor = mp.week.weekStartIso;
      }
    }
  }catch(_){ }

  // prune doneDays map (keep ~180 days)
  try{
    const keepFrom = _addDaysISO(iso, -180);
    for(const k of Object.keys(mp.stats.doneDays)){
      if(k < keepFrom) delete mp.stats.doneDays[k];
    }
  }catch(_){}
}

export function masteryMarkDueOpened(state, dueCount=0){
  try{ ensureMasteryPath(state); }catch(_){}
  if(!state?.masteryPath?.today) return;
  state.masteryPath.today.dueOpened = true;
  state.masteryPath.today.dueCount = Math.max(0, Number(dueCount||0));
}

export function masteryMarkPlayFinished(state, { durationSec=0, cardsPlayed=0 } = {}){
  try{ ensureMasteryPath(state); }catch(_){}
  if(!state?.masteryPath?.today) return;
  state.masteryPath.today.playDone = true;
  state.masteryPath.today.ratingDone = true; // Play is finalized only after ratings are saved
  state.masteryPath.today.playDurationSec = Math.max(0, Number(durationSec||0));
  state.masteryPath.today.playCards = Math.max(0, Number(cardsPlayed||0));
}

export function masteryMarkTrainingFinished(state, { durationSec=0, cardsPlayed=0 } = {}){
  try{ ensureMasteryPath(state); }catch(_){}
  if(!state?.masteryPath?.today) return;
  state.masteryPath.today.trainingDone = true;
  state.masteryPath.today.trainingDurationSec = Math.max(0, Number(durationSec||0));
  state.masteryPath.today.trainingCards = Math.max(0, Number(cardsPlayed||0));
}

export function masteryClaimDailyReward(state){
  try{ ensureMasteryPath(state); }catch(_){}
  const mp = state?.masteryPath;
  if(!mp) return false;

  if(mp.claimed) return false;
  if(!_masteryIsCompleteToday(state)) return false;

  // Reward: +1 fuel (keeps economy stable; does not inflate gold)
  state.economy = state.economy || {};
  state.economy.fuel = Math.max(0, Number(state.economy.fuel||0)) + 1;

  mp.claimed = true;
  return true;
}



// Dynamic time limit for the "Fast session" daily task.
// Goal: fair across different numbers of cards (4 cards vs 24+ cards), and avoids extremes.
// Baseline: 12 cards -> 4 minutes. Scale sub-linearly so large sets aren't unfairly impossible,
// but the task still stays meaningful.
function fastSessionLimitSec(cardsPlayed){
  const n = Math.max(0, Math.floor(Number(cardsPlayed) || 0));
  if(n <= 0) return 240;
  const baseCards = 12;
  const baseSec = 240;
  let sec = baseSec * Math.sqrt(n / baseCards);
  // clamp: never too strict for small sets, never too generous for huge sets
  sec = Math.max(180, Math.min(540, sec));
  return Math.round(sec);
}

function formatShortDuration(sec, lang){
  const s = Math.max(0, Math.round(Number(sec) || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if(lang === "en") return `${m}m ${String(r).padStart(2,"0")}s`;
  return `${m}د ${String(r).padStart(2,"0")}ث`;
}

function plannedPlayCardCountNoMutation(state){
  const today = todayISO();
  const cached = state?.attendance?.lessonCache?.[today];
  const cachedIds = Array.isArray(cached) ? cached : (cached?.cardIds);
  if(Array.isArray(cachedIds) && cachedIds.length){
    let cnt = 0;
    for(const id of cachedIds){
      const c = state?.cards?.byId?.[id];
      if(!c || c.ignored || c.completed || c.frozen) continue;
      cnt += 1;
    }
    if(cnt > 0) return cnt;
  }
  // fallback: approximate today's due set from current state without mutating progression
  let cnt = 0;
  const order = Array.isArray(state?.cards?.order) ? state.cards.order : [];
  for(const id of order){
    const c = state?.cards?.byId?.[id];
    if(!c || c.ignored || c.completed || c.frozen) continue;
    if(SHOW_LEVELS.has(c.level)) cnt += 1;
  }
  return cnt;
}

function ensureTasksShape(state){
  state.stats = state.stats || { totalCardsPlayed: 0, cardsPlayedByDay: {} };
  state.stats.cardsPlayedByDay = state.stats.cardsPlayedByDay || {};

  state.tasks = state.tasks || {};
  state.tasks.daily = state.tasks.daily || { iso: todayISO(), progress:{}, claimed:{}, flags:{}, logged:{} };
  state.tasks.weekly = state.tasks.weekly || { weekStartIso: mondayISO(todayISO()), progress:{}, claimed:{}, logged:{} };
  state.tasks.achievements = state.tasks.achievements || { claimed:{} };

  const d = state.tasks.daily;
  d.progress = d.progress || {};
  d.claimed = d.claimed || {};
  d.flags = d.flags || {};
  d.logged = d.logged || {};

  const w = state.tasks.weekly;
  w.progress = w.progress || {};
  w.claimed = w.claimed || {};
  w.logged = w.logged || {};

  state.tasks.achievements.claimed = state.tasks.achievements.claimed || {};
}

export function tasksResetIfNeeded(state){
  ensureTasksShape(state);
  const iso = todayISO();

  // Daily reset: changes when date changes (no need to open at 00:00 to be correct; it's checked on open).
  if(state.tasks.daily.iso !== iso){
    state.tasks.daily.iso = iso;
    state.tasks.daily.progress = {};
    state.tasks.daily.claimed = {};
    state.tasks.daily.flags = {};
    state.tasks.daily.logged = {};
  }

  // Weekly reset: Monday 00:00 (computed by week start ISO)
  const ws = mondayISO(iso);
  if(state.tasks.weekly.weekStartIso !== ws){
    state.tasks.weekly.weekStartIso = ws;
    state.tasks.weekly.progress = {};
    state.tasks.weekly.claimed = {};
    state.tasks.weekly.logged = {};
  }
}

export function tasksOnPlayGameFinished(state, { gameKey, wrongCount=0, usedHelp=false, skipped=false } = {}){
  tasksResetIfNeeded(state);
  const iso = todayISO();

  if(!gameKey || skipped) return;

  // --- Daily: count each game at most once per day (prevents replay abuse)
  const dlog = state.tasks.daily.logged;
  dlog.gameKeys = Array.isArray(dlog.gameKeys) ? dlog.gameKeys : [];
  if(!dlog.gameKeys.includes(gameKey)) dlog.gameKeys.push(gameKey);
  state.tasks.daily.progress.gamesPlayed = dlog.gameKeys.length;

  if(Number(wrongCount) === 0) state.tasks.daily.flags.perfectGame = true;
  if(!usedHelp) state.tasks.daily.flags.noHelpGame = true;

  // --- Weekly: also cap each game once per day
  const wlog = state.tasks.weekly.logged;
  wlog.byDay = (wlog.byDay && typeof wlog.byDay === "object") ? wlog.byDay : {};
  const day = wlog.byDay[iso] || { gameKeys: [], noHelpKeys: [] };
  day.gameKeys = Array.isArray(day.gameKeys) ? day.gameKeys : [];
  day.noHelpKeys = Array.isArray(day.noHelpKeys) ? day.noHelpKeys : [];

  if(!day.gameKeys.includes(gameKey)) day.gameKeys.push(gameKey);
  if(!usedHelp && !day.noHelpKeys.includes(gameKey)) day.noHelpKeys.push(gameKey);
  wlog.byDay[iso] = day;

  // Recompute weekly aggregates
  let games = 0;
  let noHelp = 0;
  for(const k of Object.keys(wlog.byDay)){
    const entry = wlog.byDay[k];
    games += (entry?.gameKeys?.length || 0);
    noHelp += (entry?.noHelpKeys?.length || 0);
  }
  state.tasks.weekly.progress.gamesPlayed = games;
  state.tasks.weekly.progress.gamesNoHelp = noHelp;
}

function sumCardsInWeek(state, weekStartIso, todayIso){
  let sum = 0;
  const start = new Date(weekStartIso + "T00:00:00");
  const end = new Date(todayIso + "T00:00:00");
  for(let d = new Date(start); d <= end; d.setDate(d.getDate()+1)){
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");
    const iso = `${yyyy}-${mm}-${dd}`;
    const g = state.cards?.dailyGroups?.[iso];
    const n = Array.isArray(g?.cardIds) ? g.cardIds.length : 0;
    sum += n;
  }
  return sum;
}

function attendanceDaysInWeek(state, weekStartIso, todayIso){
  let cnt = 0;
  const start = new Date(weekStartIso + "T00:00:00");
  const end = new Date(todayIso + "T00:00:00");
  for(let d = new Date(start); d <= end; d.setDate(d.getDate()+1)){
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");
    const iso = `${yyyy}-${mm}-${dd}`;
    if(state.attendance?.days?.[iso]?.completed) cnt += 1;
  }
  return cnt;
}

function maxConsecutiveAttendanceInWeek(state, weekStartIso, todayIso){
  let best = 0;
  let cur = 0;
  const start = new Date(weekStartIso + "T00:00:00");
  const end = new Date(todayIso + "T00:00:00");
  for(let d = new Date(start); d <= end; d.setDate(d.getDate()+1)){
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");
    const iso = `${yyyy}-${mm}-${dd}`;
    if(state.attendance?.days?.[iso]?.completed){
      cur += 1;
      if(cur > best) best = cur;
    } else {
      cur = 0;
    }
  }
  return best;
}

export function tasksOnPlayLessonFinished(state, { durationSec=0, cardsPlayed=0 } = {}){
  tasksResetIfNeeded(state);
  const iso = todayISO();

  // Attendance flag (requires that recordAttendance ran)
  const attended = !!state.attendance?.days?.[iso]?.completed;
  if(attended) state.tasks.daily.flags.attendance = true;

  // Cards added today/week are evaluated here (so training/add pages can't complete them alone).
  const todayGroup = state.cards?.dailyGroups?.[iso];
  const addedToday = Array.isArray(todayGroup?.cardIds) ? todayGroup.cardIds.length : 0;
  state.tasks.daily.progress.cardsAdded = addedToday;

  // Fast session (dynamic time limit based on cards played)
  const fastLimit = fastSessionLimitSec(cardsPlayed);
  if(Number(durationSec) > 0 && Number(durationSec) < fastLimit) state.tasks.daily.flags.fastSession = true;

  // Weekly derived counters
  const ws = state.tasks.weekly.weekStartIso;
  state.tasks.weekly.progress.cardsAdded = sumCardsInWeek(state, ws, iso);
  state.tasks.weekly.progress.attendanceDays = attendanceDaysInWeek(state, ws, iso);
  state.tasks.weekly.progress.attendanceConsecutiveMax = maxConsecutiveAttendanceInWeek(state, ws, iso);

  // Lifetime cards played (count once per day to avoid replay abuse)
  state.stats.cardsPlayedByDay = state.stats.cardsPlayedByDay || {};
  if(state.stats.cardsPlayedByDay[iso] == null){
    const n = Math.max(0, Math.floor(Number(cardsPlayed) || 0));
    state.stats.cardsPlayedByDay[iso] = n;
    state.stats.totalCardsPlayed = Math.max(0, Math.floor(Number(state.stats.totalCardsPlayed) || 0)) + n;
  }
}

function rewardLabel(reward, lang){
  const isEn = lang === "en";
  if(!reward || typeof reward !== "object") return "";
  if(reward.gold) return isEn ? `+${reward.gold} Gold` : `+${reward.gold} ذهب`;
  if(reward.fuel) return isEn ? `+${reward.fuel} Fuel` : `+${reward.fuel} وقود`;
  if(reward.helps) return isEn ? `+${reward.helps} Help` : `+${reward.helps} مساعدة`;
  return "";
}

function addReward(state, reward){
  if(!reward || typeof reward !== "object") return;
  if(reward.gold){
    const g = Math.max(0, Math.floor(Number(reward.gold) || 0));
    state.economy.gold = Math.max(0, Number(state.economy.gold||0) + g);
    state.economy.totalGoldEarned = Math.max(0, Number(state.economy.totalGoldEarned||0) + g);
  }
  if(reward.fuel){
    const f = Math.max(0, Math.floor(Number(reward.fuel) || 0));
    state.economy.fuel = Math.max(0, Number(state.economy.fuel||0) + f);
  }
  if(reward.helps){
    const h = Math.max(0, Math.floor(Number(reward.helps) || 0));
    state.economy.helps = Math.max(0, Number(state.economy.helps||0) + h);
  }
}

const DAILY_TASKS = [
  { id:"d_attendance", reward:{gold:10},
    title:{ar:"تسجيل الحضور", en:"Attendance"},
    desc:{ar:"سجّل حضورك عبر إنهاء جلسة اللعب (من زر اللعب).", en:"Record attendance by finishing a Play session."},
    progress:(s)=> ({ cur: s.tasks.daily.flags.attendance?1:0, max:1, done: !!s.tasks.daily.flags.attendance })
  },
  { id:"d_add6", reward:{gold:15},
    title:{ar:"إضافة 6 بطاقات", en:"Add 6 cards"},
    desc:{ar:"أضف 6 بطاقات اليوم. يتم احتسابها عند إنهاء جلسة اللعب.", en:"Add 6 cards today. Counted when you finish a Play session."},
    progress:(s)=> { const n = Math.max(0, Math.floor(Number(s.tasks.daily.progress.cardsAdded||0))); return { cur: Math.min(6,n), max:6, done: n>=6 }; }
  },
  { id:"d_perfect_game", reward:{gold:10},
    title:{ar:"لعبة بلا أخطاء", en:"Perfect game"},
    desc:{ar:"أكمل لعبة واحدة كاملة دون أي خطأ (ضمن جلسة اللعب).", en:"Finish one full game with zero mistakes (in Play)."},
    progress:(s)=> ({ cur: s.tasks.daily.flags.perfectGame?1:0, max:1, done: !!s.tasks.daily.flags.perfectGame })
  },
  { id:"d_nohelp_game", reward:{gold:5},
    title:{ar:"لعبة دون مساعدة", en:"No-help game"},
    desc:{ar:"أكمل لعبة واحدة دون استخدام أي مساعدة.", en:"Finish one game without using help."},
    progress:(s)=> ({ cur: s.tasks.daily.flags.noHelpGame?1:0, max:1, done: !!s.tasks.daily.flags.noHelpGame })
  },
  { id:"d_fast_session", reward:{gold:15},
    title:{ar:"جلسة سريعة", en:"Fast session"},
    desc:{ar:"أنه جلسة اللعب ضمن الوقت المحدد (الحد يتغير حسب عدد البطاقات).", en:"Finish the Play session within the time limit (varies by card count)."},
    progress:(s)=> ({ cur: s.tasks.daily.flags.fastSession?1:0, max:1, done: !!s.tasks.daily.flags.fastSession })
  },
  { id:"d_complete5", reward:{gold:25},
    title:{ar:"إكمال 5 مهمات يومية", en:"Complete 5 daily tasks"},
    desc:{ar:"أكمل 5 مهمات يومية (باستثناء هذه المهمة).", en:"Complete 5 daily tasks (excluding this one)."},
    progress:(s)=> {
      const basics = DAILY_TASKS.filter(t=>t.id!=="d_complete5");
      let done = 0;
      for(const t of basics){ if(t.progress(s).done) done += 1; }
      return { cur: Math.min(5, done), max: 5, done: done>=5 };
    }
  }
];

const WEEKLY_TASKS = [
  { id:"w_attendance4_consecutive", reward:{fuel:1},
    title:{ar:"حضور 4 أيام متتالية", en:"4-day streak"},
    desc:{ar:"سجّل حضورك 4 أيام متتالية خلال هذا الأسبوع.", en:"Record attendance for 4 consecutive days this week."},
    progress:(s)=> { const n = Math.max(0, Math.floor(Number(s.tasks.weekly.progress.attendanceConsecutiveMax||0))); return { cur: Math.min(4,n), max:4, done: n>=4 }; }
  },
  { id:"w_add25", reward:{gold:120},
    title:{ar:"إضافة 25 بطاقة", en:"Add 25 cards"},
    desc:{ar:"أضف 25 بطاقة خلال هذا الأسبوع.", en:"Add 25 cards this week."},
    progress:(s)=> { const n = Math.max(0, Math.floor(Number(s.tasks.weekly.progress.cardsAdded||0))); return { cur: Math.min(25,n), max:25, done: n>=25 }; }
  },
  { id:"w_attendance5", reward:{gold:150},
    title:{ar:"حضور 5 أيام", en:"Attend 5 days"},
    desc:{ar:"سجّل حضورك 5 أيام هذا الأسبوع (غير متتالية).", en:"Record attendance for 5 days this week (not necessarily consecutive)."},
    progress:(s)=> { const n = Math.max(0, Math.floor(Number(s.tasks.weekly.progress.attendanceDays||0))); return { cur: Math.min(5,n), max:5, done: n>=5 }; }
  },
  { id:"w_play15", reward:{gold:100},
    title:{ar:"العب 15 لعبة", en:"Play 15 games"},
    desc:{ar:"الحد الأقصى 4 ألعاب في اليوم، وكل لعبة تُحتسب مرة واحدة يوميًا.", en:"Max 4 games per day, each game counts once per day."},
    progress:(s)=> { const n = Math.max(0, Math.floor(Number(s.tasks.weekly.progress.gamesPlayed||0))); return { cur: Math.min(15,n), max:15, done: n>=15 }; }
  },
  { id:"w_nohelp20", reward:{helps:2},
    title:{ar:"20 لعبة دون مساعدة", en:"20 no-help games"},
    desc:{ar:"أكمل 20 لعبة دون استخدام مساعدة (ضمن اللعب).", en:"Complete 20 games without using help (in Play)."},
    progress:(s)=> { const n = Math.max(0, Math.floor(Number(s.tasks.weekly.progress.gamesNoHelp||0))); return { cur: Math.min(20,n), max:20, done: n>=20 }; }
  },
  { id:"w_complete5", reward:{gold:150},
    title:{ar:"إكمال 5 مهمات أسبوعية", en:"Complete 5 weekly tasks"},
    desc:{ar:"أكمل 5 مهمات أسبوعية (باستثناء هذه المهمة).", en:"Complete 5 weekly tasks (excluding this one)."},
    progress:(s)=> {
      const basics = WEEKLY_TASKS.filter(t=>t.id!=="w_complete5");
      let done = 0;
      for(const t of basics){ if(t.progress(s).done) done += 1; }
      return { cur: Math.min(5, done), max: 5, done: done>=5 };
    }
  }
];

function qualifiedPackCount(state){
  const packs = Array.isArray(state.library?.customPacks) ? state.library.customPacks : [];
  return packs.filter(p=> Array.isArray(p?.cardIds) && p.cardIds.length >= 4).length;
}

function rankAtLeast(state, targetKey){
  const order = ["wood","iron","copper","silver","gold","emerald","platinum","diamond","master","thinker","sage","inspirer"];
  const cur = order.indexOf(state.rating?.rankKey || "wood");
  const tar = order.indexOf(targetKey);
  if(tar < 0) return false;
  return cur >= tar;
}

const ACHIEVEMENTS = [
  // 1) Custom packs
  { id:"a_pack_1", reward:{gold:40}, title:{ar:"إنشاء حزمة مخصصة", en:"Create a custom pack"}, desc:{ar:"أنشئ حزمة مخصصة وأضف إليها 4 بطاقات على الأقل.", en:"Create a custom pack and add at least 4 cards."}, metric:(s)=> qualifiedPackCount(s), threshold:1 },
  { id:"a_pack_5", reward:{gold:60}, title:{ar:"5 حزم مخصصة", en:"5 custom packs"}, desc:{ar:"أنشئ 5 حزم، وكل حزمة تحتوي 4 بطاقات على الأقل.", en:"Create 5 packs, each with at least 4 cards."}, metric:(s)=> qualifiedPackCount(s), threshold:5 },
  { id:"a_pack_10", reward:{gold:80}, title:{ar:"10 حزم مخصصة", en:"10 custom packs"}, desc:{ar:"أنشئ 10 حزم، وكل حزمة تحتوي 4 بطاقات على الأقل.", en:"Create 10 packs, each with at least 4 cards."}, metric:(s)=> qualifiedPackCount(s), threshold:10 },
  { id:"a_pack_20", reward:{gold:100}, title:{ar:"20 حزمة مخصصة", en:"20 custom packs"}, desc:{ar:"أنشئ 20 حزمة، وكل حزمة تحتوي 4 بطاقات على الأقل.", en:"Create 20 packs, each with at least 4 cards."}, metric:(s)=> qualifiedPackCount(s), threshold:20 },

  // 2) Completed cards
  { id:"a_completed_8", reward:{gold:80}, title:{ar:"8 بطاقات مكتملة", en:"8 completed cards"}, desc:{ar:"احصل على 8 بطاقات مكتملة.", en:"Reach 8 completed cards."}, metric:(s)=> (s.cards?.completed?.length||0), threshold:8 },
  { id:"a_completed_40", reward:{gold:100}, title:{ar:"40 بطاقة مكتملة", en:"40 completed cards"}, desc:{ar:"احصل على 40 بطاقة مكتملة.", en:"Reach 40 completed cards."}, metric:(s)=> (s.cards?.completed?.length||0), threshold:40 },
  { id:"a_completed_70", reward:{gold:150}, title:{ar:"70 بطاقة مكتملة", en:"70 completed cards"}, desc:{ar:"احصل على 70 بطاقة مكتملة.", en:"Reach 70 completed cards."}, metric:(s)=> (s.cards?.completed?.length||0), threshold:70 },
  { id:"a_completed_100", reward:{gold:250}, title:{ar:"100 بطاقة مكتملة", en:"100 completed cards"}, desc:{ar:"احصل على 100 بطاقة مكتملة.", en:"Reach 100 completed cards."}, metric:(s)=> (s.cards?.completed?.length||0), threshold:100 },

  // 3) Total gold earned
  { id:"a_gold_1000", reward:{gold:100}, title:{ar:"جمع 1000 ذهب", en:"Earn 1,000 gold"}, desc:{ar:"اجمع 1000 ذهب إجمالًا.", en:"Earn a total of 1,000 gold."}, metric:(s)=> (s.economy?.totalGoldEarned||0), threshold:1000 },
  { id:"a_gold_10000", reward:{gold:250}, title:{ar:"جمع 10000 ذهب", en:"Earn 10,000 gold"}, desc:{ar:"اجمع 10000 ذهب إجمالًا.", en:"Earn a total of 10,000 gold."}, metric:(s)=> (s.economy?.totalGoldEarned||0), threshold:10000 },
  { id:"a_gold_100000", reward:{gold:500}, title:{ar:"جمع 100000 ذهب", en:"Earn 100,000 gold"}, desc:{ar:"اجمع 100000 ذهب إجمالًا.", en:"Earn a total of 100,000 gold."}, metric:(s)=> (s.economy?.totalGoldEarned||0), threshold:100000 },

  // 4) Total cards played
  { id:"a_play_500_cards", reward:{gold:200}, title:{ar:"العب بـ 500 بطاقة", en:"Play 500 cards"}, desc:{ar:"العب بإجمالي 500 بطاقة داخل جلسات اللعب.", en:"Play a total of 500 cards in Play sessions."}, metric:(s)=> (s.stats?.totalCardsPlayed||0), threshold:500 },

  // 5) Rank milestones
  { id:"a_rank_gold1", reward:{gold:20}, title:{ar:"الوصول إلى ذهبي 1", en:"Reach Gold I"}, desc:{ar:"صل إلى رتبة ذهبي 1 أو أعلى.", en:"Reach Gold I or higher."}, metric:(s)=> rankAtLeast(s,"gold")?1:0, threshold:1 },
  { id:"a_rank_platinum1", reward:{gold:50}, title:{ar:"الوصول إلى بلاتيني 1", en:"Reach Platinum I"}, desc:{ar:"صل إلى رتبة بلاتيني 1 أو أعلى.", en:"Reach Platinum I or higher."}, metric:(s)=> rankAtLeast(s,"platinum")?1:0, threshold:1 },
  { id:"a_rank_diamond1", reward:{gold:100}, title:{ar:"الوصول إلى ألماسي 1", en:"Reach Diamond I"}, desc:{ar:"صل إلى رتبة ألماسي 1 أو أعلى.", en:"Reach Diamond I or higher."}, metric:(s)=> rankAtLeast(s,"diamond")?1:0, threshold:1 },
  { id:"a_rank_legendary1", reward:{gold:200}, title:{ar:"الوصول إلى أسطوري 1", en:"Reach Legendary I"}, desc:{ar:"صل إلى رتبة أسطوري 1 أو أعلى.", en:"Reach Legendary I or higher."}, metric:(s)=> rankAtLeast(s,"master")?1:0, threshold:1 },
  { id:"a_rank_thinker1", reward:{gold:300}, title:{ar:"الوصول إلى مفكر 1", en:"Reach Thinker I"}, desc:{ar:"صل إلى رتبة مفكر 1 أو أعلى.", en:"Reach Thinker I or higher."}, metric:(s)=> rankAtLeast(s,"thinker")?1:0, threshold:1 },
  { id:"a_rank_sage1", reward:{gold:400}, title:{ar:"الوصول إلى حكيم 1", en:"Reach Sage I"}, desc:{ar:"صل إلى رتبة حكيم 1 أو أعلى.", en:"Reach Sage I or higher."}, metric:(s)=> rankAtLeast(s,"sage")?1:0, threshold:1 },
  { id:"a_rank_inspirer1", reward:{gold:600}, title:{ar:"الوصول إلى ملهم 1", en:"Reach Inspirer I"}, desc:{ar:"صل إلى رتبة ملهم 1 أو أعلى.", en:"Reach Inspirer I or higher."}, metric:(s)=> rankAtLeast(s,"inspirer")?1:0, threshold:1 },

  // 6) Streak
  { id:"a_streak_20", reward:{gold:100}, title:{ar:"حماس 20 يومًا", en:"20-day streak"}, desc:{ar:"حافظ على سلسلة حضور لمدة 20 يومًا.", en:"Maintain a 20-day attendance streak."}, metric:(s)=> (s.streak?.current||0), threshold:20 },
  { id:"a_streak_40", reward:{gold:200}, title:{ar:"حماس 40 يومًا", en:"40-day streak"}, desc:{ar:"حافظ على سلسلة حضور لمدة 40 يومًا.", en:"Maintain a 40-day attendance streak."}, metric:(s)=> (s.streak?.current||0), threshold:40 },
  { id:"a_streak_80", reward:{gold:400}, title:{ar:"حماس 80 يومًا", en:"80-day streak"}, desc:{ar:"حافظ على سلسلة حضور لمدة 80 يومًا.", en:"Maintain an 80-day attendance streak."}, metric:(s)=> (s.streak?.current||0), threshold:80 },
  { id:"a_streak_160", reward:{gold:600}, title:{ar:"حماس 160 يومًا", en:"160-day streak"}, desc:{ar:"حافظ على سلسلة حضور لمدة 160 يومًا.", en:"Maintain a 160-day attendance streak."}, metric:(s)=> (s.streak?.current||0), threshold:160 },
  { id:"a_streak_365", reward:{gold:1200}, title:{ar:"حماس 365 يومًا", en:"365-day streak"}, desc:{ar:"حافظ على سلسلة حضور لمدة 365 يومًا.", en:"Maintain a 365-day attendance streak."}, metric:(s)=> (s.streak?.current||0), threshold:365 },
];

function taskListToView(state, list, lang, claimedMap){
  const isEn = lang === "en";
  return list.map(def=>{
    const p = def.progress(state);
    const claimed = !!claimedMap?.[def.id];
    return {
      id: def.id,
      title: isEn ? def.title.en : def.title.ar,
      desc: isEn ? def.desc.en : def.desc.ar,
      reward: def.reward,
      rewardText: rewardLabel(def.reward, lang),
      cur: p.cur,
      max: p.max,
      done: !!p.done,
      claimed,
    };
  });
}

export function getTasksView(state, lang="ar"){
  tasksResetIfNeeded(state);
  const daily = taskListToView(state, DAILY_TASKS, lang, state.tasks.daily.claimed);
  // Enrich the "Fast session" task with today's computed time limit (no state mutation).
  try{
    const plannedCnt = plannedPlayCardCountNoMutation(state);
    const limitSec = fastSessionLimitSec(plannedCnt);
    const t = formatShortDuration(limitSec, lang);
    for(const it of daily){
      if(it.id === "d_fast_session"){
        it.desc = (lang === "en")
          ? `${it.desc} Today: ${t}.`
          : `${it.desc} حد اليوم: ${t}.`;
      }
    }
  }catch(_){/* ignore */}
  const weekly = taskListToView(state, WEEKLY_TASKS, lang, state.tasks.weekly.claimed);
  const achievements = ACHIEVEMENTS.map(def=>{
    const isEn = lang === "en";
    const cur = Math.max(0, Math.floor(Number(def.metric(state)) || 0));
    const max = Math.max(1, Math.floor(Number(def.threshold) || 1));
    const done = cur >= max;
    const claimed = !!state.tasks.achievements.claimed?.[def.id];
    return {
      id: def.id,
      title: isEn ? def.title.en : def.title.ar,
      desc: isEn ? def.desc.en : def.desc.ar,
      reward: def.reward,
      rewardText: rewardLabel(def.reward, lang),
      cur: Math.min(max, cur),
      max,
      done,
      claimed,
    };
  });
  return { daily, weekly, achievements };
}

export function claimTaskReward(state, scope, id){
  tasksResetIfNeeded(state);
  const lang = "ar";
  const scopeKey = (scope === "daily") ? "daily" : (scope === "weekly") ? "weekly" : "achievements";

  if(scopeKey === "daily"){
    const def = DAILY_TASKS.find(x=>x.id===id);
    if(!def) return { ok:false };
    if(state.tasks.daily.claimed[id]) return { ok:false, already:true };
    const done = !!def.progress(state).done;
    if(!done) return { ok:false, notReady:true };
    addReward(state, def.reward);
    state.tasks.daily.claimed[id] = true;
    return { ok:true, reward:def.reward };
  }

  if(scopeKey === "weekly"){
    const def = WEEKLY_TASKS.find(x=>x.id===id);
    if(!def) return { ok:false };
    if(state.tasks.weekly.claimed[id]) return { ok:false, already:true };
    const done = !!def.progress(state).done;
    if(!done) return { ok:false, notReady:true };
    addReward(state, def.reward);
    state.tasks.weekly.claimed[id] = true;
    return { ok:true, reward:def.reward };
  }

  const def = ACHIEVEMENTS.find(x=>x.id===id);
  if(!def) return { ok:false };
  if(state.tasks.achievements.claimed[id]) return { ok:false, already:true };
  const cur = Math.max(0, Math.floor(Number(def.metric(state)) || 0));
  if(cur < def.threshold) return { ok:false, notReady:true };
  addReward(state, def.reward);
  state.tasks.achievements.claimed[id] = true;
  return { ok:true, reward:def.reward };
}

// True if there is at least one task/achievement that is done but not yet claimed.
export function hasUnclaimedTaskRewards(state){
  try{ tasksResetIfNeeded(state); }catch(_){ }

  // Daily
  try{
    for(const def of DAILY_TASKS){
      const claimed = !!state?.tasks?.daily?.claimed?.[def.id];
      if(claimed) continue;
      const done = !!def.progress(state)?.done;
      if(done) return true;
    }
  }catch(_){ }

  // Weekly
  try{
    for(const def of WEEKLY_TASKS){
      const claimed = !!state?.tasks?.weekly?.claimed?.[def.id];
      if(claimed) continue;
      const done = !!def.progress(state)?.done;
      if(done) return true;
    }
  }catch(_){ }

  // Achievements
  try{
    for(const def of ACHIEVEMENTS){
      const claimed = !!state?.tasks?.achievements?.claimed?.[def.id];
      if(claimed) continue;
      const cur = Math.max(0, Math.floor(Number(def.metric(state)) || 0));
      if(cur >= (Number(def.threshold) || 1)) return true;
    }
  }catch(_){ }

  return false;
}

// تطور مستويات البطاقات محلياً:
// - مستوى البطاقة يتغير فقط بناءً على (مرور الأيام) و(تقييم لعبة التقييم).
// - جدول الأيام منذ الإضافة (progressDays) → مستوى (إتقان جديد):
//   0→0
//   1→1 (تظهر)
//   2→2
//   3→3 (تظهر)
//   4→4
//   5→5
//   6→6 (تظهر)
//   7-13→7 (لا تظهر)
//   14→8 (تظهر)
//   15-29→9 (لا تظهر)
//   30→10 (تظهر)
//   31+ → مكتملة (لا تظهر)
// - تأثير الغياب:
//   إذا كان مستوى البطاقة من مستويات الظهور (1/3/6/8/10) وسُجل غياب: تتجمد ولا تتقدم
//   حتى يحدد المستخدم الإجراء عند العودة.

export function levelFromProgressDays(pd){
  const d = Math.max(0, Math.floor(Number(pd) || 0));
  if(d <= 0) return 0;
  if(d === 1) return 1;
  if(d === 2) return 2;
  if(d === 3) return 3;
  if(d === 4) return 4;
  if(d === 5) return 5;
  if(d === 6) return 6;
  if(d >= 7 && d < 14) return 7;
  if(d === 14) return 8;
  if(d >= 15 && d < 30) return 9;
  return 10; // d >= 30 (ملاحظة: 31+ تُعتبر مكتملة في منطق التقدم اليومي)
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
    else if(lv === 7) card.progressDays = 7;
    else if(lv === 8) card.progressDays = 14;
    else if(lv === 9) card.progressDays = 15;
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
      if(lv === 6) card.progressDays = 6;
      else if(lv === 7) card.progressDays = Math.min(13, Math.max(7, ds));
      else if(lv === 8) card.progressDays = 14;
      else if(lv === 9) card.progressDays = Math.min(29, Math.max(15, ds));
      else if(lv === 10) card.progressDays = Math.max(30, ds);
      else card.progressDays = Math.min(6, Math.max(0, lv));
    }
  } else {
    card.progressDays = Number(card.level) || 0;
  }
}

export function applyDailyCardProgress(state){
  const today = todayISO();
  state.attendance.missedPending = state.attendance.missedPending || [];

  // Index missed days so we can attach cardIds to each missed lesson.
  const pendingMap = new Map();
  for(const p of state.attendance.missedPending){
    if(!p || !p.iso) continue;
    const iso = p.iso;
    const cur = pendingMap.get(iso) || { iso, cardIds: [] };
    const ids = Array.isArray(p.cardIds) ? p.cardIds : [];
    for(const id of ids){
      if(id && !cur.cardIds.includes(id)) cur.cardIds.push(id);
    }
    pendingMap.set(iso, cur);
  }

  const ensurePending = (iso) => {
    const cur = pendingMap.get(iso) || { iso, cardIds: [] };
    if(!Array.isArray(cur.cardIds)) cur.cardIds = [];
    pendingMap.set(iso, cur);
    return cur;
  };
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

      // مستوى البطاقة خلال اليوم الذي انتهى
      const lv = levelFromProgressDays(c.progressDays);
      c.level = lv;

      const wouldShow = SHOW_LEVELS.has(lv);
      if(!attended && wouldShow){
        const entry = ensurePending(dayEnded);
        if(!entry.cardIds.includes(id)) entry.cardIds.push(id);
        c.frozen = true;
        continue;
      }

      // بطاقات مجمّدة لا تتقدم حتى يحدد المستخدم الإجراء عند العودة.
      if(c.frozen) continue;

      // مرور يوم طبيعي: نتقدم يوماً واحداً في progressDays ثم نحسب المستوى وفق الجدول
      c.progressDays = (Number(c.progressDays) || 0) + 1;
      c.level = levelFromProgressDays(c.progressDays);

      // عند الوصول إلى اليوم 31+ (بعد ظهور المستوى 10 في اليوم 30) تعتبر البطاقة مكتملة
      // ولا تعود للظهور في اللعب.
      if((Number(c.progressDays) || 0) >= 31){
        c.completed = true;
        c.frozen = false;
        // نضيفها إلى قائمة المكتمل (للعرض/الإحصاءات) مرة واحدة
        if(!state.cards.completed.includes(id)) state.cards.completed.unshift(id);
      }
    }
  }

  // Save normalized missed list (unique isos, with cardIds).
  state.attendance.missedPending = Array.from(pendingMap.values())
    .filter(x=> x && x.iso)
    .sort((a,b)=> String(a.iso).localeCompare(String(b.iso)));

  state.attendance.lastTickIso = today;
  state.attendance.lastOpenedIso = today;
}

export function applyReturnChoiceToCardIds(state, cardIds, choice){
  const ids = Array.isArray(cardIds) ? cardIds : [];
  for(const id of ids){
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
      if(!state.cards.ignored.includes(id)) state.cards.ignored.unshift(id);
    }
  }
}

export function dailyResetIfNeeded(state){
  const iso = todayISO();
  if(state.economy.lastDailyReset !== iso){
    // Mastery Path: rollover record for previous day
    try{ ensureMasteryPath(state); }catch(_){ }
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
          // count as lifetime earned gold (achievements)
          state.economy.totalGoldEarned = Math.max(0, Number(state.economy.totalGoldEarned||0) + refund);
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
    // Rewarded Ads (Shop): reset daily limits and progress
    state.economy.dailyRewardedFuelClaimed = 0;
    state.economy.dailyRewardedSkipClaimed = 0;
    state.economy.dailyRewardedFuelProgress = 0;
    state.economy.dailyRewardedSkipProgress = 0;
    // Daily unlock: "Due Today" pack
    state.economy.dueTodayUnlockedIso = "";
    state.economy.dueTodayUnlockAt = 0;
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
        // هذه الدالة قد تُستعمل في بعض السيناريوهات القديمة.
        // نحافظ على التوافق مع حد المستوى الجديد.
        c.level = Math.min(10, (Number(c.level)||0) + 1);
        if(c.level >= 10 && (Number(c.progressDays)||0) >= 31){
          c.completed = true;
          if(!state.cards.completed.includes(id)) state.cards.completed.unshift(id);
        }
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

export function applyReturnChoice(state, choice){
  // choice: "continue"|"restart"|"ignore"
  // apply to all frozen cards
  const frozenIds = [];
  for(const id of state.cards.order){
    const c = state.cards.byId[id];
    if(c && c.frozen) frozenIds.push(id);
  }
  applyReturnChoiceToCardIds(state, frozenIds, choice);
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
