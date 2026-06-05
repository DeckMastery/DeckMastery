// Audio + haptics layer
// SFX: WAV files (HTMLAudioElement) + optional vibration
// BGM: HTMLAudioElement with 2 tracks (main / session)

let volumes = { music: 0.65, sfx: 0.85 };

// --------------------
// Vibration toggle
let vibrateEnabled = true;
try {
  const v = localStorage.getItem("dm_vibrate");
  vibrateEnabled = (v ?? "1") !== "0";
} catch (_) {
  vibrateEnabled = true;
}

export function setVibrationEnabled(enabled) {
  vibrateEnabled = !!enabled;
  try {
    localStorage.setItem("dm_vibrate", vibrateEnabled ? "1" : "0");
  } catch (_) {}
}

export function isVibrationEnabled() {
  return !!vibrateEnabled;
}

function maybeVibrate(ms = 10) {
  if (!vibrateEnabled) return;
  if (!navigator.vibrate) return;
  try {
    navigator.vibrate(ms);
  } catch (_) {}
}
// --------------------
// SFX (WAV)
// User will provide these files later.
// Place them in: assets/audio/sfx/
// Examples:
// - assets/audio/sfx/Naker.wav
// - assets/audio/sfx/Play.wav
// - assets/audio/sfx/Hathef.wav
// ...etc

const SFX_BASE = "./assets/audio/sfx/";

// Map legacy keys (used in data-sfx / old code) to the new WAV filenames.
// If a key isn't listed, it falls back to Naker.wav.
const SFX_MAP = {
  // disable
  "none": "",
  // user-specified
  "play": "Play.wav",
  "laeb": "Play.wav",
  "training": "Play.wav",
  "hathef": "Hathef.wav",
  "schera": "schera.wav",
  "ekmal": "Ekmal.wav",
  "enhaa": "Enhaa.wav",
  "hefth": "Hefth.wav",
  "sahel": "Sahel.wav",
  "wasat": "Wasat.wav",
  "saab": "Saaeb.wav",
  "saaeb": "Saaeb.wav",
  "ekhtiar": "Ekhtear.wav",
  "musaade": "Musaade.wav",
  "takhate": "Takhate.wav",
  "saheh": "Saheh.wav",
  "khata": "Khataa.wav",
  "tagahl": "Tagahl.wav",

  // UI legacy keys => default click
  "naker": "Naker.wav",
  "tap_primary": "Naker.wav",
  "tap_secondary": "Naker.wav",
  "popup": "Naker.wav",
  "close": "Naker.wav",
  "whoosh": "Naker.wav",
  "coin": "Naker.wav",
  "mal": "Naker.wav",
  "edafe": "Naker.wav",
  "levelup": "Naker.wav",
  "count": "Naker.wav",
  "shake": "Naker.wav",
  "tahther": "Naker.wav",
  "tap_danger": "Naker.wav",
};

let _unlocked = false;

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function resolveSfxName(name) {
  if (!name) return "Naker.wav";
  const s = String(name).trim();
  if (!s) return "Naker.wav";
  const low = s.toLowerCase();
  if (low.endsWith(".wav") || low.endsWith(".mp3") || low.endsWith(".ogg")) return s;
  const mapped = SFX_MAP.hasOwnProperty(low) ? SFX_MAP[low] : undefined;
  if (mapped === "") return ""; // explicitly muted
  return mapped || "Naker.wav";
}

export function playSfx(name) {
  // On iOS/Safari, audio play is blocked until a user gesture unlocks it.
  if (!_unlocked) return;
  const vol = clamp01(volumes.sfx ?? 0);
  if (vol <= 0.001) return;

  const file = resolveSfxName(name);
  if (!file) return; // muted
  const src = SFX_BASE + file;

  // Create a fresh element so rapid clicks can overlap.
  try {
    const a = new Audio(src);
    a.preload = "auto";
    a.volume = vol;
    a.playsInline = true;
    a.crossOrigin = "anonymous";
    a.play().catch(() => {});
    maybeVibrate(10);
  } catch (_) {}
}

export function wireSfx(root = document) {
  root?.addEventListener?.(
    "click",
    (e) => {
      const el = e.target?.closest?.("[data-sfx]");
      if (!el) return;
      // Only play if the click handler reported a "successful" action.
      // This flag is set by ui.js (wrapped click handlers).
      if (e?.__dm_sfx_ok !== true) return;
      const sfx = el.getAttribute("data-sfx");
      if (sfx) playSfx(sfx);
    },
    { passive: true }
  );
}

// --------------------
// BGM (2 tracks)
// User will provide these files later.
// Place them in: assets/audio/bgm/
// - assets/audio/bgm/khalfia.mp3
// - assets/audio/bgm/tahadi.mp3

const TRACKS = {
  main: "./assets/audio/bgm/Khalfia.wav",
  session: "./assets/audio/bgm/tahadi.wav",
};

let _bgm = null;
let _bgmKey = null; // "main" | "session"
let _requestedKey = "main";
// (_unlocked is declared above and used for both SFX + BGM)
let _fadeRaf = 0;

// --------------------
// Background handling
// Cordova/Android WebView can keep audio playing when the app is backgrounded.
// We pause BGM on background and restore *position* on return (remain paused).
// This matches native-app behavior and avoids playing in background.

const LS_BGM_TIME = "dm_bgm_time";
const LS_BGM_KEY = "dm_bgm_key"; // "main" | "session"
const LS_BGM_AUTOPAUSED = "dm_bgm_autopaused"; // "1" | "0"

let _autoPaused = false;

function safeGetLS(key) {
  try {
    return localStorage.getItem(key);
  } catch (_) {
    return null;
  }
}

function safeSetLS(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (_) {}
}

function persistBgmSnapshot() {
  if (!_bgm) return;
  // Persist track key and current time so we can restore precisely.
  safeSetLS(LS_BGM_KEY, String(_bgmKey || resolveKey(_requestedKey) || "main"));
  try {
    // currentTime can throw if metadata not loaded; guard it.
    const t = Number(_bgm.currentTime);
    if (Number.isFinite(t) && t >= 0) safeSetLS(LS_BGM_TIME, String(t));
  } catch (_) {}
}

function pauseBgmForBackground() {
  if (!_bgm) return;
  persistBgmSnapshot();
  _autoPaused = true;
  safeSetLS(LS_BGM_AUTOPAUSED, "1");
  try {
    _bgm.pause();
  } catch (_) {}
}

function restoreBgmPositionOnly() {
  // Restore exact position but keep paused.
  const key = safeGetLS(LS_BGM_KEY);
  const tRaw = safeGetLS(LS_BGM_TIME);
  const mode = resolveKey(key || _bgmKey || _requestedKey || "main");
  const src = TRACKS[mode] || TRACKS.main;

  const a = ensureBgm();
  // Ensure correct track is loaded.
  const switching = (_bgmKey !== mode) || (a.src && !a.src.endsWith(src.replace("./", "")));
  if (switching) {
    a.src = src;
    try { a.load(); } catch (_) {}
    _bgmKey = mode;
  }

  const t = Number(tRaw);
  if (Number.isFinite(t) && t >= 0) {
    try {
      a.currentTime = t;
    } catch (_) {
      // If setting currentTime fails before metadata is ready, retry once.
      const onMeta = () => {
        a.removeEventListener("loadedmetadata", onMeta);
        try { a.currentTime = t; } catch (_) {}
      };
      a.addEventListener("loadedmetadata", onMeta);
    }
  }
  try { a.pause(); } catch (_) {}
}

function wireBackgroundAudioHandling() {
  if (wireBackgroundAudioHandling._wired) return;
  wireBackgroundAudioHandling._wired = true;

  // Cordova lifecycle events
  document.addEventListener("pause", pauseBgmForBackground, false);
  document.addEventListener("resume", restoreBgmPositionOnly, false);

  // Web visibility events (also works in many WebViews)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseBgmForBackground();
    else restoreBgmPositionOnly();
  });

  // Last-resort: when navigating away / minimizing in some browsers
  window.addEventListener("pagehide", pauseBgmForBackground);
}

function ensureBgm() {
  if (_bgm) return _bgm;
  const a = document.createElement("audio");
  a.loop = true;
  a.preload = "auto";
  a.playsInline = true;
  a.crossOrigin = "anonymous";
  a.volume = Math.max(0, Math.min(1, volumes.music ?? 0));
  a.style.display = "none";
  document.body.appendChild(a);
  _bgm = a;

  // Ensure we always pause music when app goes to background.
  try { wireBackgroundAudioHandling(); } catch (_) {}
  return a;
}

function applyMusicVolumeNow() {
  if (!_bgm) return;
  const v = clamp01(volumes.music ?? 0);
  _bgm.volume = v;
  if (v <= 0.001) {
    try { _bgm.pause(); } catch (_) {}
  }
}

function fadeVolume(to, ms = 350) {
  const a = ensureBgm();
  const start = a.volume;
  const end = clamp01(to);
  const dur = Math.max(0, Number(ms) || 0);

  if (_fadeRaf) cancelAnimationFrame(_fadeRaf);
  if (dur === 0) {
    a.volume = end;
    if (end <= 0.001) {
      try { a.pause(); } catch (_) {}
    }
    return;
  }

  const t0 = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    // smoothstep
    const s = p * p * (3 - 2 * p);
    a.volume = start + (end - start) * s;
    if (p < 1) {
      _fadeRaf = requestAnimationFrame(step);
    } else {
      _fadeRaf = 0;
      if (end <= 0.001) {
        try { a.pause(); } catch (_) {}
      }
    }
  };
  _fadeRaf = requestAnimationFrame(step);
}

function resolveKey(key) {
  // Backward compatibility with existing calls
  // app.js uses: main / focus / competitive
  // We only need: main vs session
  if (key === "session") return "session";
  if (key === "focus") return "main"; // add page uses focus background but should keep main music
  if (key === "competitive") return "main";
  if (key === "main") return "main";
  return "main";
}

export function setVolumes(v) {
  volumes = { ...volumes, ...v };
  applyMusicVolumeNow();
}

export async function preloadAudio() {
  // Mark as unlocked on the first user gesture.
  _unlocked = true;
  // Prime BGM element
  try {
    ensureBgm();
  } catch (_) {}

  // If the app was backgrounded previously, keep BGM paused at the last
  // position on the next launch/resume. The user can resume it manually.
  try {
    const ap = safeGetLS(LS_BGM_AUTOPAUSED);
    if (ap === "1") {
      _autoPaused = true;
      restoreBgmPositionOnly();
      return;
    }
  } catch (_) {}

  // If a track was requested before unlock, try now.
  try {
    await playBgm(_requestedKey, { fadeMs: 0 });
  } catch (_) {}
}

export async function playBgm(key, { fadeMs = 450 } = {}) {
  _requestedKey = key || "main";
  if (!_unlocked) return Promise.resolve();

  // Any explicit play request should clear the auto-paused state.
  _autoPaused = false;
  safeSetLS(LS_BGM_AUTOPAUSED, "0");

  const mode = resolveKey(_requestedKey);
  const src = TRACKS[mode] || TRACKS.main;
  const a = ensureBgm();

  const targetVol = clamp01(volumes.music ?? 0);
  if (targetVol <= 0.001) {
    // Keep paused when volume is 0
    try { a.pause(); } catch (_) {}
    _bgmKey = mode;
    return Promise.resolve();
  }

  const switching = (_bgmKey !== mode) || (a.src && !a.src.endsWith(src.replace("./", "")));

  if (switching) {
    // Fade out quickly, switch, then fade in
    try { fadeVolume(0, Math.min(220, fadeMs)); } catch (_) {}
    a.src = src;
    try { a.load(); } catch (_) {}
    _bgmKey = mode;

    // Start at 0 then fade to target
    a.volume = 0;
    try {
      await a.play();
    } catch (_) {
      // If blocked, just keep it ready; next user gesture will unlock anyway.
      return Promise.resolve();
    }
    fadeVolume(targetVol, fadeMs);
    return Promise.resolve();
  }

  // Same track: ensure playing and fade to target
  try {
    if (a.paused) await a.play();
  } catch (_) {}
  fadeVolume(targetVol, fadeMs);
  return Promise.resolve();
}

