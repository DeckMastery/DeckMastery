
import { loadState, saveState, migrate, ensureProfile, computeLevelFromXp, rankLabel, todayISO, formatDateDMY, addNotification } from "./state.js";
import { h, clear, toast, modal, placeholderPage } from "./ui.js";
import { preloadAudio, playBgm, wireSfx, playSfx, setVolumes } from "./audio.js";
import {
  dailyResetIfNeeded, seasonCheckAndReset, newDailyGroup, canAddMoreCardsToday, addCard,
  applyDailyCardProgress, dueCardsForToday, applyReturnChoice, computeRewardsForGame, applyRatingDelta, recordAttendance,
  reconnectStreak, computeAvatarLayers
} from "./logic.js";

const app = document.getElementById("app");
const bgEl = document.getElementById("bg");

let state = migrate(loadState() || null);
saveState(state);

window.addEventListener("hashchange", render);
window.addEventListener("pointerdown", async ()=> {
  // unlock audio
  preloadAudio().catch(()=>{});
}, { once:true, passive:true });

init();

async function init(){
  // icons
  window.lucide?.createIcons?.();

  // preload audio
  preloadAudio().catch(()=>{});

  // route protection: require local profile
  if(!state.profile){
    location.hash = "#/login";
  } else if(!location.hash || location.hash === "#/login"){
    location.hash = "#/home";
  }

  // daily and season checks
  dailyResetIfNeeded(state);
  seasonCheckAndReset(state);
  // تطور مستويات البطاقات مع مرور الأيام
  applyDailyCardProgress(state);
  ensureLocalNotifications();

  // apply stored volumes
  const music = Number(localStorage.getItem("dm_music") ?? "0.65");
  const sfx = Number(localStorage.getItem("dm_sfx") ?? "0.85");
  setVolumes({music, sfx});

  render();

  // show after first render
  document.documentElement.classList.remove("boot");
}

function ensureLocalNotifications(){
  // unread dot if exists
  // add expiry reminder for extra cards if any unused (simple: if bought extra and not reached max)
  // keep minimal, local only
  if(!state.profile) return;
  // once per day reminder if not attended and time is late
  const iso = todayISO();
  const attended = !!state.attendance.days[iso]?.completed;
  const hour = new Date().getHours();
  if(!attended && hour >= 20){
    addNotification(state, { type:"reminder", title:"الدرس اليومي", body:"لم يتم تسجيل حضور اليوم.", claimable:false });
  }
  saveState(state);
}

function setBackground(mode){
  // destroy existing vanta
  if(bgEl._vantaEffect){
    try{ bgEl._vantaEffect.destroy(); }catch{}
    bgEl._vantaEffect = null;
  }

  // تحسين أداء الهواتف: Vanta/three.js قد يثقل الجهاز.
  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const deviceMem = Number(navigator.deviceMemory || 0);
  const cores = Number(navigator.hardwareConcurrency || 0);
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) <= 520;
  const lowEnd = prefersReduced || (deviceMem && deviceMem <= 3) || (cores && cores <= 4) || (coarse && smallScreen);

  if(lowEnd){
    // وضع خفيف: بدون Vanta (خلفية ثابتة من CSS)
    bgEl.classList.add("bg-static");
    return;
  }

  bgEl.classList.remove("bg-static");
  const common = {
    el: bgEl,
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200,
    minWidth: 200,
    // تقليل العبء
    scale: 1.0,
    scaleMobile: 0.85,
  };

  // تهيئة Vanta بعد الإطار التالي لتجنب تجميد أول تحميل
  requestAnimationFrame(()=>{
    if(mode === "focus"){
      bgEl._vantaEffect = window.VANTA?.CLOUDS?.({ ...common, skyColor:0x0b0a16, cloudColor:0x2a204f, cloudShadowColor:0x0, sunColor:0xffcc66, speed:0.30 });
    } else if(mode === "competitive"){
      bgEl._vantaEffect = window.VANTA?.STARS?.({ ...common, backgroundColor:0x07060a, color:0xffcc66, size:1.05, spacing:22, speed:0.75 });
    } else {
      bgEl._vantaEffect = window.VANTA?.CLOUDS?.({ ...common, skyColor:0x0a0912, cloudColor:0x1f2a56, cloudShadowColor:0x0, sunColor:0xffd28a, speed:0.45 });
    }
  });
}

function syncTopbar(){
  const p = state.profile;
  const econ = state.economy;
  const rating = state.rating;

  document.getElementById("btnProfile").disabled = !p;

  document.getElementById("uiName").textContent = p ? p.username : "DeckMastery";
  document.getElementById("uiRank").textContent = rankLabel(rating.rankKey, rating.subLevel);
  const lvl = computeLevelFromXp(econ.xp);
  document.getElementById("uiLevel").textContent = `المستوى ${lvl.level}`;
  document.getElementById("uiXpFill").style.width = `${Math.round(lvl.pct*100)}%`;
  document.getElementById("uiGold").textContent = String(Math.max(0, Math.floor(econ.gold)));

  document.getElementById("uiStreak").textContent = String(state.streak.current || 0);

  // notifications dot
  const hasUnread = state.notifications.items.some(x=>!x.readAt);
  document.getElementById("uiNotiDot").hidden = !hasUnread;

  // avatar composite
  const stack = document.getElementById("avatarStack");
  stack.innerHTML = "";
  if(p){
    const {frame, bg, av} = computeAvatarLayers(state);
    // frame base
    const frameImg = new Image();
    frameImg.src = frame?.src || "";
    frameImg.className = "layer frame";
    // background (80% of frame, centered)
    const bgImg = new Image();
    bgImg.src = bg?.src || "";
    bgImg.className = "layer bg";
    // avatar (80% of bg, center X, bottom aligned)
    const avImg = new Image();
    avImg.src = av?.src || "";
    avImg.className = "layer av";

    // ملاحظة: موضع الطبقات يدار بالكامل عبر CSS (بدون أي انزياح يمين/يسار).

    stack.append(bgImg, avImg, frameImg);
  }
}

wireGlobalActions();

function wireGlobalActions(){
  document.getElementById("btnProfile").addEventListener("click", ()=> nav("#/profile"));
  document.getElementById("btnSettings").addEventListener("click", ()=> nav("#/settings"));
  document.getElementById("btnNotifications").addEventListener("click", ()=> nav("#/notifications"));
  document.getElementById("btnStreak").addEventListener("click", ()=> nav("#/streak"));
}

function nav(hash){
  playSfx("whoosh");
  // تذكّر الصفحة السابقة عند فتح الإعدادات
  if(hash === "#/settings"){
    const from = location.hash && location.hash !== "#/settings" ? location.hash : "#/home";
    sessionStorage.setItem("dm_return_from_settings", from);
  }
  location.hash = hash;
}

function render(){
  // route protection
  if(!state.profile){
    if(location.hash !== "#/login") location.hash = "#/login";
  }
  syncTopbar();

  const route = (location.hash || "#/home").replace("#/","");

  // إخفاء شريط معلومات الحساب أثناء اللعب/التدريب فقط
  document.body.classList.toggle(
    "in-session",
    route === "play" || route === "training"
  );

  clear(app);

  // background + bgm per route
  if(route.startsWith("play") || route.startsWith("add") || route.startsWith("training")){
    setBackground("focus");
    playBgm("focus").catch(()=>{});
  } else if(route.startsWith("leaderboard") || route.startsWith("profile")){
    setBackground("competitive");
    playBgm("competitive").catch(()=>{});
  } else {
    setBackground("main");
    playBgm("main").catch(()=>{});
  }

  if(route === "login") renderLogin();
  else if(route === "home") renderHome();
  else if(route === "add") renderAddCard();
  else if(route === "play") renderPlay();
  else if(route === "training") renderTraining();
  else if(route === "library") renderLibrary();
  else if(route === "shop") renderShop();
  else if(route === "profile") renderProfile();
  else if(route === "settings") renderSettings();
  else if(route === "notifications") renderNotifications();
  else if(route === "streak") renderStreak();
  else if(route === "friends") renderPlaceholder();
  else if(route === "leaderboard") renderLeaderboard();
  else if(route === "tasks") renderPlaceholder("سيتم إضافة المهمات قريبًا.");
  else if(route === "mastery") renderPlaceholder("سيتم إنشاء طريق الإتقان قريبًا.");
  else renderHome();

  wireSfx(app);
  window.lucide?.createIcons?.();
}

function renderPlaceholder(text="سيتم توفير هذه الميزة قريبًا."){
  app.appendChild(placeholderPage(text));
}

function renderLogin(){
  const box = h("section", {class:"glass gold panel"},
    h("div",{class:"panel-title"},
      h("h2",{class:"h1"}, "DeckMastery"),
      h("span",{class:"subtle"}, "البدء")
    ),
    h("div",{class:"field"}, h("label",{}, "الاسم المستعار"), h("input",{id:"u", maxlength:"30", placeholder:""})),
    h("div",{class:"field"}, h("label",{}, "الجنس"),
      h("select",{id:"g"},
        h("option",{value:"male"}, "ذكر"),
        h("option",{value:"female"}, "أنثى"),
        h("option",{value:"other"}, "آخر")
      )
    ),
    h("button",{class:"btn primary", "data-sfx":"tap_primary", onClick: ()=> {
      const u = document.getElementById("u").value.trim();
      const g = document.getElementById("g").value;
      if(!/^[A-Za-z0-9_]{3,30}$/.test(u)){
        toast("اسم غير صالح.");
        return;
      }
      ensureProfile(state, {username:u, gender:g});
      saveState(state);
      nav("#/home");
    }}, "بدء")
  );
  app.appendChild(box);
}

function renderHome(){
  // absence popup if pending
  if(state.attendance.missedPending?.length){
    const body = h("div",{},
      h("div",{class:"subtle"}, "تم رصد أيام غياب."),
      h("div",{class:"hr"}),
      h("div",{class:"row"},
        h("button",{class:"btn", "data-sfx":"tap_secondary", onClick: ()=> { applyReturnChoice(state, "continue"); saveState(state); toast("تم."); close(); }}, "استمرار"),
        h("button",{class:"btn", "data-sfx":"tap_secondary", onClick: ()=> { applyReturnChoice(state, "restart"); saveState(state); toast("تم."); close(); }}, "إعادة"),
        h("button",{class:"btn danger", "data-sfx":"tap_danger", onClick: ()=> { applyReturnChoice(state, "ignore"); saveState(state); toast("تم."); close(); }}, "تجاهل")
      )
    );
    const { close } = modal("العودة بعد الغياب", body, []);
  }

  const grid = h("div",{class:"grid"},
    // زر (لعب): صوت مخصص Laeb.wav بدون صوت التنقل (whoosh)
    h("button",{class:"btn primary", "data-sfx":"laeb", onClick: ()=> { location.hash = "#/play"; }}, "لعب"),
    h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> nav("#/add")}, "إضافة بطاقة"),
    h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> nav("#/library")}, "رزم البطاقات"),
    h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> nav("#/shop")}, "المتجر"),
    h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> nav("#/leaderboard")}, "التصنيف"),
    h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> nav("#/tasks")}, "المهمات"),
    h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> nav("#/mastery")}, "طريق الإتقان"),
    h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> nav("#/friends")}, "الأصدقاء"),
  );

  const panel = h("section",{class:"glass gold panel"},
    h("div",{class:"panel-title"}, h("h2",{class:"h1"}, "الرئيسية"),
      h("span",{class:"subtle"}, formatDateDMY(todayISO()))
    ),
    grid
  );
  app.appendChild(panel);

  // mark daily reset
  dailyResetIfNeeded(state);
  seasonCheckAndReset(state);
  saveState(state);
}

function renderAddCard(){
  const g = newDailyGroup(state);
  const { max, count, can } = canAddMoreCardsToday(state);

  // temp draft stored in memory for this session
  let draft = { a:"", b:"", hint:"" };
  let typed = false;
  let added = 0;

  const counter = h("div",{class:"subtle", id:"counter"}, `البطاقة ${Math.max(1, added+1)} من 4`);
  const date = h("div",{class:"kbd"}, g.titleDMY);
  const maxNote = h("div",{class:"subtle", id:"maxNote"}, "");

  const a = h("input",{maxlength:"45"});
  const b = h("input",{maxlength:"45"});
  const hint = h("input",{maxlength:"60"});

  function update(){
    counter.textContent = `البطاقة ${Math.max(1, added+1)} من 4`;
    const st = canAddMoreCardsToday(state);
    if(!st.can){
      maxNote.textContent = "تم بلوغ الحد اليومي.";
    } else {
      maxNote.textContent = "";
    }
  }

  function commit(){
    const A = a.value;
    const B = b.value;
    const H = hint.value;
    if(!A || !B || !H){
      toast("حقول ناقصة.");
      return false;
    }
    const st = canAddMoreCardsToday(state);
    if(!st.can){
      toast("تم بلوغ الحد.");
      return false;
    }
    addCard(state, {a:A, b:B, hint:H});
    saveState(state);
    added += 1;
    a.value=""; b.value=""; hint.value="";
    typed = false;
    update();
    playSfx("coin");
    return true;
  }

  const btnMore = h("button",{class:"btn", "data-sfx":"edafe", onClick: ()=> commit()}, "إضافة بطاقة أخرى");
  const btnFinish = h("button",{class:"btn primary", "data-sfx":"edafe", onClick: ()=> {
    if(added < 4){
      toast("الحد الأدنى 4.");
      return;
    }
    nav("#/home");
  }}, "إنهاء وحفظ");
  const btnCancel = h("button",{class:"btn danger", "data-sfx":"tahther", onClick: ()=> {
    const any = (a.value||b.value||hint.value);
    if(!any && added===0){
      nav("#/home"); return;
    }
    const body = h("div",{}, h("div",{class:"subtle"}, "حذف البيانات والخروج؟"));
    modal("تأكيد", body, [
      { label:"حسنًا", kind:"ghost", onClick:(close)=> close(), sfx:"tap_secondary" },
      { label:"حذف وخروج", kind:"danger", onClick:(close)=> { a.value=""; b.value=""; hint.value=""; added=0; close(); nav("#/home"); }, sfx:"tap_danger" },
    ]);
  }}, "إلغاء وخروج");

  [a,b,hint].forEach(x=> x.addEventListener("input", ()=> { typed = true; }, {passive:true}));

  const box = h("section",{class:"glass gold panel"},
    h("div",{class:"panel-title"}, h("h2",{class:"h1"}, "إضافة بطاقة"),
      h("div",{class:"row"}, date, h("div",{class:"kbd"}, `الذهب ${state.economy.gold}`))
    ),
    counter,
    h("div",{class:"hr"}),
    h("div",{class:"field"}, h("label",{}, "النص الأصلي"), a),
    h("div",{class:"field"}, h("label",{}, "الترجمة أو التوضيح"), b),
    h("div",{class:"field"}, h("label",{}, "التلميح"), hint),
    h("div",{class:"hr"}),
    h("div",{class:"row"}, btnMore, btnFinish),
    h("div",{class:"row"}, btnCancel, h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> nav("#/shop")}, "المتجر")),
    maxNote
  );

  update();
  app.appendChild(box);
}

function renderPlay(){
  const due = dueCardsForToday(state).filter(c=>!c.frozen);
  if(due.length === 0){
    app.appendChild(h("section",{class:"glass gold panel center"}, h("div",{class:"subtle"}, "لا توجد بطاقات لليوم.")));
    return;
  }

  // Create session (pending rewards)
  const session = {
    startedAt: performance.now(),
    pending: { xp:0, gold:0, rating:0 },
    perGame: [],
    usedHelps: 0,
    usedSkips: 0,
    completed: false,
    cards: shuffle([...due]),
  };

  // pick 30% for anagram/typing without overlap
  const n30 = Math.max(1, Math.floor(session.cards.length*0.30));
  const anagramSet = new Set(session.cards.slice(0, n30).map(c=>c.id));
  const typingSet = new Set(session.cards.slice(n30, n30*2).map(c=>c.id));

  const games = shuffle(["match","memory","anagram","typing"]);
  let gameIndex = 0;

  const panel = h("section",{class:"glass gold panel"});
  const header = h("div",{class:"panel-title"},
    h("h2",{class:"h1"}, "اللعب"),
    h("span",{class:"subtle", id:"timer"}, "00:00")
  );
  panel.appendChild(header);

  const stage = h("div",{class:"no-lams"});
  panel.appendChild(stage);
  app.appendChild(panel);

  // header widgets: help/skip/settings
  const helpBtn = h("button",{class:"icon-btn", "data-sfx":"tap_secondary", onClick: ()=> onHelp()}, h("i",{"data-lucide":"sparkles"}));
  const skipBtn = h("button",{class:"icon-btn", "data-sfx":"tap_secondary", onClick: ()=> onSkip()}, h("i",{"data-lucide":"forward"}));
  const logBtn = h("button",{class:"icon-btn", "data-sfx":"tap_secondary", onClick: ()=> showHelpLog()}, h("i",{"data-lucide":"scroll-text"}));
  const setBtn = h("button",{class:"icon-btn", "data-sfx":"naker", onClick: ()=> openSettingsOverlay()}, h("i",{"data-lucide":"sliders-horizontal"}));
  header.appendChild(h("div",{class:"top-right"}, helpBtn, logBtn, skipBtn, setBtn));

  window.lucide?.createIcons?.();

  // timer
  let timerId = setInterval(()=>{
    const t = Math.floor((performance.now()-session.startedAt)/1000);
    const mm = String(Math.floor(t/60)).padStart(2,"0");
    const ss = String(t%60).padStart(2,"0");
    header.querySelector("#timer").textContent = `${mm}:${ss}`;
  }, 250);

  // help log
  let helpLog = [];

  function openSettingsOverlay(){
    const music = Number(localStorage.getItem("dm_music") ?? "0.65");
    const sfx = Number(localStorage.getItem("dm_sfx") ?? "0.85");

    const m = h("input",{type:"range", min:"0", max:"1", step:"0.01", value:String(music)});
    const s = h("input",{type:"range", min:"0", max:"1", step:"0.01", value:String(sfx)});

    const body = h("div",{},
      h("div",{class:"glass gold card"},
        h("div",{class:"subtle"}, "الصوت"),
        h("div",{class:"field"}, h("label",{}, "مستوى صوت الموسيقى"), m),
        h("div",{class:"field"}, h("label",{}, "مستوى صوت التفاعلات"), s),
      ),
      h("div",{class:"hr"}),
      h("div",{class:"glass gold card"},
        h("div",{class:"subtle"}, "الحساب"),
        h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> modal("تسجيل الخروج", h("div",{class:"subtle"}, "سيتم توفير هذه الميزة قريبًا."), [])}, "تسجيل الخروج"),
        h("button",{class:"btn danger", style:"margin-top:10px;", "data-sfx":"tahther", onClick: ()=> deleteFlowInOverlay()}, "حذف الحساب")
      ),
      h("div",{class:"hr"}),
      h("div",{class:"glass gold card"},
        h("div",{class:"subtle"}, "الدعم"),
        h("div",{class:"subtle"}, "deckmastery.support1@gmail.com")
      ),
    );

    const handle = modal("الإعدادات", body, [
      { label:"رجوع", kind:"primary", sfx:"tap_secondary", onClick:(close)=> close() },
    ]);

    m.addEventListener("input", ()=> {
      localStorage.setItem("dm_music", m.value);
      setVolumes({music:Number(m.value), sfx:Number(s.value)});
    }, {passive:true});
    s.addEventListener("input", ()=> {
      localStorage.setItem("dm_sfx", s.value);
      setVolumes({music:Number(m.value), sfx:Number(s.value)});
    }, {passive:true});

    function deleteFlowInOverlay(){
      const b1 = h("div",{}, h("div",{class:"subtle"}, "هل أنت متأكد؟"));
      modal("حذف", b1, [
        { label:"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
        { label:"متابعة", kind:"danger", sfx:"tap_danger", onClick:(close)=> { close(); step2(); } },
      ]);
      function step2(){
        const b2 = h("div",{}, h("div",{style:"color:var(--danger);font-weight:900;"}, "انتبه! بعد الحذف لن تتمكن من استعادة بياناتك."));
        modal("تحذير", b2, [
          { label:"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
          { label:"متابعة", kind:"danger", sfx:"tap_danger", onClick:(close)=> { close(); step3(); } },
        ]);
      }
      function step3(){
        const pass = h("input",{});
        const b3 = h("div",{}, h("div",{class:"field"}, h("label",{}, "كلمة السر"), pass));
        modal("تأكيد نهائي", b3, [
          { label:"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
          { label:"حذف", kind:"danger", sfx:"tap_danger", onClick:(close)=> {
            localStorage.removeItem("deckmastery_v1");
            close();
            location.reload();
          }},
        ]);
      }
    }
  }

  function onHelp(){
    if(state.economy.helps <= 0){
      playSfx("shake");
      gsap.fromTo(helpBtn, {x:0}, {x:8, duration:0.08, yoyo:true, repeat:3});
      return;
    }
    state.economy.helps -= 1;
    session.usedHelps += 1;
    saveState(state);
    playSfx("popup");
    // effect depends on game; minimal: reveal hint line in log
    helpLog.push("مساعدة مستخدمة.");
    toast("تم استخدام مساعدة.");
  }

  function onSkip(){
    if(state.economy.skips <= 0){
      playSfx("shake");
      gsap.fromTo(skipBtn, {x:0}, {x:-8, duration:0.08, yoyo:true, repeat:3});
      return;
    }
    const body = h("div",{}, h("div",{class:"subtle"}, "تأكيد التخطي؟"));
    modal("تخطي", body, [
      { label:"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
      { label:"تأكيد", kind:"primary", sfx:"tap_primary", onClick:(close)=> {
        state.economy.skips -= 1;
        session.usedSkips += 1;
        saveState(state);
        close();
        // treat current game as perfect and jump forward
        finishGame({ skipped:true, perfect:true });
      }},
    ]);
  }

  function showHelpLog(){
    const body = h("div",{}, ...(helpLog.length? helpLog.map(x=>h("div",{class:"subtle"}, x)) : [h("div",{class:"subtle"}, "لا يوجد.")]));
    modal("سجل المساعدات", body, []);
  }

  function nextStepPopup(){
    const body = h("div",{}, h("div",{class:"subtle"}, "هل تود الاستمرار؟"));
    modal("استمرار", body, [
      { label:"اللعبة التالية", kind:"primary", sfx:"tap_primary", onClick:(close)=> { close(); gameIndex++; runGame(); } },
      { label:"إنهاء الجلسة", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> { close(); runRating(); } },
    ]);
  }

  function runGame(){
    clear(stage);
    window.lucide?.createIcons?.();
    helpLog = [];

    if(gameIndex >= games.length){
      runRating();
      return;
    }
    const gk = games[gameIndex];

    if(gk === "match") renderMatch();
    if(gk === "memory") renderMemory();
    if(gk === "anagram") renderAnagram();
    if(gk === "typing") renderTyping();
  }

  function finishGame(result){
    // compute rewards for this game
    const avgLevel = Math.round(session.cards.reduce((s,c)=>s+c.level,0)/session.cards.length);
    const priceExtraCard = 100;
    const usedHelp = result.usedHelp || false;
    const base = computeRewardsForGame({
      gameKey: result.gameKey,
      pairsOrCards: result.pairsOrCards,
      successCount: result.successCount,
      wrongCount: result.wrongCount,
      avgSec: result.avgSec,
      usedHelp,
      levelAvg: avgLevel,
      rankKey: state.rating.rankKey,
      subLevel: state.rating.subLevel,
      priceExtraCard
    });
    // clamp daily gold cap for lessons: 300
    const dailyCap = 300;
    const remaining = Math.max(0, dailyCap - state.economy.dailyGoldEarned);
    const goldGranted = Math.min(base.gold, remaining);
    state.economy.dailyGoldEarned += goldGranted;

    session.pending.xp += base.xp;
    session.pending.gold += goldGranted;
    session.pending.rating += base.rating;
    session.perGame.push({ ...base, gold: goldGranted, gameKey: result.gameKey });

    // popup flow
    if(gameIndex < games.length-1){
      nextStepPopup();
    } else {
      runRating();
    }
  }

  // Game 1: matching
  function renderMatch(){
    const cards = session.cards;
    const left = shuffle(cards.map(c=>({ id:c.id, type:"a", text:c.a })));
    const right = shuffle(cards.map(c=>({ id:c.id, type:"b", text:c.b })));
    let sel = null;
    let selBtn = null;
    let correct = 0, wrong = 0;
    let lastT = performance.now();
    const times = [];

    const wrap = h("div",{class:"row"});
    const colA = h("div",{class:"card-list"});
    const colB = h("div",{class:"card-list"});
    wrap.append(colA, colB);

    const makeBtn = (item)=> {
      const b = h("button",{class:"btn", "data-sfx":"ekhtiar"}, item.text);
      b.dataset.cardid = item.id;
      b.dataset.type = item.type;
      b.addEventListener("click", ()=> pick(item, b), {passive:true});
      return b;
    };

    left.forEach(it=> colA.appendChild(makeBtn(it)));
    right.forEach(it=> colB.appendChild(makeBtn(it)));

    stage.appendChild(h("div",{class:"subtle"}, "التوصيل"));
    stage.appendChild(h("div",{class:"hr"}));
    stage.appendChild(wrap);

    function pick(item, btn){
      const now = performance.now();
      const dt = (now-lastT)/1000;
      lastT = now;
      times.push(dt);

      // اختيار/إلغاء اختيار البطاقة الأولى
      if(!sel){
        sel = item;
        selBtn = btn;
        btn.classList.add("selected");
        return;
      }
      if(sel.id === item.id && sel.type === item.type){
        selBtn?.classList.remove("selected");
        sel = null;
        selBtn = null;
        return;
      }

      const x = sel;
      const bx = selBtn;
      sel = null;
      selBtn = null;

      const y = item;

      bx?.classList.remove("selected");
      btn.classList.remove("selected");

      const ok = x.id === y.id && x.type !== y.type;
      if(ok){
        correct += 1;
        playSfx("saheh");
        // remove matched pair buttons (حسب المعرف)
        const aBtn = colA.querySelector(`button[data-cardid="${x.id}"][data-type="a"]`);
        const bBtn = colB.querySelector(`button[data-cardid="${x.id}"][data-type="b"]`);
        aBtn?.remove();
        bBtn?.remove();
      } else {
        wrong += 1;
        playSfx("khata");
      }
      if(colA.children.length === 0){
        const avgSec = average(times);
        finishGame({ gameKey:"match", pairsOrCards: correct, successCount: correct, wrongCount: wrong, avgSec, usedHelp: session.usedHelps>0 });
      }
    }
  }

  // Game 2: memory
  function renderMemory(){
    const cs = session.cards;
    const items = shuffle([
      ...cs.map(c=>({ id:c.id, kind:"a", text:c.a })),
      ...cs.map(c=>({ id:c.id, kind:"b", text:c.b })),
    ]);
    let revealed = [];
    let matched = new Set();
    let correct = 0;
    let lastSuccessT = performance.now();
    const times = [];
    const grid = h("div",{style:"display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;"});

    const open = new Set(items.map((_,i)=>i));

    items.forEach((it, idx)=>{
      const tile = h("div",{class:"glass gold card", style:"height:86px; display:flex;align-items:center;justify-content:center; cursor:pointer; user-select:none;"}, it.text);
      tile.addEventListener("click", ()=> flip(idx, tile), {passive:true});
      grid.appendChild(tile);
    });

    stage.appendChild(h("div",{class:"subtle"}, "قلب البطاقات"));
    stage.appendChild(h("div",{class:"hr"}));
    stage.appendChild(grid);

    setTimeout(()=>{
      open.clear();
      [...grid.children].forEach((tile)=> tile.textContent = "✦");
    }, 5000);

    function flip(idx, tile){
      if(matched.has(idx)) return;
      if(open.has(idx)) return;
      if(revealed.includes(idx)) {
        playSfx("ekhtiar");
        revealed = revealed.filter(x=>x!==idx);
        tile.textContent = "✦";
        return;
      }
      if(revealed.length >= 2) return;

      playSfx("ekhtiar");
      tile.textContent = items[idx].text;
      revealed.push(idx);

      if(revealed.length === 2){
        const [i1,i2] = revealed;
        const a = items[i1], b = items[i2];
        const ok = a.id === b.id && a.kind !== b.kind;
        if(ok){
          matched.add(i1); matched.add(i2);
          correct += 1;
          const now = performance.now();
          times.push((now-lastSuccessT)/1000);
          lastSuccessT = now;
          playSfx("saheh");
          setTimeout(()=> {
            const t1 = grid.children[i1];
            const t2 = grid.children[i2];
            if(t1) t1.style.visibility = "hidden";
            if(t2) t2.style.visibility = "hidden";
            revealed = [];
            if(correct >= cs.length){
              const avgSec = average(times.length?times:[6]);
              finishGame({ gameKey:"memory", pairsOrCards: correct, successCount: correct, wrongCount: 0, avgSec, usedHelp: session.usedHelps>0 });
            }
          }, 250);
        } else {
          playSfx("khata");
          setTimeout(()=>{
            if(grid.children[i1]) grid.children[i1].textContent = "✦";
            if(grid.children[i2]) grid.children[i2].textContent = "✦";
            revealed = [];
          }, 800);
        }
      }
    }
  }

  // Game 3: anagram
  function renderAnagram(){
    const pool = session.cards.filter(c=>anagramSet.has(c.id));
    if(pool.length === 0){
      finishGame({ gameKey:"anagram", pairsOrCards: 0, successCount: 0, wrongCount: 0, avgSec: 6, usedHelp:false });
      return;
    }
    let idx = 0;
    let correct = 0, wrong = 0;
    let lastT = performance.now();
    const times = [];

    const card = h("div",{class:"glass gold card"});
    stage.appendChild(h("div",{class:"subtle"}, "ترتيب الأحرف"));
    stage.appendChild(h("div",{class:"hr"}));
    stage.appendChild(card);

    function show(){
      if(idx >= pool.length){
        const avgSec = average(times.length?times:[6]);
        finishGame({ gameKey:"anagram", pairsOrCards: pool.length, successCount: correct, wrongCount: wrong, avgSec, usedHelp: session.usedHelps>0 });
        return;
      }
      const c = pool[idx];
      const letters = shuffle(c.a.split(""));
      const out = [];
      const line = h("div",{style:"font-size:22px;font-weight:900;letter-spacing:1px;min-height:34px;"}, "");
      const buttons = h("div",{class:"row", style:"flex-wrap:wrap; gap:8px; margin-top:10px;"});
      letters.forEach((ch)=>{
        const b = h("button",{class:"btn", "data-sfx":"ekhtiar", onClick: ()=> { out.push(ch); line.textContent = out.join(""); b.disabled = true; }}, ch);
        buttons.appendChild(b);
      });
      const okBtn = h("button",{class:"btn primary", "data-sfx":"tap_primary", style:"margin-top:12px;", onClick: ()=> check(c, out.join(""))}, "موافق");
      clear(card);
      card.append(h("div",{class:"subtle"}, `(${idx+1}/${pool.length})`), line, buttons, okBtn);
    }

    function check(c, answer){
      const now = performance.now();
      times.push((now-lastT)/1000);
      lastT = now;

      if(answer === c.a){
        correct += 1;
        playSfx("saheh");
        idx += 1;
        show();
      } else {
        wrong += 1;
        playSfx("khata");
        toast("خطأ");
        show();
      }
    }

    show();
  }

  // Game 4: typing
  function renderTyping(){
    const pool = session.cards.filter(c=>typingSet.has(c.id) && !anagramSet.has(c.id));
    if(pool.length === 0){
      finishGame({ gameKey:"typing", pairsOrCards: 0, successCount: 0, wrongCount: 0, avgSec: 6, usedHelp:false });
      return;
    }
    let idx = 0;
    let correct = 0, wrong = 0;
    let lastT = performance.now();
    const times = [];

    const card = h("div",{class:"glass gold card"});
    stage.appendChild(h("div",{class:"subtle"}, "الكتابة"));
    stage.appendChild(h("div",{class:"hr"}));
    stage.appendChild(card);

    function show(){
      if(idx >= pool.length){
        const avgSec = average(times.length?times:[6]);
        finishGame({ gameKey:"typing", pairsOrCards: pool.length, successCount: correct, wrongCount: wrong, avgSec, usedHelp: session.usedHelps>0 });
        return;
      }
      const c = pool[idx];
      const input = h("input",{maxlength:"45"});
      const okBtn = h("button",{class:"btn primary", "data-sfx":"tap_primary", style:"margin-top:12px;", onClick: ()=> check(c, input.value)}, "موافق");
      clear(card);
      card.append(
        h("div",{class:"subtle"}, `(${idx+1}/${pool.length})`),
        h("div",{class:"subtle"}, c.b),
        h("div",{class:"field"}, input),
        okBtn
      );
    }

    function check(c, val){
      const now = performance.now();
      times.push((now-lastT)/1000);
      lastT = now;

      const a = (val||"").trim().toLowerCase();
      const b = (c.a||"").trim().toLowerCase();
      if(a === b){
        correct += 1;
        playSfx("saheh");
        idx += 1;
        show();
      } else {
        wrong += 1;
        playSfx("khata");
        toast("خطأ");
      }
    }

    show();
  }

  // Rating game
  function runRating(){
    clear(stage);
    const cards = session.cards;
    let idx = 0;
    let current = null;
    const wrap = h("div",{class:"glass gold card"});
    stage.appendChild(h("div",{class:"subtle"}, "التقييم"));
    stage.appendChild(h("div",{class:"hr"}));
    stage.appendChild(wrap);

    function show(){
      if(idx >= cards.length){
        finalizeLesson();
        return;
      }
      const c = (current = cards[idx]);
      clear(wrap);
      wrap.append(
        h("div",{class:"subtle"}, `(${idx+1}/${cards.length})`),
        h("div",{class:"kbd", style:"margin-top:10px;"}, c.hint),
      );
      const reveal = h("div",{class:"row", style:"margin-top:10px;"}, 
        h("button",{class:"btn", "data-sfx":"tap_secondary", onClick: ()=> modal("النص", h("div",{class:"subtle"}, c.a), [])}, "النص"),
        h("button",{class:"btn", "data-sfx":"tap_secondary", onClick: ()=> modal("المعنى", h("div",{class:"subtle"}, c.b), [])}, "المعنى"),
      );
      const row = h("div",{class:"row", style:"margin-top:10px;"},
        h("button",{class:"btn", "data-sfx":"sahel", onClick: ()=> rate("easy")}, "سهل"),
        h("button",{class:"btn", "data-sfx":"wasat", onClick: ()=> rate("medium")}, "متوسط"),
        h("button",{class:"btn danger", "data-sfx":"saab", onClick: ()=> rate("hard")}, "صعب"),
      );
      wrap.append(reveal, row);
    }

    function rate(v){
      // update card level per spec
      const c = current;
      if(!c) return;
      c.lastRating = v;
      if(v === "hard"){
        c.level = 0;
      } else if(v === "medium"){
        if(c.level <= 3) c.level = 0;
        else c.level = 2;
      } else {
        // easy: no direct change
        // if level 8 and easy -> completed
        if(c.level === 8){
          c.completed = true;
          state.cards.completed.unshift(c.id);
        }
      }
      c.lastReviewedIso = todayISO();

      // accuracy
      state.rating.accuracySeason.total += 1;
      if(v === "easy") state.rating.accuracySeason.correct += 1;

      idx += 1;
      show();
    }

    show();
  }

  function finalizeLesson(){
    clearInterval(timerId);
    // apply pending rewards
    state.economy.xp += session.pending.xp;
    state.economy.gold += session.pending.gold;

    const beforeRank = rankLabel(state.rating.rankKey, state.rating.subLevel);
    const beforeLevel = computeLevelFromXp(state.economy.xp - session.pending.xp).level;

    applyRatingDelta(state, session.pending.rating);

    recordAttendance(state);

    // notification: reward
    addNotification(state, { type:"reward", title:"تم تسجيل الحضور", body:`+${session.pending.gold} ذهب`, claimable:false });

    saveState(state);
    syncTopbar();

    // reward summary with count-up
    const box = h("div",{class:"glass gold panel center"},
      h("h2",{class:"h1"}, "الجوائز"),
      h("div",{class:"hr"}),
      h("div",{class:"card-list"},
        h("div",{class:"glass gold card"}, h("div",{class:"subtle"}, "XP"), h("div",{style:"font-size:24px;font-weight:900;", id:"xpN"}, "0")),
        h("div",{class:"glass gold card"}, h("div",{class:"subtle"}, "الذهب"), h("div",{style:"font-size:24px;font-weight:900;", id:"gN"}, "0")),
        h("div",{class:"glass gold card"}, h("div",{class:"subtle"}, "التصنيف"), h("div",{style:"font-size:24px;font-weight:900;", id:"rN"}, "0")),
      ),
      h("div",{class:"hr"}),
      h("button",{class:"btn primary", "data-sfx":"tap_primary", onClick: ()=> nav("#/home")}, "عودة")
    );
    clear(app);
    app.appendChild(box);

    // confetti
    try{
      confetti({ particleCount: 120, spread: 65, origin:{y:0.75} });
      playSfx("levelup");
    }catch{}

    // count-up
    const xpEl = document.getElementById("xpN");
    const gEl = document.getElementById("gN");
    const rEl = document.getElementById("rN");
    countUp(xpEl, session.pending.xp);
    setTimeout(()=> countUp(gEl, session.pending.gold), 420);
    setTimeout(()=> countUp(rEl, session.pending.rating), 860);

    // level up notification
    const afterLevel = computeLevelFromXp(state.economy.xp).level;
    if(afterLevel > beforeLevel){
      addNotification(state, { type:"level", title:"ترقية مستوى", body:`المستوى ${afterLevel}`, claimable:false });
      saveState(state);
    }
  }

  runGame();
}

// ===== تدريب (من رزم البطاقات) =====
const TRAINING_KEY = "dm_training_payload_v1";
function setTrainingPayload(payload){
  try{ localStorage.setItem(TRAINING_KEY, JSON.stringify(payload)); }catch{}
}
function getTrainingPayload(){
  try{
    const raw = localStorage.getItem(TRAINING_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch{ return null; }
}
function clearTrainingPayload(){
  try{ localStorage.removeItem(TRAINING_KEY); }catch{}
}

function renderTraining(){
  const payload = getTrainingPayload();
  const ids = payload?.ids || [];
  const cards = ids.map(id=>state.cards.byId[id]).filter(Boolean);

  if(cards.length < 4){
    clearTrainingPayload();
    app.appendChild(h("section",{class:"glass gold panel center"}, h("div",{class:"subtle"}, "لا توجد بطاقات كافية للتدريب.")));
    app.appendChild(h("div",{class:"row", style:"justify-content:center;margin-top:12px;"}, h("button",{class:"btn primary", "data-sfx":"tap_primary", onClick: ()=> nav("#/library")}, "عودة")));
    return;
  }

  // جلسة تدريب: 4 ألعاب فقط (بدون تقييم)، لا حضور، لا تغيير مستويات
  const session = {
    startedAt: performance.now(),
    pending: { xp:0, gold:0, rating:0 },
    perGame: [],
    usedHelps: 0,
    usedSkips: 0,
    cards: shuffle([...cards]),
  };

  // pick 30% for anagram/typing without overlap
  const n30 = Math.max(1, Math.floor(session.cards.length*0.30));
  const anagramSet = new Set(session.cards.slice(0, n30).map(c=>c.id));
  const typingSet = new Set(session.cards.slice(n30, n30*2).map(c=>c.id));

  const games = shuffle(["match","memory","anagram","typing"]);
  let gameIndex = 0;

  const panel = h("section",{class:"glass gold panel"});
  const header = h("div",{class:"panel-title"},
    h("h2",{class:"h1"}, "تدريب"),
    h("span",{class:"subtle", id:"timer"}, "00:00")
  );
  panel.appendChild(header);

  const stage = h("div",{class:"no-lams"});
  panel.appendChild(stage);
  app.appendChild(panel);

  // header widgets: help/skip/settings
  const helpBtn = h("button",{class:"icon-btn", "data-sfx":"tap_secondary", onClick: ()=> onHelp()}, h("i",{"data-lucide":"sparkles"}));
  const skipBtn = h("button",{class:"icon-btn", "data-sfx":"tap_secondary", onClick: ()=> onSkip()}, h("i",{"data-lucide":"forward"}));
  const logBtn = h("button",{class:"icon-btn", "data-sfx":"tap_secondary", onClick: ()=> showHelpLog()}, h("i",{"data-lucide":"scroll-text"}));
  const setBtn = h("button",{class:"icon-btn", "data-sfx":"naker", onClick: ()=> openSettingsOverlay()}, h("i",{"data-lucide":"sliders-horizontal"}));
  header.appendChild(h("div",{class:"top-right"}, helpBtn, logBtn, skipBtn, setBtn));

  window.lucide?.createIcons?.();

  // timer
  let timerId = setInterval(()=>{
    const t = Math.floor((performance.now()-session.startedAt)/1000);
    const mm = String(Math.floor(t/60)).padStart(2,"0");
    const ss = String(t%60).padStart(2,"0");
    header.querySelector("#timer").textContent = `${mm}:${ss}`;
  }, 250);

  // help log
  let helpLog = [];

  function openSettingsOverlay(){
    const music = Number(localStorage.getItem("dm_music") ?? "0.65");
    const sfx = Number(localStorage.getItem("dm_sfx") ?? "0.85");

    const m = h("input",{type:"range", min:"0", max:"1", step:"0.01", value:String(music)});
    const s = h("input",{type:"range", min:"0", max:"1", step:"0.01", value:String(sfx)});

    const body = h("div",{},
      h("div",{class:"glass gold card"},
        h("div",{class:"subtle"}, "الصوت"),
        h("div",{class:"field"}, h("label",{}, "مستوى صوت الموسيقى"), m),
        h("div",{class:"field"}, h("label",{}, "مستوى صوت التفاعلات"), s),
      ),
      h("div",{class:"hr"}),
      h("div",{class:"glass gold card"},
        h("div",{class:"subtle"}, "الحساب"),
        h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> modal("تسجيل الخروج", h("div",{class:"subtle"}, "سيتم توفير هذه الميزة قريبًا."), [])}, "تسجيل الخروج"),
        h("button",{class:"btn danger", style:"margin-top:10px;", "data-sfx":"tahther", onClick: ()=> deleteFlowInOverlay()}, "حذف الحساب")
      ),
      h("div",{class:"hr"}),
      h("div",{class:"glass gold card"},
        h("div",{class:"subtle"}, "الدعم"),
        h("div",{class:"subtle"}, "deckmastery.support1@gmail.com")
      ),
    );

    modal("الإعدادات", body, [
      { label:"رجوع", kind:"primary", sfx:"tap_secondary", onClick:(close)=> close() },
    ]);

    m.addEventListener("input", ()=> {
      localStorage.setItem("dm_music", m.value);
      setVolumes({music:Number(m.value), sfx:Number(s.value)});
    }, {passive:true});
    s.addEventListener("input", ()=> {
      localStorage.setItem("dm_sfx", s.value);
      setVolumes({music:Number(m.value), sfx:Number(s.value)});
    }, {passive:true});

    function deleteFlowInOverlay(){
      const b1 = h("div",{}, h("div",{class:"subtle"}, "هل أنت متأكد؟"));
      modal("حذف", b1, [
        { label:"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
        { label:"متابعة", kind:"danger", sfx:"tap_danger", onClick:(close)=> { close(); step2(); } },
      ]);
      function step2(){
        const b2 = h("div",{}, h("div",{style:"color:var(--danger);font-weight:900;"}, "انتبه! بعد الحذف لن تتمكن من استعادة بياناتك."));
        modal("تحذير", b2, [
          { label:"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
          { label:"متابعة", kind:"danger", sfx:"tap_danger", onClick:(close)=> { close(); step3(); } },
        ]);
      }
      function step3(){
        const pass = h("input",{});
        const b3 = h("div",{}, h("div",{class:"field"}, h("label",{}, "كلمة السر"), pass));
        modal("تأكيد نهائي", b3, [
          { label:"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
          { label:"حذف", kind:"danger", sfx:"tap_danger", onClick:(close)=> {
            localStorage.removeItem("deckmastery_v1");
            close();
            location.reload();
          }},
        ]);
      }
    }
  }

  function onHelp(){
    if(state.economy.helps <= 0){
      playSfx("shake");
      gsap.fromTo(helpBtn, {x:0}, {x:8, duration:0.08, yoyo:true, repeat:3});
      return;
    }
    state.economy.helps -= 1;
    session.usedHelps += 1;
    saveState(state);
    playSfx("popup");
    helpLog.push("مساعدة مستخدمة.");
    toast("تم استخدام مساعدة.");
  }

  function onSkip(){
    if(state.economy.skips <= 0){
      playSfx("shake");
      gsap.fromTo(skipBtn, {x:0}, {x:-8, duration:0.08, yoyo:true, repeat:3});
      return;
    }
    const body = h("div",{}, h("div",{class:"subtle"}, "تأكيد التخطي؟"));
    modal("تخطي", body, [
      { label:"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
      { label:"تأكيد", kind:"primary", sfx:"tap_primary", onClick:(close)=> {
        state.economy.skips -= 1;
        session.usedSkips += 1;
        saveState(state);
        close();
        finishGame({ skipped:true, perfect:true });
      }},
    ]);
  }

  function showHelpLog(){
    const body = h("div",{}, ...(helpLog.length? helpLog.map(x=>h("div",{class:"subtle"}, x)) : [h("div",{class:"subtle"}, "لا يوجد.")]));
    modal("سجل المساعدات", body, []);
  }

  function nextStepPopup(){
    const body = h("div",{}, h("div",{class:"subtle"}, "هل تود الاستمرار؟"));
    modal("استمرار", body, [
      { label:"اللعبة التالية", kind:"primary", sfx:"tap_primary", onClick:(close)=> { close(); gameIndex++; runGame(); } },
      { label:"إنهاء التدريب", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> { close(); finalizeTraining(); } },
    ]);
  }

  function runGame(){
    clear(stage);
    window.lucide?.createIcons?.();
    helpLog = [];

    if(gameIndex >= games.length){
      finalizeTraining();
      return;
    }
    const gk = games[gameIndex];

    if(gk === "match") renderMatch();
    if(gk === "memory") renderMemory();
    if(gk === "anagram") renderAnagram();
    if(gk === "typing") renderTyping();
  }

  function finishGame(result){
    // إذا تم التخطي، نعتبر اللعبة مثالية بزمن سريع وبدون أخطاء
    if(result.skipped){
      const fastSec = 4.5;
      const avgLevel = Math.round(session.cards.reduce((s,c)=>s+c.level,0)/session.cards.length);
      const base = computeRewardsForGame({
        gameKey: games[gameIndex],
        pairsOrCards: session.cards.length,
        successCount: session.cards.length,
        wrongCount: 0,
        avgSec: fastSec,
        usedHelp: false,
        levelAvg: avgLevel,
        rankKey: state.rating.rankKey,
        subLevel: state.rating.subLevel,
        priceExtraCard: 100
      });
      const dailyCap = 300;
      const remaining = Math.max(0, dailyCap - state.economy.dailyGoldEarned);
      const goldGranted = Math.min(base.gold, remaining);
      state.economy.dailyGoldEarned += goldGranted;
      session.pending.xp += base.xp;
      session.pending.gold += goldGranted;
      session.pending.rating += base.rating;
      session.perGame.push({ ...base, gold: goldGranted, gameKey: games[gameIndex] });
      if(gameIndex < games.length-1) nextStepPopup(); else finalizeTraining();
      return;
    }

    const avgLevel = Math.round(session.cards.reduce((s,c)=>s+c.level,0)/session.cards.length);
    const priceExtraCard = 100;
    const usedHelp = result.usedHelp || false;
    const base = computeRewardsForGame({
      gameKey: result.gameKey,
      pairsOrCards: result.pairsOrCards,
      successCount: result.successCount,
      wrongCount: result.wrongCount,
      avgSec: result.avgSec,
      usedHelp,
      levelAvg: avgLevel,
      rankKey: state.rating.rankKey,
      subLevel: state.rating.subLevel,
      priceExtraCard
    });

    // نفس سقف ذهب اليوم لمنع الاستغلال
    const dailyCap = 300;
    const remaining = Math.max(0, dailyCap - state.economy.dailyGoldEarned);
    const goldGranted = Math.min(base.gold, remaining);
    state.economy.dailyGoldEarned += goldGranted;

    session.pending.xp += base.xp;
    session.pending.gold += goldGranted;
    session.pending.rating += base.rating;
    session.perGame.push({ ...base, gold: goldGranted, gameKey: result.gameKey });

    if(gameIndex < games.length-1){
      nextStepPopup();
    } else {
      finalizeTraining();
    }
  }

  function finalizeTraining(){
    clearInterval(timerId);

    // تطبيق الجوائز مباشرة (بدون حضور وبدون تقييم)
    state.economy.xp += session.pending.xp;
    state.economy.gold += session.pending.gold;
    applyRatingDelta(state, session.pending.rating);

    saveState(state);
    syncTopbar();
    clearTrainingPayload();

    const box = h("div",{class:"glass gold panel center"},
      h("h2",{class:"h1"}, "الجوائز"),
      h("div",{class:"hr"}),
      h("div",{class:"card-list"},
        h("div",{class:"glass gold card"}, h("div",{class:"subtle"}, "XP"), h("div",{style:"font-size:24px;font-weight:900;", id:"xpN"}, "0")),
        h("div",{class:"glass gold card"}, h("div",{class:"subtle"}, "الذهب"), h("div",{style:"font-size:24px;font-weight:900;", id:"gN"}, "0")),
        h("div",{class:"glass gold card"}, h("div",{class:"subtle"}, "التصنيف"), h("div",{style:"font-size:24px;font-weight:900;", id:"rN"}, "0")),
      ),
      h("div",{class:"hr"}),
      h("button",{class:"btn primary", "data-sfx":"tap_primary", onClick: ()=> nav(payload?.origin || "#/library")}, "عودة")
    );
    clear(app);
    app.appendChild(box);

    const xpEl = document.getElementById("xpN");
    const gEl = document.getElementById("gN");
    const rEl = document.getElementById("rN");
    countUp(xpEl, session.pending.xp);
    setTimeout(()=> countUp(gEl, session.pending.gold), 420);
    setTimeout(()=> countUp(rEl, session.pending.rating), 860);
  }

  // === Game 1: matching ===
  function renderMatch(){
    const cs = session.cards;
    const left = shuffle(cs.map(c=>({ id:c.id, type:"a", text:c.a })));
    const right = shuffle(cs.map(c=>({ id:c.id, type:"b", text:c.b })));
    let sel = null;
    let selBtn = null;
    let correct = 0, wrong = 0;
    let lastT = performance.now();
    const times = [];

    const wrap = h("div",{class:"row"});
    const colA = h("div",{class:"card-list"});
    const colB = h("div",{class:"card-list"});
    wrap.append(colA, colB);

    const makeBtn = (item)=> {
      const b = h("button",{class:"btn", "data-sfx":"ekhtiar"}, item.text);
      b.dataset.cardid = item.id;
      b.dataset.type = item.type;
      b.addEventListener("click", ()=> pick(item, b), {passive:true});
      return b;
    };

    left.forEach(it=> colA.appendChild(makeBtn(it)));
    right.forEach(it=> colB.appendChild(makeBtn(it)));

    stage.appendChild(h("div",{class:"subtle"}, "التوصيل"));
    stage.appendChild(h("div",{class:"hr"}));
    stage.appendChild(wrap);

    function pick(item, btn){
      const now = performance.now();
      const dt = (now-lastT)/1000;
      lastT = now;
      times.push(dt);

      // اختيار/إلغاء اختيار البطاقة الأولى
      if(!sel){
        sel = item;
        selBtn = btn;
        btn.classList.add("selected");
        return;
      }
      if(sel.id === item.id && sel.type === item.type){
        selBtn?.classList.remove("selected");
        sel = null;
        selBtn = null;
        return;
      }

      const x = sel;
      const bx = selBtn;
      sel = null;
      selBtn = null;

      const y = item;

      bx?.classList.remove("selected");
      btn.classList.remove("selected");
      const ok = x.id === y.id && x.type !== y.type;
      if(ok){
        correct += 1;
        playSfx("saheh");
        // remove matched pair buttons (حسب المعرف)
        const aBtn = colA.querySelector(`button[data-cardid="${x.id}"][data-type="a"]`);
        const bBtn = colB.querySelector(`button[data-cardid="${x.id}"][data-type="b"]`);
        aBtn?.remove();
        bBtn?.remove();
      } else {
        wrong += 1;
        playSfx("khata");
      }
      if(colA.children.length === 0){
        const avgSec = average(times);
        finishGame({ gameKey:"match", pairsOrCards: correct, successCount: correct, wrongCount: wrong, avgSec, usedHelp: session.usedHelps>0 });
      }
    }
  }

  // === Game 2: memory ===
  function renderMemory(){
    const cs = session.cards;
    const items = shuffle([
      ...cs.map(c=>({ id:c.id, kind:"a", text:c.a })),
      ...cs.map(c=>({ id:c.id, kind:"b", text:c.b })),
    ]);
    let revealed = [];
    let matched = new Set();
    let correct = 0;
    let lastSuccessT = performance.now();
    const times = [];
    const grid = h("div",{style:"display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;"});

    const open = new Set(items.map((_,i)=>i));

    items.forEach((it, idx)=>{
      const tile = h("div",{class:"glass gold card", style:"height:86px; display:flex;align-items:center;justify-content:center; cursor:pointer; user-select:none;"}, it.text);
      tile.addEventListener("click", ()=> flip(idx, tile), {passive:true});
      grid.appendChild(tile);
    });

    stage.appendChild(h("div",{class:"subtle"}, "قلب البطاقات"));
    stage.appendChild(h("div",{class:"hr"}));
    stage.appendChild(grid);

    setTimeout(()=>{
      open.clear();
      [...grid.children].forEach((tile)=> tile.textContent = "✦");
    }, 5000);

    function flip(idx, tile){
      if(matched.has(idx)) return;
      if(open.has(idx)) return;
      if(revealed.includes(idx)) {
        playSfx("ekhtiar");
        revealed = revealed.filter(x=>x!==idx);
        tile.textContent = "✦";
        return;
      }
      if(revealed.length >= 2) return;

      playSfx("ekhtiar");
      tile.textContent = items[idx].text;
      revealed.push(idx);

      if(revealed.length === 2){
        const [i1,i2] = revealed;
        const a = items[i1], b = items[i2];
        const ok = a.id === b.id && a.kind !== b.kind;
        if(ok){
          matched.add(i1); matched.add(i2);
          correct += 1;
          const now = performance.now();
          times.push((now-lastSuccessT)/1000);
          lastSuccessT = now;
          playSfx("saheh");
          setTimeout(()=> {
            // hide matched tiles
            const t1 = grid.children[i1];
            const t2 = grid.children[i2];
            if(t1) t1.style.visibility = "hidden";
            if(t2) t2.style.visibility = "hidden";
            revealed = [];
            if(correct >= cs.length){
              const avgSec = average(times.length?times:[6]);
              finishGame({ gameKey:"memory", pairsOrCards: correct, successCount: correct, wrongCount: 0, avgSec, usedHelp: session.usedHelps>0 });
            }
          }, 250);
        } else {
          playSfx("khata");
          setTimeout(()=>{
            if(grid.children[i1]) grid.children[i1].textContent = "✦";
            if(grid.children[i2]) grid.children[i2].textContent = "✦";
            revealed = [];
          }, 800);
        }
      }
    }
  }

  // === Game 3: anagram ===
  function renderAnagram(){
    const pool = session.cards.filter(c=>anagramSet.has(c.id));
    if(pool.length === 0){
      finishGame({ gameKey:"anagram", pairsOrCards: 0, successCount: 0, wrongCount: 0, avgSec: 6, usedHelp:false });
      return;
    }
    let idx = 0;
    let correct = 0, wrong = 0;
    let lastT = performance.now();
    const times = [];

    const card = h("div",{class:"glass gold card"});
    stage.appendChild(h("div",{class:"subtle"}, "ترتيب الأحرف"));
    stage.appendChild(h("div",{class:"hr"}));
    stage.appendChild(card);

    function show(){
      if(idx >= pool.length){
        const avgSec = average(times.length?times:[6]);
        finishGame({ gameKey:"anagram", pairsOrCards: pool.length, successCount: correct, wrongCount: wrong, avgSec, usedHelp: session.usedHelps>0 });
        return;
      }
      const c = pool[idx];
      const letters = shuffle(c.a.split(""));
      const out = [];
      const line = h("div",{style:"font-size:22px;font-weight:900;letter-spacing:1px;min-height:34px;"}, "");
      const buttons = h("div",{class:"row", style:"flex-wrap:wrap; gap:8px; margin-top:10px;"});
      letters.forEach((ch)=>{
        const b = h("button",{class:"btn", "data-sfx":"ekhtiar", onClick: ()=> { out.push(ch); line.textContent = out.join(""); b.disabled = true; }}, ch);
        buttons.appendChild(b);
      });
      const okBtn = h("button",{class:"btn primary", "data-sfx":"tap_primary", style:"margin-top:12px;", onClick: ()=> check(c, out.join(""))}, "موافق");
      clear(card);
      card.append(h("div",{class:"subtle"}, `(${idx+1}/${pool.length})`), line, buttons, okBtn);
    }

    function check(c, answer){
      const now = performance.now();
      times.push((now-lastT)/1000);
      lastT = now;

      if(answer === c.a){
        correct += 1;
        playSfx("saheh");
        idx += 1;
        show();
      } else {
        wrong += 1;
        playSfx("khata");
        toast("خطأ");
        show();
      }
    }

    show();
  }

  // === Game 4: typing ===
  function renderTyping(){
    const pool = session.cards.filter(c=>typingSet.has(c.id) && !anagramSet.has(c.id));
    if(pool.length === 0){
      finishGame({ gameKey:"typing", pairsOrCards: 0, successCount: 0, wrongCount: 0, avgSec: 6, usedHelp:false });
      return;
    }
    let idx = 0;
    let correct = 0, wrong = 0;
    let lastT = performance.now();
    const times = [];

    const card = h("div",{class:"glass gold card"});
    stage.appendChild(h("div",{class:"subtle"}, "الكتابة"));
    stage.appendChild(h("div",{class:"hr"}));
    stage.appendChild(card);

    function show(){
      if(idx >= pool.length){
        const avgSec = average(times.length?times:[6]);
        finishGame({ gameKey:"typing", pairsOrCards: pool.length, successCount: correct, wrongCount: wrong, avgSec, usedHelp: session.usedHelps>0 });
        return;
      }
      const c = pool[idx];
      const input = h("input",{maxlength:"45"});
      const okBtn = h("button",{class:"btn primary", "data-sfx":"tap_primary", style:"margin-top:12px;", onClick: ()=> check(c, input.value)}, "موافق");
      clear(card);
      card.append(
        h("div",{class:"subtle"}, `(${idx+1}/${pool.length})`),
        h("div",{class:"subtle"}, c.b),
        h("div",{class:"field"}, input),
        okBtn
      );
    }

    function check(c, val){
      const now = performance.now();
      times.push((now-lastT)/1000);
      lastT = now;

      const a = (val||"").trim().toLowerCase();
      const b = (c.a||"").trim().toLowerCase();
      if(a === b){
        correct += 1;
        playSfx("saheh");
        idx += 1;
        show();
      } else {
        wrong += 1;
        playSfx("khata");
        toast("خطأ");
      }
    }

    show();
  }

  runGame();
}

function renderLibrary(){
  const panel = h("section",{class:"glass gold panel"},
    h("div",{class:"panel-title"},
      h("h2",{class:"h1"}, "رزم البطاقات"),
      h("div",{style:"display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end;"},
        h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> nav("#/home")}, "رجوع"),
        h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> openCreatePack()}, "إضافة رزمة")
      )
    )
  );

  const search = h("input",{placeholder:"بحث", style:"margin-bottom:10px;"});
  const list = h("div",{class:"card-list"});

  const packs = [
    { key:"all", name:"جميع البطاقات" },
    { key:"daily", name:"المجموعات اليومية" },
    { key:"easy", name:"سهل" },
    { key:"medium", name:"متوسط" },
    { key:"hard", name:"صعب" },
    { key:"ignored", name:"التجاهل" },
    { key:"completed", name:"المكتملة" },
    ...state.library.customPacks.map(p=>({ key:`custom:${p.id}`, name:p.name })),
  ];

  function rebuild(){
    clear(list);
    const q = search.value.trim();
    for(const p of packs){
      if(q && !p.name.includes(q)) continue;
      list.appendChild(h("div",{class:"glass gold card card-mini"},
        h("div",{class:"t"}, h("div",{class:"a"}, p.name), h("div",{class:"b"}, "")),
        h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> openPack(p.key, p.name)}, "فتح")
      ));
    }
  }
  search.addEventListener("input", rebuild, {passive:true});
  panel.append(search, list);
  app.appendChild(panel);
  rebuild();

  function openCreatePack(){
    const name = h("input",{maxlength:"30"});
    const body = h("div",{}, h("div",{class:"field"}, h("label",{}, "الاسم"), name));
    modal("إضافة رزمة", body, [
      { label:"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
      { label:"حفظ", kind:"primary", sfx:"tap_primary", onClick:(close)=> {
        const n = name.value.trim();
        if(!n){ toast("اسم فارغ."); return; }
        if(state.library.customPacks.some(x=>x.name===n)){ toast("اسم مستخدم."); return; }
        state.library.customPacks.push({ id: crypto.randomUUID(), name:n, cardIds:[] });
        saveState(state);
        close();
        nav("#/library");
      }},
    ]);
  }

  function openPack(key, title){
    // daily groups special
    if(key === "daily"){
      openDailyGroups();
      return;
    }
    const ids = getPackCardIds(key);
    openCardsList(title, ids, { packKey:key });
  }

  function openDailyGroups(){
    const groups = Object.values(state.cards.dailyGroups).sort((a,b)=> b.iso.localeCompare(a.iso));
    const s = h("input",{placeholder:"بحث بالتاريخ"});
    const l = h("div",{class:"card-list"});
    function rebuildG(){
      clear(l);
      const q = s.value.trim();
      for(const g of groups){
        if(q && !g.titleDMY.includes(q)) continue;
        l.appendChild(h("div",{class:"glass gold card card-mini"},
          h("div",{class:"t"}, h("div",{class:"a"}, g.titleDMY), h("div",{class:"b"}, `${g.cardIds.length} بطاقة`)),
          h("button",{class:"btn", "data-sfx":"tap_secondary", onClick: ()=> openCardsList(g.titleDMY, g.cardIds, { packKey:"dailyGroup", groupIso:g.iso })}, "فتح")
        ));
      }
    }
    s.addEventListener("input", rebuildG, {passive:true});
    const page = h("section",{class:"glass gold panel"},
      h("div",{class:"panel-title"}, h("h2",{class:"h1"}, "المجموعات اليومية"),
        h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> { clear(app); renderLibrary(); wireSfx(app); }}, "رجوع")
      ),
      s, h("div",{class:"hr"}), l
    );
    clear(app);
    app.appendChild(page);
    // ملاحظة: هذه الصفحة تُبنى داخلياً بدون استدعاء render()، لذلك يجب إعادة ربط مؤثرات الصوت للأزرار.
    wireSfx(app);
    rebuildG();
  }

  function openCardsList(title, ids, ctx){
    const q = h("input",{placeholder:"بحث"});
    const selectBtn = h("button",{class:"btn", "data-sfx":"naker"}, "تحديد");
    const actionsBtn = h("button",{class:"btn", "data-sfx":"naker", style:"display:none;"}, "إجراءات (0)");
    // ملاحظة: عند فتح الرزمة لا يتم تغيير الـ hash (يبقى #/library)، لذلك nav("#/library") لن يعيد الرندر.
    // زر الرجوع يجب أن يعيد المستخدم لقائمة رزم البطاقات مباشرة.
    const backBtn = h("button",{class:"btn", "data-sfx":"tap_secondary", onClick: ()=> {
      if(ctx?.packKey === "dailyGroup"){
        openDailyGroups();
        return;
      }
      clear(app);
      renderLibrary();
    }}, "رجوع");
    const top = h("div",{class:"panel-title"}, h("h2",{class:"h1"}, title), h("div",{class:"row"}, selectBtn, actionsBtn, backBtn));
    const l = h("div",{class:"card-list"});
    const page = h("section",{class:"glass gold panel"}, top, q, h("div",{class:"hr"}), l);
    clear(app);
    app.appendChild(page);
    // ملاحظة: هذه الصفحة تُبنى داخلياً بدون استدعاء render()، لذلك يجب إعادة ربط مؤثرات الصوت للأزرار.
    wireSfx(app);

    let selecting = false;
    const selected = new Set();

    function rebuildC(){
      clear(l);
      const query = q.value.trim();
      const cards = ids.map(id=>state.cards.byId[id]).filter(Boolean);
      for(const c of cards){
        if(query){
          const hit = (c.a+c.b+c.hint).includes(query);
          if(!hit) continue;
        }
        const row = h("div",{class:"glass gold card"},
          h("div",{class:"card-mini"},
            h("div",{class:"t"},
              h("div",{class:"a"}, c.a),
              h("div",{class:"b"}, `المستوى ${c.level} • ${labelRating(c.lastRating)}`)
            ),
            selecting
              ? h("button",{class:"btn", "data-sfx":"tap_secondary", onClick: ()=> toggle(c.id)}, selected.has(c.id)?"محدد":"تحديد")
              : h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> openCardDetails(c.id, ctx)}, "فتح")
          )
        );
        l.appendChild(row);
      }

      if(selecting){
        actionsBtn.textContent = `إجراءات (${selected.size})`;
      }
    }

    function toggle(id){
      if(selected.has(id)) selected.delete(id);
      else selected.add(id);
      actionsBtn.textContent = `إجراءات (${selected.size})`;
      rebuildC();
    }

    q.addEventListener("input", rebuildC, {passive:true});
    selectBtn.addEventListener("click", ()=>{
      selecting = !selecting;
      selected.clear();
      selectBtn.textContent = selecting ? "إلغاء التحديد" : "تحديد";
      actionsBtn.style.display = selecting ? "inline-flex" : "none";
      actionsBtn.textContent = "إجراءات (0)";
      rebuildC();
    });

    actionsBtn.addEventListener("click", ()=>{
      openBulkActions(ctx, selected, ()=> rebuildC());
    });

    rebuildC();
  }

  function openBulkActions(ctx, selected, refresh){
    if(selected.size === 0){
      toast("حدّد بطاقات أولاً.");
      return;
    }

    const isSpecial = (ctx.packKey === "ignored" || ctx.packKey === "completed");

    const body = isSpecial
      ? h("div",{},
          h("div",{class:"subtle"}, "إجراءات"),
          h("div",{class:"hr"}),
          h("div",{class:"row"},
            h("button",{class:"btn danger", "data-sfx":"tap_danger", onClick: ()=> bulkDeleteForever()}, "حذف نهائي"),
            h("button",{class:"btn", "data-sfx":"tap_secondary", onClick: ()=> bulkReset()}, "إعادة"),
          )
        )
      : h("div",{},
          h("div",{class:"subtle"}, "إجراءات"),
          h("div",{class:"hr"}),
          h("div",{class:"row"},
            h("button",{class:"btn danger", "data-sfx":"tahther", onClick: ()=> bulkIgnore()}, "تجاهل"),
            h("button",{class:"btn", "data-sfx":"laeb", onClick: ()=> bulkTrain()}, "تدريب"),
          ),
          h("div",{class:"row", style:"margin-top:10px;"},
            h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> bulkAddToPack()}, "إضافة إلى رزمة"),
            (ctx.packKey?.startsWith?.("custom:") ? h("button",{class:"btn", "data-sfx":"tap_secondary", onClick: ()=> bulkRemoveFromPack(ctx.packKey.split(':')[1])}, "إزالة من الرزمة") : h("div",{}))
          )
        );

    const m = modal("التحديد", body, []);

    function idsSel(){ return Array.from(selected); }

    function bulkIgnore(){
      for(const id of idsSel()){
        const c = state.cards.byId[id];
        if(!c) continue;
        c.ignored = true;
        state.cards.ignored.unshift(id);
        // remove from custom packs
        for(const p of state.library.customPacks){
          p.cardIds = p.cardIds.filter(x=>x!==id);
        }
      }
      saveState(state);
      toast("تم.");
      selected.clear();
      m.close();
      refresh();
    }

    function bulkTrain(){
      const ids = idsSel();
      if(ids.length < 4){ toast("الحد الأدنى 4."); return; }
      // تدريب: تشغيل الألعاب الأربع عشوائياً بدون تقييم، والجوائز تُحسب بعد اللعب
      setTrainingPayload({
        ids,
        origin: "#/library"
      });
      selected.clear();
      m.close();
      refresh();
      nav("#/training");
    }

    function bulkAddToPack(){
      const packs = state.library.customPacks;
      if(packs.length === 0){ toast("لا توجد رزم."); return; }
      const sel = new Set();
      const body = h("div",{}, ...packs.map(p=>{
        return h("button",{class:"btn", "data-sfx":"tap_secondary", onClick: ()=> { if(sel.has(p.id)) sel.delete(p.id); else sel.add(p.id); }}, p.name);
      }));
      modal("اختيار رزم", body, [
        { label:"حفظ", kind:"primary", sfx:"tap_primary", onClick:(close)=> {
          for(const pid of sel){
            const p = state.library.customPacks.find(x=>x.id===pid);
            if(!p) continue;
            for(const id of idsSel()){
              if(!p.cardIds.includes(id)) p.cardIds.push(id);
            }
          }
          saveState(state);
          close();
          toast("تم.");
          m.close();
          selected.clear();
          refresh();
        }},
      ]);
    }

    function bulkRemoveFromPack(packId){
      const p = state.library.customPacks.find(x=>x.id===packId);
      if(!p) return;
      p.cardIds = p.cardIds.filter(id=> !selected.has(id));
      saveState(state);
      toast("تم.");
      selected.clear();
      m.close();
      refresh();
    }

    function bulkDeleteForever(){
      for(const id of idsSel()){
        // remove from main lists
        delete state.cards.byId[id];
        state.cards.order = state.cards.order.filter(x=>x!==id);
        state.cards.ignored = state.cards.ignored.filter(x=>x!==id);
        state.cards.completed = state.cards.completed.filter(x=>x!==id);

        // remove from daily groups
        for(const g of Object.values(state.cards.dailyGroups)){
          g.cardIds = g.cardIds.filter(x=>x!==id);
        }

        // remove from custom packs
        for(const p of state.library.customPacks){
          p.cardIds = p.cardIds.filter(x=>x!==id);
        }
      }
      saveState(state);
      toast("تم.");
      selected.clear();
      m.close();
      refresh();
    }

    function bulkReset(){
      const iso = todayISO();
      for(const id of idsSel()){
        const c = state.cards.byId[id];
        if(!c) continue;
        c.ignored = false;
        c.completed = false;
        c.level = 0;
        c.lastRating = null;
        c.frozen = false;
        c.lastReviewedIso = null;
        // keep groupIso if exists; ensure group exists
        const gIso = c.groupIso || iso;
        c.groupIso = gIso;
        if(!state.cards.dailyGroups[gIso]){
          state.cards.dailyGroups[gIso] = { iso: gIso, titleDMY: formatDateDMY(gIso), cardIds: [] };
        }
        if(!state.cards.dailyGroups[gIso].cardIds.includes(id)){
          state.cards.dailyGroups[gIso].cardIds.push(id);
        }
      }
      // remove from ignored/completed lists
      state.cards.ignored = state.cards.ignored.filter(x=> !selected.has(x));
      state.cards.completed = state.cards.completed.filter(x=> !selected.has(x));

      saveState(state);
      toast("تم.");
      selected.clear();
      m.close();
      refresh();
    }
  }

  function runTraining(cards){
    // minimal: one combined reward using focus music and same formulas, no attendance
    const avgLevel = Math.round(cards.reduce((s,c)=>s+c.level,0)/Math.max(1,cards.length));
    const base = computeRewardsForGame({
      gameKey:"match",
      pairsOrCards: cards.length,
      successCount: cards.length,
      wrongCount: 0,
      avgSec: 6,
      usedHelp:false,
      levelAvg: avgLevel,
      rankKey: state.rating.rankKey,
      subLevel: state.rating.subLevel,
      priceExtraCard: 100
    });
    state.economy.xp += base.xp;
    state.economy.gold += base.gold;
    applyRatingDelta(state, base.rating);
    saveState(state);
    toast("تم.");
  }

  function openCardDetails(id, ctx){
    const c = state.cards.byId[id];
    if(!c) return;
    const body = h("div",{},
      h("div",{class:"subtle"}, c.a),
      h("div",{class:"subtle"}, c.b),
      h("div",{class:"subtle"}, c.hint),
      h("div",{class:"hr"}),
      h("div",{class:"subtle"}, `المستوى ${c.level}`),
      h("div",{class:"subtle"}, `آخر تقييم: ${labelRating(c.lastRating)}`),
    );
    modal("تفاصيل", body, [
      { label:"إغلاق", kind:"ghost", sfx:"naker", onClick:(close)=> close() },
      { label:"تجاهل", kind:"danger", sfx:"tahther", onClick:(close)=> { c.ignored = true; state.cards.ignored.unshift(id); saveState(state); close(); nav("#/library"); } },
      { label:"تعديل", kind:"primary", sfx:"naker", onClick:(close)=> { close(); openEdit(c); } },
    ]);
  }

  function openEdit(c){
    const a = h("input",{maxlength:"45", value:c.a});
    const b = h("input",{maxlength:"45", value:c.b});
    const hint = h("input",{maxlength:"60", value:c.hint});
    const body = h("div",{},
      h("div",{class:"field"}, h("label",{}, "النص الأصلي"), a),
      h("div",{class:"field"}, h("label",{}, "الترجمة أو التوضيح"), b),
      h("div",{class:"field"}, h("label",{}, "التلميح"), hint),
    );
    modal("تعديل", body, [
      { label:"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
      { label:"حفظ", kind:"primary", sfx:"tap_primary", onClick:(close)=> {
        c.a = a.value; c.b = b.value; c.hint = hint.value;
        saveState(state);
        close();
        toast("تم.");
        nav("#/library");
      }},
    ]);
  }

  function getPackCardIds(key){
    if(key === "all"){
      return state.cards.order.filter(id=> {
        const c = state.cards.byId[id];
        return c && !c.ignored && !c.completed;
      });
    }
    if(key === "easy" || key === "medium" || key === "hard"){
      return state.cards.order.filter(id=>{
        const c = state.cards.byId[id];
        return c && !c.ignored && !c.completed && c.lastRating === key;
      });
    }
    if(key === "ignored") return [...state.cards.ignored];
    if(key === "completed") return [...state.cards.completed];
    if(key.startsWith("custom:")){
      const id = key.split(":")[1];
      const p = state.library.customPacks.find(x=>x.id===id);
      return p ? [...p.cardIds] : [];
    }
    return [];
  }

  function labelRating(r){
    if(r==="easy") return "سهل";
    if(r==="medium") return "متوسط";
    if(r==="hard") return "صعب";
    return "—";
  }
}

function renderShop(){
  const panel = h("section",{class:"glass gold panel"},
    h("div",{class:"panel-title"}, h("h2",{class:"h1"}, "المتجر"),
      h("div",{class:"kbd"}, `الذهب ${state.economy.gold}`)
    )
  );

  const power = h("div",{class:"card-list"},
    shopItem("بطاقة إضافية", 100, ()=> buyExtraCard()),
    shopItem("مساعدة", 150, ()=> buyCount("helps", 150)),
    shopItem("وقود", 250, ()=> buyCount("fuel", 250)),
    shopItem("تخطي لعبة", 500, ()=> buyCount("skips", 500)),
  );

  const cosmetics = h("div",{class:"card-list"});
  rebuildCosmetics();

  panel.append(
    h("div",{class:"subtle"}, "الأدوات التشغيلية"),
    power,
    h("div",{class:"hr"}),
    h("div",{class:"subtle"}, "التخصيص"),
    cosmetics,
    h("div",{class:"hr"}),
    h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> {
        const back = sessionStorage.getItem("dm_return_from_settings") || "#/home";
        sessionStorage.removeItem("dm_return_from_settings");
        nav(back);
      }}, "رجوع")
  );
  app.appendChild(panel);

  function shopItem(name, price, onBuy){
    return h("div",{class:"glass gold card card-mini"},
      h("div",{class:"t"}, h("div",{class:"a"}, name), h("div",{class:"b"}, `${price} ذهب`)),
      h("button",{class:"btn primary", "data-sfx":"mal", onClick: ()=> confirmBuy(name, price, onBuy)}, "شراء")
    );
  }

  function confirmBuy(name, price, onBuy){
    const body = h("div",{}, h("div",{class:"subtle"}, `شراء ${name} مقابل ${price} ذهب؟`));
    modal("تأكيد", body, [
      { label:"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
      { label:"شراء", kind:"primary", sfx:"mal", onClick:(close)=> {
        if(state.economy.gold < price){ toast("رصيد غير كافٍ."); return; }
        onBuy();
        saveState(state);
        syncTopbar();
        close();
        playSfx("coin");
        toast("تم.");
        render(); // refresh
      }},
    ]);
  }

  function buyExtraCard(){
    const iso = todayISO();
    if(state.economy.dailyExtraCardsPurchased >= 2){
      toast("تم بلوغ الحد.");
      return;
    }
    state.economy.gold -= 100;
    state.economy.dailyExtraCardsPurchased += 1;
    // refund rule not fully implemented; notification handled locally
  }

  function buyCount(key, price){
    state.economy.gold -= price;
    state.economy[key] = (state.economy[key]||0) + 1;
  }

  function rebuildCosmetics(){
    clear(cosmetics);
    const gender = state.profile.gender;
    const bgItems = state.library.backgrounds.items;
    const avItems = state.library.avatars.items;

    const bgOwned = new Set(state.library.backgrounds.owned);
    const avOwned = new Set(state.library.avatars.owned);

    const showBg = bgItems.filter(x=>x.gender !== gender);
    const showAv = avItems.filter(x=>x.gender !== gender);

    for(const it of showAv){
      cosmetics.appendChild(cosmeticRow(it, avOwned.has(it.id), "avatars"));
    }
    for(const it of showBg){
      cosmetics.appendChild(cosmeticRow(it, bgOwned.has(it.id), "backgrounds"));
    }
  }

  function cosmeticRow(it, owned, kind){
    return h("div",{class:"glass gold card card-mini"},
      h("div",{class:"t"},
        h("div",{class:"a"}, it.name),
        h("div",{class:"b"}, owned ? "ممتلك" : `${it.price} ذهب`)
      ),
      owned
        ? h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> selectCosmetic(kind, it.id)}, "اختيار")
        : h("button",{class:"btn primary", "data-sfx":"mal", onClick: ()=> confirmBuy(it.name, it.price, ()=> buyCosmetic(kind, it))}, "شراء")
    );
  }

  function buyCosmetic(kind, it){
    state.economy.gold -= it.price;
    const lib = state.library[kind];
    if(!lib.owned.includes(it.id)) lib.owned.push(it.id);
  }
  function selectCosmetic(kind, id){
    state.library[kind].selected = id;
    saveState(state);
    syncTopbar();
    toast("تم.");
  }
}

function renderProfile(){
  const p = state.profile;
  const econ = state.economy;
  const r = state.rating;

  const bio = h("textarea",{maxlength:"150", value:p.bio||""});
  const canEditBio = (p.lastBioEditSeason !== state.season.season);

  const body = h("section",{class:"glass gold panel"},
    h("div",{class:"panel-title"},
      h("h2",{class:"h1"}, "الملف الشخصي"),
      h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> {
        const back = sessionStorage.getItem("dm_return_from_settings") || "#/home";
        sessionStorage.removeItem("dm_return_from_settings");
        nav(back);
      }}, "رجوع")
    ),
    h("div",{class:"card-list"},
      h("div",{class:"glass gold card"},
        h("div",{class:"subtle"}, "الاسم"),
        h("div",{style:"font-weight:900;font-size:18px;"}, p.username)
      ),
      h("div",{class:"glass gold card"},
        h("div",{class:"subtle"}, "النجوم"),
        h("div",{style:"font-weight:900;font-size:18px;"}, String(p.stars||0))
      ),
      h("div",{class:"glass gold card"},
        h("div",{class:"subtle"}, "التصنيف"),
        h("div",{style:"font-weight:900;font-size:18px;"}, rankLabel(r.rankKey, r.subLevel)),
        h("button",{class:"btn", style:"margin-top:10px;", "data-sfx":"naker", onClick: ()=> openRanks()}, "سلم التصنيفات")
      ),
      h("div",{class:"glass gold card"},
        h("div",{class:"subtle"}, "الدقة"),
        h("div",{style:"font-weight:900;font-size:18px;"}, accuracyText())
      ),
      h("div",{class:"glass gold card"},
        h("div",{class:"subtle"}, "النبذة"),
        bio,
        h("button",{class:"btn primary", style:"margin-top:10px;", "data-sfx":"naker", disabled: !canEditBio, onClick: ()=> {
          p.bio = bio.value;
          p.lastBioEditSeason = state.season.season;
          saveState(state);
          toast("تم.");
        }}, "حفظ")
      ),
      h("div",{class:"glass gold card"},
        h("div",{class:"subtle"}, "التخصيص"),
        h("div",{class:"row"},
          h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> openOwnedPicker("avatars")}, "الأفاتارات"),
          h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> openOwnedPicker("backgrounds")}, "الخلفيات"),
          h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> openOwnedPicker("frames")}, "الإطارات")
        )
      ),
    )
  );
  app.appendChild(body);

  function accuracyText(){
    const a = state.rating.accuracySeason;
    if(a.total <= 0) return "0%";
    return `${Math.round((a.correct/a.total)*100)}%`;
  }


  function openOwnedPicker(kind){
    const title = kind === "avatars" ? "الأفاتارات" : kind === "backgrounds" ? "الخلفيات" : "الإطارات";
    const lib = state.library[kind];
    const owned = new Set(lib.owned || []);
    const items = (lib.items || []).filter(it => owned.has(it.id));

    const grid = h("div",{class:"cos-grid"});
    const m = modal(title, grid, []);

    for(const it of items){
      grid.appendChild(ownedTile(kind, it, ()=>{ m.close(); }));
    }

    if(items.length === 0){
      grid.appendChild(h("div",{class:"subtle"}, "لا توجد عناصر."));
    }

    window.lucide?.createIcons?.();
  }

  function ownedTile(kind, it, close){
    const selectedId = state.library[kind].selected;
    const isSelected = (selectedId === it.id);

    const preview = buildCosmeticPreview(kind, it.id);

    const btn = h("button",{
      class: `btn ${isSelected ? "primary" : ""}`,
      disabled: isSelected,
      "data-sfx": isSelected ? "tap_secondary" : "naker",
      onClick: ()=> {
        state.library[kind].selected = it.id;
        saveState(state);
        syncTopbar();
        toast("تم.");
        close();
      }
    }, isSelected ? "مستخدم" : "استخدام");

    return h("div",{class:"cos-item glass gold"}, preview, h("div",{class:"cos-name"}, it.name), btn);
  }

  function buildCosmeticPreview(kind, id){
    // بناء معاينة مركبة (إطار + خلفية + أفاتار) لعرض الشكل الحقيقي للعنصر
    const curFrame = state.library.frames.selected;
    const curBg = state.library.backgrounds.selected;
    const curAv = state.library.avatars.selected;

    const frameId = (kind === "frames") ? id : curFrame;
    const bgId = (kind === "backgrounds") ? id : curBg;
    const avId = (kind === "avatars") ? id : curAv;

    const frame = state.library.frames.items.find(x=>x.id===frameId);
    const bg = state.library.backgrounds.items.find(x=>x.id===bgId);
    const av = state.library.avatars.items.find(x=>x.id===avId);

    const stack = h("div",{class:"avatar-stack cos-preview"});
    const bgImg = new Image(); bgImg.src = bg?.src || ""; bgImg.className = "layer bg";
    const avImg = new Image(); avImg.src = av?.src || ""; avImg.className = "layer av";
    const frImg = new Image(); frImg.src = frame?.src || ""; frImg.className = "layer frame";
    stack.append(bgImg, avImg, frImg);
    return stack;
  }

  function openRanks(){
    const body = h("div",{}, ...["خشبي","حديدي","نحاسي","فضي","ذهبي","زمردي","بلاتيني","ألماسي","أستاذ","مفكر","حكيم","ملهم"].map(x=>h("div",{class:"subtle"}, x)));
    modal("سلم التصنيفات", body, []);
  }
}

function renderSettings(){
  const music = Number(localStorage.getItem("dm_music") ?? "0.65");
  const sfx = Number(localStorage.getItem("dm_sfx") ?? "0.85");

  const m = h("input",{type:"range", min:"0", max:"1", step:"0.01", value:String(music)});
  const s = h("input",{type:"range", min:"0", max:"1", step:"0.01", value:String(sfx)});

  const panel = h("section",{class:"glass gold panel"},
    h("div",{class:"panel-title"}, h("h2",{class:"h1"}, "الإعدادات"),
      h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> {
        const back = sessionStorage.getItem("dm_return_from_settings") || "#/home";
        sessionStorage.removeItem("dm_return_from_settings");
        nav(back);
      }}, "رجوع")
    ),
    h("div",{class:"glass gold card"},
      h("div",{class:"subtle"}, "الصوت"),
      h("div",{class:"field"}, h("label",{}, "مستوى صوت الموسيقى"), m),
      h("div",{class:"field"}, h("label",{}, "مستوى صوت التفاعلات"), s),
    ),
    h("div",{class:"hr"}),
    h("div",{class:"glass gold card"},
      h("div",{class:"subtle"}, "الحساب"),
      h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> modal("تسجيل الخروج", h("div",{class:"subtle"}, "سيتم توفير هذه الميزة قريبًا."), [])}, "تسجيل الخروج"),
      h("button",{class:"btn danger", style:"margin-top:10px;", "data-sfx":"naker", onClick: ()=> deleteFlow()}, "حذف الحساب")
    ),
    h("div",{class:"hr"}),
    h("div",{class:"glass gold card"},
      h("div",{class:"subtle"}, "الدعم"),
      h("div",{class:"subtle"}, "deckmastery.support1@gmail.com")
    )
  );

  m.addEventListener("input", ()=> {
    localStorage.setItem("dm_music", m.value);
    setVolumes({music:Number(m.value), sfx:Number(s.value)});
  }, {passive:true});
  s.addEventListener("input", ()=> {
    localStorage.setItem("dm_sfx", s.value);
    setVolumes({music:Number(m.value), sfx:Number(s.value)});
  }, {passive:true});

  app.appendChild(panel);

  function deleteFlow(){
    const b1 = h("div",{}, h("div",{class:"subtle"}, "هل أنت متأكد؟"));
    modal("حذف", b1, [
      { label:"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
      { label:"متابعة", kind:"danger", sfx:"tap_danger", onClick:(close)=> { close(); step2(); } },
    ]);
    function step2(){
      const b2 = h("div",{}, h("div",{style:"color:var(--danger);font-weight:900;"}, "انتبه! بعد الحذف لن تتمكن من استعادة بياناتك."));
      modal("تحذير", b2, [
        { label:"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
        { label:"متابعة", kind:"danger", sfx:"tap_danger", onClick:(close)=> { close(); step3(); } },
      ]);
    }
    function step3(){
      const pass = h("input",{});
      const b3 = h("div",{}, h("div",{class:"field"}, h("label",{}, "كلمة السر"), pass));
      modal("تأكيد نهائي", b3, [
        { label:"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
        { label:"حذف", kind:"danger", sfx:"tap_danger", onClick:(close)=> {
          // local delete regardless of pass content
          localStorage.removeItem("deckmastery_v1");
          close();
          location.reload();
        }},
      ]);
    }
  }
}

function renderNotifications(){
  // mark as read when open, but claimable needs click
  const list = h("div",{class:"card-list"});
  for(const n of state.notifications.items){
    const item = h("div",{class:"glass gold card card-mini"},
      h("div",{class:"t"},
        h("div",{class:"a"}, n.title || "تنبيه"),
        h("div",{class:"b"}, n.body || "")
      ),
      n.claimable
        ? h("button",{class:"btn primary", "data-sfx":"tap_primary", onClick: ()=> claim(n.id)}, n.claimed ? "تم" : "استلام")
        : h("div",{class:"kbd"}, n.readAt ? "مقروء" : "جديد")
    );
    list.appendChild(item);
  }

  // mark read
  const now = Date.now();
  for(const n of state.notifications.items){
    if(!n.readAt) n.readAt = now;
  }
  saveState(state);
  syncTopbar();

  const panel = h("section",{class:"glass gold panel"},
    h("div",{class:"panel-title"}, h("h2",{class:"h1"}, "التنبيهات"),
      h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> {
        const back = sessionStorage.getItem("dm_return_from_settings") || "#/home";
        sessionStorage.removeItem("dm_return_from_settings");
        nav(back);
      }}, "رجوع")
    ),
    list
  );
  app.appendChild(panel);

  function claim(id){
    const n = state.notifications.items.find(x=>x.id===id);
    if(!n || n.claimed) return;
    n.claimed = true;
    saveState(state);
    toast("تم.");
    render();
  }
}

function renderStreak(){
  const segs = state.streak.segments || [];
  const wrap = h("div",{class:"glass gold card"});
  const fuel = h("div",{class:"kbd"}, `الوقود ${state.economy.fuel}`);

  const title = h("div",{class:"panel-title"},
    h("h2",{class:"h1"}, "الالتزام"),
    h("div",{class:"row"}, fuel, h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> {
        const back = sessionStorage.getItem("dm_return_from_settings") || "#/home";
        sessionStorage.removeItem("dm_return_from_settings");
        nav(back);
      }}, "رجوع"))
  );

  const line = h("div",{style:"display:flex;gap:8px;flex-wrap:wrap;justify-content:center;"});
  // build display numbers from segments: show last two segments with barrier
  const days = [];
  if(segs.length){
    const old = segs[0];
    // show last segment only for simplicity
    const merged = segs.reduce((acc, s)=> acc + s.length + (s.missed?.length||0), 0);
    // build visual from segments end
    let num = 1;
    for(let si=0; si<segs.length; si++){
      const s = segs[si];
      for(let i=0;i<s.length;i++){
        days.push({ n:num++, type:"on" });
      }
      const missed = s.missed||[];
      for(let j=0;j<missed.length;j++){
        days.push({ n:num++, type:"off" });
      }
    }
  }

  days.slice(-30).forEach(d=>{
    const btn = h("button",{class:`btn ${d.type==="off"?"danger":""}`, style:"min-width:64px; padding:10px 12px;", "data-sfx":"tap_secondary", onClick: ()=> onDay(d)}, String(d.n));
    line.appendChild(btn);
  });

  wrap.appendChild(line);

  const panel = h("section",{class:"glass gold panel"}, title,
    h("div",{class:"center", style:"font-size:28px;font-weight:900;margin:10px 0;"}, String(state.streak.current||0)),
    wrap
  );
  app.appendChild(panel);

  function onDay(d){
    // reconnect possible if last segment separated by missed and user taps any off day (simplified)
    const last = segs[segs.length-2];
    if(!last || !(last.missed?.length)) return;
    const need = last.missed.length;
    const body = h("div",{}, h("div",{class:"subtle"}, `استخدام ${need} وقود لتوصيل الحماسة؟`));
    modal("توصيل", body, [
      { label:"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
      { label:"تأكيد", kind:"primary", sfx:"tap_primary", onClick:(close)=> {
        const r = reconnectStreak(state);
        if(!r.ok){ toast("رصيد غير كافٍ."); return; }
        saveState(state);
        close();
        toast("تم.");
        render();
      }},
    ]);
  }
}

function renderLeaderboard(){
  // global leaderboard not available
  app.appendChild(placeholderPage("سيتم توفير هذه الميزة قريبًا."));
}

function average(arr){
  if(!arr || arr.length===0) return 10;
  return arr.reduce((s,x)=>s+x,0)/arr.length;
}
function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}
function countUp(el, target){
  const d = {v:0};
  gsap.to(d, { v: target, duration: 0.9, ease: "power2.out", onUpdate: ()=> {
    el.textContent = String(Math.floor(d.v));
    if(Math.random() < 0.12) playSfx("count");
  }});
}
