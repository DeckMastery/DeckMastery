import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

initializeApp();
const db = getFirestore();

setGlobalOptions({ region: "europe-west1" });

function requireAuth(ctx) {
  if (!ctx.auth?.uid) throw new HttpsError("unauthenticated", "غير مصرح.");
  return ctx.auth.uid;
}

function normalizeUsername(u) {
  return String(u || "").trim();
}
function usernameKey(u) {
  return normalizeUsername(u).toLowerCase();
}
function validateUsername(u) {
  const s = normalizeUsername(u);
  if (s.length < 3 || s.length > 30) return false;
  if (!/^[A-Za-z0-9_]+$/.test(s)) return false;
  return true;
}

function assetsDefaultsByGender(gender) {
  if (gender === "female") {
    return { frameKey: "woodDefault", backgroundKey: "femaleDefault", avatarKey: "femaleDefault" };
  }
  if (gender === "male") {
    return { frameKey: "woodDefault", backgroundKey: "maleDefault", avatarKey: "maleDefault" };
  }
  return { frameKey: "woodDefault", backgroundKey: "otherDefault", avatarKey: "otherDefault" };
}

async function ensureSeasonDoc() {
  const ref = db.collection("meta").doc("season");
  const snap = await ref.get();
  if (snap.exists) return snap.data();

  const now = Timestamp.now();
  const endsAt = Timestamp.fromMillis(now.toMillis() + 100 * 24 * 60 * 60 * 1000);

  const season = {
    startedAt: now,
    endsAt,
    lengthDays: 100,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  };

  await ref.set(season, { merge: true });
  return season;
}

async function ensureUserDoc(uid) {
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  if (snap.exists) return snap.data();

  const defaults = {
    username: null,
    gender: null,
    profileComplete: false,
    emailVerified: false,

    level: 1,
    xp: 0,
    gold: 0,
    ratingPoints: 0,
    ratingTier: "Wood",
    ratingSublevel: 1,

    streakCurrent: 0,

    frameKey: "woodDefault",
    backgroundKey: "otherDefault",
    avatarKey: "otherDefault",

    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    lastSeenAt: FieldValue.serverTimestamp()
  };

  await ref.set(defaults, { merge: true });
  return defaults;
}

export const user_getMe = onCall(async (req) => {
  const uid = requireAuth(req);
  const [user, season] = await Promise.all([
    ensureUserDoc(uid),
    ensureSeasonDoc()
  ]);

  return {
    serverTime: Timestamp.now().toDate().toISOString(),
    seasonEndsAt: season?.endsAt?.toDate?.().toISOString?.() ?? null,
    user
  };
});

export const user_touchLastSeen = onCall(async (req) => {
  const uid = requireAuth(req);
  const ref = db.collection("users").doc(uid);
  await ref.set(
    { lastSeenAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
  return { ok: true };
});

export const username_check = onCall(async (req) => {
  const username = normalizeUsername(req.data?.username);
  if (!validateUsername(username)) return { available: false };

  const key = usernameKey(username);
  const ref = db.collection("usernames").doc(key);
  const snap = await ref.get();
  return { available: !snap.exists };
});

export const user_completeProfile = onCall(async (req) => {
  const uid = requireAuth(req);

  const username = normalizeUsername(req.data?.username);
  const gender = req.data?.gender;

  if (!validateUsername(username)) {
    throw new HttpsError("invalid-argument", "اسم المستخدم غير صالح.");
  }
  if (!["male", "female", "other"].includes(gender)) {
    throw new HttpsError("invalid-argument", "الجنس غير صالح.");
  }

  const userRef = db.collection("users").doc(uid);
  const unameKey = usernameKey(username);
  const unameRef = db.collection("usernames").doc(unameKey);

  const assets = assetsDefaultsByGender(gender);

  await db.runTransaction(async (tx) => {
    const [userSnap, unameSnap] = await Promise.all([
      tx.get(userRef),
      tx.get(unameRef)
    ]);

    const existingUser = userSnap.exists ? userSnap.data() : null;

    if (existingUser?.profileComplete === true) {
      throw new HttpsError("failed-precondition", "تم تثبيت البيانات مسبقًا.");
    }
    if (existingUser?.username && existingUser.username !== username) {
      throw new HttpsError("failed-precondition", "تم تثبيت اسم المستخدم مسبقًا.");
    }
    if (existingUser?.gender && existingUser.gender !== gender) {
      throw new HttpsError("failed-precondition", "تم تثبيت الجنس مسبقًا.");
    }

    if (unameSnap.exists) {
      const owner = unameSnap.data()?.uid;
      if (owner && owner !== uid) {
        throw new HttpsError("already-exists", "اسم المستخدم غير متاح.");
      }
    }

    tx.set(unameRef, {
      uid,
      username,
      createdAt: FieldValue.serverTimestamp()
    }, { merge: true });

    if (!userSnap.exists) {
      tx.set(userRef, {
        username,
        gender,
        profileComplete: true,
        ...assets,
        level: 1,
        xp: 0,
        gold: 0,
        ratingPoints: 0,
        ratingTier: "Wood",
        ratingSublevel: 1,
        streakCurrent: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastSeenAt: FieldValue.serverTimestamp()
      }, { merge: true });
    } else {
      tx.set(userRef, {
        username,
        gender,
        profileComplete: true,
        ...assets,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }
  });

  const fresh = await userRef.get();
  return { ok: true, user: fresh.data() };
});

export const leaderboard_top100 = onCall(async (req) => {
  requireAuth(req);
  const season = await ensureSeasonDoc();

  const snap = await db.collection("users")
    .orderBy("ratingPoints", "desc")
    .limit(100)
    .get();

  const users = snap.docs.map((d) => {
    const u = d.data();
    return {
      uid: d.id,
      username: u.username ?? null,
      gender: u.gender ?? null,
      level: u.level ?? 1,
      ratingPoints: u.ratingPoints ?? 0,
      frameKey: u.frameKey ?? "woodDefault",
      backgroundKey: u.backgroundKey ?? "otherDefault",
      avatarKey: u.avatarKey ?? "otherDefault",
      ratingTier: u.ratingTier ?? "Wood",
      ratingSublevel: u.ratingSublevel ?? 1
    };
  });

  return {
    serverTime: Timestamp.now().toDate().toISOString(),
    seasonEndsAt: season?.endsAt?.toDate?.().toISOString?.() ?? null,
    users
  };
});

export const leaderboard_myRank = onCall(async (req) => {
  const uid = requireAuth(req);
  const meSnap = await db.collection("users").doc(uid).get();
  if (!meSnap.exists) throw new HttpsError("not-found", "المستخدم غير موجود.");

  const my = meSnap.data();
  const myRP = Number(my?.ratingPoints ?? 0);

  const topSnap = await db.collection("users").orderBy("ratingPoints", "desc").limit(100).get();
  let inTop100 = false;
  let rank = null;
  topSnap.docs.forEach((d, i) => {
    if (d.id === uid) { inTop100 = true; rank = i + 1; }
  });

  const totalAgg = await db.collection("users").count().get();
  const total = totalAgg.data().count || 1;

  if (inTop100) {
    return { inTop100: true, rank, total, percent: Math.ceil((rank / total) * 100) };
  }

  const higherAgg = await db.collection("users").where("ratingPoints", ">", myRP).count().get();
  const higher = higherAgg.data().count || 0;

  const computedRank = higher + 1;
  const percent = Math.ceil((computedRank / total) * 100);

  return { inTop100: false, rank: computedRank, total, percent };
});