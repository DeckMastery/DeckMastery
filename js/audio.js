
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

export async function preloadAudio(){
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

export function setVolumes({music, sfx}){
  masterBgm = Math.max(0, Math.min(1, music));
  masterSfx = Math.max(0, Math.min(1, sfx));
  if(bgmGain) bgmGain.gain.value = masterBgm;
}

export async function playSfx(name){
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

export async function playBgm(key, {fadeMs=450} = {}){
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

export function wireSfx(root=document){
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
