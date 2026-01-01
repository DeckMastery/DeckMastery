
export const LS_KEY = "deckmastery_v1";

export const RANKS = [
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

export const TARGETS = {
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

export const LEVEL_MULT = [0.80, 1.00, 1.10, 1.25, 1.40, 1.60, 1.85, 2.20, 2.35];
export const SHOW_LEVELS = new Set([1,3,6,7,8]);

export function uuid(){
  try{
    if(typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  }catch{}
  return "id_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
}

export function todayISO(){
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}
export function formatDateDMY(iso){
  const [y,m,d] = iso.split("-");
  return `${d}.${m}.${String(y).slice(-2)}`;
}
export function daysBetween(aIso,bIso){
  const a = new Date(aIso+"T00:00:00");
  const b = new Date(bIso+"T00:00:00");
  return Math.round((b-a)/(1000*60*60*24));
}

export function defaultState(){
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
      cardBacks: {
        owned: ["cb_star_001"],
        selected: "cb_star_001",
        items: [
          // Add more card backs later (shop/profile will pick them up automatically)
          { id:"cb_star_001", name:"Card Back: Star Map", src:"assets/cardbacks/cb_star_001.jpeg", rarity:"default", unlocked:true, price:0 },
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

export function loadState(){
  const raw = localStorage.getItem(LS_KEY);
  if(!raw) return null;
  try{ return JSON.parse(raw); }catch{ return null; }
}
export function saveState(state){
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

export function migrate(state){
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
  merged.library.cardBacks = merged.library.cardBacks || d.library.cardBacks;
  merged.library.cardBacks.items = d.library.cardBacks.items;
  merged.library.cardBacks.owned = merged.library.cardBacks.owned || [];
  if(!merged.library.cardBacks.owned.includes("cb_star_001")){
    merged.library.cardBacks.owned = Array.from(new Set([...(merged.library.cardBacks.owned||[]), "cb_star_001"]));
  }
  if(!merged.library.cardBacks.selected) merged.library.cardBacks.selected = "cb_star_001";
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

export function ensureProfile(state, {username, gender}){
  const iso = todayISO();
  state.profile = {
    username,
    gender,
    bio: "",
    stars: 0,
    createdAt: iso,
    lastBioEditSeason: null,
    betaNoticeShown: false,
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

  // default card back
  try{
    state.library.cardBacks.owned = ["cb_star_001"];
    state.library.cardBacks.selected = "cb_star_001";
  }catch(_){ }

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

export function computeLevelFromXp(xp){
  // simple curve
  const lvl = Math.floor(Math.sqrt(xp/100)) + 1;
  const prev = (lvl-1)*(lvl-1)*100;
  const next = (lvl)*(lvl)*100;
  const pct = Math.max(0, Math.min(1, (xp-prev)/(next-prev)));
  return { level:lvl, pct };
}

export function difficultyD(rankKey, subLevel){
  const idx = RANKS.findIndex(r=>r.key===rankKey);
  const n = Math.max(0, idx);
  return 1 + (0.12*n) + (0.04*(Math.max(1,subLevel)-1));
}

export function rankLabel(rankKey, subLevel){
  const r = RANKS.find(x=>x.key===rankKey);
  if(!r) return "خشبي 1";
  return `${r.name} ${subLevel}`;
}

export function getTarget(rankKey, subLevel){
  if(rankKey==="inspirer"){
    return TARGETS.inspirer(subLevel);
  }
  const arr = TARGETS[rankKey] || [200];
  return arr[subLevel-1] ?? arr[arr.length-1];
}

export function addNotification(state, n){
  const id = uuid();
  state.notifications.items.unshift({
    id,
    iso: todayISO(),
    readAt: null,
    claimed: false,
    ...n
  });
}

