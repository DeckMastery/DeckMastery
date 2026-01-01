import { loadState, saveState, migrate, ensureProfile, computeLevelFromXp, rankLabel, todayISO, formatDateDMY, addNotification, uuid } from "./state.js";
import { h, clear, toast, modal, placeholderPage, tip } from "./ui.js";
import { preloadAudio, playBgm, wireSfx, playSfx, setVolumes, setVibrationEnabled, isVibrationEnabled } from "./audio.js";
import { getLang, applyLang, setLang, tr } from "./i18n.js";
import {
  dailyResetIfNeeded, seasonCheckAndReset, newDailyGroup, canAddMoreCardsToday, addCard,
  applyDailyCardProgress, dueCardsForToday, applyReturnChoice, computeRewardsForGame, applyRatingDelta, recordAttendance,
  reconnectStreak, computeAvatarLayers
} from "./logic.js";

const app = document.getElementById("app");
const bgEl = document.getElementById("bg"); // kept but not used in modern UI
const USE_VANTA = false;

let state = migrate(loadState() || null);
saveState(state);

// --- Theme (Light / Dark) ---
function getTheme(){
  const t = (localStorage.getItem("dm_theme") || "light").toLowerCase();
  return (t === "dark") ? "dark" : "light";
}
function applyTheme(theme){
  const t = (theme === "dark") ? "dark" : "light";
  localStorage.setItem("dm_theme", t);
  document.documentElement.dataset.theme = t;
}
// Apply immediately (also set in index.html to avoid flash)
applyTheme(getTheme());
let vibOn = (localStorage.getItem("dm_vibrate") ?? "1") !== "0";
let darkOn = (getTheme() === "dark");

// --- Card back skin (applies to all card surfaces via CSS variable) ---
function getSelectedCardBack(){
  try{
    const lib = state?.library?.cardBacks;
    if(!lib) return null;
    const items = lib.items || [];
    const sel = lib.selected;
    return items.find(x=>x.id===sel) || items[0] || null;
  }catch(_){ return null; }
}

function applyCardBackSkin(){
  try{
    const it = getSelectedCardBack();
    const src = (it && it.src) ? String(it.src) : "";
    const root = document.documentElement;
    root.style.setProperty("--dm-cardback-image", src ? `url("${src}")` : "none");
  }catch(_){ }
}

// Static chrome labels live in index.html (outside the routed app). Keep them in sync with dm_lang.
function syncStaticChromeI18n(){
  try{
    const lblStreak = document.getElementById("lblStreak");
    if(lblStreak) lblStreak.textContent = tr("الحماس");

    const lblNotifications = document.getElementById("lblNotifications");
    if(lblNotifications) lblNotifications.textContent = tr("الإشعارات");

    const lblHelp = document.getElementById("lblHelp");
    if(lblHelp) lblHelp.textContent = tr("التعليمات");

    const lblSettings = document.getElementById("lblSettings");
    if(lblSettings) lblSettings.textContent = tr("الإعدادات");

    const btnProfile = document.getElementById("btnProfile");
    if(btnProfile) btnProfile.setAttribute("aria-label", tr("الملف الشخصي"));

    const goldTag = document.getElementById("goldTag");
    if(goldTag) goldTag.setAttribute("aria-label", tr("الذهب"));
  }catch(_){ }
}

// تعليمات الصفحة (زر ? في الشريط العلوي)
let currentRoute = "home";
const HELP_TEXT = {
  login: { ar: "أدخل اسم مستخدم واختر الجنس، ثم ابدأ.", en: "Enter a username, choose gender, then start." },
  home: { ar: `نصيحة مهمة: قبل أن تضع وقتك في التطبيق، صدِّر بياناتك من «الإعدادات» عبر «تصدير بياناتي»، واحتفظ بملف النسخ الاحتياطي لتستطيع استيراده لاحقًا عند تغيير الجهاز أو حذف بيانات المتصفح.

آلية البطاقات: أي بطاقة تُضيفها اليوم تُحفظ ضمن مجموعة تاريخ اليوم، وتبدأ بالظهور في الألعاب ابتداءً من الغد ثم وفق جدول المستويات المتفق عليه.

لديك اقتراح أو ملاحظة؟ أرسلها إلى بريد الدعم الموجود داخل «الإعدادات».`, en: `Important tip: before you invest your time, export your data from “Settings” using “Export my data”, and keep the backup file so you can import it later if you change devices or clear your browser data.

How cards work: any card you add today is saved inside today’s daily group, and it starts appearing in games from tomorrow, then continues according to the agreed level schedule.

Have a suggestion or a note? Send it to the support email shown inside “Settings”.` },
  add: { ar: "اكتب الكلمة الأجنبية في الحقل الأول، وترجمتها في الثاني، وتلميحًا في الثالث. الحد الأدنى 4 بطاقات والحد الأقصى 8. يمكنك شراء بطاقتين إضافيتين من المتجر.", en: "Put the foreign word in the first field, its meaning in the second, and a memorable hint in the third. Minimum 4 cards, maximum 8. You can buy 2 extra cards from the shop." },
  library: { ar: "افتح أي رزمة ثم استخدم «تحديد» لتنفيذ الإجراءات على عدة بطاقات. «تدريب» يتطلب 4 بطاقات فأكثر.", en: "Open any pack, then use “Select” to run actions on multiple cards. “Training” requires at least 4 cards." },
  shop: { ar: "اشترِ الأدوات والتخصيص. العناصر المشتراة تختفي من المتجر وتظهر ضمن مكتبة الملف الشخصي.", en: "Buy power-ups and cosmetics. Purchased items disappear from the shop and appear in your Profile library." },
  profile: { ar: "غيّر الأفاتار/الخلفية/الإطار من قسم التخصيص. العناصر المملوكة تظهر ويمكن تفعيلها بزر «استخدام».", en: "Change avatar/background/frame from Customize. Owned items can be applied with “Use”." },
  settings: { ar: "تحكم بالصوت. استخدم «تصدير بياناتي» و«استيراد بياناتي» للحفظ الاحتياطي.", en: "Control audio. Use “Export my data” and “Import my data” for backups." },
  notifications: { ar: "تُعلَّم التنبيهات كمقروءة عند فتح الصفحة. استلام الجوائز يتطلب النقر عليها.", en: "Notifications are marked as read when you open the page. Claiming rewards requires tapping them." },
  streak: { ar: "يتتبع الالتزام اليومي. يمكن وصل أيام الانقطاع باستخدام الوقود.", en: "Tracks your daily streak. You can reconnect missed days using Fuel." },
  leaderboard: { ar: "تصنيف محلي على هذا الجهاز. الموسم يُعاد ضبطه كل 100 يوم وفق خوارزمية التصفير.", en: "Local leaderboard on this device. The season resets every 100 days using the reset algorithm." },
};

function openHelp(){
  const lang = getLang();
  const txtObj = HELP_TEXT[currentRoute];
  const txt = (txtObj && typeof txtObj === "object") ? (txtObj[lang] || txtObj.ar) : (txtObj || "لا توجد تعليمات لهذه الصفحة.");
  const body = h("div",{},
    h("div",{class:"subtle", style:"white-space:pre-wrap; line-height:1.8;"}, txt)
  );
  modal(tr("التعليمات"), body, [ { label: tr("إغلاق"), kind:"primary", sfx:"naker", onClick:(close)=> close() } ]);
}

// -------- النسخ الاحتياطي الأسبوعي (تذكير كل سبت) --------
function backupDateKey(d=new Date()){
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}-${mm}-${yy}`;
}

function defaultBackupFileName(){
  return `DeckMastery_${backupDateKey()}_Backup.json`;
}

function downloadFullBackup(fileName=defaultBackupFileName()){
  const payload = {
    _app:"DeckMastery",
    _type:"backup",
    _v:1,
    exportedAt: new Date().toISOString(),
    storage:{
      deckmastery_v1: state,
      dm_music: localStorage.getItem("dm_music") ?? "0.65",
      dm_sfx: localStorage.getItem("dm_sfx") ?? "0.85",
      dm_vibrate: localStorage.getItem("dm_vibrate") ?? "1",
      dm_theme: localStorage.getItem("dm_theme") ?? "light",
    }
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 5000);
  localStorage.setItem("dm_last_backup_filename", fileName);
}

function maybeShowSaturdayBackupReminder(){
  try{
    if(!state.profile) return;
    // لا نُقاطع جلسات اللعب/التدريب
    if(["play","training"].includes(currentRoute)) return;

    const now = new Date();
    const isSaturday = now.getDay() === 6; // Saturday
    if(!isSaturday) return;

    const todayKey = backupDateKey(now);
    const shownKey = localStorage.getItem("dm_backup_reminder_saturday_last") || "";
    if(shownKey === todayKey) return;

    // سجّل أنه ظهر اليوم (مرة واحدة فقط)
    localStorage.setItem("dm_backup_reminder_saturday_last", todayKey);

    const body = h("div",{},
      h("div",{class:"subtle", style:"white-space:pre-wrap; line-height:1.9;"},
`هذا تذكيرٌ أسبوعيٌّ لطيف.

لتحمي تقدّمك من ضياع البيانات، ننصحك بتنزيل نسخة احتياطية على جهازك.

النسخة تشمل كل شيء: مستوى الحساب، الذهب، التصنيف، جميع الرزم والبطاقات والمجموعات اليومية، وكل المقتنيات التي اشتريتها من المتجر.`)
    );

    modal("نسخة احتياطية أسبوعية", body, [
      {
        label:"تنزيل الآن",
        kind:"primary",
        sfx:"naker",
        onClick:(close)=>{
          const prev = localStorage.getItem("dm_last_backup_filename");
          const name = defaultBackupFileName();
          downloadFullBackup(name);
          close();

          // رسالة ثانية: نصيحة حذف النسخة القديمة (يدويًا)
          const oldName = (prev && prev !== name) ? prev : "";
          const tipBody = h("div",{},
            h("div",{class:"subtle", style:"white-space:pre-wrap; line-height:1.9;"},
`للمحافظة على مساحة جهازك، احذف النسخ القديمة إن لم تعد تحتاجها.
${oldName ? `\nآخر نسخة يُنصح بحذفها: ${oldName}` : ""}`)
          );
          modal("تنبيه مساحة التخزين", tipBody, [
            { label:"حسنًا", kind:"primary", sfx:"naker", onClick:(c)=>c() }
          ]);
        }
      },
      {
        label:"لاحقًا",
        kind:"ghost",
        sfx:"naker",
        onClick:(close)=> close()
      }
    ]);
  }catch{}
}


window.addEventListener("hashchange", render);
window.addEventListener("pointerdown", async ()=> {
  // unlock audio
  preloadAudio().catch(()=>{});
}, { once:true, passive:true });

init();

async function init(){
  applyLang();
  syncStaticChromeI18n();
  applyCardBackSkin();
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
	  vibOn = (localStorage.getItem("dm_vibrate") ?? "1") !== "0";
	  darkOn = (getTheme() === "dark");
	  setVolumes({ music, sfx });

  // vibration toggle (default ON)
  try{
    if(localStorage.getItem("dm_vibrate") == null) localStorage.setItem("dm_vibrate", "1");
  }catch(_){ }
	  try{
	    setVibrationEnabled(vibOn);
	  }catch(_){ }

  render();

  // تذكير النسخ الاحتياطي (كل سبت مرة واحدة)
  setTimeout(()=> maybeShowSaturdayBackupReminder(), 350);

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
  if(!USE_VANTA || !bgEl) return;
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
  document.getElementById("uiRank").textContent = tr(rankLabel(rating.rankKey, rating.subLevel));
  const lvl = computeLevelFromXp(econ.xp);
  document.getElementById("uiLevel").textContent = (getLang()==="en") ? `Level ${lvl.level}` : `المستوى ${lvl.level}`;
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
    // Layering per spec: frame (bottom) -> background -> avatar (top)
  }
}

wireGlobalActions();

function wireGlobalActions(){
  document.getElementById("btnProfile").addEventListener("click", (e)=>{ e.__dm_sfx_ok = true; nav("#/profile"); });
  document.getElementById("btnSettings").addEventListener("click", (e)=>{ e.__dm_sfx_ok = true; nav("#/settings"); });
  document.getElementById("btnNotifications").addEventListener("click", (e)=>{ e.__dm_sfx_ok = true; nav("#/notifications"); });
  document.getElementById("btnStreak").addEventListener("click", (e)=>{ e.__dm_sfx_ok = true; nav("#/streak"); });
  document.getElementById("btnHelp").addEventListener("click", (e)=>{ e.__dm_sfx_ok = true; openHelp(); });
  // تفعيل أصوات اللمس/النقر لشريط الأعلى مرة واحدة
  // Global SFX delegator (covers app + modalRoot)
  wireSfx(document);
}

function nav(hash){
  return navEx(hash);
}

// --- Navigation stack (for in-app Back button)
// We intentionally manage our own stack because some pages previously forced a return to Home.
// This makes "Back" consistently return to the previous page the user came from.
const NAV_STACK_KEY = "dm_nav_stack_v1";

function getNavStack(){
  try{
    const raw = sessionStorage.getItem(NAV_STACK_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  }catch(_){
    return [];
  }
}

function setNavStack(arr){
  try{
    const safe = Array.isArray(arr) ? arr.slice(-50) : [];
    sessionStorage.setItem(NAV_STACK_KEY, JSON.stringify(safe));
  }catch(_){/* ignore */}
}

function navEx(hash, opts={}){
  const {
    replace = false,
    noSfx = false,
    fromBack = false,
  } = opts || {};

  // SFX is handled centrally via data-sfx + wireSfx (plays after successful click actions).

  // keep legacy "return from settings" key for compatibility, but it is no longer relied upon
  if(hash === "#/settings"){
    const from = location.hash && location.hash !== "#/settings" ? location.hash : "#/home";
    sessionStorage.setItem("dm_return_from_settings", from);
  }

  // push current hash into stack unless this navigation is triggered by Back
  const cur = location.hash || "#/home";
  if(!fromBack && cur && cur !== hash){
    const st = getNavStack();
    if(st.length === 0 || st[st.length-1] !== cur) st.push(cur);
    setNavStack(st);
  }

  // navigate
  if(replace){
    // replace current history entry to avoid creating loops when using our custom back stack
    try{ location.replace(hash); }catch(_){ location.hash = hash; }
  }else{
    location.hash = hash;
  }
}

function navBack(){
  // Back should always go one step back *within the app*.
  const cur = location.hash || "#/home";
  const st = getNavStack();
  while(st.length){
    const prev = st.pop();
    if(prev && prev !== cur){
      setNavStack(st);
      return navEx(prev, { fromBack:true, replace:true });
    }
  }
  setNavStack([]);
  return navEx("#/home", { fromBack:true, replace:true });
}

function render(){
  // route protection
  if(!state.profile){
    if(location.hash !== "#/login") location.hash = "#/login";
  }

  // تحديثات يومية/موسمية يجب تطبيقها بغض النظر عن الصفحة
  if(state.profile){
    try{
      dailyResetIfNeeded(state);
      seasonCheckAndReset(state);
      saveState(state);
    }catch(_){/* ignore */}
  }
  syncTopbar();

  const fullHash = (location.hash || "#/home").replace("#/","");
  const parts = fullHash.split("?");
  const route = parts[0];
  const hashParams = new URLSearchParams(parts[1] || "");
  currentRoute = route;

  // هذا الشريط العلوي (الملف الشخصي + الذهب + أزرار أعلى) خاص بالصفحة الرئيسية فقط.
  // بقية الصفحات يجب أن تظهر بدون "قسم الرئيسية العلوي" حتى لا يتكرر في كل مكان.
  const topbar = document.getElementById("topbar");
  const topNav = document.getElementById("topNav");
  const showHomeChrome = (route === "home");
  if(topbar) topbar.style.display = showHomeChrome ? "flex" : "none";
  if(topNav) topNav.style.display = showHomeChrome ? "grid" : "none";




  // إخفاء شريط معلومات الحساب أثناء اللعب/التدريب فقط
  document.body.classList.toggle(
    "in-session",
    route === "play" || route === "training"
  );

  clear(app);

  // background + bgm per route
  // Music rules:
  // - Outside gameplay: khalfia.mp3
  // - Inside gameplay sessions (play/training): tahadi.mp3
  if(route.startsWith("play") || route.startsWith("training")) {
    setBackground("focus");
    playBgm("session").catch(()=>{});
  } else if(route.startsWith("add")) {
    setBackground("focus");
    playBgm("main").catch(()=>{});
  } else {
    // profile/settings/shop/library/notifications/home/login...
    setBackground(route.startsWith("leaderboard") || route.startsWith("profile") ? "competitive" : "main");
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

  window.lucide?.createIcons?.();
}

function renderPlaceholder(text="سيتم توفير هذه الميزة قريبًا."){
  app.appendChild(placeholderPage(text));
}

function renderLogin(){
  clear(app);

  let selectedGender = "male";

  const uInput = h("input", {
    id: "u",
    type: "text",
    class: "modern-input login-username",
    style: "padding-left: 40px;",
    dir: "auto",
    maxlength: "30",
    placeholder: (getLang() === "en") ? "e.g. Wisam_123" : "مثل: Wisam_123",
    inputmode: "text",
    autocapitalize: "off",
    autocomplete: "nickname",
    spellcheck: "false",
  });

  const setGenderUI = (value, btn) => {
    selectedGender = value;
    const grid = btn?.parentElement;
    grid?.querySelectorAll?.(".gender-btn")?.forEach((b) => {
      b.classList.toggle("selected", b === btn);
      b.setAttribute("aria-pressed", b === btn ? "true" : "false");
    });
  };

  const genderBtn = (value, label, iconClass) =>
    h(
      "button",
      {
        class: `gender-btn ${value === selectedGender ? "selected" : ""}`,
        type: "button",
        "data-sfx": "tap_secondary",
        "aria-pressed": value === selectedGender ? "true" : "false",
        onClick: (e) => setGenderUI(value, e.currentTarget),
      },
      h("i", { class: iconClass, ariaHidden: "true" }),
      h("span", {}, label)
    );

  const start = () => {
    const u = (uInput.value || "").trim();
    if (!/^[A-Za-z0-9_]{3,30}$/.test(u)) {
      toast(tr("اسم غير صالح."));
      return;
    }
    ensureProfile(state, { username: u, gender: selectedGender });
    saveState(state);
    nav("#/home");
  };

  // Header like the new UI (but without real profile)
  const header = h(
    "header",
    { class: "page-header" },
    h(
      "div",
      { class: "profile-card login-header-card", role: "heading", "aria-level": "1" },
      h("div", { class: "login-badge", ariaHidden: "true" }, h("i", { class: "fas fa-user-plus" })),
      h(
        "div",
        { class: "profile-text" },
        h("div", { class: "profile-name" }, "DeckMastery"),
        h("div", { class: "user-meta" }, h("span", { class: "meta-pill" }, tr("البدء")))
      )
    ),
    h("div", { class: "gold-tag", title: tr("الحساب") }, h("i", { class: "fas fa-lock" }), h("span", {}, tr("محلي")))
  );

  const hero = h(
    "div",
    { class: "login-hero glass" },
    h("div", { class: "auth-mark", ariaHidden: "true" }, h("i", { class: "fas fa-wand-magic-sparkles" })),
    h("div", { class: "subtle", style: "text-align:center;white-space:pre-wrap;line-height:1.7;" }, tr(HELP_TEXT.login[getLang()] ? HELP_TEXT.login[getLang()] : HELP_TEXT.login.ar))
  );

  const form = h(
    "section",
    { class: "panel glass gold login-card" },
    hero,
    h(
      "div",
      { class: "field" },
      h("label", {}, tr("الاسم المستعار")),
      h("div",{class:"search-box login-userbox", style:"margin-bottom:0;"}, uInput, h("i",{class:"fas fa-user", ariaHidden:"true"})),
      h("div", { class: "subtle", style: "font-size:0.85rem;" }, "A-Z / 0-9 / _ — 3..30")
    ),
    h(
      "div",
      { class: "field" },
      h("label", {}, tr("الجنس")),
      h("div", { class: "gender-grid" },
        genderBtn("male", tr("ذكر"), "fas fa-mars"),
        genderBtn("female", tr("أنثى"), "fas fa-venus"),
        genderBtn("other", tr("آخر"), "fas fa-transgender")
      )
    ),
    h(
      "button",
      { class: "btn primary auth-start", type: "button", "data-sfx": "tap_primary", onClick: start },
      h("i", { class: "fas fa-play", ariaHidden: "true" }),
      tr("بدء")
    )
  );

  const page = h("div", { class: "login-page" }, header, form);
  app.appendChild(page);

  // Enter => start
  uInput.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") start();
  });
}



function renderHome(){
  // absence popup if pending
  if(state.attendance.missedPending?.length){
    const body = h("div",{},
      h("div",{class:"subtle"}, "تم رصد أيام غياب."),
      h("div",{class:"hr"}),
      h("div",{class:"row"},
        h("button",{class:"btn", "data-sfx":"tap_secondary", onClick:()=> { applyReturnChoice(state, "continue"); saveState(state); toast("تم."); close(); }}, "استمرار"),
        h("button",{class:"btn", "data-sfx":"tap_secondary", onClick:()=> { applyReturnChoice(state, "restart"); saveState(state); toast("تم."); close(); }}, "إعادة"),
        h("button",{class:"btn danger", "data-sfx":"tagahl", onClick:()=> { applyReturnChoice(state, "ignore"); saveState(state); toast("تم."); close(); }}, "تجاهل")
      )
    );
    const { close } = modal("العودة بعد الغياب", body, []);
  }

  clear(app);

  const hero = h("div",{class:"main-hero"},
    h("button",{class:"play-master btn-active", "data-sfx":"play", ariaLabel:"ابدأ اللعب", onClick:()=> { location.hash = "#/play"; }},
      h("i",{class:"fas fa-play"})
    ),
    h("button",{class:"nav-btn btn-active cta-add-card", "data-sfx":"tap_primary", onClick:()=> nav("#/add")},
      h("i",{class:"fas fa-plus"}), "إضافة بطاقة"
    )
  );

  const menu = h("div",{class:"menu-grid"},
    h("div",{class:"menu-item btn-active", "data-sfx":"naker", onClick:()=> nav("#/library")}, h("i",{class:"fas fa-box-open"}), "رزم البطاقات"),
    h("div",{class:"menu-item btn-active", "data-sfx":"naker", onClick:()=> nav("#/shop")}, h("i",{class:"fas fa-shopping-cart"}), "المتجر"),
    h("div",{class:"menu-item btn-active", "data-sfx":"naker", onClick:()=> nav("#/leaderboard")}, h("i",{class:"fas fa-trophy"}), "التصنيف"),
    h("div",{class:"menu-item btn-active", "data-sfx":"naker", onClick:()=> nav("#/tasks")}, h("i",{class:"fas fa-tasks"}), "المهمات"),
    h("div",{class:"menu-item btn-active", "data-sfx":"naker", onClick:()=> nav("#/mastery")}, h("i",{class:"fas fa-road"}), "طريق الإتقان"),
    h("div",{class:"menu-item btn-active", "data-sfx":"naker", onClick:()=> nav("#/friends")}, h("i",{class:"fas fa-users"}), "الأصدقاء")
  );

  const panel = h("section",{class:"panel glass gold"},
    h("div",{class:"panel-title"},
      h("h2",{class:"h1"}, "الرئيسية"),
      h("span",{class:"subtle"}, formatDateDMY(todayISO()))
    ),
    hero,
    menu
  );

  app.appendChild(panel);
  
  // ---- First-run beta notice (show once per profile) ----
  if (state.profile && !state.profile.betaNoticeShown) {
    // mark as shown immediately (so it never repeats)
    state.profile.betaNoticeShown = true;
    saveState(state);

    const body = document.createElement("div");

    const ar = document.createElement("div");
    ar.setAttribute("dir", "rtl");
    ar.style.lineHeight = "1.7";
    ar.textContent =
      "تنبيه: التطبيق جديد وما زال تحت الاختبار. إذا واجهت أي مشكلة أو لديك اقتراح مفيد لتحسين التطبيق، ستجد بريد الدعم داخل الإعدادات ويمكنك مراسلتنا عليه.";

    const hr = document.createElement("div");
    hr.className = "hr";

    const en = document.createElement("div");
    en.setAttribute("dir", "ltr");
    en.style.lineHeight = "1.7";
    en.textContent =
      "Notice: This app is new and still under testing. If you face any issue or have a useful suggestion to improve the app, you can find the support email in Settings and contact us.";

    body.append(ar, hr, en);

    modal("تنبيه / Notice", body, [
      {
        label: "حسنًا / OK",
        kind: "primary",
        sfx: "tap_primary",
        onClick: (close) => close(),
      },
    ]);
  }
  // -------------------------------------------------------

  // apply background mode (disabled in modern UI)
  setBackground(state.mode || "normal");

  // mark daily reset
  dailyResetIfNeeded(state);
  seasonCheckAndReset(state);
  saveState(state);

  // SFX is delegated globally via wireSfx(document)
}


function renderAddCard(){
  const g = newDailyGroup(state);
  const isEn = getLang()==="en";

  // Track how many cards were added in this visit (session).
  // IMPORTANT: the minimum rule (4 cards) applies to the whole "today" group,
  // not just this session.
  let sessionAdded = 0;

  // Remove card ids everywhere they could exist inside the local state.
  // This is used to rollback today's draft cards if the user exits before reaching 4.
  function removeCardIds(ids){
    if(!Array.isArray(ids) || !ids.length) return;
    const idSet = new Set(ids);

    // remove from byId
    for(const id of ids){
      delete state.cards.byId[id];
    }

    // remove from order
    state.cards.order = (state.cards.order||[]).filter(id=> !idSet.has(id));

    // remove from daily groups
    for(const iso of Object.keys(state.cards.dailyGroups||{})){
      const dg = state.cards.dailyGroups[iso];
      if(!dg?.cardIds) continue;
      dg.cardIds = dg.cardIds.filter(id=> !idSet.has(id));
      // if group becomes empty, drop it to keep UI clean
      if(dg.cardIds.length === 0) delete state.cards.dailyGroups[iso];
    }

    // remove from ignored/completed lists
    state.cards.ignored = (state.cards.ignored||[]).filter(id=> !idSet.has(id));
    state.cards.completed = (state.cards.completed||[]).filter(id=> !idSet.has(id));

    // remove from custom packs
    for(const p of (state.library.customPacks||[])){
      if(!p?.cardIds) continue;
      p.cardIds = p.cardIds.filter(id=> !idSet.has(id));
    }

    // remove from lesson caches
    for(const iso of Object.keys(state.attendance.lessonCache||{})){
      const entry = state.attendance.lessonCache[iso];
      const list = Array.isArray(entry) ? entry : entry?.cardIds;
      if(!Array.isArray(list)) continue;
      const next = list.filter(id=> !idSet.has(id));
      if(Array.isArray(entry)) state.attendance.lessonCache[iso] = next;
      else state.attendance.lessonCache[iso] = { ...(entry||{}), cardIds: next };
    }
  }

  // inputs
  // Add-card inputs: Enter should move between fields, and on the 3rd field it should add the card and focus the first field.
  const a = h("input",{type:"text", maxlength:"45", class:"modern-input", id:"original-text", enterkeyhint:"next", autocomplete:"off", placeholder: isEn?"Original text...":"النص الأصلي..."});
  const b = h("input",{type:"text", maxlength:"45", class:"modern-input", id:"translation-text", enterkeyhint:"next", autocomplete:"off", placeholder: isEn?"Translation...":"الترجمة..."});
  const hint = h("input",{type:"text", maxlength:"60", class:"modern-input", id:"hint-text", enterkeyhint:"done", autocomplete:"off", placeholder: isEn?"Hint (required)...":"التلميح..."});

  const counter = h("div",{class:"subtle add-counter", id:"counter"}, "");
  const addedToday = h("div",{class:"add-today"}, "");
  const maxNote = h("div",{class:"subtle", id:"maxNote"}, "");

  function todayGroupCount(){
    const iso = todayISO();
    const dg = state.cards.dailyGroups?.[iso];
    return Array.isArray(dg?.cardIds) ? dg.cardIds.length : 0;
  }

  function todayGroupIds(){
    const iso = todayISO();
    const dg = state.cards.dailyGroups?.[iso];
    return Array.isArray(dg?.cardIds) ? [...dg.cardIds] : [];
  }

  function update(){
    const st = canAddMoreCardsToday(state);
    const cur = Math.max(1, todayGroupCount()+1);
    counter.textContent = (isEn)
      ? `Card ${cur} of 4 (min)`
      : `البطاقة ${cur} من 4 (الحد الأدنى)`;
    addedToday.innerHTML = (isEn)
      ? `Added today: <b style="color:var(--accent-color)">${st.count}</b> / ${st.max}`
      : `عدد المضاف اليوم: <b style="color:var(--accent-color)">${st.count}</b> / ${st.max}`;

    btnAdd.disabled = !st.can;
    btnAdd.style.opacity = st.can ? "1" : "0.6";
    if(!st.can){
      maxNote.textContent = isEn ? "Daily limit reached." : "تم بلوغ الحد اليومي.";
    } else {
      maxNote.textContent = "";
    }

    // finish availability (depends on today's group, not this session)
    const canFinish = todayGroupCount() >= 4;
    // Keep the button clickable so it can show the "minimum 4" message + Ekmal.wav.
    btnFinish.disabled = false;
    btnFinish.setAttribute("aria-disabled", canFinish ? "false" : "true");
    btnFinish.style.opacity = canFinish ? "1" : "0.65";
  }

  function commit(){
    const A = a.value.trim();
    const B = b.value.trim();
    const H = hint.value.trim();
    if(!A || !B || !H){
      toast(isEn?"Missing fields.":"يرجى تعبئة الحقول الأساسية.");
      // Focus the first missing field for faster keyboard flow
      if(!A) a.focus({preventScroll:true});
      else if(!B) b.focus({preventScroll:true});
      else hint.focus({preventScroll:true});
      return false;
    }
    const st = canAddMoreCardsToday(state);
    if(!st.can){
      toast(isEn?"Daily limit reached.":"تم بلوغ الحد.");
      return false;
    }
    const card = addCard(state, {a:A, b:B, hint:H});
    saveState(state);
    sessionAdded += 1;
    a.value=""; b.value=""; hint.value="";
    update();
    // SFX for this action is handled on the button level (Add & Save).
    // Ready for the next card
    a.focus({preventScroll:true});
    return true;
  }

  // Keyboard flow (desktop + mobile): Enter moves to next input, and on hint it submits and prepares next card.
  a.addEventListener("keydown", (e)=>{
    if(e.key === "Enter"){
      e.preventDefault();
      b.focus({preventScroll:true});
    }
  });
  b.addEventListener("keydown", (e)=>{
    if(e.key === "Enter"){
      e.preventDefault();
      hint.focus({preventScroll:true});
    }
  });
  hint.addEventListener("keydown", (e)=>{
    if(e.key === "Enter"){
      e.preventDefault();
      commit();
    }
  });

  // header like the prototype
  const headerCardStack = h("div",{class:"avatar-stack", ariaHidden:"true"});
  try{
    const {frame, bg, av} = computeAvatarLayers(state);
    const bgImg = new Image(); bgImg.src = bg?.src || ""; bgImg.className = "layer bg";
    const avImg = new Image(); avImg.src = av?.src || ""; avImg.className = "layer av";
    const frameImg = new Image(); frameImg.src = frame?.src || ""; frameImg.className = "layer frame";
    // Layering per spec: frame (bottom) -> background -> avatar (top)
    headerCardStack.append(frameImg, bgImg, avImg);
  }catch{}

  const header = h("header",{class:"page-header"},
    h("div",{class:"profile-card", "data-sfx":"naker", onClick: ()=> nav("#/profile")},
      headerCardStack,
      h("div",{class:"profile-text"},
        h("div",{class:"profile-name"}, isEn?"Add Card":"إضافة بطاقة"),
        h("div",{class:"user-meta"}, isEn?"Prepare a new card":"تجهيز بطاقة جديدة")
      )
    ),
    h("div",{class:"gold-tag"}, h("i",{class:"fas fa-coins"}), h("span",{class:"gold-val"}, String(Math.max(0, Math.floor(state.economy.gold||0)))))
  );

  const infoRow = h("div",{class:"card-info-row"},
    h("span",{}, isEn?"Date:":"التاريخ:", " ", h("b",{}, g.titleDMY)),
    h("span",{class:"info-link", "data-sfx":"tap_secondary", onClick: (e)=> { e.preventDefault?.(); openHelp(); }},
      h("i",{class:"fas fa-info-circle"}), " ", isEn?"Instructions":"تعليمات"
    )
  );

  // actions like the prototype (wide stacked buttons)
  const btnAdd = h("button",{class:"btn-wide btn-active accent", "data-sfx":"hefth", onClick: ()=> commit()},
    h("i",{class:"fas fa-plus-circle"}),
    isEn?"Add & save":"إضافة وحفظ"
  );

  const btnFinish = h("button",{class:"btn-wide btn-active neutral", "data-sfx":"enhaa", onClick: ()=> {
    // Dynamic SFX:
    // - before reaching 4 cards => Ekmal.wav
    // - after reaching 4 cards  => Enhaa.wav
    if(todayGroupCount() < 4){
      btnFinish.setAttribute("data-sfx", "ekmal");
      toast(isEn?"Minimum is 4 cards.":"الحد الأدنى 4 بطاقات.");
      return true;
    }
    btnFinish.setAttribute("data-sfx", "enhaa");
    nav("#/home");
    return true;
  }},
    h("i",{class:"fas fa-check"}),
    isEn?"Finish & save":"إنهاء وحفظ"
  );

  const btnShop = h("button",{class:"btn-wide btn-active gold", "data-sfx":"naker", onClick: ()=> nav("#/shop")},
    h("i",{class:"fas fa-shopping-cart"}),
    isEn?"Shop":"المتجر"
  );

  const btnExit = h("button",{class:"btn-wide btn-active dark", "data-sfx":"tahther", onClick: ()=> {
    const anyInputs = !!(a.value||b.value||hint.value);
    const tCount = todayGroupCount();

    // Nothing to lose
    if(!anyInputs && tCount===0){ nav("#/home"); return; }

    // If today's group is still below the minimum, exiting must rollback ALL today's cards.
    if(tCount > 0 && tCount < 4){
      const body = h("div",{},
        h("div",{class:"subtle"}, isEn
          ? `You added ${tCount} card(s) today. Minimum is 4. If you exit now, today's cards will be deleted.`
          : `أضفت اليوم ${tCount} بطاقة فقط. الحد الأدنى 4. إذا خرجت الآن سيتم حذف بطاقات اليوم.`
        )
      );
      modal(isEn?"Confirm":"تأكيد", body, [
        { label: isEn?"Continue":"متابعة الإضافة", kind:"ghost", onClick:(close)=> close(), sfx:"tap_secondary" },
        { label: isEn?"Delete & exit":"حذف وخروج", kind:"danger", onClick:(close)=> {
            // rollback today's draft cards
            const ids = todayGroupIds();
            removeCardIds(ids);
            // also drop today's group entry (clean)
            try{ delete state.cards.dailyGroups[todayISO()]; }catch{}
            saveState(state);
            a.value=""; b.value=""; hint.value=""; sessionAdded=0;
            close();
            nav("#/home");
          }, sfx:"hathef" },
      ]);
      return;
    }

    // Otherwise: keep saved cards, discard only unsaved inputs
    if(!anyInputs){ nav("#/home"); return; }
    const body = h("div",{}, h("div",{class:"subtle"}, isEn?"Discard unsaved text and exit?":"حذف النص غير المحفوظ والخروج؟"));
    modal(isEn?"Confirm":"تأكيد", body, [
      { label: isEn?"Cancel":"إلغاء", kind:"ghost", onClick:(close)=> close(), sfx:"tap_secondary" },
      { label: isEn?"Discard":"حذف وخروج", kind:"danger", onClick:(close)=> { a.value=""; b.value=""; hint.value=""; close(); nav("#/home"); }, sfx:"hathef" },
    ]);
  }},
    h("i",{class:"fas fa-sign-out-alt"}),
    isEn?"Exit":"خروج"
  );

  const inputs = h("div",{class:"input-group"}, a, b, hint);
  const actions = h("div",{class:"action-stack"}, btnAdd, btnFinish, btnShop, btnExit, maxNote);

  const wrap = h("div",{class:"add-wrap"},
    header,
    infoRow,
    addedToday,
    inputs,
    counter,
    actions
  );

  update();
  app.appendChild(wrap);
}

function renderPlay(){
  const today = todayISO();
  let due = null;

  // تثبيت بطاقات اليوم حتى لو تغيّرت مستوياتها بعد التقييم
  const cached = state.attendance.lessonCache?.[today];
  const cachedIds = Array.isArray(cached) ? cached : (cached?.cardIds);
  if(Array.isArray(cachedIds) && cachedIds.length){
    due = cachedIds
      .map(id=> state.cards.byId[id])
      .filter(c=> c && !c.ignored && !c.completed && !c.frozen);
    if(due.length === 0) due = null;
  }
  if(!due){
    due = dueCardsForToday(state).filter(c=>!c.frozen);
    state.attendance.lessonCache = state.attendance.lessonCache || {};
    state.attendance.lessonCache[today] = { cardIds: due.map(c=>c.id) };
    saveState(state);
  }
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
    h("div",{class:"hud-metrics"},
      h("span",{class:"subtle", id:"timer"}, "00:00"),
      h("span",{class:"subtle", id:"remain"}, "")
    )
  );
  panel.appendChild(header);

  const stage = h("div",{class:"no-lams"});
  panel.appendChild(stage);
  app.appendChild(panel);

  // header widgets: help/skip/settings (with owned counts)
  const helpBadge = h("span",{class:"icon-badge", ariaLabel:"عدد المساعدة"}, String(state.economy.helps ?? 0));
  const skipBadge = h("span",{class:"icon-badge", ariaLabel:"عدد التخطي"}, String(state.economy.skips ?? 0));

  const helpBtn = h(
    "button",
    { class:"icon-btn", "data-sfx":"musaade", onClick: ()=> onHelp() },
    h("i",{class:"fas fa-wand-magic-sparkles", ariaHidden:"true"}),
    helpBadge
  );
  const skipBtn = h(
    "button",
    { class:"icon-btn", "data-sfx":"takhate", onClick: ()=> onSkip() },
    h("i",{class:"fas fa-forward", ariaHidden:"true"}),
    skipBadge
  );
  const logBtn = h("button",{class:"icon-btn", "data-sfx":"tap_secondary", onClick: ()=> showHelpLog()}, h("i",{class:"fas fa-scroll", ariaHidden:"true"}));
  const setBtn = h("button",{class:"icon-btn", "data-sfx":"naker", onClick: ()=> openSettingsOverlay()}, h("i",{class:"fas fa-sliders", ariaHidden:"true"}));
  header.appendChild(h("div",{class:"top-right"}, helpBtn, logBtn, skipBtn, setBtn));

  function refreshOwnedCounters(){
    helpBadge.textContent = String(state.economy.helps ?? 0);
    skipBadge.textContent = String(state.economy.skips ?? 0);
  }

  window.lucide?.createIcons?.();

  // مؤشر عدد البطاقات المتبقية داخل اللعبة الحالية (مثال: 7/20)
  const remainEl = header.querySelector("#remain");
  function setRemain(done, total){
    if(!remainEl) return;
    const t = Math.max(0, Number(total || 0));
    const d = Math.max(0, Number(done || 0));
    const r = Math.max(0, t - d);
    remainEl.textContent = t ? `${r}/${t}` : "";
  }

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
    const isEn = getLang()==="en";
    const music = Number(localStorage.getItem("dm_music") ?? "0.65");
    const sfx = Number(localStorage.getItem("dm_sfx") ?? "0.85");

    const m = h("input",{type:"range", min:"0", max:"1", step:"0.01", value:String(music)});
    const s = h("input",{type:"range", min:"0", max:"1", step:"0.01", value:String(sfx)});

    // Vibration toggle
    const vibIcon = h("i",{class: vibOn ? "fas fa-toggle-on" : "fas fa-toggle-off"});
    const vibTxt  = h("span",{class:"vib-txt"}, vibOn ? (isEn?"On":"شغال") : (isEn?"Off":"متوقف"));
    const vibBtn  = h("button",{type:"button", class:`vibrate-pill ${vibOn?"on":"off"} btn-active`, "data-sfx":"tap_secondary", onClick: ()=>{
      vibOn = !vibOn;
      setVibrationEnabled(vibOn);
      vibBtn.classList.toggle("on", vibOn);
      vibBtn.classList.toggle("off", !vibOn);
      vibIcon.className = vibOn ? "fas fa-toggle-on" : "fas fa-toggle-off";
      vibTxt.textContent = vibOn ? (isEn?"On":"شغال") : (isEn?"Off":"متوقف");
      playSfx("tap_secondary");
    }}, vibIcon, vibTxt);

    // Theme toggle
    const thIcon = h("i",{class: darkOn ? "fas fa-moon" : "fas fa-sun"});
    const thTxt  = h("span",{}, darkOn ? (isEn?"Dark":"داكن") : (isEn?"Light":"فاتح"));
    const thBtn  = h("button",{type:"button", class:`theme-pill ${darkOn?"on":"off"} btn-active`, "data-sfx":"tap_secondary", onClick: ()=>{
      darkOn = !darkOn;
      applyTheme(darkOn ? "dark" : "light");
      thBtn.classList.toggle("on", darkOn);
      thBtn.classList.toggle("off", !darkOn);
      thIcon.className = darkOn ? "fas fa-moon" : "fas fa-sun";
      thTxt.textContent = darkOn ? (isEn?"Dark":"داكن") : (isEn?"Light":"فاتح");
      playSfx("tap_secondary");
    }}, thIcon, thTxt);

    const body = h("div",{class:"settings-list"},
      h("div",{class:"setting-item"},
        h("div",{class:"setting-label"}, h("i",{class:"fas fa-music"}), isEn?"Music volume":"مستوى الموسيقى"),
        m
      ),
      h("div",{class:"setting-item"},
        h("div",{class:"setting-label"}, h("i",{class:"fas fa-volume-up"}), isEn?"Interaction volume":"مستوى التفاعلات"),
        s
      ),
      h("div",{class:"setting-item"},
        h("div",{class:"setting-row"},
          h("div",{class:"setting-label"}, h("i",{class:"fas fa-mobile-screen-button"}), isEn?"Tap vibration":"اهتزاز اللمس"),
          vibBtn
        )
      ),
      h("div",{class:"setting-item"},
        h("div",{class:"setting-row"},
          h("div",{class:"setting-label"}, h("i",{class:"fas fa-circle-half-stroke"}), isEn?"Theme":"المظهر"),
          thBtn
        )
      ),
      h("div",{class:"support-email"}, isEn?"Full settings are on Home.":"ملاحظة: الإعدادات الكاملة من الصفحة الرئيسية.")
    );

    modal(isEn?"Quick Settings":"إعدادات سريعة", body, [
      { label:isEn?"Back":"رجوع", kind:"primary", sfx:"tap_secondary", onClick:(close)=> close() },
    ]);

    m.addEventListener("input", ()=>{
      localStorage.setItem("dm_music", m.value);
      setVolumes({music:Number(m.value), sfx:Number(s.value)});
    }, {passive:true});
    s.addEventListener("input", ()=>{
      localStorage.setItem("dm_sfx", s.value);
      setVolumes({music:Number(m.value), sfx:Number(s.value)});
    }, {passive:true});
  }

  function onHelp(){
    if(state.economy.helps <= 0){
      // No help available => no sound (return false)
      try{
        if(window.gsap && typeof gsap.fromTo === "function"){
          gsap.fromTo(helpBtn, {x:0}, {x:8, duration:0.08, yoyo:true, repeat:3});
        } else if(helpBtn?.animate){
          helpBtn.animate(
            [{transform:"translateX(0px)"},{transform:"translateX(8px)"},{transform:"translateX(0px)"}],
            {duration:240, iterations:3, easing:"ease-in-out"}
          );
        }
      }catch{}
      toast("لا توجد مساعدة.");
      return false;
    }
    state.economy.helps -= 1;
    session.usedHelps += 1;
    saveState(state);
    refreshOwnedCounters();
    helpLog.push("مساعدة مستخدمة.");
    toast("تم استخدام مساعدة.");
    return true;
  }

  function onSkip(){
    if(state.economy.skips <= 0){
      try{
        if(window.gsap && typeof gsap.fromTo === "function"){
          gsap.fromTo(skipBtn, {x:0}, {x:-8, duration:0.08, yoyo:true, repeat:3});
        } else if(skipBtn?.animate){
          skipBtn.animate(
            [{transform:"translateX(0px)"},{transform:"translateX(-8px)"},{transform:"translateX(0px)"}],
            {duration:240, iterations:3, easing:"ease-in-out"}
          );
        }
      }catch{}
      toast("لا يوجد تخطي.");
      return false;
    }
    const body = h("div",{}, h("div",{class:"subtle"}, "تأكيد التخطي؟"));
    modal("تخطي", body, [
      { label:"إلغاء", kind:"ghost", sfx:"naker", onClick:(close)=> close() },
      { label:"تأكيد", kind:"primary", sfx:"none", onClick:(close)=> {
        state.economy.skips -= 1;
        session.usedSkips += 1;
        saveState(state);
        refreshOwnedCounters();
        close();
        // treat current game as perfect and jump forward
        finishGame({ skipped:true, perfect:true });
        return true;
      }},
    ]);
    return true;
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

    setRemain(0, cards.length);

    const wrap = h("div",{class:"match-wrap"});
    const colA = h("div",{class:"match-col"});
    const colB = h("div",{class:"match-col"});
    wrap.append(colA, colB);

    const makeBtn = (item)=> {
      const b = h("button",{class:"btn match-choice", "data-sfx":"ekhtiar"}, item.text);
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
        try{ playSfx("ekhtiar"); }catch{}
        return;
      }
      if(sel.id === item.id && sel.type === item.type){
        selBtn?.classList.remove("selected");
        sel = null;
        selBtn = null;
        try{ playSfx("ekhtiar"); }catch{}
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
        setRemain(correct, cards.length);
        // remove matched pair buttons (حسب المعرف)
        const aBtn = colA.querySelector(`button[data-cardid="${x.id}"][data-type="a"]`);
        const bBtn = colB.querySelector(`button[data-cardid="${x.id}"][data-type="b"]`);
        aBtn?.remove();
        bBtn?.remove();
      } else {
        wrong += 1;
        playSfx("khata");
        if(vibOn && navigator.vibrate) navigator.vibrate(40);

        [bx, btn].forEach((el)=>{
          if(!el) return;
          el.classList.add("wrong");
          try{
            if(window.gsap && typeof gsap.fromTo === "function"){
              gsap.fromTo(el, {x:0}, {x:10, duration:0.06, yoyo:true, repeat:3});
            } else if(el.animate){
              el.animate(
                [{transform:"translateX(0px)"},{transform:"translateX(10px)"},{transform:"translateX(0px)"}],
                {duration:240, iterations:2, easing:"ease-in-out"}
              );
            }
          }catch{}
          setTimeout(()=> el.classList.remove("wrong"), 450);
        });
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
    const matched = new Set();
    let correct = 0;
    let lastSuccessT = performance.now();
    const times = [];

    const grid = h("div",{class:"memory-grid"});
    const tiles = [];

    setRemain(0, cs.length);

    const open = new Set(items.map((_,i)=>i));

    items.forEach((it, idx)=>{
      const tile = h("div",{class:"memory-tile open"});
      const inner = h("div",{class:"memory-inner"});
      const front = h("div",{class:"memory-face memory-front"}, "✦");
      const back  = h("div",{class:"memory-face memory-back"}, it.text);
      inner.append(front, back);
      tile.appendChild(inner);

      // show all at start for a few seconds
      tile.classList.add("flipped");

      tile.addEventListener("click", ()=> flip(idx, tile), {passive:true});
      tiles[idx] = tile;
      grid.appendChild(tile);
    });

    stage.appendChild(h("div",{class:"subtle"}, "قلب البطاقات"));
    stage.appendChild(h("div",{class:"hr"}));
    stage.appendChild(grid);

    setTimeout(()=>{
      open.clear();
      tiles.forEach((t)=>{
        if(!t) return;
        t.classList.remove("open","flipped","selected");
      });
    }, 5000);

    function flip(idx, tile){
      if(matched.has(idx)) return;
      if(open.has(idx)) return;

      // allow user to unselect the same revealed tile
      if(revealed.includes(idx)){
        playSfx("ekhtiar");
        revealed = revealed.filter(x=>x!==idx);
        tile.classList.remove("flipped","selected");
        return;
      }
      if(revealed.length >= 2) return;

      if(revealed.length === 0) playSfx("ekhtiar");
      tile.classList.add("flipped","selected");
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
          setRemain(correct, cs.length);

          setTimeout(()=>{
            const t1 = tiles[i1];
            const t2 = tiles[i2];
            if(t1){ t1.classList.add("matched"); t1.classList.remove("selected"); }
            if(t2){ t2.classList.add("matched"); t2.classList.remove("selected"); }
            revealed = [];
            if(correct >= cs.length){
              const avgSec = average(times.length?times:[6]);
              finishGame({ gameKey:"memory", pairsOrCards: correct, successCount: correct, wrongCount: 0, avgSec, usedHelp: session.usedHelps>0 });
            }
          }, 250);
        } else {
          playSfx("khata");
          setTimeout(()=>{
            const t1 = tiles[i1];
            const t2 = tiles[i2];
            if(t1) t1.classList.remove("flipped","selected");
            if(t2) t2.classList.remove("flipped","selected");
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

    const card = h("div",{class:"card glass anagram-card"});
    stage.appendChild(h("div",{class:"subtle"}, "ترتيب الحروف"));
    stage.appendChild(h("div",{class:"hr"}));
    stage.appendChild(card);

    function show(){
      setRemain(idx, pool.length);

      if(idx >= pool.length){
        const avgSec = average(times.length?times:[6]);
        finishGame({ gameKey:"anagram", pairsOrCards: pool.length, successCount: correct, wrongCount: wrong, avgSec, usedHelp: session.usedHelps>0 });
        return;
      }

      const c = pool[idx];
      const letters = shuffle(c.a.split(""));

      const out = [];
      const stack = [];

      const progress = h("div",{class:"subtle", style:"text-align:center;"}, `(${Math.max(0, pool.length-idx)}/${pool.length})`);
      const answer = h("div",{class:"anagram-answer", dir:"auto"}, "");

      const grid = h("div",{class:"anagram-grid"});

      function update(){
        answer.textContent = out.join("");
        undoBtn.disabled = stack.length === 0;
      }

      const undoBtn = h("button",{class:"btn-wide btn-active anagram-undo","data-sfx":"naker", type:"button", disabled:true, onClick: ()=> {
        if(!stack.length) return;
        const last = stack.pop();
        out.pop();
        last.disabled = false;
        last.classList.remove("is-used");
        update();
      }}, h("i",{class:"fas fa-rotate-left", ariaHidden:"true"}), "تراجع");

      letters.forEach((ch)=>{
        const b = h("button",{class:"anagram-letter btn-active","data-sfx":"ekhtiar", type:"button", onClick: ()=> {
          out.push(ch);
          stack.push(b);
          b.disabled = true;
          b.classList.add("is-used");
          update();
        }}, ch);
        grid.appendChild(b);
      });

      const okBtn = h("button",{class:"btn-wide btn-active anagram-ok","data-sfx":"none", type:"button", onClick: ()=> check(c, out.join(""))},
        h("i",{class:"fas fa-check-circle", ariaHidden:"true"}),
        "موافق"
      );

      clear(card);
      card.append(progress, answer, grid, h("div",{class:"anagram-actions"}, undoBtn, okBtn));
      update();
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

      const card = h("div",{class:"card glass typing-card"});
      stage.appendChild(h("div",{class:"subtle"}, "الكتابة"));
      stage.appendChild(h("div",{class:"hr"}));
      stage.appendChild(card);

      function show(){
        setRemain(idx, pool.length);

        if(idx >= pool.length){
          const avgSec = average(times.length?times:[6]);
          finishGame({ gameKey:"typing", pairsOrCards: pool.length, successCount: correct, wrongCount: wrong, avgSec, usedHelp: session.usedHelps>0 });
          return;
        }

        const c = pool[idx];

        const progress = h("div",{class:"subtle", style:"text-align:center;"}, `(${Math.max(0, pool.length-idx)}/${pool.length})`);
        const prompt = h("div",{class:"typing-prompt"}, c.b || "");
        const hint = h("div",{class:"typing-hint subtle"}, "اكتب الإجابة ثم اضغط موافق");

        const input = h("input",{type:"text", class:"modern-input typing-input", maxlength:"45", placeholder:"اكتب هنا...", dir:"auto", autocapitalize:"none", autocomplete:"off", spellcheck:"false"});
        // Enter to submit
        input.addEventListener("keydown", (e)=>{
          if(e.key === "Enter"){
            e.preventDefault();
            check(c, input.value);
          }
        });

        const okBtn = h("button",{class:"btn-wide btn-active typing-ok", "data-sfx":"none", style:"background: var(--accent-color); color: white; margin-top:12px;", onClick: ()=> check(c, input.value)}, 
          h("i",{class:"fas fa-check-circle", ariaHidden:"true"}), 
          "موافق"
        );

        clear(card);
        card.append(progress, prompt, hint, h("div",{class:"field"}, input), okBtn);

        // Focus for speed
        setTimeout(()=> { try{ input.focus(); }catch{} }, 0);
      }

      function check(c, val){
        const now = performance.now();
        times.push((now-lastT)/1000);
        lastT = now;

        const a = (val||"").trim().toLowerCase();
        const b = (c.a||"").trim().toLowerCase();

        if(a && a === b){
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

    const page = h("section",{class:"rating-page"});
    const title = h("div",{class:"subtle rating-title"}, "التقييم");
    const cardBox = h("div",{class:"rating-card glass gold"});
    page.append(title, cardBox);
    stage.appendChild(page);

    function ratingBtn(key, label, iconCls, sfx){
      return h(
        "button",
        { class:`rating-option ${key} btn-active`, "data-sfx": sfx, onClick: ()=> rate(key) },
        h("i", { class: iconCls, ariaHidden:"true" }),
        h("div", { class:"rating-label" }, label),
      );
    }

    function show(){
      setRemain(idx, cards.length);
      if(idx >= cards.length){
        finalizeLesson();
        return;
      }
      const c = (current = cards[idx]);
      clear(cardBox);

      const count = h("div", { class:"rating-count" }, `${idx+1} / ${cards.length}`);
      const hint = h("div", { class:"kbd rating-hint" }, c.hint || "");

      const reveal = h(
        "div",
        { class:"rating-reveal" },
        h(
          "button",
          { class:"btn small btn-active", "data-sfx":"tap_secondary", onClick: ()=> modal("النص", h("div",{class:"subtle"}, c.a), []) },
          h("i", { class:"fas fa-file-lines", ariaHidden:"true" }),
          h("span", {}, "النص")
        ),
        h(
          "button",
          { class:"btn small btn-active", "data-sfx":"tap_secondary", onClick: ()=> modal("المعنى", h("div",{class:"subtle"}, c.b), []) },
          h("i", { class:"fas fa-language", ariaHidden:"true" }),
          h("span", {}, "المعنى")
        ),
      );

      const options = h(
        "div",
        { class:"rating-grid" },
        ratingBtn("easy", "سهل", "fas fa-smile", "sahel"),
        ratingBtn("medium", "متوسط", "fas fa-meh", "wasat"),
        ratingBtn("hard", "صعب", "fas fa-dizzy", "saab"),
      );

      cardBox.append(count, hint, reveal, options);
    }

    function rate(v){
      // update card level per spec
      const c = current;
      if(!c) return;
      c.lastRating = v;
      if(v === "hard"){
        c.level = 0;
        c.progressDays = 0;
      } else if(v === "medium"){
        // في لعبة التقييم لا تظهر إلا مستويات: 1/3/6/7/8
        if(c.level === 1 || c.level === 3){
          c.level = 0;
          c.progressDays = 0;
        } else {
          // 6/7/8 → 5
          c.level = 5;
          c.progressDays = 5;
        }
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
    h("div",{class:"hud-metrics"},
      h("span",{class:"subtle", id:"timer"}, "00:00"),
      h("span",{class:"subtle", id:"remain"}, "")
    )
  );
  panel.appendChild(header);

  const stage = h("div",{class:"no-lams"});
  panel.appendChild(stage);
  app.appendChild(panel);

  // header widgets: help/skip/settings (with owned counts)
  const helpBadge = h("span",{class:"icon-badge", ariaLabel:"عدد المساعدة"}, String(state.economy.helps ?? 0));
  const skipBadge = h("span",{class:"icon-badge", ariaLabel:"عدد التخطي"}, String(state.economy.skips ?? 0));

  const helpBtn = h(
    "button",
    { class:"icon-btn", "data-sfx":"musaade", onClick: ()=> onHelp() },
    h("i",{class:"fas fa-wand-magic-sparkles", ariaHidden:"true"}),
    helpBadge
  );
  const skipBtn = h(
    "button",
    { class:"icon-btn", "data-sfx":"takhate", onClick: ()=> onSkip() },
    h("i",{class:"fas fa-forward", ariaHidden:"true"}),
    skipBadge
  );
  const logBtn = h("button",{class:"icon-btn", "data-sfx":"tap_secondary", onClick: ()=> showHelpLog()}, h("i",{class:"fas fa-scroll", ariaHidden:"true"}));
  const setBtn = h("button",{class:"icon-btn", "data-sfx":"naker", onClick: ()=> openSettingsOverlay()}, h("i",{class:"fas fa-sliders", ariaHidden:"true"}));
  header.appendChild(h("div",{class:"top-right"}, helpBtn, logBtn, skipBtn, setBtn));

  function refreshOwnedCounters(){
    helpBadge.textContent = String(state.economy.helps ?? 0);
    skipBadge.textContent = String(state.economy.skips ?? 0);
  }

  window.lucide?.createIcons?.();

  // مؤشر عدد البطاقات المتبقية داخل اللعبة الحالية (مثال: 7/20)
  const remainEl = header.querySelector("#remain");
  function setRemain(done, total){
    if(!remainEl) return;
    const t = Math.max(0, Number(total || 0));
    const d = Math.max(0, Number(done || 0));
    const r = Math.max(0, t - d);
    remainEl.textContent = t ? `${r}/${t}` : "";
  }

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
    const isEn = getLang()==="en";
    const music = Number(localStorage.getItem("dm_music") ?? "0.65");
    const sfx = Number(localStorage.getItem("dm_sfx") ?? "0.85");

    const m = h("input",{type:"range", min:"0", max:"1", step:"0.01", value:String(music)});
    const s = h("input",{type:"range", min:"0", max:"1", step:"0.01", value:String(sfx)});

    // Vibration toggle
    const vibIcon = h("i",{class: vibOn ? "fas fa-toggle-on" : "fas fa-toggle-off"});
    const vibTxt  = h("span",{class:"vib-txt"}, vibOn ? (isEn?"On":"شغال") : (isEn?"Off":"متوقف"));
    const vibBtn  = h("button",{type:"button", class:`vibrate-pill ${vibOn?"on":"off"} btn-active`, "data-sfx":"tap_secondary", onClick: ()=>{
      vibOn = !vibOn;
      setVibrationEnabled(vibOn);
      vibBtn.classList.toggle("on", vibOn);
      vibBtn.classList.toggle("off", !vibOn);
      vibIcon.className = vibOn ? "fas fa-toggle-on" : "fas fa-toggle-off";
      vibTxt.textContent = vibOn ? (isEn?"On":"شغال") : (isEn?"Off":"متوقف");
      playSfx("tap_secondary");
    }}, vibIcon, vibTxt);

    // Theme toggle
    const thIcon = h("i",{class: darkOn ? "fas fa-moon" : "fas fa-sun"});
    const thTxt  = h("span",{}, darkOn ? (isEn?"Dark":"داكن") : (isEn?"Light":"فاتح"));
    const thBtn  = h("button",{type:"button", class:`theme-pill ${darkOn?"on":"off"} btn-active`, "data-sfx":"tap_secondary", onClick: ()=>{
      darkOn = !darkOn;
      applyTheme(darkOn ? "dark" : "light");
      thBtn.classList.toggle("on", darkOn);
      thBtn.classList.toggle("off", !darkOn);
      thIcon.className = darkOn ? "fas fa-moon" : "fas fa-sun";
      thTxt.textContent = darkOn ? (isEn?"Dark":"داكن") : (isEn?"Light":"فاتح");
      playSfx("tap_secondary");
    }}, thIcon, thTxt);

    const body = h("div",{class:"settings-list"},
      h("div",{class:"setting-item"},
        h("div",{class:"setting-label"}, h("i",{class:"fas fa-music"}), isEn?"Music volume":"مستوى الموسيقى"),
        m
      ),
      h("div",{class:"setting-item"},
        h("div",{class:"setting-label"}, h("i",{class:"fas fa-volume-up"}), isEn?"Interaction volume":"مستوى التفاعلات"),
        s
      ),
      h("div",{class:"setting-item"},
        h("div",{class:"setting-row"},
          h("div",{class:"setting-label"}, h("i",{class:"fas fa-mobile-screen-button"}), isEn?"Tap vibration":"اهتزاز اللمس"),
          vibBtn
        )
      ),
      h("div",{class:"setting-item"},
        h("div",{class:"setting-row"},
          h("div",{class:"setting-label"}, h("i",{class:"fas fa-circle-half-stroke"}), isEn?"Theme":"المظهر"),
          thBtn
        )
      ),
      h("div",{class:"support-email"}, isEn?"Full settings are on Home.":"ملاحظة: الإعدادات الكاملة من الصفحة الرئيسية.")
    );

    modal(isEn?"Quick Settings":"إعدادات سريعة", body, [
      { label:isEn?"Back":"رجوع", kind:"primary", sfx:"tap_secondary", onClick:(close)=> close() },
    ]);

    m.addEventListener("input", ()=>{
      localStorage.setItem("dm_music", m.value);
      setVolumes({music:Number(m.value), sfx:Number(s.value)});
    }, {passive:true});
    s.addEventListener("input", ()=>{
      localStorage.setItem("dm_sfx", s.value);
      setVolumes({music:Number(m.value), sfx:Number(s.value)});
    }, {passive:true});
  }

  function onHelp(){
    if((state.economy.helps ?? 0) <= 0){
      toast((getLang()==="en") ? "No helps left." : "لا توجد مساعدات.");
      return false;
    }
    state.economy.helps -= 1;
    session.usedHelps += 1;
    saveState(state);
    refreshOwnedCounters();
    helpLog.push((getLang()==="en") ? "Help used." : "مساعدة مستخدمة.");
    toast((getLang()==="en") ? "Help used." : "تم استخدام مساعدة.");
    return true;
  }

  function onSkip(){
    if((state.economy.skips ?? 0) <= 0){
      toast((getLang()==="en") ? "No skips left." : "لا توجد محاولات تخطي.");
      return false;
    }
    const body = h("div",{}, h("div",{class:"subtle"}, (getLang()==="en") ? "Confirm skip?" : "تأكيد التخطي؟"));
    modal((getLang()==="en") ? "Skip" : "تخطي", body, [
      { label:(getLang()==="en") ? "Cancel" : "إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
      { label:(getLang()==="en") ? "Confirm" : "تأكيد", kind:"primary", sfx:"none", onClick:(close)=> {
        state.economy.skips -= 1;
        session.usedSkips += 1;
        saveState(state);
        refreshOwnedCounters();
        close();
        finishGame({ skipped:true, perfect:true });
        return true;
      }},
    ]);
    return true;
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

    setRemain(0, cs.length);

    const wrap = h("div",{class:"match-wrap"});
    const colA = h("div",{class:"match-col"});
    const colB = h("div",{class:"match-col"});
    wrap.append(colA, colB);

    const makeBtn = (item)=> {
      const b = h("button",{class:"btn match-choice", "data-sfx":"ekhtiar"}, item.text);
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
        setRemain(correct, cs.length);
        // remove matched pair buttons (حسب المعرف)
        const aBtn = colA.querySelector(`button[data-cardid="${x.id}"][data-type="a"]`);
        const bBtn = colB.querySelector(`button[data-cardid="${x.id}"][data-type="b"]`);
        aBtn?.remove();
        bBtn?.remove();
      } else {
        wrong += 1;
        playSfx("khata");
        if(vibOn && navigator.vibrate) navigator.vibrate(40);

        [bx, btn].forEach((el)=>{
          if(!el) return;
          el.classList.add("wrong");
          try{
            if(window.gsap && typeof gsap.fromTo === "function"){
              gsap.fromTo(el, {x:0}, {x:10, duration:0.06, yoyo:true, repeat:3});
            } else if(el.animate){
              el.animate(
                [{transform:"translateX(0px)"},{transform:"translateX(10px)"},{transform:"translateX(0px)"}],
                {duration:240, iterations:2, easing:"ease-in-out"}
              );
            }
          }catch{}
          setTimeout(()=> el.classList.remove("wrong"), 450);
        });
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
    const matched = new Set();
    let correct = 0;
    let lastSuccessT = performance.now();
    const times = [];

    const grid = h("div",{class:"memory-grid"});
    const tiles = [];

    const open = new Set(items.map((_,i)=>i));

    items.forEach((it, idx)=>{
      const tile = h("div",{class:"memory-tile open"});
      const inner = h("div",{class:"memory-inner"});
      const front = h("div",{class:"memory-face memory-front"}, "✦");
      const back  = h("div",{class:"memory-face memory-back"}, it.text);
      inner.append(front, back);
      tile.appendChild(inner);

      // show all at start for a few seconds
      tile.classList.add("flipped");

      tile.addEventListener("click", ()=> flip(idx, tile), {passive:true});
      tiles[idx] = tile;
      grid.appendChild(tile);
    });

    stage.appendChild(h("div",{class:"subtle"}, "قلب البطاقات"));
    stage.appendChild(h("div",{class:"hr"}));
    stage.appendChild(grid);

    setTimeout(()=>{
      open.clear();
      tiles.forEach((t)=>{
        if(!t) return;
        t.classList.remove("open","flipped","selected");
      });
    }, 5000);

    function flip(idx, tile){
      if(matched.has(idx)) return;
      if(open.has(idx)) return;

      // allow user to unselect the same revealed tile
      if(revealed.includes(idx)){
        playSfx("ekhtiar");
        revealed = revealed.filter(x=>x!==idx);
        tile.classList.remove("flipped","selected");
        return;
      }
      if(revealed.length >= 2) return;

      if(revealed.length === 0) playSfx("ekhtiar");
      tile.classList.add("flipped","selected");
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

          setTimeout(()=>{
            const t1 = tiles[i1];
            const t2 = tiles[i2];
            if(t1){ t1.classList.add("matched"); t1.classList.remove("selected"); }
            if(t2){ t2.classList.add("matched"); t2.classList.remove("selected"); }
            revealed = [];
            if(correct >= cs.length){
              const avgSec = average(times.length?times:[6]);
              finishGame({ gameKey:"memory", pairsOrCards: correct, successCount: correct, wrongCount: 0, avgSec, usedHelp: session.usedHelps>0 });
            }
          }, 250);
        } else {
          playSfx("khata");
          setTimeout(()=>{
            const t1 = tiles[i1];
            const t2 = tiles[i2];
            if(t1) t1.classList.remove("flipped","selected");
            if(t2) t2.classList.remove("flipped","selected");
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

    const card = h("div",{class:"card glass anagram-card"});
    stage.appendChild(h("div",{class:"subtle"}, "ترتيب الحروف"));
    stage.appendChild(h("div",{class:"hr"}));
    stage.appendChild(card);

    function show(){
      setRemain(idx, pool.length);
      if(idx >= pool.length){
        const avgSec = average(times.length?times:[6]);
        finishGame({ gameKey:"anagram", pairsOrCards: pool.length, successCount: correct, wrongCount: wrong, avgSec, usedHelp: session.usedHelps>0 });
        return;
      }
      const c = pool[idx];
      const letters = shuffle(c.a.split(""));
      const out = [];
      const stack = [];
      const line = h("div",{style:"font-size:22px;font-weight:900;letter-spacing:1px;min-height:34px;"}, "");
      const buttons = h("div",{class:"anagram-grid"});
      const undoBtn = h("button",{class:"btn ghost small anagram-undo", type:"button", "data-sfx":"naker", style:"margin-top:12px;", disabled:true, onClick: ()=> {
        if(!stack.length) return;
        const last = stack.pop();
        out.pop();
        last.disabled = false;
        line.textContent = out.join("");
        undoBtn.disabled = stack.length === 0;
      }}, "تراجع");

      letters.forEach((ch)=>{
        const b = h("button",{class:"anagram-letter btn-active", "data-sfx":"ekhtiar", type:"button", onClick: ()=> { out.push(ch); stack.push(b); line.textContent = out.join(""); b.disabled = true; undoBtn.disabled = stack.length === 0; }}, ch);
        buttons.appendChild(b);
      });
      const okBtn = h("button",{class:"btn primary", "data-sfx":"none", style:"margin-top:12px;", onClick: ()=> check(c, out.join(""))}, "موافق");
      clear(card);
      card.append(h("div",{class:"subtle"}, `(${Math.max(0, pool.length-idx)}/${pool.length})`), line, buttons, h("div",{class:"row", style:"gap:10px; margin-top:12px; flex-wrap:wrap;"}, undoBtn, okBtn));
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

      const card = h("div",{class:"card glass typing-card"});
      stage.appendChild(h("div",{class:"subtle"}, "الكتابة"));
      stage.appendChild(h("div",{class:"hr"}));
      stage.appendChild(card);

      function show(){
        setRemain(idx, pool.length);

        if(idx >= pool.length){
          const avgSec = average(times.length?times:[6]);
          finishGame({ gameKey:"typing", pairsOrCards: pool.length, successCount: correct, wrongCount: wrong, avgSec, usedHelp: session.usedHelps>0 });
          return;
        }

        const c = pool[idx];

        const progress = h("div",{class:"subtle", style:"text-align:center;"}, `(${Math.max(0, pool.length-idx)}/${pool.length})`);
        const prompt = h("div",{class:"typing-prompt"}, c.b || "");
        const hint = h("div",{class:"typing-hint subtle"}, "اكتب الإجابة ثم اضغط موافق");

        const input = h("input",{type:"text", class:"modern-input typing-input", maxlength:"45", placeholder:"اكتب هنا...", dir:"auto", autocapitalize:"none", autocomplete:"off", spellcheck:"false"});
        // Enter to submit
        input.addEventListener("keydown", (e)=>{
          if(e.key === "Enter"){
            e.preventDefault();
            check(c, input.value);
          }
        });

        const okBtn = h("button",{class:"btn-wide btn-active typing-ok", "data-sfx":"none", style:"background: var(--accent-color); color: white; margin-top:12px;", onClick: ()=> check(c, input.value)}, 
          h("i",{class:"fas fa-check-circle", ariaHidden:"true"}), 
          "موافق"
        );

        clear(card);
        card.append(progress, prompt, hint, h("div",{class:"field"}, input), okBtn);

        // Focus for speed
        setTimeout(()=> { try{ input.focus(); }catch{} }, 0);
      }

      function check(c, val){
        const now = performance.now();
        times.push((now-lastT)/1000);
        lastT = now;

        const a = (val||"").trim().toLowerCase();
        const b = (c.a||"").trim().toLowerCase();

        if(a && a === b){
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
  const isEn = getLang()==="en";

  // header like the UI prototype (profile chip + gold)
  const headerCardStack = h("div",{class:"avatar-stack", ariaHidden:"true"});
  try{
    const {frame, bg, av} = computeAvatarLayers(state);
    const bgImg = new Image(); bgImg.src = bg?.src || ""; bgImg.className = "layer bg";
    const avImg = new Image(); avImg.src = av?.src || ""; avImg.className = "layer av";
    const frameImg = new Image(); frameImg.src = frame?.src || ""; frameImg.className = "layer frame";
    // Layering per spec: frame (bottom) -> background -> avatar (top)
    headerCardStack.append(frameImg, bgImg, avImg);
  }catch{}

  const header = h("header",{class:"page-header"},
    h("div",{class:"profile-card", "data-sfx":"naker", onClick: ()=> nav("#/profile")},
      headerCardStack,
      h("div",{class:"profile-text"},
        h("div",{class:"profile-name"}, isEn?"Packs":"رزم البطاقات"),
        h("div",{class:"user-meta"}, isEn?"Your library":"مكتبتك")
      )
    ),
    h("div",{class:"gold-tag", "aria-label": isEn?"Gold":"الذهب"},
      h("i",{class:"fas fa-coins"}),
      h("span",{class:"gold-val"}, String(Math.max(0, Math.floor(state.economy.gold||0))))
    )
  );

  const searchInput = h("input",{id:"pack-search", class:"modern-input", placeholder: isEn?"Search packs...":"بحث عن رزمة...", style:"padding-left: 40px;"});
  const search = h("div",{class:"search-box"}, searchInput, h("i",{class:"fas fa-search", ariaHidden:"true"}));

  const btnAddPack = h("button",{class:"btn-wide btn-active accent-outline", style:"margin-bottom: 10px;", "data-sfx":"edafe", onClick: ()=> openCreatePack()},
    h("i",{class:"fas fa-plus-square"}),
    isEn?"Add a new pack":"إضافة رزمة جديدة"
  );

  const grid = h("div",{class:"packs-grid", id:"packsGrid"});
  const scroll = h("div",{class:"packs-scroll"}, grid);

  const backBtn = h("button",{class:"fixed-back-btn btn-active", "data-sfx":"naker", onClick: ()=> navBack()},
    h("i",{class:"fas fa-arrow-right"}),
    isEn?"Back":"رجوع"
  );

  const wrap = h("div",{class:"packs-wrap"}, header, search, btnAddPack, scroll, backBtn);
  app.appendChild(wrap);

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

  function iconForPack(key){
    if(key === "all") return { cls:"fas fa-layer-group", color:"#4682b4" };
    if(key === "daily") return { cls:"fas fa-calendar-day", color:"#ff5722" };
    if(key === "easy") return { cls:"fas fa-smile", color:"#4caf50" };
    if(key === "medium") return { cls:"fas fa-meh", color:"#ffc107" };
    if(key === "hard") return { cls:"fas fa-dizzy", color:"#f44336" };
    if(key === "ignored") return { cls:"fas fa-ban", color:"#9e9e9e" };
    if(key === "completed") return { cls:"fas fa-check-circle", color:"#009688" };
    if(String(key).startsWith("custom:")) return { cls:"fas fa-folder", color:"#6d4c41" };
    return { cls:"fas fa-box-open", color:"var(--accent-color)" };
  }

  function rebuild(){
    clear(grid);
    const q = (searchInput.value||"").trim().toLowerCase();
    for(const p of packs){
      if(q && !p.name.toLowerCase().includes(q)) continue;
      const ic = iconForPack(p.key);
      const tile = h("div",{class:"pack-item btn-active", "data-sfx":"naker", onClick: ()=> openPack(p.key, p.name)},
        h("i",{class: ic.cls, style: `color:${ic.color}`}),
        h("div",{class:"pack-name"}, p.name)
      );
      grid.appendChild(tile);
    }
  }
  searchInput.addEventListener("input", rebuild, {passive:true});
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
        state.library.customPacks.push({ id: uuid(), name:n, cardIds:[] });
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
    const isEn = getLang()==="en";
    const groups = Object.values(state.cards.dailyGroups).sort((a,b)=> b.iso.localeCompare(a.iso));

    // Header (same style as packs page)
    const headerCardStack = h("div",{class:"avatar-stack", ariaHidden:"true"});
    try{
      const {frame, bg, av} = computeAvatarLayers(state);
      const bgImg = new Image(); bgImg.src = bg?.src || ""; bgImg.className = "layer bg";
      const avImg = new Image(); avImg.src = av?.src || ""; avImg.className = "layer av";
      const frameImg = new Image(); frameImg.src = frame?.src || ""; frameImg.className = "layer frame";
      // Layering per spec: frame (bottom) -> background -> avatar (top)
      headerCardStack.append(frameImg, bgImg, avImg);
    }catch{}

    const header = h("header",{class:"page-header"},
      h("div",{class:"profile-card", "data-sfx":"naker", onClick: ()=> nav("#/profile")},
        headerCardStack,
        h("div",{class:"profile-text"},
          h("div",{class:"profile-name"}, isEn?"Daily groups":"المجموعات اليومية"),
          h("div",{class:"user-meta"}, isEn?"Pick a day":"اختر يومًا")
        )
      ),
      h("div",{class:"gold-tag", "aria-label": isEn?"Gold":"الذهب"},
        h("i",{class:"fas fa-coins"}),
        h("span",{class:"gold-val"}, String(Math.max(0, Math.floor(state.economy.gold||0))))
      )
    );

    // Search (prototype style)
    const searchInput = h("input",{id:"daily-search", class:"modern-input", placeholder: isEn?"Search by date...":"بحث بالتاريخ...", style:"padding-left: 40px;"});
    const search = h("div",{class:"search-box"}, searchInput, h("i",{class:"fas fa-search", ariaHidden:"true"}));

    // Grid list
    const grid = h("div",{class:"packs-grid", id:"dailyGrid"});
    const scroll = h("div",{class:"packs-scroll"}, grid);

    const backBtn = h("button",{class:"fixed-back-btn btn-active", "data-sfx":"tap_secondary", onClick: ()=> {
      clear(app);
      renderLibrary();
    }},
      h("i",{class:"fas fa-arrow-right"}),
      isEn?"Back":"العودة للرزم"
    );

    const wrap = h("div",{class:"packs-wrap"}, header, search, scroll, backBtn);
    clear(app);
    app.appendChild(wrap);

    // SFX is delegated globally via wireSfx(document)

    function rebuildG(){
      clear(grid);
      const q = (searchInput.value||"").trim();

      if(!groups.length){
        grid.appendChild(h("div",{class:"glass gold panel center", style:"grid-column: 1 / -1; text-align:center;"},
          h("div",{class:"subtle"}, isEn?"No daily groups yet.":"لا توجد مجموعات يومية بعد.")
        ));
        return;
      }

      for(const g of groups){
        if(q && !String(g.titleDMY||"").includes(q)) continue;
        const tile = h("div",{class:"pack-item btn-active", "data-sfx":"naker", onClick: ()=> openCardsList(g.titleDMY, g.cardIds, { packKey:"dailyGroup", groupIso:g.iso })},
          h("i",{class:"fas fa-calendar-day", style:"color:#ff5722"}),
          h("div",{class:"pack-name"}, g.titleDMY),
          h("div",{class:"pack-count"}, `${g.cardIds.length} ${isEn?"cards":"بطاقة"}`)
        );
        grid.appendChild(tile);
      }

      if(!grid.childElementCount){
        grid.appendChild(h("div",{class:"glass gold panel center", style:"grid-column: 1 / -1; text-align:center;"},
          h("div",{class:"subtle"}, isEn?"No results.":"لا توجد نتائج.")
        ));
      }
    }

    searchInput.addEventListener("input", rebuildG, {passive:true});
    rebuildG();
  }

  function openCardsList(title, ids, ctx){
    const isEn = getLang()==="en";

    // Custom pack management (rename/delete) only for user-created packs
    let packTitle = title;
    const isCustomPack = !!(ctx?.packKey && String(ctx.packKey).startsWith("custom:"));
    const customPackId = isCustomPack ? String(ctx.packKey).split(":")[1] : null;

    // Header (same style as packs page)
    const headerCardStack = h("div",{class:"avatar-stack", ariaHidden:"true"});
    try{
      const {frame, bg, av} = computeAvatarLayers(state);
      const bgImg = new Image(); bgImg.src = bg?.src || ""; bgImg.className = "layer bg";
      const avImg = new Image(); avImg.src = av?.src || ""; avImg.className = "layer av";
      const frameImg = new Image(); frameImg.src = frame?.src || ""; frameImg.className = "layer frame";
      // Layering per spec: frame (bottom) -> background -> avatar (top)
      headerCardStack.append(frameImg, bgImg, avImg);
    }catch{}

    const titleEl = h("div",{class:"profile-name"}, packTitle);
    const header = h("header",{class:"page-header"},
      h("div",{class:"profile-card", "data-sfx":"naker", onClick: ()=> nav("#/profile")},
        headerCardStack,
        h("div",{class:"profile-text"},
          titleEl,
          h("div",{class:"user-meta"}, isEn?"Cards":"البطاقات")
        )
      ),
      h("div",{class:"gold-tag", "aria-label": isEn?"Gold":"الذهب"},
        h("i",{class:"fas fa-coins"}),
        h("span",{class:"gold-val"}, String(Math.max(0, Math.floor(state.economy.gold||0))))
      )
    );

    // Search box (prototype style)
    const searchInput = h("input",{id:"card-search", class:"modern-input", placeholder: isEn?"Search cards...":"بحث في البطاقات...", style:"padding-left: 40px;"});
    const search = h("div",{class:"search-box"}, searchInput, h("i",{class:"fas fa-search", ariaHidden:"true"}));

    // Custom pack tools (rename/delete)
    const packTools = isCustomPack ? h("div",{class:"row", style:"gap:10px; margin-bottom: 10px;"},
      h("button",{class:"btn-wide btn-active accent-outline", style:"flex:1;", "data-sfx":"naker", onClick: ()=> renameCustomPack()},
        h("i",{class:"fas fa-pen"}),
        isEn?"Rename pack":"تغيير الاسم"
      ),
      h("button",{class:"btn-wide btn-active danger", style:"flex:1;", "data-sfx":"hathef", onClick: ()=> deleteCustomPack()},
        h("i",{class:"fas fa-trash-alt"}),
        isEn?"Delete pack":"حذف الرزمة"
      )
    ) : null;

    function getCustomPack(){
      if(!customPackId) return null;
      return state.library.customPacks.find(p=> p.id === customPackId) || null;
    }

    function renameCustomPack(){
      const p = getCustomPack();
      if(!p){ toast(isEn?"Pack not found.":"الرزمة غير موجودة."); return false; }

      const input = h("input",{maxlength:"30", value: p.name || ""});
      const body = h("div",{},
        h("div",{class:"field"},
          h("label",{}, isEn?"Name":"الاسم"),
          input
        )
      );

      modal(isEn?"Rename pack":"تغيير اسم الرزمة", body, [
        { label: isEn?"Cancel":"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> { close(); return true; } },
        { label: isEn?"Save":"حفظ", kind:"primary", sfx:"naker", onClick:(close)=> {
          const n = (input.value||"").trim();
          if(!n){ toast(isEn?"Empty name.":"اسم فارغ."); return false; }
          const exists = state.library.customPacks.some(x=> x.id !== p.id && x.name === n);
          if(exists){ toast(isEn?"Name already used.":"اسم مستخدم."); return false; }
          p.name = n;
          packTitle = n;
          try{ titleEl.textContent = n; }catch{}
          saveState(state);
          close();
          toast(isEn?"Done.":"تم.");
          return true;
        }},
      ]);
      // Focus
      setTimeout(()=> { try{ input.focus(); input.select?.(); }catch{} }, 0);
      return true;
    }

    function deleteCustomPack(){
      const p = getCustomPack();
      if(!p){ toast(isEn?"Pack not found.":"الرزمة غير موجودة."); return false; }

      const body = h("div",{},
        h("div",{class:"subtle", style:"white-space:pre-wrap; line-height:1.8;"},
          isEn
            ? "Delete this pack? Cards will NOT be deleted, only the pack."
            : "هل تريد حذف هذه الرزمة؟\nالبطاقات لن تُحذف، سيتم حذف الرزمة فقط."
        )
      );

      modal(isEn?"Confirm":"تأكيد", body, [
        { label: isEn?"Cancel":"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> { close(); return true; } },
        { label: isEn?"Delete":"حذف", kind:"danger", sfx:"hathef", onClick:(close)=> {
          state.library.customPacks = state.library.customPacks.filter(x=> x.id !== p.id);
          saveState(state);
          close();
          toast(isEn?"Deleted.":"تم حذف الرزمة.");
          clear(app);
          renderLibrary();
          return true;
        }},
      ]);
      return true;
    }

    // Selection controls
    const normalControls = h("div",{id:"normal-controls"},
      h("button",{class:"btn-wide btn-active accent-outline", style:"margin-bottom: 10px;", "data-sfx":"naker", onClick: ()=> toggleSelectionMode(true)},
        h("i",{class:"fas fa-check-double"}),
        isEn?"Select":"تحديد"
      )
    );

    const selectionControls = h("div",{id:"selection-controls", style:"display:none; gap: 10px; margin-bottom: 10px;"},
      h("button",{class:"btn-wide btn-active accent-outline", style:"flex: 1;", "data-sfx":"naker", onClick: ()=> selectAllCards()},
        isEn?"Select all":"تحديد الكل"
      ),
      h("button",{class:"btn-wide btn-active muted", style:"flex: 1;", "data-sfx":"naker", onClick: ()=> toggleSelectionMode(false)},
        isEn?"Cancel":"إلغاء"
      )
    );

    const actionBar = h("div",{class:"selection-actions", id:"action-bar", style:"display:none;"});
    const grid = h("div",{class:"cards-grid", id:"cards-grid"});

    const backBtn = h("button",{class:"fixed-back-btn btn-active", "data-sfx":"tap_secondary", onClick: ()=> {
      if(ctx?.packKey === "dailyGroup"){
        openDailyGroups();
        return;
      }
      clear(app);
      renderLibrary();
    }},
      h("i",{class:"fas fa-arrow-right"}),
      isEn?"Back":"العودة للرزم"
    );

    const wrap = h("div",{class:"cards-pack-wrap"}, header, search, packTools, normalControls, selectionControls, actionBar, grid, backBtn);
    clear(app);
    app.appendChild(wrap);
    // SFX is delegated globally via wireSfx(document)

    let selecting = false;
    const selected = new Set();
    const isSpecial = (ctx?.packKey === "ignored" || ctx?.packKey === "completed");

    function currentIds(){
      if(ctx?.packKey === "dailyGroup"){
        const g = state.cards.dailyGroups[ctx.groupIso];
        return g?.cardIds ? [...g.cardIds] : [];
      }
      if(ctx?.packKey){
        return getPackCardIds(ctx.packKey);
      }
      return [...ids];
    }

    function statusLabel(c){
      const r = c.lastRating;
      if(r === "easy") return isEn?"Easy":"سهل";
      if(r === "medium") return isEn?"Medium":"متوسط";
      if(r === "hard") return isEn?"Hard":"صعب";
      return "—";
    }

    function statusClass(c){
      const r = c.lastRating;
      if(r === "easy") return "easy";
      if(r === "medium") return "medium";
      if(r === "hard") return "hard";
      return "none";
    }

    function filteredCards(){
      const query = (searchInput.value||"").trim().toLowerCase();
      const idsNow = currentIds();
      const cards = idsNow.map(id=> state.cards.byId[id]).filter(Boolean);
      if(!query) return cards;
      return cards.filter(c=> ((c.a||"") + " " + (c.b||"") + " " + (c.hint||"")).toLowerCase().includes(query));
    }

    function actionBtn({label, icon, onClick, disabled=false, danger=false, disabledTip, sfx}){
      const cls = `action-btn${disabled?" disabled":""}${danger?" danger":""}`;
      const btn = h("div",{
        class: cls,
        "data-sfx": disabled ? "tap_secondary" : (sfx || (danger ? "tahther" : "naker")),
        onClick: (e)=>{
          if(disabled){
            e.preventDefault();
            e.stopPropagation();
            if(disabledTip) tip(btn, disabledTip);
            return false;
          }
          return onClick?.();
        }
      },
        h("i",{class: icon, ariaHidden:"true"}),
        label
      );
      return btn;
    }

    function requireSelection(){
      if(selected.size === 0){
        toast(isEn?"Select cards first":"حدد بطاقات أولاً");
        return false;
      }
      return true;
    }

    function renameCustomPack(){
      if(!isCustomPack || !customPackId) return false;
      const p = state.library.customPacks.find(x=>x.id===customPackId);
      if(!p){ toast(isEn?"Pack not found":"الرزمة غير موجودة"); return false; }

      const input = h("input",{maxlength:"30", value: p.name || ""});
      const body = h("div",{},
        h("div",{class:"field"},
          h("label",{}, isEn?"Name":"الاسم"),
          input
        )
      );

      modal(isEn?"Rename pack":"تغيير اسم الرزمة", body, [
        { label: isEn?"Cancel":"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> { close(); return true; } },
        { label: isEn?"Save":"حفظ", kind:"primary", sfx:"hefth", onClick:(close)=> {
          const n = (input.value||"").trim();
          if(!n){ toast(isEn?"Name is empty":"الاسم فارغ"); return false; }
          const exists = state.library.customPacks.some(x=> x.id!==p.id && String(x.name||"").trim()===n);
          if(exists){ toast(isEn?"Name already used":"اسم مستخدم"); return false; }
          p.name = n;
          packTitle = n;
          try{ titleEl.textContent = n; }catch{}
          saveState(state);
          close();
          toast(isEn?"Done":"تم");
          return true;
        }},
      ]);
      return true;
    }

    function deleteCustomPack(){
      if(!isCustomPack || !customPackId) return false;
      const p = state.library.customPacks.find(x=>x.id===customPackId);
      if(!p){ toast(isEn?"Pack not found":"الرزمة غير موجودة"); return false; }

      const body = h("div",{},
        h("div",{class:"subtle", style:"white-space:pre-wrap; line-height:1.8;"},
          isEn
            ? "Delete this pack? Cards will stay in your library."
            : "هل تريد حذف هذه الرزمة؟\nالبطاقات لن تُحذف من مكتبتك."
        )
      );

      modal(isEn?"Confirm":"تأكيد", body, [
        { label: isEn?"Cancel":"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> { close(); return true; } },
        { label: isEn?"Delete":"حذف", kind:"danger", sfx:"hathef", onClick:(close)=> {
          state.library.customPacks = state.library.customPacks.filter(x=>x.id!==customPackId);
          saveState(state);
          close();
          toast(isEn?"Deleted":"تم الحذف");
          nav("#/library");
          return true;
        }},
      ]);
      return true;
    }

    function bulkShare(){
      if(!requireSelection()) return;
      const idsSel = Array.from(selected);
      exportShareDeck({ kind: ctx?.packKey ? "pack" : (ctx?.dayKey ? "dailyGroup" : "selection"), title: packTitle, cardIds: idsSel });
      toggleSelectionMode(false);
    }

    function bulkAddToPack(){
      if(!requireSelection()) return;
      const packs = state.library.customPacks;
      if(packs.length === 0){ toast(isEn?"No packs":"لا توجد رزم."); return; }
      const sel = new Set();
      const body = h("div",{}, ...packs.map(p=>{
        const btn = h("button",{
          class:"btn",
          "data-sfx":"tap_secondary",
          "aria-pressed": "false",
          onClick: ()=> {
            if(sel.has(p.id)) sel.delete(p.id);
            else sel.add(p.id);
            const isSelected = sel.has(p.id);
            btn.classList.toggle("selected", isSelected);
            btn.setAttribute("aria-pressed", String(isSelected));
          }
        }, p.name);
        return btn;
      }));
      modal(isEn?"Choose packs":"اختيار رزم", body, [
        { label: isEn?"Cancel":"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
        { label: isEn?"Save":"حفظ", kind:"primary", sfx:"tap_primary", onClick:(close)=> {
          for(const pid of sel){
            const p = state.library.customPacks.find(x=>x.id===pid);
            if(!p) continue;
            for(const id of Array.from(selected)){
              if(!p.cardIds.includes(id)) p.cardIds.push(id);
            }
          }
          saveState(state);
          close();
          toast(isEn?"Done":"تم.");
          toggleSelectionMode(false);
        }}
      ]);
    }

    function bulkTrain(){
      if(!requireSelection()) return false;
      const idsSel = Array.from(selected);
      if(idsSel.length < 4){ toast(isEn?"Pick at least 4":"اختر 4 بطاقات على الأقل"); return false; }
      setTrainingPayload({ ids: idsSel, origin: "#/library" });
      selected.clear();
      toggleSelectionMode(false);
      nav("#/training");
      return true;
    }

    function bulkIgnore(){
      if(!requireSelection()) return false;
      for(const id of Array.from(selected)){
        const c = state.cards.byId[id];
        if(!c) continue;
        c.ignored = true;
        if(!state.cards.ignored.includes(id)) state.cards.ignored.unshift(id);
        // remove from custom packs
        for(const p of state.library.customPacks){
          p.cardIds = p.cardIds.filter(x=>x!==id);
        }
      }
      // remove from completed list if any
      state.cards.completed = state.cards.completed.filter(x=> !selected.has(x));
      saveState(state);
      toast(isEn?"Done":"تم.");
      toggleSelectionMode(false);
      return true;
    }

    function bulkReset(){
      if(!requireSelection()) return false;
      const iso = todayISO();
      for(const id of Array.from(selected)){
        const c = state.cards.byId[id];
        if(!c) continue;
        c.ignored = false;
        c.completed = false;
        c.level = 0;
        c.lastRating = null;
        c.frozen = false;
        c.lastReviewedIso = null;
        const gIso = c.groupIso || iso;
        c.groupIso = gIso;
        if(!state.cards.dailyGroups[gIso]){
          state.cards.dailyGroups[gIso] = { iso: gIso, titleDMY: formatDateDMY(gIso), cardIds: [] };
        }
        if(!state.cards.dailyGroups[gIso].cardIds.includes(id)){
          state.cards.dailyGroups[gIso].cardIds.push(id);
        }
      }
      state.cards.ignored = state.cards.ignored.filter(x=> !selected.has(x));
      state.cards.completed = state.cards.completed.filter(x=> !selected.has(x));
      saveState(state);
      toast(isEn?"Done":"تم.");
      toggleSelectionMode(false);
      return true;
    }

    function bulkDeleteForever(){
      if(!requireSelection()) return false;
      const body = h("div",{},
        h("div",{class:"subtle", style:"white-space:pre-wrap; line-height:1.8;"}, isEn?"Delete selected cards permanently? This cannot be undone.":"هل تريد حذف البطاقات المحددة نهائيًا؟ لا يمكن التراجع.")
      );
      modal(isEn?"Confirm":"تأكيد", body, [
        { label: isEn?"Cancel":"إلغاء", kind:"ghost", sfx:"naker", onClick:(close)=> close() },
        { label: isEn?"Delete":"حذف", kind:"danger", sfx:"hathef", onClick:(close)=> {
          for(const id of Array.from(selected)){
            delete state.cards.byId[id];
            state.cards.order = state.cards.order.filter(x=>x!==id);
            state.cards.ignored = state.cards.ignored.filter(x=>x!==id);
            state.cards.completed = state.cards.completed.filter(x=>x!==id);
            for(const g of Object.values(state.cards.dailyGroups)){
              g.cardIds = g.cardIds.filter(x=>x!==id);
            }
            for(const p of state.library.customPacks){
              p.cardIds = p.cardIds.filter(x=>x!==id);
            }
          }
          saveState(state);
          close();
          toast(isEn?"Deleted":"تم الحذف");
          toggleSelectionMode(false);
          return true;
        }}
      ]);
      return true;
    }

    function updateActionBar(){
      if(!selecting) return;
      clear(actionBar);

      if(isSpecial){
        actionBar.append(
          actionBtn({ label: isEn?"Delete":"حذف", icon:"fas fa-trash-alt", danger:true, sfx:"naker", onClick: ()=> bulkDeleteForever() }),
          actionBtn({ label: isEn?"Reset":"إعادة", icon:"fas fa-rotate-left", onClick: ()=> bulkReset() }),
          actionBtn({ label: isEn?"Share":"مشاركة", icon:"fas fa-share-alt", onClick: ()=> bulkShare() }),
          h("div",{class:"action-btn ghost"}, h("i",{class:"fas fa-minus", ariaHidden:"true"}), " ")
        );
        return;
      }

      const canTrain = selected.size >= 4;
      actionBar.append(
        actionBtn({ label: isEn?"Ignore":"تجاهل", icon:"fas fa-eye-slash", danger:true, sfx:"tagahl", onClick: ()=> bulkIgnore() }),
        actionBtn({ label: isEn?"Training":"تدريب", icon:"fas fa-dumbbell", disabled: !canTrain, disabledTip: isEn?"Pick at least 4":"اختر 4 بطاقات على الأقل", sfx:"play", onClick: ()=> bulkTrain() }),
        actionBtn({ label: isEn?"Add":"إضافة", icon:"fas fa-folder-plus", onClick: ()=> bulkAddToPack() }),
        actionBtn({ label: isEn?"Share":"مشاركة", icon:"fas fa-share-alt", onClick: ()=> bulkShare() }),
      );
    }

    function rebuild(){
      clear(grid);
      const cards = filteredCards();
      for(const c of cards){
        const tile = h("div",{
          class: `word-card btn-active${selected.has(c.id)?" selected":""}`,
          "data-sfx": selecting ? "tap_secondary" : "naker",
          onClick: ()=> handleCardClick(c.id)
        },
          h("span",{class:"word"}, c.a),
          h("span",{class:"lvl"}, isEn?`Level ${c.level}`:`مستوى ${c.level}`),
          h("span",{class:`status ${statusClass(c)}`}, statusLabel(c))
        );
        grid.appendChild(tile);
      }
      updateActionBar();
    }

    function handleCardClick(id){
      if(!selecting){
        openCardDetails(id, ctx);
        return;
      }
      if(selected.has(id)) selected.delete(id);
      else selected.add(id);
      rebuild();
    }

    function toggleSelectionMode(enable){
      selecting = enable;
      selected.clear();
      normalControls.style.display = enable ? "none" : "block";
      selectionControls.style.display = enable ? "flex" : "none";
      actionBar.style.display = enable ? "grid" : "none";
      rebuild();
    }

    function selectAllCards(){
      if(!selecting) return;
      const cards = filteredCards();
      const allSelected = (cards.length > 0) && cards.every(c=> selected.has(c.id));
      for(const c of cards){
        if(allSelected) selected.delete(c.id);
        else selected.add(c.id);
      }
      rebuild();
    }

    searchInput.addEventListener("input", rebuild, {passive:true});

    rebuild();
  }

  function openBulkActions(ctx, selected, refresh){
    if(selected.size === 0){
      toast("حدّد بطاقات أولاً.");
      return;
    }

    const isSpecial = (ctx.packKey === "ignored" || ctx.packKey === "completed");

    let trainBtn = null;
    const canTrain = (!isSpecial) && (selected.size >= 4);

    if(!isSpecial){
      trainBtn = h("button",{
        class: `btn ${canTrain ? "" : "disabled"}`,
        "data-sfx": canTrain ? "laeb" : null,
        onPointerdown: (e)=>{
          if(canTrain) return;
          e.preventDefault();
          e.stopPropagation();
          tip(trainBtn, "اختر 4 بطاقات على الأقل");
        },
        onClick: (e)=>{
          if(canTrain){ bulkTrain(); return; }
          e.preventDefault();
          tip(trainBtn, "اختر 4 بطاقات على الأقل");
        }
      }, "تدريب");
    }

    const body = isSpecial
      ? h("div",{},
          h("div",{class:"subtle"}, "إجراءات"),
          h("div",{class:"hr"}),
          h("div",{class:"row"},
            h("button",{class:"btn danger", "data-sfx":"hathef", onClick: ()=> bulkDeleteForever()}, "حذف نهائي"),
            h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> bulkReset()}, "إعادة"),
          )
          ,h("div",{class:"row", style:"margin-top:10px;"},
            h("button",{class:"btn", "data-sfx":"naker", onPointerup: ()=> { m.close(); bulkShare(); }, onClick: ()=> { m.close(); bulkShare(); }}, "مشاركة")
          )
        )
      : h("div",{},
          h("div",{class:"subtle"}, "إجراءات"),
          h("div",{class:"hr"}),
          h("div",{class:"row"},
            h("button",{class:"btn danger", "data-sfx":"tahther", onClick: ()=> bulkIgnore()}, "تجاهل"),
            trainBtn,
          ),
          h("div",{class:"row", style:"margin-top:10px;"},
            h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> bulkAddToPack()}, "إضافة إلى رزمة"),
            h("button",{class:"btn", "data-sfx":"naker", onPointerup: ()=> { m.close(); bulkShare(); }, onClick: ()=> { m.close(); bulkShare(); }}, "مشاركة"),
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

    function bulkShare(){
      const ids = idsSel();
      if(ids.length === 0){ toast("اختر بطاقة واحدة على الأقل."); return; }
      exportShareDeck({ kind: ctx.packKey ? "pack" : (ctx.dayKey ? "dailyGroup" : "selection"), title, cardIds: ids });
    }


    function bulkAddToPack(){
      const packs = state.library.customPacks;
      if(packs.length === 0){ toast("لا توجد رزم."); return; }
      const sel = new Set();
      const body = h("div",{}, ...packs.map(p=>{
        const btn = h("button",{
          class:"btn",
          "data-sfx":"tap_secondary",
          "aria-pressed": "false",
          onClick: ()=> {
            if(sel.has(p.id)) sel.delete(p.id);
            else sel.add(p.id);
            const isSelected = sel.has(p.id);
            btn.classList.toggle("selected", isSelected);
            btn.setAttribute("aria-pressed", String(isSelected));
          }
        }, p.name);
        return btn;
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
  const title = (getLang()==="en") ? "Shop" : "المتجر";
  const econ = state.economy || {};

  const goldVal = h("span",{class:"gold-val"}, String(Math.max(0, Math.floor(state.economy.gold||0))));
  const header = h("header",{class:"page-header"},
    h("div",{style:"font-weight:bold;font-size:1.2rem;"}, title),
    h("div",{class:"gold-tag", "aria-label": (getLang()==="en") ? "Gold" : "الذهب"},
      h("i",{class:"fas fa-coins"}),
      goldVal
    )
  );

  const powerGrid = h("div",{class:"content-area shop-grid"});
  const cosGrid   = h("div",{class:"content-area shop-grid"});

  // Power-ups (same logic, new UI)
  powerGrid.append(
    shopTile({
      name: (getLang()==="en") ? "Extra card" : "بطاقة إضافية",
      countText: (getLang()==="en") ? `Today: ${Number(econ.dailyExtraCardsPurchased||0)}/2` : `اليوم: ${Number(econ.dailyExtraCardsPurchased||0)}/2`,
      price: 100,
      icon: "fas fa-id-card",
      sfx:"mal",
      onBuy: ()=> buyExtraCard()
    }),
    shopTile({
      name: (getLang()==="en") ? "Help" : "مساعدة",
      countText: (getLang()==="en") ? `Owned: ${Number(econ.helps||0)}` : `معك: ${Number(econ.helps||0)}`,
      price: 150,
      icon: "fas fa-lightbulb",
      sfx:"mal",
      onBuy: ()=> buyCount("helps", 150)
    }),
    shopTile({
      name: (getLang()==="en") ? "Fuel" : "وقود",
      countText: (getLang()==="en") ? `Owned: ${Number(econ.fuel||0)}` : `معك: ${Number(econ.fuel||0)}`,
      price: 250,
      icon: "fas fa-gas-pump",
      sfx:"mal",
      onBuy: ()=> buyCount("fuel", 250)
    }),
    shopTile({
      name: (getLang()==="en") ? "Skip game" : "تخطي لعبة",
      countText: (getLang()==="en") ? `Owned: ${Number(econ.skips||0)}` : `معك: ${Number(econ.skips||0)}`,
      price: 500,
      icon: "fas fa-forward",
      sfx:"mal",
      onBuy: ()=> buyCount("skips", 500)
    }),
  );

  // Cosmetics
  rebuildCosmetics();

  const scroll = h("div",{class:"shop-scroll"},
    h("div",{class:"subtle"}, (getLang()==="en") ? "Power-ups" : "الأدوات التشغيلية"),
    powerGrid,
    h("div",{class:"hr"}),
    h("div",{class:"subtle"}, (getLang()==="en") ? "Cosmetics" : "التخصيص"),
    cosGrid
  );

  const backBtn = h("button",{class:"fixed-back-btn btn-active", "data-sfx":"naker", onClick: ()=> navBack()},
    h("i",{class:"fas fa-arrow-right"}),
    (getLang()==="en") ? "Back" : "رجوع"
  );

  const panel = h("section",{class:"glass gold panel"},
    header,
    scroll,
    backBtn
  );
  app.appendChild(panel);

  function updateGoldUI(){
    goldVal.textContent = String(Math.max(0, Math.floor(state.economy.gold||0)));
  }

  function shopTile({name, countText="", price, icon, sfx="tap_primary", onBuy}){
    const tile = h("div",{class:"shop-item btn-active", "data-sfx": sfx, role:"button", tabIndex:"0"},
      h("i",{class: icon, "aria-hidden":"true"}),
      h("div",{class:"shop-name"}, name),
      countText ? h("div",{class:"shop-count"}, countText) : null,
      h("div",{class:"price"}, String(price))
    );
    const handler = ()=> confirmBuy(name, price, ()=> {
      onBuy();
      saveState(state);
      syncTopbar();
      updateGoldUI();
    });
    tile.addEventListener("click", (e)=>{ e.__dm_sfx_ok = true; handler(); });
    tile.addEventListener("keydown", (e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); e.__dm_sfx_ok = true; handler(); }});
    return tile;
  }

  function confirmBuy(name, price, doBuy){
    const body = h("div",{class:"modal-body"},
      h("div",{class:"subtle"}, (getLang()==="en") ? `Buy ${name} for ${price} gold?` : `شراء ${name} مقابل ${price} ذهب؟`)
    );
    modal((getLang()==="en") ? "Confirm" : "تأكيد", body, [
      { label: (getLang()==="en") ? "Cancel" : "إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
      { label: (getLang()==="en") ? "Buy" : "شراء", kind:"primary", sfx:"schera", onClick:(close)=> {
        if(state.economy.gold < price){ toast((getLang()==="en") ? "Not enough gold." : "رصيد غير كافٍ."); return false; }
        doBuy();
        close();
        toast((getLang()==="en") ? "Done." : "تم.");
        render(); // refresh any dependent UI
        return true;
      }},
    ]);
  }

  function buyExtraCard(){
    if(state.economy.dailyExtraCardsPurchased >= 2){
      toast((getLang()==="en") ? "Daily limit reached." : "تم بلوغ الحد.");
      return;
    }
    state.economy.gold -= 100;
    state.economy.dailyExtraCardsPurchased += 1;
  }

  function buyCount(key, price){
    state.economy.gold -= price;
    state.economy[key] = (state.economy[key]||0) + 1;
  }

  function rebuildCosmetics(){
    clear(cosGrid);
    const gender = state.profile.gender;

    const bgItems = state.library.backgrounds.items;
    const avItems = state.library.avatars.items;
    const frItems = state.library.frames.items;
    const cbItems = (state.library.cardBacks && state.library.cardBacks.items) ? state.library.cardBacks.items : [];

    const bgOwned = new Set(state.library.backgrounds.owned);
    const avOwned = new Set(state.library.avatars.owned);
    const frOwned = new Set(state.library.frames.owned);
    const cbOwned = new Set((state.library.cardBacks && state.library.cardBacks.owned) ? state.library.cardBacks.owned : []);

    // Non-owned only + do not sell default gender items to the same gender
    const showBg = bgItems.filter(x=> x.gender !== gender && !bgOwned.has(x.id));
    const showAv = avItems.filter(x=> x.gender !== gender && !avOwned.has(x.id));
    const showFr = frItems.filter(x=> !frOwned.has(x.id) && Number(x.price||0) > 0);
    const showCb = cbItems.filter(x=> !cbOwned.has(x.id) && Number(x.price||0) > 0);

    // Frames then avatars then backgrounds, then card backs
    for(const it of showFr){ cosGrid.appendChild(cosmeticTile(it, "frames")); }
    for(const it of showAv){ cosGrid.appendChild(cosmeticTile(it, "avatars")); }
    for(const it of showBg){ cosGrid.appendChild(cosmeticTile(it, "backgrounds")); }
    for(const it of showCb){ cosGrid.appendChild(cosmeticTile(it, "cardBacks")); }

    if(showFr.length + showAv.length + showBg.length + showCb.length === 0){
      cosGrid.appendChild(h("div",{class:"subtle", style:"grid-column: 1 / -1; text-align:center; padding: 10px 0;"}, (getLang()==="en") ? "No items available." : "لا توجد عناصر متاحة."));
    }
  }

  function cosmeticTile(it, kind){
    const name = it.name;
    const price = Number(it.price||0);

    const thumbClass = kind==="frames" ? "shop-thumb is-frame" : (kind==="avatars" ? "shop-thumb is-avatar" : (kind==="backgrounds" ? "shop-thumb is-bg" : "shop-thumb"));
    const img = h("img",{src: it.src, alt: name, loading:"lazy"});
    const visual = h("div",{class: thumbClass}, img);

    const tile = h("div",{class:"shop-item btn-active", "data-sfx":"naker", role:"button", tabIndex:"0"},
      visual,
      h("div",{class:"shop-name"}, name),
      h("div",{class:"price"}, String(price))
    );

    const handler = ()=> confirmBuyCosmetic(tile, kind, it);
    tile.addEventListener("click", (e)=>{ e.__dm_sfx_ok = true; handler(); });
    tile.addEventListener("keydown", (e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); e.__dm_sfx_ok = true; handler(); }});
    return tile;
  }

  function confirmBuyCosmetic(tile, kind, it){
    const body = h("div",{class:"modal-body"},
      h("div",{class:"subtle"}, (getLang()==="en") ? `Buy ${it.name} for ${it.price} gold?` : `شراء ${it.name} مقابل ${it.price} ذهب؟`)
    );
    modal((getLang()==="en") ? "Confirm" : "تأكيد", body, [
      { label: (getLang()==="en") ? "Cancel" : "إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
      { label: (getLang()==="en") ? "Buy" : "شراء", kind:"primary", sfx:"schera", onClick:(close)=> {
        if(state.economy.gold < it.price){ toast((getLang()==="en") ? "Not enough gold." : "رصيد غير كافٍ."); return false; }
        buyCosmetic(kind, it);
        saveState(state);
        syncTopbar();
        updateGoldUI();
        close();
        toast((getLang()==="en") ? "Done." : "تم.");

        // Fade out then remove from shop after short delay (like original)
        tile.classList.add("owned");
        tile.querySelector(".price").textContent = tr("ممتلك");
        setTimeout(()=>{
          tile.style.transition = "opacity .22s ease, transform .22s ease";
          tile.style.opacity = "0";
          tile.style.transform = "translateY(-6px)";
          setTimeout(()=> tile.remove(), 240);
        }, 800);
        return true;
      }},
    ]);
  }

  function buyCosmetic(kind, it){
    state.economy.gold -= it.price;
    const lib = state.library[kind];
    if(!lib.owned.includes(it.id)) lib.owned.push(it.id);
  }
}


function renderProfile(){
  const p = state.profile;
  const econ = state.economy;
  const r = state.rating;

  // واجهة الملف الشخصي يجب أن تطابق ستايل البروتوتايب (الكود الثاني):
  // Hero + إحصائيات + أزرار تخصيص + زر رجوع ثابت. (لا نعرض محرر نبذة هنا)

  const accPct = accuracyPct();
  const heroStack = h("div",{class:"avatar-stack big", id:"profileAvatarStack", "aria-hidden":"true"});

  // Build avatar stack
  try{
    heroStack.innerHTML = "";
    const {frame, bg, av} = computeAvatarLayers(state);
    const frameImg = new Image(); frameImg.src = frame?.src || ""; frameImg.className = "layer frame";
    const bgImg = new Image(); bgImg.src = bg?.src || ""; bgImg.className = "layer bg";
    const avImg = new Image(); avImg.src = av?.src || ""; avImg.className = "layer av";
    // Layering per spec: frame (bottom) -> background -> avatar (top)
    heroStack.append(bgImg, avImg, frameImg);
  }catch(e){}

  const lvl = computeLevelFromXp(p.xp || 0);

  const header = h("header",{class:"page-header"},
    h("div",{style:"font-weight:bold;font-size:1.2rem;"}, "الملف الشخصي"),
    h("div",{class:"gold-tag", "aria-label":"الذهب"},
      h("i",{class:"fas fa-coins"}),
      h("span",{style:"margin-inline-start:8px;"}, String(Math.max(0, Math.floor(econ.gold||0))))
    )
  );

  const hero = h("div",{class:"profile-hero-section"},
    heroStack,
    h("div",{class:"profile-title-block"},
      h("div",{class:"profile-big-name"}, p.username),
      h("div",{class:"profile-level-pill"}, (getLang()==="en") ? `Level ${lvl.level}` : `مستوى ${lvl.level}`)
    ),
    h("div",{class:"stats-container"},
      h("div",{class:"stat-row"},
        h("span",{}, (getLang()==="en") ? `Rank: ` : "التصنيف: ", h("span",{class:"rank-chip"}, rankLabel(r.rankKey, r.subLevel))),
        h("button",{class:"ladder-btn btn-active", "data-sfx":"naker", onClick: ()=> openRanks()}, (getLang()==="en") ? "Ladder" : "سلم التصنيف")
      ),
      h("div",{class:"stat-row"},
        h("span",{}, (getLang()==="en") ? "Accuracy: " : "الدقة: ", h("span",{style:"font-weight:900;"}, `${accPct}%`))
      ),
      h("div",{class:"accuracy-bar-bg", "aria-hidden":"true"},
        h("div",{class:"accuracy-fill", style:`width:${accPct}%`})
      )
    )
  );

  const custom = h("div",{class:"custom-grid"},
    h("button",{class:"custom-btn btn-active", "data-sfx":"naker", onClick: ()=> openOwnedPicker("avatars")},
      h("i",{class:"fas fa-user-circle", style:"color:var(--accent-color)"}), (getLang()==="en") ? "Avatar" : "الافتار"
    ),
    h("button",{class:"custom-btn btn-active", "data-sfx":"naker", onClick: ()=> openOwnedPicker("backgrounds")},
      h("i",{class:"fas fa-image", style:"color:var(--accent-color)"}), (getLang()==="en") ? "Background" : "الخلفية"
    ),
    h("button",{class:"custom-btn btn-active", "data-sfx":"naker", onClick: ()=> openOwnedPicker("frames")},
      h("i",{class:"fas fa-border-style", style:"color:var(--accent-color)"}), (getLang()==="en") ? "Frame" : "الإطار"
    ),
    h("button",{class:"custom-btn btn-active", "data-sfx":"naker", onClick: ()=> openOwnedPicker("cardBacks")},
      h("i",{class:"fas fa-clone", style:"color:var(--accent-color)"}), (getLang()==="en") ? "Cards" : "البطاقات"
    )
  );

  const scroll = h("div",{class:"profile-scroll"},
    hero,
    custom
  );

  const backBtn = h("button",{class:"fixed-back-btn btn-active", "data-sfx":"naker", onClick: ()=> navBack()},
    h("i",{class:"fas fa-arrow-right"}),
    (getLang()==="en") ? "Back" : "رجوع"
  );

  // نفس بنية صفحة البروتوتايب: Header + محتوى قابل للتمرير + زر رجوع ثابت
  const wrap = h("div",{class:"profile-wrap"}, header, scroll, backBtn);
  app.appendChild(wrap);
  return;

  function accuracyPct(){
    const a = state.rating.accuracySeason;
    if(!a || a.total <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((a.correct/a.total)*100)));
  }

  function openOwnedPicker(kind){
    const title = kind === "avatars" ? ((getLang()==="en") ? "Avatars" : "الأفاتارات") :
                  kind === "backgrounds" ? ((getLang()==="en") ? "Backgrounds" : "الخلفيات") :
                  kind === "frames" ? ((getLang()==="en") ? "Frames" : "الإطارات") :
                  ((getLang()==="en") ? "Card backs" : "خلفيات البطاقات");
    const lib = state.library[kind];
    const owned = new Set(lib.owned || []);
    const items = (lib.items || []).filter(it => owned.has(it.id));

    const grid = h("div",{class:"cos-grid"});
    const m = modal(title, grid, []);

    for(const it of items){
      grid.appendChild(ownedTile(kind, it, ()=>{ m.close(); }));
    }

    if(items.length === 0){
      grid.appendChild(h("div",{class:"subtle"}, (getLang()==="en") ? "No items." : "لا توجد عناصر."));
    }

    window.lucide?.createIcons?.();
  }

  function ownedTile(kind, it, close){
    const selectedId = state.library[kind].selected;
    const isSelected = (selectedId === it.id);

    const preview = buildCosmeticPreview(kind, it.id);

    const btn = h("button",{class:"btn primary", "data-sfx":"naker", onClick: ()=> {
      if(isSelected){ close(); return; }
      state.library[kind].selected = it.id;
      saveState(state);
      updateTopbarUI();
      if(kind === "cardBacks") applyCardBackSkin();
      close();
    }}, isSelected ? ((getLang()==="en") ? "Active" : "مستخدم") : ((getLang()==="en") ? "Use" : "استخدام"));

    return h("div",{class:"cos-item glass gold"}, preview, h("div",{class:"cos-name"}, it.name), btn);
  }

  function buildCosmeticPreview(kind, id){
    if(kind === "cardBacks"){
      const it = (state.library.cardBacks.items||[]).find(x=>x.id===id);
      const src = it?.src || "";
      return h("div",{class:"cardback-preview", "aria-hidden":"true"},
        h("img",{src, alt: it?.name || "Card back", loading:"lazy"})
      );
    }

    const curFrame = state.library.frames.selected;
    const curBg = state.library.backgrounds.selected;
    const curAv = state.library.avatars.selected;

    const frameId = (kind === "frames") ? id : curFrame;
    const bgId = (kind === "backgrounds") ? id : curBg;
    const avId = (kind === "avatars") ? id : curAv;

    const tmp = {
      library: {
        frames: {...state.library.frames, selected: frameId},
        backgrounds: {...state.library.backgrounds, selected: bgId},
        avatars: {...state.library.avatars, selected: avId}
      },
      profile: state.profile
    };

    const stack = h("div",{class:"avatar-stack big preview", "aria-hidden":"true"});
    try{
      stack.innerHTML="";
      const {frame, bg, av} = computeAvatarLayers(tmp);
      const frameImg = new Image(); frameImg.src = frame?.src || ""; frameImg.className="layer frame";
      const bgImg = new Image(); bgImg.src = bg?.src || ""; bgImg.className="layer bg";
      const avImg = new Image(); avImg.src = av?.src || ""; avImg.className="layer av";
      // Layering per spec: frame (bottom) -> background -> avatar (top)
      stack.append(frameImg, bgImg, avImg);
    }catch(e){}
    return stack;
  }

  function openRanks(){
    const tiers = ["خشبي","حديدي","نحاسي","فضي","ذهبي","بلاتيني","ألماسي","أسطوري","مفكر","حكيم","ملهم"];
    const body = h("div",{class:"card-list"},
      ...tiers.map((name, idx)=> h("div",{class:"glass gold card"},
        h("div",{style:"font-weight:900;"}, name),
        h("div",{class:"subtle"}, (getLang()==="en") ? `Tier ${idx+1}` : `مرتبة ${idx+1}`)
      ))
    );
    modal((getLang()==="en") ? "Ladder" : "سلم التصنيفات", body, []);
  }
}



function renderSettings(){
  const econ = state.economy;
  const isEn = getLang()==="en";

  const music = Number(localStorage.getItem("dm_music") ?? "0.65");
  const sfx = Number(localStorage.getItem("dm_sfx") ?? "0.85");

  const m = h("input",{type:"range", min:"0", max:"1", step:"0.01", value:String(music)});
  const s = h("input",{type:"range", min:"0", max:"1", step:"0.01", value:String(sfx)});

  const header = h("header",{class:"page-header"},
    h("div",{style:"font-weight:bold;font-size:1.2rem;"}, isEn ? "Settings" : "الإعدادات"),
    h("div",{class:"gold-tag", "aria-label": isEn ? "Gold" : "الذهب"},
      h("i",{class:"fas fa-coins"}),
      h("span",{class:"gold-val", style:"margin-inline-start:8px;"}, String(Math.max(0, Math.floor(econ.gold||0))))
    )
  );

  const list = h("div",{class:"settings-list"},
    h("div",{class:"setting-item"},
      h("div",{class:"setting-label"}, h("i",{class:"fas fa-music"}), isEn ? "Music volume" : "مستوى الموسيقى"),
      m
    ),
    h("div",{class:"setting-item"},
      h("div",{class:"setting-label"}, h("i",{class:"fas fa-volume-up"}), isEn ? "Interaction volume" : "مستوى التفاعلات"),
      s
    ),

    // Vibration toggle
    (function(){
      const icon = h("i",{class: vibOn ? "fas fa-toggle-on" : "fas fa-toggle-off"});
      const txt = h("span",{class:"vib-txt"}, vibOn ? (isEn?"On":"شغال") : (isEn?"Off":"متوقف"));
      const btn = h("button",{type:"button", class:`vibrate-pill ${vibOn?"on":"off"} btn-active`, "data-sfx":"tap_secondary", onClick: ()=>{
          vibOn = !vibOn;
          setVibrationEnabled(vibOn);
          btn.classList.toggle("on", vibOn);
          btn.classList.toggle("off", !vibOn);
          icon.className = vibOn ? "fas fa-toggle-on" : "fas fa-toggle-off";
          txt.textContent = vibOn ? (isEn?"On":"شغال") : (isEn?"Off":"متوقف");
          playSfx("tap_secondary");
        }}, icon, txt);
      return h("div",{class:"setting-item"},
        h("div",{class:"setting-row"},
          h("div",{class:"setting-label"}, h("i",{class:"fas fa-mobile-screen-button"}), isEn ? "Tap vibration" : "اهتزاز اللمس"),
          btn
        )
      );
    })(),

    // Dark mode toggle
    (function(){
      const icon = h("i",{class: darkOn ? "fas fa-moon" : "fas fa-sun"});
      const txt = h("span",{}, darkOn ? (isEn?"Dark":"داكن") : (isEn?"Light":"فاتح"));
      const btn = h("button",{type:"button", class:`theme-pill ${darkOn?"on":"off"} btn-active`, "data-sfx":"tap_secondary", onClick: ()=>{
          darkOn = !darkOn;
          applyTheme(darkOn ? "dark" : "light");
          btn.classList.toggle("on", darkOn);
          btn.classList.toggle("off", !darkOn);
          icon.className = darkOn ? "fas fa-moon" : "fas fa-sun";
          txt.textContent = darkOn ? (isEn?"Dark":"داكن") : (isEn?"Light":"فاتح");
          playSfx("tap_secondary");
        }}, icon, txt);
      return h("div",{class:"setting-item"},
        h("div",{class:"setting-row"},
          h("div",{class:"setting-label"}, h("i",{class:"fas fa-circle-half-stroke"}), isEn ? "Theme" : "المظهر"),
          btn
        )
      );
    })(),

    h("button",{class:"btn-wide btn-active neutral", "data-sfx":"naker", onClick: ()=> openLangPicker()},
      h("i",{class:"fas fa-globe"}),
      isEn ? "Change language" : "تغيير اللغة"
    ),

    h("button",{class:"btn-wide btn-active neutral", "data-sfx":"naker", onClick: ()=> exportBackup()},
      h("i",{class:"fas fa-file-export"}),
      isEn ? "Export my data" : "تصدير بيانات الحساب"
    ),

    h("button",{class:"btn-wide btn-active neutral", "data-sfx":"naker", onClick: ()=> importBackup()},
      h("i",{class:"fas fa-file-import"}),
      isEn ? "Import my data" : "استيراد بيانات حساب"
    ),

    h("button",{class:"btn-wide btn-active neutral", "data-sfx":"naker", onClick: ()=> importSharedDeckFile()},
      h("i",{class:"fas fa-file-csv"}),
      isEn ? "Import shared deck" : "استيراد ملف مشاركة"
    ),

    h("button",{class:"btn-wide btn-active danger-outline", "data-sfx":"hathef", onClick: ()=> deleteFlow()},
      h("i",{class:"fas fa-trash-alt"}),
      isEn ? "Delete account" : "حذف الحساب"
    ),

    h("div",{class:"support-email"}, isEn ? "Support: deckmastery0@gmail.com" : "دعم فني: deckmastery0@gmail.com")
  );

  const backBtn = h("button",{class:"fixed-back-btn btn-active", "data-sfx":"naker", onClick: ()=> navBack()},
    h("i",{class:"fas fa-arrow-right"}),
    isEn ? "Back" : "رجوع"
  );

  const wrap = h("div",{class:"settings-wrap"}, header, list, backBtn);
  app.appendChild(wrap);

  function openLangPicker(){
    const body = h("div",{class:"modal-body"},
      h("div",{class:"subtle"}, isEn ? "Choose language:" : "اختر اللغة:"),
      h("div",{class:"row"},
        h("button",{class:"btn", "data-sfx":"naker", onClick: ()=>{ setLang("ar"); applyLang(); location.reload(); }}, "العربية"),
        h("button",{class:"btn", "data-sfx":"naker", onClick: ()=>{ setLang("en"); applyLang(); location.reload(); }}, "English")
      )
    );
    modal(isEn?"Language":"اللغة", body, [
      { label: isEn?"Close":"إغلاق", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() }
    ]);
  }

  m.addEventListener("input", ()=> {
    localStorage.setItem("dm_music", m.value);
    setVolumes({music:Number(m.value), sfx:Number(s.value)});
    playSfx("tap_secondary");
  }, {passive:true});

  s.addEventListener("input", ()=> {
    localStorage.setItem("dm_sfx", s.value);
    setVolumes({music:Number(m.value), sfx:Number(s.value)});
    playSfx("tap_secondary");
  }, {passive:true});

  function exportBackup(){
    downloadFullBackup();
  }

  function importBackup(){
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "application/json,.json";
    inp.onchange = async ()=> {
      const file = inp.files?.[0];
      if(!file) return;
      try{
        const text = await file.text();
        const data = JSON.parse(text);
        let importedState = null;
        let dmMusic = null;
        let dmSfx = null;
        let dmVibrate = null;
        let dmTheme = null;
        if(data && typeof data === "object" && data.storage && typeof data.storage === "object"){
          if(data.storage.deckmastery_v1) importedState = data.storage.deckmastery_v1;
          if(typeof data.storage.dm_music === "string") dmMusic = data.storage.dm_music;
          if(typeof data.storage.dm_sfx === "string") dmSfx = data.storage.dm_sfx;
          if(typeof data.storage.dm_vibrate === "string") dmVibrate = data.storage.dm_vibrate;
          if(typeof data.storage.dm_theme === "string") dmTheme = data.storage.dm_theme;
        } else {
          importedState = data;
        }
        if(!importedState || typeof importedState !== "object") throw new Error("bad");
        state = migrate(importedState);
        saveState(state);
        if(dmMusic != null) localStorage.setItem("dm_music", dmMusic);
        if(dmSfx != null) localStorage.setItem("dm_sfx", dmSfx);
        if(dmVibrate != null) localStorage.setItem("dm_vibrate", dmVibrate);
        if(dmTheme != null) localStorage.setItem("dm_theme", dmTheme);
        location.reload();
      } catch(e){
        toast(isEn ? "Invalid file." : "ملف غير صالح");
      }
    };
    inp.click();
  }

  function importSharedDeckFile(){
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".json,application/json";
    inp.addEventListener("change", async ()=>{
      const file = inp.files?.[0];
      if(!file) return;
      try{
        const txt = await file.text();
        const obj = JSON.parse(txt);
        const res = importSharedDeckPayload(obj);
        if(!res.ok){ toast(res.msg || (isEn?"Invalid file.":"ملف غير صالح.")); return; }
        saveState(state);
        toast(res.msg);
      }catch(e){
        toast(isEn ? "Could not read file." : "تعذّر قراءة الملف.");
      }
    });
    inp.click();
  }

  function deleteFlow(){
    const b1 = h("div",{}, h("div",{class:"subtle"}, isEn ? "Are you sure?" : "هل أنت متأكد؟"));
    modal(isEn?"Delete":"حذف", b1, [
      { label: isEn?"Cancel":"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
      { label: isEn?"Continue":"متابعة", kind:"danger", sfx:"hathef", onClick:(close)=> { close(); step2(); } },
    ]);
    function step2(){
      const b2 = h("div",{}, h("div",{style:"color:var(--danger);font-weight:900;"}, isEn ? "Warning: this cannot be undone." : "انتبه! بعد الحذف لن تتمكن من استعادة بياناتك."));
      modal(isEn?"Warning":"تحذير", b2, [
        { label: isEn?"Cancel":"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
        { label: isEn?"Continue":"متابعة", kind:"danger", sfx:"hathef", onClick:(close)=> { close(); step3(); } },
      ]);
    }
    function step3(){
      const pass = h("input",{});
      const b3 = h("div",{}, h("div",{class:"field"}, h("label",{}, isEn ? "Password" : "كلمة السر"), pass));
      modal(isEn?"Final confirmation":"تأكيد نهائي", b3, [
        { label: isEn?"Cancel":"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
        { label: isEn?"Delete":"حذف", kind:"danger", sfx:"hathef", onClick:(close)=> {
          localStorage.removeItem("deckmastery_v1");
          close();
          location.reload();
        }},
      ]);
    }
  }
}


function renderNotifications(){
  const econ = state.economy;
  const isEn = getLang()==="en";

  const header = h("header",{class:"page-header"},
    h("div",{style:"font-weight:bold;font-size:1.2rem;"}, isEn ? "Notifications" : "الإشعارات"),
    h("div",{class:"gold-tag", "aria-label": isEn ? "Gold" : "الذهب"},
      h("i",{class:"fas fa-coins"}),
      h("span",{class:"gold-val", style:"margin-inline-start:8px;"}, String(Math.max(0, Math.floor(econ.gold||0))))
    )
  );

  // Build items (render state first, then mark read)
  const list = h("div",{class:"settings-list noti-list"});
  if(!state.notifications.items.length){
    list.appendChild(h("div",{class:"setting-item"},
      h("div",{class:"subtle", style:"text-align:center;"}, isEn ? "No notifications yet." : "لا توجد إشعارات بعد.")
    ));
  } else {
    for(const n of state.notifications.items){
      const title = n.title || (isEn ? "Notification" : "تنبيه");
      const body = n.body || "";
      const isNew = !n.readAt;
      const icon = n.claimable ? "fas fa-gift" : (n.type==="level" ? "fas fa-star" : "fas fa-bell");

      const badge = h("div",{class:"kbd"}, isNew ? (isEn ? "NEW" : "جديد") : (isEn ? "Read" : "مقروء"));

      const action = n.claimable
        ? h("button",{
            class:"btn small primary btn-active noti-claim",
            "data-sfx":"tap_primary",
            disabled: !!n.claimed,
            onClick: ()=> claim(n.id)
          }, n.claimed ? (isEn ? "Done" : "تم") : (isEn ? "Claim" : "استلام"))
        : null;

      const metaRow = h("div",{class:"noti-meta"}, badge, action || h("div",{}));

      const item = h("div",{class:"setting-item noti-item"},
        h("div",{class:"setting-label"},
          h("i",{class: icon}),
          h("span",{}, title)
        ),
        body ? h("div",{class:"subtle noti-body"}, body) : null,
        metaRow
      );

      // allow tap to open/claim quickly
      if(n.claimable && !n.claimed){
        item.style.cursor = "pointer";
        item.addEventListener("click", (ev)=>{
          // avoid double trigger if button clicked
          if((ev.target && ev.target.closest && ev.target.closest("button")) ) return;
          claim(n.id);
        });
      }

      list.appendChild(item);
    }
  }

  // mark read after building UI
  const now = Date.now();
  let changed = false;
  for(const n of state.notifications.items){
    if(!n.readAt){ n.readAt = now; changed = true; }
  }
  if(changed){
    saveState(state);
    syncTopbar();
  }

  const backBtn = h("button",{class:"fixed-back-btn btn-active", "data-sfx":"naker", onClick: ()=> navBack()},
    h("i",{class:"fas fa-arrow-right"}),
    isEn ? "Back" : "رجوع"
  );

  const wrap = h("div",{class:"notifications-wrap"}, header, list, backBtn);
  app.appendChild(wrap);

  function claim(id){
    const n = state.notifications.items.find(x=>x.id===id);
    if(!n || n.claimed) return;
    n.claimed = true;
    saveState(state);
    toast(isEn ? "Claimed." : "تم الاستلام.");
    render();
  }
}


function renderStreak(){
  const econ = state.economy;
  const isEn = getLang()==="en";
  const segs = state.streak.segments || [];

  const header = h("header",{class:"page-header"},
    h("div",{style:"font-weight:bold;font-size:1.2rem;"}, isEn ? "Streak" : "الحماس"),
    h("div",{class:"gold-tag", "aria-label": isEn ? "Gold" : "الذهب"},
      h("i",{class:"fas fa-coins"}),
      h("span",{class:"gold-val", style:"margin-inline-start:8px;"}, String(Math.max(0, Math.floor(econ.gold||0))))
    )
  );

  const hero = h("div",{class:"streak-hero-section"},
    h("div",{class:"streak-icon", "aria-hidden":"true"}, h("i",{class:"fas fa-fire"})),
    h("div",{class:"streak-title"}, isEn ? "Your current streak" : "حماسك الحالي"),
    h("div",{class:"streak-number"}, String(state.streak.current||0)),
    h("div",{class:"streak-meta-row"},
      h("div",{class:"kbd"}, (isEn ? "Fuel: " : "الوقود: ") + String(econ.fuel||0)),
      h("div",{class:"subtle"}, isEn ? "Tap a missed day to reconnect." : "اضغط على يوم مفقود لتوصيل الحماس.")
    )
  );

  // build visual days list from segments
  const days = [];
  if(segs.length){
    let num = 1;
    for(const s of segs){
      for(let i=0;i<(s.length||0);i++) days.push({ n:num++, type:"on" });
      const missed = s.missed||[];
      for(let j=0;j<missed.length;j++) days.push({ n:num++, type:"off" });
    }
  }

  const grid = h("div",{class:"streak-days-grid"});
  const last30 = days.slice(-30);
  if(!last30.length){
    grid.appendChild(h("div",{class:"subtle", style:"text-align:center; padding: 10px 0;"}, isEn ? "No streak yet. Play today to start!" : "لا يوجد حماس بعد. العب اليوم لتبدأ!"));
  } else {
    last30.forEach(d=>{
      const cls = `day-btn btn-active ${d.type==="off" ? "off" : "on"}`;
      const sfx = d.type==="off" ? "tap_danger" : "tap_secondary";
      const btn = h("button",{class: cls, "data-sfx": sfx, onClick: ()=> onDay(d)}, String(d.n));
      grid.appendChild(btn);
    });
  }

  const backBtn = h("button",{class:"fixed-back-btn btn-active", "data-sfx":"naker", onClick: ()=> navBack()},
    h("i",{class:"fas fa-arrow-right"}),
    isEn ? "Back" : "رجوع"
  );

  const wrap = h("div",{class:"streak-wrap"}, header, hero, grid, backBtn);
  app.appendChild(wrap);

  function onDay(d){
    if(d.type !== "off") return;
    const last = segs[segs.length-2];
    if(!last || !(last.missed?.length)) return;
    const need = last.missed.length;
    const body = h("div",{},
      h("div",{class:"subtle"}, (isEn ? `Use ${need} fuel to reconnect?` : `استخدام ${need} وقود لتوصيل الحماسة؟`))
    );
    modal(isEn ? "Reconnect" : "توصيل", body, [
      { label: isEn?"Cancel":"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
      { label: isEn?"Confirm":"تأكيد", kind:"primary", sfx:"tap_primary", onClick:(close)=> {
        const r = reconnectStreak(state);
        if(!r.ok){ toast(isEn ? "Not enough fuel." : "رصيد غير كافٍ."); return; }
        saveState(state);
        close();
        toast(isEn ? "Done." : "تم.");
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
  if(!el) return;
  const t = Number(target) || 0;

  // Prefer GSAP when available, but provide a fallback so the UI never stays at 0.
  try{
    if(window.gsap && typeof gsap.to === "function"){
      const d = {v:0};
      gsap.to(d, { v: t, duration: 0.9, ease: "power2.out", onUpdate: ()=> {
        el.textContent = String(Math.floor(d.v));
        if(Math.random() < 0.12) playSfx("count");
      }});
      return;
    }
  }catch{}

  const start = 0;
  const duration = 900;
  const t0 = performance.now();
  function easeOutQuad(p){ return 1 - (1-p)*(1-p); }
  function step(now){
    const p = Math.min(1, (now - t0) / duration);
    const v = Math.floor(start + (t - start) * easeOutQuad(p));
    el.textContent = String(v);
    if(Math.random() < 0.08) playSfx("count");
    if(p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ================================
// مشاركة/استيراد (ملف JSON بسيط)
// ================================
function sanitizeFileName(name){
  return String(name||"مشاركة")
    .replace(/[\\/:*?\"<>|]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48) || "مشاركة";
}

function fingerprintCard(a,b,hint){
  return [a,b,hint].map(x=>String(x||"").trim().toLowerCase()).join("|");
}

function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 5000);

  // خزّن اسم آخر ملف تم تنزيله (للاستخدام في تذكير حذف النسخة القديمة)
  try{ localStorage.setItem("dm_last_backup_filename", filename); }catch{}
}





function uniquePackName(base){
  let name = base;
  let i = 2;
  const exists = (n)=> state.library.customPacks.some(p=>p.name===n);
  while(exists(name)){
    name = `${base} (${i})`;
    i++;
  }
  return name;
}

function ensureCustomPackByName(name){
  let p = state.library.customPacks.find(x=>x.name===name);
  if(!p){
    p = { id: uuid(), name, cardIds: [] };
    state.library.customPacks.unshift(p);
  }
  return p;
}

function importSharedDeckFile(){
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = "application/json,.json";
  inp.onchange = async ()=> {
    const file = inp.files?.[0];
    if(!file) return;
    try{
      const data = JSON.parse(await file.text());
      const res = importSharedDeckPayload(data);
      if(!res.ok){ toast(res.msg || "ملف غير صالح."); return; }
      saveState(state);
      toast(`تم استيراد ${res.added} بطاقة.`);
      // افتح المكتبة لتظهر رزمة المشاركات فوراً
      nav("#/library");
    }catch(e){
      toast("تعذّر قراءة الملف.");
    }
  };
  inp.click();
}


// ===== مشاركة رزم/بطاقات (تنزيل ملف) =====
function makeSharePayload({ kind="selection", title="DeckMastery", cardIds=[] }){
  const cards = [];
  for(const id of cardIds){
    const c = state.cards.byId?.[id];
    if(!c) continue;
    cards.push({ a: c.a ?? "", b: c.b ?? "", hint: c.hint ?? "" });
  }
  return {
    _app: "DeckMastery",
    _type: "share",
    _v: 1,
    kind,
    title,
    exportedAt: new Date().toISOString(),
    cards
  };
}

function downloadSharePayload(payload){
  const nameBase = sanitizeFileName(payload.title || "DeckMastery");
  const fname = `${nameBase}_${backupDateKey()}_Share.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=> URL.revokeObjectURL(url), 500);
}


function exportShareDeck({ kind="selection", title="DeckMastery", cardIds=[] }={}){
  const payload = makeSharePayload({ kind, title, cardIds });
  // تنزيل الملف مباشرة ثم إظهار رسالة إرشادية
  downloadSharePayload(payload);
  modal("تم تنزيل ملف المشاركة", h("div",{class:"modal-body"},
    h("div",{style:"line-height:1.75"},
      h("div",{}, "تم تنزيل ملف المشاركة على جهازك."),
      h("div",{style:"margin-top:8px; opacity:.9"}, "شارك هذا الملف مع الشخص الآخر (عبر واتساب أو تلغرام أو البريد الإلكتروني)."),
      h("div",{style:"margin-top:8px; opacity:.9"}, "وعلى الطرف الآخر اختيار «استيراد ملف مشاركة» من الإعدادات لاستقبال البطاقات.")
    )
  ), [
    { label:"حسنًا", kind:"primary", sfx:"tap_primary", onClick:(close)=> close() }
  ]);
}

// دعم للتوافق مع نسخ أقدم كانت تستخدم importShareDeck
function importShareDeck(payload){
  return importSharedDeckPayload(payload);
}

function importSharedDeckPayload(data){
  if(!data || data._app !== "DeckMastery" || data._type !== "share" || !Array.isArray(data.cards)){
    return { ok:false, msg:"هذا ليس ملف مشاركة DeckMastery." };
  }

  const today = todayISO();
  const baseName = (data.kind === "pack")
    ? String(data.title || "مشاركة")
    : (data.kind === "dailyGroup")
      ? `مجموعة مشاركة: ${String(data.title || "")}`.trim()
      : `مشاركة: ${formatDateDMY(today)}`;

  const packName = uniquePackName(baseName || `مشاركة: ${formatDateDMY(today)}`);
  const pack = ensureCustomPackByName(packName);

  // fingerprints
  const fp = new Set();
  for(const id of state.cards.order){
    const c = state.cards.byId[id];
    if(!c) continue;
    fp.add(fingerprintCard(c.a,c.b,c.hint));
  }

  let added = 0;
  for(const x of data.cards){
    const a = String(x?.a ?? "").trim();
    const b = String(x?.b ?? "").trim();
    const hint = String(x?.hint ?? "").trim();
    if(!a || !b || !hint) continue;
    const f = fingerprintCard(a,b,hint);
    if(fp.has(f)) continue;
    const card = addCard(state, {a,b,hint});
    fp.add(f);
    pack.cardIds.push(card.id);
    added++;
  }

  if(added === 0){
    return { ok:true, added:0 };
  }
  return { ok:true, added };
}
function handleQrImport(encoded){
  let raw = "";
  try{
    const b64 = decodeURIComponent(encoded);
    raw = b64DecodeUtf8(b64);
  }catch(_e){
    toast("تعذّر قراءة رابط المشاركة.");
    location.hash = "#/home";
    return;
  }
  let data=null;
  try{ data = JSON.parse(raw); }catch(_e){
    toast("تعذّر قراءة بيانات المشاركة.");
    location.hash = "#/home";
    return;
  }

  const infoTitle = String(data?.title || "مشاركة");
  const count = Array.isArray(data?.cards) ? data.cards.length : 0;

  modal("استيراد مشاركة", h("div",{},
    h("div",{class:"subtle", style:"white-space:pre-wrap; line-height:1.9;"},
`سيتم إضافة ${count} بطاقة إلى مكتبتك.
العنوان: ${infoTitle}`)
  ), [
    {label:"إضافة", kind:"primary", sfx:"tap_primary", onClick:(close)=>{
      const res = importSharedDeckPayload(data);
      close();
      if(!res.ok){
        toast(res.msg || "فشل الاستيراد.");
        location.hash = "#/home";
        return;
      }
      saveState(state);
      toast(res.added ? `تمت إضافة ${res.added} بطاقة.` : "لا توجد بطاقات جديدة.");
      location.hash = "#/library";
    }},
    {label:"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=>{ close(); location.hash = "#/home"; }},
  ]);
}
