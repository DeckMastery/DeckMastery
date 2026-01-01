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
  main: "./assets/audio/bgm/khalfia.mp3",
  session: "./assets/audio/bgm/tahadi.mp3",
};

let _bgm = null;
let _bgmKey = null; // "main" | "session"
let _requestedKey = "main";
// (_unlocked is declared above and used for both SFX + BGM)
let _fadeRaf = 0;

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

  // If a track was requested before unlock, try now.
  try {
    await playBgm(_requestedKey, { fadeMs: 0 });
  } catch (_) {}
}

export async function playBgm(key, { fadeMs = 450 } = {}) {
  _requestedKey = key || "main";
  if (!_unlocked) return Promise.resolve();

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

