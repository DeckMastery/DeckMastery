
/* ===== i18n.js ===== */
// DeckMastery i18n (LocalStorage: dm_lang = 'ar'|'en')
function getLang(){
  return localStorage.getItem("dm_lang") || "ar";
}
function setLang(lang){
  localStorage.setItem("dm_lang", (lang === "en") ? "en" : "ar");
}
function applyLang(){
  const lang = getLang();
  const root = document.documentElement;
  root.lang = (lang === "en") ? "en" : "ar";
  root.dir = (lang === "en") ? "ltr" : "rtl";
  if(document.body) document.body.classList.toggle("lang-en", lang === "en");
}

const MAP = {
  "آخر": "Other",
  "أدخل اسم مستخدم واختر الجنس، ثم ابدأ.": "Enter a username, choose gender, then start.",
  "أستاذ": "Master",
  "أفاتار الآخر": "Other Avatar",
  "أفاتار الأنثى": "Female Avatar",
  "أفاتار الذكر": "Male Avatar",
  "أكمل الدرس حتى «التقييم» لتسجيل الحضور. الخروج قبل التقييم يلغي الجوائز ولا يسجّل حضورًا.": "Finish the lesson up to “Rating” to record attendance. Leaving before rating cancels rewards and does not count attendance.",
  "ألماسي": "Diamond",
  "أنثى": "Female",
  "إجراءات": "Actions",
  "إجراءات (0)": "Actions (0)",
  "إزالة من الرزمة": "Remove from pack",
  "إضافة": "Add",
  "إضافة إلى رزمة": "Add to pack",
  "إضافة بطاقة": "Add card",
  "إضافة بطاقة أخرى": "Add another card",
  "الأصدقاء": "Friends",
  "الأفاتارات": "Avatars",
  "الإطار الخشبي الدائري": "Wooden round frame",
  "الإطارات": "Frames",
  "الإعدادات": "Settings",
  "الاسم": "Name",
  "الاسم المستعار": "Username",
  "الالتزام": "Streak",
  "البدء": "Start",
  "التجاهل": "Ignored",
  "التحديد": "Select",
  "التخصيص": "Customize",
  "الترجمة أو التوضيح": "Translation / explanation",
  "التصنيف": "Leaderboard",
  "التعليمات": "Help",
  "التقييم": "Rating",
  "التلميح": "Hint",
  "التنبيهات": "Notifications",
  "التوصيل": "Matching",
  "الجنس": "Gender",
  "الجوائز": "Rewards",
  "الحد الأدنى 4.": "Minimum is 4.",
  "الحساب": "Account",
  "الخلفيات": "Backgrounds",
  "الدرس اليومي": "Daily lesson",
  "الدعم": "Support",
  "الدقة": "Accuracy",
  "الذهب": "Gold",
  "الرئيسية": "Home",
  "الصوت": "Audio",
  "العودة بعد الغياب": "Return after absence",
  "الكتابة": "Typing",
  "اللعب": "Play",
  "اللعبة التالية": "Next game",
  "المتجر": "Shop",
  "المجموعات اليومية": "Daily groups",
  "المشاركة": "Share",
  "المعنى": "Meaning",
  "المكتملة": "Completed",
  "الملف الشخصي": "Profile",
  "المهمات": "Quests",
  "النبذة": "Bio",
  "النجوم": "Stars",
  "النسخ الاحتياطي": "Backup",
  "النص": "Text",
  "النص الأصلي": "Original text",
  "اليوم الثاني": "Day 2",
  "انتبه! بعد الحذف لن تتمكن من استعادة بياناتك.": "Warning! After deletion, you can’t restore your data.",
  "بحث": "Search",
  "بحث بالتاريخ": "Search by date",
  "بدء": "Start",
  "بداية موسم جديد": "New season",
  "بطاقة إضافية": "Extra card",
  "بلاتيني": "Platinum",
  "تأكيد": "Confirm",
  "تأكيد التخطي؟": "Confirm skip?",
  "تأكيد نهائي": "Final confirmation",
  "تجاهل": "Ignore",
  "تحديد": "Select",
  "تحديد الكل": "Select all",
  "إلغاء التحديد": "Unselect",
  "تحذير": "Warning",
  "تحكم بالصوت. استخدم «تصدير بياناتي» و«استيراد بياناتي» للحفظ الاحتياطي.": "Control audio. Use “Export my data” and “Import my data” for backups.",
  "تخطي": "Skip",
  "تخطي لعبة": "Skip game",
  "تدريب": "Training",
  "تدريب سريع بدون تقييم. لا يسجّل حضورًا ولا يغيّر مستويات البطاقات.": "Quick training without rating. It does not record attendance and does not change card levels.",
  "تراجع": "Undo",
  "ترتيب الأحرف": "Anagram",
  "ترقية مستوى": "Level up",
  "تسجيل الخروج": "Log out",
  "تصدير بياناتي": "Export my data",
  "تصنيف محلي على هذا الجهاز. الموسم يُعاد ضبطه كل 100 يوم وفق خوارزمية التصفير.": "Local leaderboard on this device. The season resets every 100 days using the reset algorithm.",
  "تعديل": "Edit",
  "تعذّر قراءة الملف.": "Could not read the file.",
  "تعذّر قراءة بيانات المشاركة.": "Could not read share data.",
  "تعذّر قراءة رابط المشاركة.": "Could not read share link.",
  "تفاصيل": "Details",
  "تم": "Done",
  "تم استخدام مساعدة.": "A help item was used.",
  "تم بلوغ الحد اليومي.": "Daily limit reached.",
  "تم بلوغ الحد.": "Limit reached.",
  "تم تسجيل الحضور": "Attendance recorded",
  "تم تصفير الموسم.": "Season reset.",
  "تم تنزيل ملف المشاركة": "Share file downloaded",
  "تم تنزيل ملف المشاركة على جهازك.": "The share file was downloaded to your device.",
  "تم.": "Done.",
  "تنبيه": "Notice",
  "تنبيه مساحة التخزين": "Storage reminder",
  "تنزيل الآن": "Download now",
  "توصيل": "Connect",
  "تُعلَّم التنبيهات كمقروءة عند فتح الصفحة. استلام الجوائز يتطلب النقر عليها.": "Notifications are marked as read when you open this page. Claiming rewards requires tapping them.",
  "جديد": "New",
  "جميع البطاقات": "All cards",
  "حديدي": "Iron",
  "حدّد بطاقات أولاً.": "Select cards first.",
  "حذف": "Delete",
  "حذف البيانات والخروج؟": "Delete data and exit?",
  "حذف الحساب": "Delete account",
  "حذف نهائي": "Permanent delete",
  "حذف وخروج": "Delete & exit",
  "حسنًا": "OK",
  "حفظ": "Save",
  "حقول ناقصة.": "Missing fields.",
  "حكيم": "Sage",
  "خشبي": "Wood",
  "خشبي 1": "Wood 1",
  "خطأ": "Wrong",
  "خلفية الآخر": "Other background",
  "خلفية الأنثى": "Female background",
  "خلفية الذكر": "Male background",
  "ذكر": "Male",
  "ذهبي": "Gold",
  "رجوع": "Back",
  "رزم البطاقات": "Card packs",
  "رصيد غير كافٍ.": "Insufficient balance.",
  "زمردي": "Emerald",
  "سجل المساعدات": "Help log",
  "سلم التصنيفات": "Rank ladder",
  "سهل": "Easy",
  "سيتم إضافة المهمات قريبًا.": "Quests will be added soon.",
  "سيتم إنشاء طريق الإتقان قريبًا.": "Mastery Path will be created soon.",
  "سيتم توفير هذه الميزة قريبًا.": "This feature will be available soon.",
  "شارك هذا الملف مع الشخص الآخر (عبر واتساب أو تلغرام أو البريد الإلكتروني).": "Share this file with the other person (WhatsApp, Telegram, or email).",
  "شراء": "Buy",
  "صعب": "Hard",
  "طريق الإتقان": "Mastery Path",
  "عودة": "Return",
  "غيّر الأفاتار/الخلفية/الإطار من قسم التخصيص. العناصر المملوكة تظهر ويمكن تفعيلها بزر «استخدام».": "Change your avatar/background/frame from Customize. Owned items appear and can be applied with “Use”.",
  "فتح": "Open",
  "فضي": "Silver",
  "قلب البطاقات": "Flip cards",
  "قفل": "Locked",
  "كلمة السر": "Password",
  "لا توجد تعليمات لهذه الصفحة.": "No help is available for this page.",
  "لا يوجد بطاقات كافية.": "Not enough cards.",
  "لا يمكن إضافة بطاقة خارج مجموعة يومية.": "You can’t add a card outside a daily group.",
  "لا يمكن ترك الحقول فارغة.": "Fields cannot be empty.",
  "لا": "No",
  "لديك نسخة احتياطية قديمة:": "You have an old backup:",
  "لعبة": "Game",
  "مشاركة": "Share",
  "متوسط": "Medium",
  "متابعة": "Continue",
  "متابعة الكل": "Continue all",
  "مرحبًا": "Welcome",
  "مسح": "Clear",
  "مساعدة": "Help",
  "مستوى صوت التفاعلات": "SFX volume",
  "مستوى صوت الموسيقى": "Music volume",
  "ملف غير صالح": "Invalid file",
  "ملف غير صالح.": "Invalid file.",
  "ملهم": "Inspirer",
  "ممتلك": "Owned",
  "موافق": "OK",
  "نحاسي": "Bronze",
  "نسخة احتياطية أسبوعية": "Weekly backup",
  "هذا ليس ملف مشاركة DeckMastery.": "This is not a DeckMastery share file.",
  "هل أنت متأكد؟": "Are you sure?",
  "هل تود الاستمرار؟": "Do you want to continue?",
  "وعلى الطرف الآخر اختيار «استيراد ملف مشاركة» من الإعدادات لاستقبال البطاقات.": "On the other side, choose “Import share file” from Settings to receive the cards.",
  "وقود": "Fuel",
  "يتتبع الالتزام اليومي. يمكن وصل أيام الانقطاع باستخدام الوقود.": "Tracks daily streak. You can reconnect missed days using Fuel.",
  "نصيحة مهمة: قبل أن تضع وقتك في التطبيق، صدِّر بياناتك من «الإعدادات» عبر «تصدير بياناتي»، واحتفظ بملف النسخ الاحتياطي لتستطيع استيراده لاحقًا عند تغيير الجهاز أو حذف بيانات المتصفح.\n\nآلية البطاقات: أي بطاقة تُضيفها اليوم تُحفظ ضمن مجموعة تاريخ اليوم، وتبدأ بالظهور في الألعاب ابتداءً من الغد ثم وفق جدول المستويات المتفق عليه.\n\nلديك اقتراح أو ملاحظة؟ أرسلها إلى بريد الدعم الموجود داخل «الإعدادات».": "Important tip: before you invest your time, export your data from “Settings” using “Export my data”, and keep the backup file so you can import it later if you change devices or clear your browser data.\n\nHow cards work: any card you add today is saved inside today’s daily group, and it starts appearing in games from tomorrow, then continues according to the agreed level schedule.\n\nHave a suggestion or a note? Send it to the support email shown inside “Settings”.",
  "لم يتم تسجيل حضور اليوم.": "Today’s attendance has not been recorded.",
  "استخدام": "Use",
  "استيراد بياناتي": "Import my data",
  "استيراد ملف مشاركة": "Import share file",
  "تصدير ملف مشاركة": "Export share file",
  "تم استيراد البيانات.": "Data imported.",
  "تم تصدير البيانات.": "Data exported.",
  "اللغة": "Language",
  "العربية": "Arabic",
  "إغلاق": "Close",
  "إلغاء": "Cancel",
  "اسم غير صالح.": "Invalid username.",
  "نعم": "Yes",
  "مفكر": "Thinker",
  "بدء اللعب": "Start",
  "عشوائي": "Random",
  "إعادة": "Reset",
  "إطار": "Frame",
  "أيام": "Days",
  "استيراد": "Import",
  "تصدير": "Export",
  "خروج": "Exit",
  "تجربة": "Try",
  "سحب وإفلات ملف JSON هنا أو انقر للاختيار": "Drag & drop a JSON file here, or click to choose.",
  "ملف البيانات ليس JSON صالحاً.": "The data file is not valid JSON.",
  "ممنوع الخروج الآن.": "Exiting is disabled right now.",
  "لا يوجد بطاقات.\nأضف بطاقات من زر «إضافة بطاقة».": "No cards.\nAdd cards using “Add card”.",
  "الإنجازات": "Achievements",
  "الموسم": "Season",
  "باقي": "Remaining",
  "إستمرار": "Continue",
  "استخدام 1 وقود لتوصيل الحماسة؟": "Use 1 Fuel to reconnect the streak?",
  "أفهمت": "Got it",
  "إغلاق الصفحة": "Close page",
  "إضافة رزمة": "Add pack",
  "إنهاء التدريب": "End training",
  "إنهاء الجلسة": "End session",
  "إنهاء وحفظ": "Finish & save",
  "إلغاء وخروج": "Cancel & exit",
  "اختر 4 بطاقات على الأقل": "Select at least 4 cards",
  "اختر بطاقة واحدة على الأقل.": "Select at least one card.",
  "اختيار رزم": "Choose packs",
  "استلام": "Claim",
  "استمرار": "Continue",
  "اسم فارغ.": "Empty name.",
  "اسم مستخدم.": "Username.",
  "الأدوات التشغيلية": "Power-ups",
  "تم رصد أيام غياب.": "Missed days detected.",
  "لا توجد بطاقات كافية للتدريب.": "Not enough cards for training.",
  "لا توجد بطاقات لليوم.": "No cards for today.",
  "لا توجد رزم.": "No packs.",
  "لا توجد عناصر.": "No items.",
  "لا يوجد.": "None.",
  "لاحقًا": "Later",
  "لعب": "Play",
  "محدد": "Selected",
  "مساعدة مستخدمة.": "Help used.",
  "مستخدم": "User",
  "مقروء": "Read",
  "اكتب الكلمة الأجنبية في الحقل الأول، وترجمتها في الثاني، وتلميحًا في الثالث. الحد الأدنى 4 بطاقات والحد الأقصى 8. يمكنك شراء بطاقتين إضافيتين من المتجر.": "Put the foreign word in the first field, its meaning in the second, and a hint in the third. Minimum 4 cards, maximum 8. You can buy 2 extra cards from the shop.",
  "افتح أي رزمة ثم استخدم «تحديد» لتنفيذ الإجراءات على عدة بطاقات. «تدريب» يتطلب 4 بطاقات فأكثر.": "Open any pack, then use “Select” to run actions on multiple cards. “Training” requires at least 4 cards.",
  "اشترِ الأدوات والتخصيص. العناصر المشتراة تختفي من المتجر وتظهر ضمن مكتبة الملف الشخصي.": "Buy power-ups and cosmetics. Purchased items disappear from the shop and appear in your Profile library."
};

const RANK_NAME_MAP = {
  "خشبي":"Wood",
  "حديدي":"Iron",
  "نحاسي":"Bronze",
  "فضي":"Silver",
  "ذهبي":"Gold",
  "زمردي":"Emerald",
  "بلاتيني":"Platinum",
  "ألماسي":"Diamond",
  "أستاذ":"Master",
  "مفكر":"Thinker",
  "حكيم":"Sage",
  "ملهم":"Inspirer"
};
function tr(text){
  if(typeof text !== "string") return text;
  if(getLang() !== "en") return text;

  if(MAP[text]) return MAP[text];

  const m = text.match(/^([\u0600-\u06FF]+)\s(\d+)$/);
  if(m){
    const name = m[1];
    const num = m[2];
    if(RANK_NAME_MAP[name]) return `${RANK_NAME_MAP[name]} ${num}`;
  }

  const m2 = text.match(/^المستوى\s(\d+)$/);
  if(m2) return `Level ${m2[1]}`;

  const m3 = text.match(/^الذهب\s(\d+)$/);
  if(m3) return `Gold ${m3[1]}`;

  const m4 = text.match(/^البطاقة\s(\d+)\sمن\s(\d+)$/);
  if(m4) return `Card ${m4[1]} of ${m4[2]}`;

  const m5 = text.match(/^بقي\s(\d+)\sيومًا\sعلى\sنهاية\sالموسم$/);
  if(m5) return `${m5[1]} days left in the season`;

  return text;
}



/* ===== audio.js ===== */

const SFX = {
  tap_primary: "assets/audio/sfx/tap_primary.wav",
  tap_secondary: "assets/audio/sfx/tap_secondary.wav",
  tap_danger: "assets/audio/sfx/tap_danger.wav",
  // صوت اللمس (Hover/Touch) للأزرار المحددة
  lams: "assets/audio/sfx/Lams.wav",
  // صوت النقر (Click) للأزرار المحددة
  naker: "assets/audio/sfx/Naker.wav",
  // صوت زر (لعب) / بدء التدريب — سيتم إضافة الملف لاحقاً من طرف المطور
  laeb: "assets/audio/sfx/Laeb.wav",
  // صوت التحذير للأزرار الحساسة (حذف/تجاهل/إلغاء)
  tahther: "assets/audio/sfx/Tahther.wav",
  // صوت زر الشراء داخل المتجر
  mal: "assets/audio/sfx/Mal.wav",
  // صوت إضافة بطاقة (إضافة/حفظ)
  edafe: "assets/audio/sfx/Edafe.wav",
  // صوت الاختيار داخل الألعاب (اختيار/إلغاء اختيار)
  ekhtiar: "assets/audio/sfx/Ekhtiar.wav",
    // أصوات التقييم
  sahel: "assets/audio/sfx/Sahel.wav",
  wasat: "assets/audio/sfx/Wasat.wav",
  saab: "assets/audio/sfx/Saab.wav",
  // صوت الإجابة الصحيحة داخل الألعاب
  saheh: "assets/audio/sfx/Saheh.wav",
  // صوت الإجابة الخاطئة داخل الألعاب
  khata: "assets/audio/sfx/Khata.wav",
whoosh: "assets/audio/sfx/whoosh.wav",
  correct: "assets/audio/sfx/correct.wav",
  wrong: "assets/audio/sfx/wrong.wav",
  coin: "assets/audio/sfx/coin.wav",
  popup: "assets/audio/sfx/popup.wav",
  close: "assets/audio/sfx/close.wav",
  shake: "assets/audio/sfx/shake.wav",
  count: "assets/audio/sfx/count.wav",
  levelup: "assets/audio/sfx/levelup.wav",
};

const BGM = {
  main: "assets/audio/bgm/bgm_main.wav",
  competitive: "assets/audio/bgm/bgm_competitive.wav",
  focus: "assets/audio/bgm/bgm_focus.wav",
};

let ctx;
let masterBgm = 0.65;
let masterSfx = 0.85;

let bgmSource = null;
let bgmGain = null;
let currentBgmKey = null;

const buffers = new Map();

async function ensureCtx(){
  if(!ctx){
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if(ctx.state === "suspended"){
    try{ await ctx.resume(); }catch{}
  }
  return ctx;
}

async function loadBuffer(url){
  if(buffers.has(url)) return buffers.get(url);
  const c = await ensureCtx();
  const res = await fetch(url);
  const arr = await res.arrayBuffer();
  const buf = await c.decodeAudioData(arr);
  buffers.set(url, buf);
  return buf;
}
async function preloadAudio(){
  // ملاحظة أداء: تحميل ملفات BGM الكبيرة على الهاتف يسبب بطء شديد.
  // لذلك نقوم بتهيئة مؤثرات SFX فقط، ونجعل موسيقى الخلفية تُحمّل عند الحاجة.
  for(const k of Object.values(SFX)) loadBuffer(k).catch(()=>{});

  // تحميل موسيقى الخلفية لاحقاً في وقت خمول المتصفح (اختياري)
  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const deviceMem = Number(navigator.deviceMemory || 0);
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
  const allowBgmPrefetch = !prefersReduced && !coarse && (!deviceMem || deviceMem >= 4);

  const idle = window.requestIdleCallback;
  if(allowBgmPrefetch && typeof idle === "function"){
    idle(()=>{ for(const k of Object.values(BGM)) loadBuffer(k).catch(()=>{}); }, {timeout: 2500});
  }
}
function setVolumes({music, sfx}){
  masterBgm = Math.max(0, Math.min(1, music));
  masterSfx = Math.max(0, Math.min(1, sfx));
  if(bgmGain) bgmGain.gain.value = masterBgm;
}
async function playSfx(name){
  const url = SFX[name];
  if(!url) return;
  try{
    const c = await ensureCtx();
    const buf = await loadBuffer(url);
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.value = masterSfx;
    src.connect(g).connect(c.destination);
    src.start();
  }catch{
    // تجاهل أخطاء التحميل/الفك (مثل: ملف صوت غير موجود بعد)
  }
}
async function playBgm(key, {fadeMs=450} = {}){
  if(currentBgmKey === key) return;
  const url = BGM[key];
  if(!url) return;
  const c = await ensureCtx();
  const buf = await loadBuffer(url);

  const nextSrc = c.createBufferSource();
  nextSrc.buffer = buf;
  nextSrc.loop = true;

  const nextGain = c.createGain();
  nextGain.gain.value = 0;

  nextSrc.connect(nextGain).connect(c.destination);
  nextSrc.start();

  const now = c.currentTime;
  const fade = Math.max(0.05, fadeMs/1000);

  if(bgmGain && bgmSource){
    bgmGain.gain.cancelScheduledValues(now);
    bgmGain.gain.setValueAtTime(bgmGain.gain.value, now);
    bgmGain.gain.linearRampToValueAtTime(0, now+fade);
    try{ bgmSource.stop(now+fade+0.02); }catch{}
  }

  nextGain.gain.setValueAtTime(0, now);
  nextGain.gain.linearRampToValueAtTime(masterBgm, now+fade);

  bgmSource = nextSrc;
  bgmGain = nextGain;
  currentBgmKey = key;
}
function wireSfx(root=document){
  const isInsideNoLams = (el)=> !!el.closest?.('.no-lams');

  // صوت النقر (كما هو)
  root.querySelectorAll("[data-sfx]").forEach(el=>{
    el.addEventListener("pointerdown", ()=> playSfx(el.dataset.sfx), {passive:true});
  });

  // صوت اللمس/المرور (بدون تفعيل الزر)
  // ملاحظة: يتم تعطيله داخل عناصر الألعاب (.no-lams) لتجنب الضجيج.
  const seen = new WeakMap();
  const canFire = (el)=>{
    const t = performance.now();
    const last = seen.get(el) || 0;
    if(t - last < 140) return false;
    seen.set(el, t);
    return true;
  };

  root.querySelectorAll("[data-sfx]").forEach(el=>{
    // Desktop: hover
    el.addEventListener("pointerenter", (e)=>{
      if(isInsideNoLams(el)) return;
      if(e.pointerType && e.pointerType !== "mouse") return;
      if(!canFire(el)) return;
      playSfx("lams");
    }, {passive:true});

    // Mobile: touch (لمس قبل التفعيل)
    el.addEventListener("touchstart", ()=>{
      if(isInsideNoLams(el)) return;
      if(!canFire(el)) return;
      playSfx("lams");
    }, {passive:true});
  });
}



/* ===== ui.js ===== */
function h(tag, attrs={}, ...children){
  const el = document.createElement(tag);
  for(const [k,v] of Object.entries(attrs||{})){
    if(k==="class") el.className = v;
    else if(k==="html") el.innerHTML = v;
    else if(k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if(v === false || v === null || v === undefined) {}
    else el.setAttribute(k, String(v));
  }
  for(const c of children.flat()){
    if(c === null || c === undefined || c === false) continue;
    if(typeof c === "string") el.appendChild(document.createTextNode(c));
    else el.appendChild(c);
  }
  return el;
}
function clear(el){ el.innerHTML = ""; }
function toast(msg){
  const root = document.body;
  const t = h("div", {class:"toast glass gold"}, h("div", {class:"panel"}, msg));
  root.appendChild(t);
  try{ playSfx("popup"); }catch{}
  requestAnimationFrame(()=>{
    t.style.opacity = "0";
    t.style.transform = "translateX(-50%) translateY(8px)";
    t.style.transition = "opacity .18s ease, transform .18s ease";
    t.style.opacity = "1";
    t.style.transform = "translateX(-50%) translateY(0)";
  });
  setTimeout(()=>{
    t.style.opacity = "0";
    t.style.transform = "translateX(-50%) translateY(8px)";
    setTimeout(()=> t.remove(), 220);
  }, 1600);
}
function modal(title, bodyNode, actions=[]){
  const backdrop = h("div", {class:"modal-backdrop"});
  const box = h("div", {class:"modal glass gold"});
  const panel = h("div", {class:"panel"});
  const head = h("div", {class:"panel-title"}, h("h2",{class:"h1"}, title),
    h("button",{class:"icon-btn", "data-sfx":"close", ariaLabel:"إغلاق", onClick: ()=> close()}, h("i",{ "data-lucide":"x"}))
  );
  const act = h("div",{class:"row"}, ...actions.map(a=>{
    const btn = h("button",{class:`btn ${a.kind||"ghost"}`, "data-sfx": a.sfx||"tap_secondary", onClick: ()=> a.onClick(close)}, a.label);
    return btn;
  }));
  panel.append(head, h("div",{class:"hr"}), bodyNode, actions.length? h("div",{class:"hr"}):null, actions.length? act:null);
  box.appendChild(panel);
  backdrop.appendChild(box);

  function close(){
    backdrop.remove();
  }
  document.getElementById("modalRoot").appendChild(backdrop);
  window.lucide?.createIcons?.();
  return { close };
}
function placeholderPage(text){
  return h("section",{class:"glass gold panel center"}, h("div",{class:"subtle"}, text));
}

// Tooltip صغير مرتبط بعنصر (للرسائل السريعة بدون توست عام)
function tip(anchorEl, msg, ms=1200){
  if(!anchorEl) return;
  const t = h("div", {class:"tooltip glass gold"}, h("div", {class:"panel"}, msg));
  document.body.appendChild(t);
  try{ playSfx("popup"); }catch{}

  // موضع فوق الزر (مع ضمان البقاء داخل الشاشة)
  const r = anchorEl.getBoundingClientRect();
  const cx = r.left + r.width/2;
  // render ثم احسب العرض الحقيقي
  requestAnimationFrame(()=>{
    const tw = t.offsetWidth || 220;
    const th = t.offsetHeight || 44;
    const pad = 10;
    let left = cx - tw/2;
    left = Math.max(pad, Math.min(left, window.innerWidth - tw - pad));
    let top = r.top - th - 10;
    if(top < pad) top = r.bottom + 10;
    t.style.left = `${left}px`;
    t.style.top = `${top}px`;
    t.style.opacity = "0";
    t.style.transform = "translateY(6px)";
    t.style.transition = "opacity .16s ease, transform .16s ease";
    // fade in
    requestAnimationFrame(()=>{
      t.style.opacity = "1";
      t.style.transform = "translateY(0)";
    });
  });

  setTimeout(()=>{
    t.style.opacity = "0";
    t.style.transform = "translateY(6px)";
    setTimeout(()=> t.remove(), 220);
  }, ms);
}



/* ===== state.js ===== */
const LS_KEY = "deckmastery_v1";
const RANKS = [
  { key:"wood", name:"خشبي", levels:3 },
  { key:"iron", name:"حديدي", levels:3 },
  { key:"copper", name:"نحاسي", levels:3 },
  { key:"silver", name:"فضي", levels:3 },
  { key:"gold", name:"ذهبي", levels:3 },
  { key:"emerald", name:"زمردي", levels:3 },
  { key:"platinum", name:"بلاتيني", levels:3 },
  { key:"diamond", name:"ألماسي", levels:4 },
  { key:"master", name:"أستاذ", levels:5 },
  { key:"thinker", name:"مفكر", levels:6 },
  { key:"sage", name:"حكيم", levels:7 },
  { key:"inspirer", name:"ملهم", levels:9999 },
];
const TARGETS = {
  "wood":   [120,135,150],
  "iron":   [165,180,195],
  "copper": [210,225,240],
  "silver": [255,270,285],
  "gold":   [240,255,270],     // kept near spec narrative
  "emerald":[300,315,330],
  "platinum":[360,375,390],
  "diamond":[400,440,480,520],
  "master":[600,660,720,780,840],
  "thinker":[900,990,1080,1170,1260,1350],
  "sage":[1400,1520,1640,1760,1880,2000,2120],
  "inspirer": (n)=> 2200 + (100*(n-1)),
};
const LEVEL_MULT = [0.80, 1.00, 1.10, 1.25, 1.40, 1.60, 1.85, 2.20, 2.35];
const SHOW_LEVELS = new Set([1,3,6,7,8]);
function uuid(){
  try{
    if(typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  }catch{}
  return "id_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
}
function todayISO(){
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}
function formatDateDMY(iso){
  const [y,m,d] = iso.split("-");
  return `${d}.${m}.${String(y).slice(-2)}`;
}
function daysBetween(aIso,bIso){
  const a = new Date(aIso+"T00:00:00");
  const b = new Date(bIso+"T00:00:00");
  return Math.round((b-a)/(1000*60*60*24));
}
function defaultState(){
  const iso = todayISO();
  return {
    version: 1,
    profile: null, // { username, gender, bio, stars, createdAt, lastBioEditSeason }
    economy: {
      gold: 0,
      xp: 0,
      helps: 0,
      skips: 0,
      fuel: 0,
      dailyExtraCardsPurchased: 0,
      dailyGoldEarned: 0,
      lastDailyReset: iso,
    },
    rating: {
      rankKey: "wood",
      subLevel: 1,
      progress: 0,
      accuracySeason: { season: 1, correct: 0, total: 0 },
      history: [], // [{season, rankKey, subLevel, bestRankKey, bestSubLevel, correct,total}]
    },
    season: {
      season: 1,
      startedAt: iso,
      lengthDays: 100
    },
    streak: {
      segments: [
        // { startIso, length, missed: [] }  // visual model
      ],
      current: 0,
      lastAttendanceIso: null,
    },
    library: {
      frames: {
        owned: ["frame_wood_round_001"],
        selected: "frame_wood_round_001",
        items: [
          { id:"frame_wood_round_001", name:"الإطار الخشبي الدائري", src:"assets/frames/frame_wood_round_001.jpeg", rarity:"default", unlocked:true },
        ]
      },
      backgrounds: {
        owned: [],
        selected: null,
        items: [
          { id:"bg_female_pink_001", name:"خلفية الأنثى", src:"assets/backgrounds/bg_female_pink_001.jpeg", unlockType:"gender_default", gender:"female", unlocked:true, price:300 },
          { id:"bg_male_blue_001", name:"خلفية الذكر", src:"assets/backgrounds/bg_male_blue_001.jpeg", unlockType:"gender_default", gender:"male", unlocked:true, price:300 },
          { id:"bg_other_marble_001", name:"خلفية الآخر", src:"assets/backgrounds/bg_other_marble_001.jpeg", unlockType:"gender_default", gender:"other", unlocked:true, price:300 },
        ]
      },
      avatars: {
        owned: [],
        selected: null,
        items: [
          { id:"av_female_001", name:"أفاتار الأنثى", src:"assets/avatars/av_female_001.jpeg", unlockType:"gender_default", gender:"female", unlocked:true, price:300 },
          { id:"av_male_001", name:"أفاتار الذكر", src:"assets/avatars/av_male_001.jpeg", unlockType:"gender_default", gender:"male", unlocked:true, price:300 },
          { id:"av_other_001", name:"أفاتار الآخر", src:"assets/avatars/av_other_001.jpeg", unlockType:"gender_default", gender:"other", unlocked:true, price:300 },
        ]
      },
      customPacks: [], // {id,name, cardIds:[]}
    },
    cards: {
      byId: {}, // id -> card
      order: [], // ids
      dailyGroups: {}, // iso -> { iso, titleDMY, cardIds:[] }
      ignored: [],
      completed: [],
    },
    attendance: {
      days: {}, // iso -> { completed: true, startedAt, completedAt }
      missedPending: [], // [{iso}] for return popup
      lessonCache: {}, // iso -> { cardIds:[] } لضمان نفس البطاقات عند إعادة اللعب في نفس اليوم
      lastOpenedIso: iso,
      lastTickIso: iso,
    },
    notifications: {
      items: [], // {id, iso, type, title, body, readAt, claimable, claimed}
    }
  };
}
function loadState(){
  const raw = localStorage.getItem(LS_KEY);
  if(!raw) return null;
  try{ return JSON.parse(raw); }catch{ return null; }
}
function saveState(state){
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}
function migrate(state){
  // Ensure base structure
  if(!state || typeof state !== "object") return defaultState();
  const d = defaultState();

  // shallow merge
  const merged = { ...d, ...state };
  merged.economy = { ...d.economy, ...(state.economy||{}) };
  merged.rating = { ...d.rating, ...(state.rating||{}) };
  merged.season = { ...d.season, ...(state.season||{}) };
  merged.streak = { ...d.streak, ...(state.streak||{}) };
  merged.library = { ...d.library, ...(state.library||{}) };
  merged.cards = { ...d.cards, ...(state.cards||{}) };
  merged.attendance = { ...d.attendance, ...(state.attendance||{}) };
  merged.notifications = { ...d.notifications, ...(state.notifications||{}) };

  // seed assets if missing
  const frameIds = new Set((merged.library.frames.items||[]).map(x=>x.id));
  for(const f of d.library.frames.items){
    if(!frameIds.has(f.id)) merged.library.frames.items.push(f);
  }
  if(!merged.library.frames.owned?.includes("frame_wood_round_001")){
    merged.library.frames.owned = Array.from(new Set([...(merged.library.frames.owned||[]), "frame_wood_round_001"]));
  }
  if(!merged.library.frames.selected) merged.library.frames.selected = "frame_wood_round_001";

  // ensure default cosmetics list
  merged.library.backgrounds.items = d.library.backgrounds.items;
  merged.library.avatars.items = d.library.avatars.items;
  merged.library.customPacks = merged.library.customPacks || [];

  // ensure cards maps
  merged.cards.byId = merged.cards.byId || {};
  merged.cards.order = merged.cards.order || [];
  merged.cards.dailyGroups = merged.cards.dailyGroups || {};
  merged.cards.ignored = merged.cards.ignored || [];
  merged.cards.completed = merged.cards.completed || [];

  // initial gold for existing state missing gold
  if(typeof merged.economy.gold !== "number") merged.economy.gold = 900;

  // daily reset fields
  if(!merged.economy.lastDailyReset) merged.economy.lastDailyReset = todayISO();
  if(typeof merged.economy.dailyGoldEarned !== "number") merged.economy.dailyGoldEarned = 0;
  if(typeof merged.economy.dailyExtraCardsPurchased !== "number") merged.economy.dailyExtraCardsPurchased = 0;

  // attendance fields
  merged.attendance.days = merged.attendance.days || {};
  merged.attendance.missedPending = merged.attendance.missedPending || [];
  merged.attendance.lessonCache = merged.attendance.lessonCache || {};
  if(!merged.attendance.lastOpenedIso) merged.attendance.lastOpenedIso = todayISO();
  if(!merged.attendance.lastTickIso) merged.attendance.lastTickIso = merged.attendance.lastOpenedIso || todayISO();

  return merged;
}
function ensureProfile(state, {username, gender}){
  const iso = todayISO();
  state.profile = {
    username,
    gender,
    bio: "",
    stars: 0,
    createdAt: iso,
    lastBioEditSeason: null,
  };

  // initial economy
  state.economy.gold = 900;
  state.economy.xp = 0;
  state.economy.helps = 0;
  state.economy.skips = 0;
  state.economy.fuel = 0;
  state.economy.dailyExtraCardsPurchased = 0;
  state.economy.dailyGoldEarned = 0;
  state.economy.lastDailyReset = iso;

  // default cosmetics by gender
  const g = gender === "female" ? "female" : gender === "male" ? "male" : "other";
  const bgId = g==="female" ? "bg_female_pink_001" : g==="male" ? "bg_male_blue_001" : "bg_other_marble_001";
  const avId = g==="female" ? "av_female_001" : g==="male" ? "av_male_001" : "av_other_001";

  state.library.backgrounds.owned = [bgId];
  state.library.backgrounds.selected = bgId;
  state.library.avatars.owned = [avId];
  state.library.avatars.selected = avId;

  // season
  state.season.season = 1;
  state.season.startedAt = iso;

  // rating
  state.rating.rankKey = "wood";
  state.rating.subLevel = 1;
  state.rating.progress = 0;
  state.rating.accuracySeason = { season: 1, correct: 0, total: 0 };
  state.rating.history = [];

  // streak
  state.streak.segments = [];
  state.streak.current = 0;
  state.streak.lastAttendanceIso = null;

  // notifications
  state.notifications.items = [];

  // attendance
  state.attendance.days = {};
  state.attendance.missedPending = [];
  state.attendance.lastOpenedIso = iso;
  state.attendance.lastTickIso = iso;
}
function computeLevelFromXp(xp){
  // simple curve
  const lvl = Math.floor(Math.sqrt(xp/100)) + 1;
  const prev = (lvl-1)*(lvl-1)*100;
  const next = (lvl)*(lvl)*100;
  const pct = Math.max(0, Math.min(1, (xp-prev)/(next-prev)));
  return { level:lvl, pct };
}
function difficultyD(rankKey, subLevel){
  const idx = RANKS.findIndex(r=>r.key===rankKey);
  const n = Math.max(0, idx);
  return 1 + (0.12*n) + (0.04*(Math.max(1,subLevel)-1));
}
function rankLabel(rankKey, subLevel){
  const r = RANKS.find(x=>x.key===rankKey);
  if(!r) return "خشبي 1";
  return `${r.name} ${subLevel}`;
}
function getTarget(rankKey, subLevel){
  if(rankKey==="inspirer"){
    return TARGETS.inspirer(subLevel);
  }
  const arr = TARGETS[rankKey] || [200];
  return arr[subLevel-1] ?? arr[arr.length-1];
}
function addNotification(state, n){
  const id = uuid();
  state.notifications.items.unshift({
    id,
    iso: todayISO(),
    readAt: null,
    claimed: false,
    ...n
  });
}




/* ===== logic.js ===== */
// تطور مستويات البطاقات محلياً:
// - مستوى البطاقة يتغير فقط بناءً على (مرور الأيام) و(تقييم لعبة التقييم).
// - جدول الأيام منذ الإضافة (progressDays) → مستوى:
//   0→0, 1→1, 2→2, 3→3, 4→4, 5→5, 6→6, 14→7, 30→8
//   (أي: الأيام 7-13 تبقى على مستوى 6، والأيام 14-29 تبقى على مستوى 7، وبعد 30 تبقى 8)
// - تأثير الغياب:
//   إذا كان مستوى البطاقة من مستويات الظهور (1/3/6/7/8) وسُجل غياب: تتجمد ولا تتقدم
//   حتى يحدد المستخدم الإجراء عند العودة.
function levelFromProgressDays(pd){
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
function applyDailyCardProgress(state){
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
function dailyResetIfNeeded(state){
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
function seasonCheckAndReset(state){
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
function newDailyGroup(state){
  const iso = todayISO();
  if(state.cards.dailyGroups[iso]) return state.cards.dailyGroups[iso];
  const g = { iso, titleDMY: formatDateDMY(iso), cardIds: [] };
  state.cards.dailyGroups[iso] = g;
  return g;
}
function canAddMoreCardsToday(state){
  const baseMax = 8;
  const extra = state.economy.dailyExtraCardsPurchased;
  const max = baseMax + extra;
  const g = state.cards.dailyGroups[todayISO()];
  const count = g?.cardIds?.length || 0;
  return { max, count, can: count < max };
}
function addCard(state, {a,b,hint}){
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
function dueCardsForToday(state){
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
function evolveByAbsence(state){
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
function applyReturnChoice(state, choice){
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
function speedFactor(sec){
  if(sec <= 5) return 1.30;
  if(sec <= 7) return 1.15;
  if(sec <= 10) return 1.00;
  if(sec <= 15) return 0.80;
  return 0.60;
}
function errorFactor(errors){
  if(errors < 6) return 1.0;
  if(errors <= 9) return 1.3;
  return 1.7;
}
function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }
function computeRewardsForGame({gameKey, pairsOrCards, successCount, wrongCount, avgSec, usedHelp, levelAvg, rankKey, subLevel, priceExtraCard}){
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
function applyRatingDelta(state, delta){
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
function recordAttendance(state){
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
function reconnectStreak(state, fromMissedIndex){
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
function computeAvatarLayers(state){
  const frame = state.library.frames.items.find(x=>x.id===state.library.frames.selected);
  const bg = state.library.backgrounds.items.find(x=>x.id===state.library.backgrounds.selected);
  const av = state.library.avatars.items.find(x=>x.id===state.library.avatars.selected);
  return { frame, bg, av };
}




/* ===== app.js ===== */
const app = document.getElementById("app");
const bgEl = document.getElementById("bg");

let state = migrate(loadState() || null);
saveState(state);

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
  }
}

wireGlobalActions();

function wireGlobalActions(){
  document.getElementById("btnProfile").addEventListener("click", ()=> nav("#/profile"));
  document.getElementById("btnSettings").addEventListener("click", ()=> nav("#/settings"));
  document.getElementById("btnNotifications").addEventListener("click", ()=> nav("#/notifications"));
  document.getElementById("btnStreak").addEventListener("click", ()=> nav("#/streak"));
  document.getElementById("btnHelp").addEventListener("click", ()=> openHelp());
  // تفعيل أصوات اللمس/النقر لشريط الأعلى مرة واحدة
  wireSfx(document.querySelector("header.topbar"));
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
      maxNote.textContent = tr("تم بلوغ الحد اليومي.");
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

  // header widgets: help/skip/settings
  const helpBtn = h("button",{class:"icon-btn", "data-sfx":"tap_secondary", onClick: ()=> onHelp()}, h("i",{"data-lucide":"sparkles"}));
  const skipBtn = h("button",{class:"icon-btn", "data-sfx":"tap_secondary", onClick: ()=> onSkip()}, h("i",{"data-lucide":"forward"}));
  const logBtn = h("button",{class:"icon-btn", "data-sfx":"tap_secondary", onClick: ()=> showHelpLog()}, h("i",{"data-lucide":"scroll-text"}));
  const setBtn = h("button",{class:"icon-btn", "data-sfx":"naker", onClick: ()=> openSettingsOverlay()}, h("i",{"data-lucide":"sliders-horizontal"}));
  header.appendChild(h("div",{class:"top-right"}, helpBtn, logBtn, skipBtn, setBtn));

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
    const music = Number(localStorage.getItem("dm_music") ?? "0.65");
    const sfx = Number(localStorage.getItem("dm_sfx") ?? "0.85");

    const m = h("input",{type:"range", min:"0", max:"1", step:"0.01", value:String(music)});
    const s = h("input",{type:"range", min:"0", max:"1", step:"0.01", value:String(sfx)});

    const body = h("div",{},
      h("div",{class:"glass gold card"},
        h("div",{class:"subtle"}, "الصوت"),
        h("div",{class:"field"}, h("label",{}, "مستوى صوت الموسيقى"), m),
        h("div",{class:"field"}, h("label",{}, "مستوى صوت التفاعلات"), s),
      ),      h("div",{class:"hr"}),
      h("div",{class:"glass gold card"},
        h("div",{class:"subtle"}, "اللغة"),
        h("select",{class:"input", on:{change:(e)=>{ setLang(e.target.value); applyLang(); location.reload(); }}},
          h("option",{value:"ar", selected: getLang()!=="en"}, "العربية"),
          h("option",{value:"en", selected: getLang()==="en"}, "English")
        )
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

    setRemain(0, cards.length);

    const wrap = h("div",{class:"row"});
    const colA = h("div",{class:"card-list"});
    const colB = h("div",{class:"card-list"});
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
        setRemain(correct, cards.length);
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

    setRemain(0, cs.length);

    setRemain(0, cs.length);

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
          setRemain(correct, cs.length);
          setRemain(correct, cs.length);
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
      const buttons = h("div",{class:"row", style:"flex-wrap:wrap; gap:8px; margin-top:10px;"});
      const undoBtn = h("button",{class:"btn match-choice", "data-sfx":"ekhtiar", style:"margin-top:12px;", disabled:true, onClick: ()=> {
        if(!stack.length) return;
        const last = stack.pop();
        out.pop();
        last.disabled = false;
        line.textContent = out.join("");
        undoBtn.disabled = stack.length === 0;
      }}, "تراجع");

      letters.forEach((ch)=>{
        const b = h("button",{class:"btn match-choice", "data-sfx":"ekhtiar", onClick: ()=> { out.push(ch); stack.push(b); line.textContent = out.join(""); b.disabled = true; undoBtn.disabled = stack.length === 0; }}, ch);
        buttons.appendChild(b);
      });
      const okBtn = h("button",{class:"btn primary", "data-sfx":"tap_primary", style:"margin-top:12px;", onClick: ()=> check(c, out.join(""))}, "موافق");
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
      setRemain(idx, pool.length);
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
        h("div",{class:"subtle"}, `(${Math.max(0, pool.length-idx)}/${pool.length})`),
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
      setRemain(idx, cards.length);
      if(idx >= cards.length){
        finalizeLesson();
        return;
      }
      const c = (current = cards[idx]);
      clear(wrap);
      wrap.append(
        h("div",{class:"subtle"}, `(${Math.max(0, cards.length-idx)}/${cards.length})`),
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

  // header widgets: help/skip/settings
  const helpBtn = h("button",{class:"icon-btn", "data-sfx":"tap_secondary", onClick: ()=> onHelp()}, h("i",{"data-lucide":"sparkles"}));
  const skipBtn = h("button",{class:"icon-btn", "data-sfx":"tap_secondary", onClick: ()=> onSkip()}, h("i",{"data-lucide":"forward"}));
  const logBtn = h("button",{class:"icon-btn", "data-sfx":"tap_secondary", onClick: ()=> showHelpLog()}, h("i",{"data-lucide":"scroll-text"}));
  const setBtn = h("button",{class:"icon-btn", "data-sfx":"naker", onClick: ()=> openSettingsOverlay()}, h("i",{"data-lucide":"sliders-horizontal"}));
  header.appendChild(h("div",{class:"top-right"}, helpBtn, logBtn, skipBtn, setBtn));

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

    setRemain(0, cs.length);

    const wrap = h("div",{class:"row"});
    const colA = h("div",{class:"card-list"});
    const colB = h("div",{class:"card-list"});
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
      const buttons = h("div",{class:"row", style:"flex-wrap:wrap; gap:8px; margin-top:10px;"});
      const undoBtn = h("button",{class:"btn match-choice", "data-sfx":"ekhtiar", style:"margin-top:12px;", disabled:true, onClick: ()=> {
        if(!stack.length) return;
        const last = stack.pop();
        out.pop();
        last.disabled = false;
        line.textContent = out.join("");
        undoBtn.disabled = stack.length === 0;
      }}, "تراجع");

      letters.forEach((ch)=>{
        const b = h("button",{class:"btn match-choice", "data-sfx":"ekhtiar", onClick: ()=> { out.push(ch); stack.push(b); line.textContent = out.join(""); b.disabled = true; undoBtn.disabled = stack.length === 0; }}, ch);
        buttons.appendChild(b);
      });
      const okBtn = h("button",{class:"btn primary", "data-sfx":"tap_primary", style:"margin-top:12px;", onClick: ()=> check(c, out.join(""))}, "موافق");
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

    const card = h("div",{class:"glass gold card"});
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
      const input = h("input",{maxlength:"45"});
      const okBtn = h("button",{class:"btn primary", "data-sfx":"tap_primary", style:"margin-top:12px;", onClick: ()=> check(c, input.value)}, "موافق");
      clear(card);
      card.append(
        h("div",{class:"subtle"}, `(${Math.max(0, pool.length-idx)}/${pool.length})`),
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
      const openBtn = h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> openPack(p.key, p.name)}, "فتح");
      list.appendChild(h("div",{class:"glass gold card card-mini"},
        h("div",{class:"t"}, h("div",{class:"a"}, p.name), h("div",{class:"b"}, "")),
        h("div",{class:"row", style:"gap:10px; flex-wrap:wrap; justify-content:flex-end;"},
          openBtn
        )
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
    const groups = Object.values(state.cards.dailyGroups).sort((a,b)=> b.iso.localeCompare(a.iso));
    const s = h("input",{placeholder:"بحث بالتاريخ"});
    const l = h("div",{class:"card-list"});
    function rebuildG(){
      clear(l);
      const q = s.value.trim();
      for(const g of groups){
        if(q && !g.titleDMY.includes(q)) continue;
        const openBtn = h("button",{class:"btn", "data-sfx":"tap_secondary", onClick: ()=> openCardsList(g.titleDMY, g.cardIds, { packKey:"dailyGroup", groupIso:g.iso })}, "فتح");
        l.appendChild(h("div",{class:"glass gold card card-mini"},
          h("div",{class:"t"}, h("div",{class:"a"}, g.titleDMY), h("div",{class:"b"}, `${g.cardIds.length} بطاقة`)),
          h("div",{class:"row", style:"gap:10px; flex-wrap:wrap; justify-content:flex-end;"},
            openBtn
          )
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
    const selectAllBtn = h("button",{class:"btn", "data-sfx":"naker", style:"display:none;"}, "تحديد الكل");
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
    const top = h("div",{class:"panel-title"}, h("h2",{class:"h1"}, title), h("div",{class:"row", style:"flex-wrap:wrap;"}, selectBtn, selectAllBtn, actionsBtn, backBtn));
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
        actionsBtn.textContent = (getLang()==="en") ? `Actions (${selected.size})` : `إجراءات (${selected.size})`;
      }
    }

    function toggle(id){
      if(selected.has(id)) selected.delete(id);
      else selected.add(id);
      actionsBtn.textContent = (getLang()==="en") ? `Actions (${selected.size})` : `إجراءات (${selected.size})`;
      rebuildC();
    }

    q.addEventListener("input", rebuildC, {passive:true});
    selectBtn.addEventListener("click", ()=>{
      selecting = !selecting;
      selected.clear();
      selectBtn.textContent = selecting ? "إلغاء التحديد" : "تحديد";
      actionsBtn.style.display = selecting ? "inline-flex" : "none";
      selectAllBtn.style.display = selecting ? "inline-flex" : "none";
      actionsBtn.textContent = tr("إجراءات (0)");
      rebuildC();
    });

    selectAllBtn.addEventListener("click", ()=>{
      if(!selecting) return;
      const query = q.value.trim();
      const cards = ids.map(id=>state.cards.byId[id]).filter(Boolean);
      for(const c of cards){
        if(query){
          const hit = (c.a + c.b + c.hint).includes(query);
          if(!hit) continue;
        }
        selected.add(c.id);
      }
      actionsBtn.textContent = (getLang()==="en") ? `Actions (${selected.size})` : `إجراءات (${selected.size})`;
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
            h("button",{class:"btn danger", "data-sfx":"tap_danger", onClick: ()=> bulkDeleteForever()}, "حذف نهائي"),
            h("button",{class:"btn", "data-sfx":"tap_secondary", onClick: ()=> bulkReset()}, "إعادة"),
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
  const goldKbd = h("div",{class:"kbd"}, `الذهب ${state.economy.gold}`);
  const panel = h("section",{class:"glass gold panel"},
    h("div",{class:"panel-title"}, h("h2",{class:"h1"}, "المتجر"),
      goldKbd
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
    const frItems = state.library.frames.items;

    const bgOwned = new Set(state.library.backgrounds.owned);
    const avOwned = new Set(state.library.avatars.owned);
    const frOwned = new Set(state.library.frames.owned);

    // إظهار العناصر غير المملوكة فقط.
    // قاعدة المتجر الأساسية: العناصر الافتراضية حسب جنس المستخدم لا تُعرض للبيع له.
    const showBg = bgItems.filter(x=> x.gender !== gender && !bgOwned.has(x.id));
    const showAv = avItems.filter(x=> x.gender !== gender && !avOwned.has(x.id));
    const showFr = frItems.filter(x=> !frOwned.has(x.id) && Number(x.price||0) > 0);

    for(const it of showFr){
      cosmetics.appendChild(cosmeticRow(it, "frames"));
    }

    for(const it of showAv){
      cosmetics.appendChild(cosmeticRow(it, "avatars"));
    }
    for(const it of showBg){
      cosmetics.appendChild(cosmeticRow(it, "backgrounds"));
    }
  }

  function cosmeticRow(it, kind){
    const priceEl = h("div",{class:"b"}, `${it.price} ذهب`);
    const btn = h("button",{class:"btn primary", "data-sfx":"mal"}, "شراء");
    const img = h("img",{src: it.src, alt: it.name, loading:"lazy"});
    const thumbClass = kind==="frames" ? "thumb is-frame" : (kind==="avatars" ? "thumb is-avatar" : "thumb is-bg");
    const thumb = h("div",{class:thumbClass}, img);
    const meta = h("div",{class:"meta"},
      thumb,
      h("div",{class:"t"},
        h("div",{class:"a"}, it.name),
        priceEl
      )
    );
    const row = h("div",{class:"glass gold card card-mini"},
      meta,
      btn
    );
    btn.addEventListener("click", ()=> confirmBuyCosmetic(row, btn, priceEl, kind, it));
    return row;
  }

  function confirmBuyCosmetic(row, btn, priceEl, kind, it){
    const body = h("div",{}, h("div",{class:"subtle"}, `شراء ${it.name} مقابل ${it.price} ذهب؟`));
    modal("تأكيد", body, [
      { label:"إلغاء", kind:"ghost", sfx:"tap_secondary", onClick:(close)=> close() },
      { label:"شراء", kind:"primary", sfx:"mal", onClick:(close)=> {
        if(state.economy.gold < it.price){ toast("رصيد غير كافٍ."); return; }
        buyCosmetic(kind, it);
        saveState(state);
        syncTopbar();
        goldKbd.textContent = `الذهب ${state.economy.gold}`;
        close();
        playSfx("coin");
        toast("تم.");

        // بعد ثانيتين: تختفي من المتجر وتبقى في المكتبة داخل الملف الشخصي.
        btn.disabled = true;
        btn.classList.remove("primary");
        btn.textContent = tr("ممتلك");
        priceEl.textContent = tr("ممتلك");
        setTimeout(()=>{
          row.style.transition = "opacity .22s ease, transform .22s ease";
          row.style.opacity = "0";
          row.style.transform = "translateY(-6px)";
          setTimeout(()=> row.remove(), 240);
        }, 2000);
      }},
    ]);
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
      h("div",{class:"subtle"}, "اللغة"),
      h("div",{class:"row"},
        h("select",{class:"input", on:{change:(e)=>{ setLang(e.target.value); applyLang(); location.reload(); }}},
          h("option",{value:"ar", selected: getLang()!=="en"}, "العربية"),
          h("option",{value:"en", selected: getLang()==="en"}, "English")
        )
      )
    ),
    h("div",{class:"hr"}),
    h("div",{class:"glass gold card"},
      h("div",{class:"subtle"}, "الحساب"),
      h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> modal("تسجيل الخروج", h("div",{class:"subtle"}, "سيتم توفير هذه الميزة قريبًا."), [])}, "تسجيل الخروج"),
      h("button",{class:"btn danger", style:"margin-top:10px;", "data-sfx":"naker", onClick: ()=> deleteFlow()}, "حذف الحساب")
    ),
    h("div",{class:"hr"}),
    h("div",{class:"glass gold card"},
      h("div",{class:"subtle"}, "النسخ الاحتياطي"),
      h("div",{class:"row"},
        h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> exportBackup()}, "تصدير بياناتي"),
        h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> importBackup()}, "استيراد بياناتي")
      )
    ),
    h("div",{class:"hr"}),
    h("div",{class:"glass gold card"},
      h("div",{class:"subtle"}, "المشاركة"),
      h("button",{class:"btn", "data-sfx":"naker", onClick: ()=> importSharedDeckFile()}, "استيراد ملف مشاركة")
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
        if(data && typeof data === "object" && data.storage && typeof data.storage === "object"){
          if(data.storage.deckmastery_v1) importedState = data.storage.deckmastery_v1;
          if(typeof data.storage.dm_music === "string") dmMusic = data.storage.dm_music;
          if(typeof data.storage.dm_sfx === "string") dmSfx = data.storage.dm_sfx;
        } else {
          importedState = data;
        }
        if(!importedState || typeof importedState !== "object") throw new Error("bad");
        state = migrate(importedState);
        saveState(state);
        if(dmMusic != null) localStorage.setItem("dm_music", dmMusic);
        if(dmSfx != null) localStorage.setItem("dm_sfx", dmSfx);
        location.reload();
      } catch(e){
        toast("ملف غير صالح");
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
        if(!res.ok){ toast(res.msg || "ملف غير صالح."); return; }
        saveState(state);
        toast(res.msg);
      }catch(e){
        toast("تعذّر قراءة الملف.");
      }
    });
    inp.click();
  }


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

  const backBtn = h("button",{class:"fixed-back-btn btn-active", "data-sfx":"naker", onClick: ()=> {
      const back = sessionStorage.getItem("dm_return_from_settings") || "#/home";
      sessionStorage.removeItem("dm_return_from_settings");
      nav(back);
    }},
    h("i",{class:"fas fa-arrow-right"}),
    isEn ? "Back" : "العودة"
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
  const d = {v:0};
  gsap.to(d, { v: target, duration: 0.9, ease: "power2.out", onUpdate: ()=> {
    el.textContent = String(Math.floor(d.v));
    if(Math.random() < 0.12) playSfx("count");
  }});
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

