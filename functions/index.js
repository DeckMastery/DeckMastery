const admin = require("firebase-admin");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");

admin.initializeApp();
const db = admin.firestore();

const REGION = "europe-west3";
const TZ = "Europe/Berlin";

/** أدوات وقت السيرفر */
function nowTs() {
  return admin.firestore.Timestamp.now();
}

function datePartsInTZ(ts) {
  const d = ts.toDate();
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(d).reduce((acc, p) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {});
  // day/month/year (2-digit)
  return { dd: parts.day, mm: parts.month, yy: parts.year };
}

function dailyGroupName(ts) {
  const { dd, mm, yy } = datePartsInTZ(ts);
  return `${dd}.${mm}.${yy}`;
}

// groupId ثابت وآمن للفرز
function dailyGroupId(ts) {
  const { dd, mm, yy } = datePartsInTZ(ts);
  return `${yy}${mm}${dd}`; // YYMMDD
}

function requireAuth(req) {
  if (!req.auth) throw new HttpsError("unauthenticated", "Unauthenticated");
  return req.auth.uid;
}

/** التحقق من أطوال البطاقة */
function validateCard({ original, translation, hint }) {
  if (typeof original !== "string" || typeof translation !== "string" || typeof hint !== "string")
    throw new HttpsError("invalid-argument", "Invalid");

  if (original.length === 0 || translation.length === 0 || hint.length === 0)
    throw new HttpsError("invalid-argument", "Invalid");

  if (original.length > 45 || translation.length > 45 || hint.length > 60)
    throw new HttpsError("invalid-argument", "Invalid");
}

/** تهيئة وثيقة المستخدم عند أول دخول (Server-side truth) */
async function ensureUserDoc(uid, email) {
  const ref = db.doc(`users/${uid}`);
  const snap = await ref.get();
  if (snap.exists) return snap.data();

  const ts = nowTs();

  const data = {
    uid,
    email: email || null,
    createdAt: ts,
    lastSeenAt: ts,

    gold: 0,
    xp: 0,
    level: 1,

    ratingPoints: 0,
    rankTier: "wood",
    rankLevel: 1,

    seasonId: 1,
    seasonStartAt: ts,

    streakCurrent: 0,
    fuel: 0,

    username: null,
    gender: null,
    avatarKey: null,
    bgKey: null,
    frameKey: "frame_default",

    profileComplete: false,
  };

  await ref.set(data);
  return data;
}

/** config/global للموسم */
async function ensureGlobalConfig() {
  const ref = db.doc("config/global");
  const snap = await ref.get();
  const ts = nowTs();
  if (!snap.exists) {
    await ref.set({
      seasonId: 1,
      seasonStartAt: ts,
      lastResetAt: null,
    });
    return { seasonId: 1, seasonStartAt: ts, lastResetAt: null };
  }
  return snap.data();
}

/** Username uniqueness عبر collection usernames */
async function claimUsername(uid, username) {
  // docId = username lowercase لضمان uniqueness
  const docId = username.toLowerCase();
  const ref = db.doc(`usernames/${docId}`);

  await db.runTransaction(async (tx) => {
    const s = await tx.get(ref);
    if (s.exists) throw new HttpsError("already-exists", "USERNAME_TAKEN");
    tx.set(ref, { username, uid, createdAt: nowTs() });
  });
}

/** تصنيف label */
function rankLabel(tier, level) {
  const map = {
    wood: "خشبي",
    iron: "حديدي",
    bronze: "نحاسي",
    silver: "فضي",
    gold: "ذهبي",
    emerald: "زمردي",
    platinum: "بلاتيني",
    diamond: "ألماسي",
    master: "أستاذ",
    thinker: "مفكر",
    sage: "حكيم",
    inspirer: "ملهم",
  };
  return `${map[tier] || "خشبي"} ${level || 1}`;
}

/** خوارزمية Season Reset (حسب وثيقتك) */
function computeResetTarget(rankTier) {
  // الفئة الذهبية: (ملهم، حكيم، مفكر) => بلاتيني 1
  if (["inspirer", "sage", "thinker"].includes(rankTier)) {
    return { rankTier: "platinum", rankLevel: 1, ratingPoints: 0 };
  }
  // الفئة الفضية: (أستاذ، ألماسي، بلاتيني) => زمردي 1
  if (["master", "diamond", "platinum"].includes(rankTier)) {
    return { rankTier: "emerald", rankLevel: 1, ratingPoints: 0 };
  }
  // الفئة النحاسية: (زمردي) => ذهبي 1
  if (["emerald"].includes(rankTier)) {
    return { rankTier: "gold", rankLevel: 1, ratingPoints: 0 };
  }
  // التأسيسية: (فضي، نحاسي، حديدي، خشبي) => نفس tier لكن level 1
  if (["silver", "bronze", "iron", "wood"].includes(rankTier)) {
    return { rankTier, rankLevel: 1, ratingPoints: 0 };
  }
  return { rankTier: "wood", rankLevel: 1, ratingPoints: 0 };
}

/** 1) إكمال البيانات (Username فريد + Gender ثابت) */
exports.completeProfile = onCall({ region: REGION }, async (req) => {
  const uid = requireAuth(req);
  const { username, gender } = req.data || {};

  if (typeof username !== "string" || username.length < 3 || username.length > 30)
    throw new HttpsError("invalid-argument", "Invalid");

  if (!/^[A-Za-z0-9_]+$/.test(username))
    throw new HttpsError("invalid-argument", "Invalid");

  if (!["male", "female", "other"].includes(gender))
    throw new HttpsError("invalid-argument", "Invalid");

  const userRecord = await admin.auth().getUser(uid);
  const profile = await ensureUserDoc(uid, userRecord.email);

  if (profile.profileComplete === true)
    throw new HttpsError("failed-precondition", "ALREADY_COMPLETE");

  await claimUsername(uid, username);

  const defaultBgKey =
    gender === "female" ? "bg_female_01" :
    gender === "male" ? "bg_male_01" : "bg_other_01";

  const defaultAvatarKey =
    gender === "female" ? "av_female_01" :
    gender === "male" ? "av_male_01" : "av_other_01";

  await db.doc(`users/${uid}`).update({
    username,
    gender,
    bgKey: defaultBgKey,
    avatarKey: defaultAvatarKey,
    profileComplete: true,
    lastSeenAt: nowTs(),
  });

  return { ok: true };
});

/** 2) إنشاء بطاقة (Server Timestamp + Daily Group server time) */
exports.createCard = onCall({ region: REGION }, async (req) => {
  const uid = requireAuth(req);
  const { original, translation, hint } = req.data || {};
  validateCard({ original, translation, hint });

  const userRecord = await admin.auth().getUser(uid);
  await ensureUserDoc(uid, userRecord.email);

  const ts = nowTs();
  const groupId = dailyGroupId(ts);
  const groupName = dailyGroupName(ts);

  const cardsCol = db.collection(`users/${uid}/cards`);
  const cardRef = cardsCol.doc();

  const groupRef = db.doc(`users/${uid}/dailyGroups/${groupId}`);

  await db.runTransaction(async (tx) => {
    const g = await tx.get(groupRef);
    if (!g.exists) {
      tx.set(groupRef, {
        id: groupId,
        name: groupName,
        createdAt: ts,
      });
    }

    tx.set(cardRef, {
      id: cardRef.id,
      groupId,
      createdAt: ts,
      lastSeenAt: ts,
      level: 0,
      lastRating: null, // "easy" | "medium" | "hard"
      ignored: false,
      completed: false,
      original,
      translation,
      hint,
    });
  });

  return { ok: true, cardId: cardRef.id, groupId, groupName };
});

/** 3) تطبيق المكافآت (Gold/XP/Rating) — فقط من السيرفر */
exports.applyRewards = onCall({ region: REGION }, async (req) => {
  const uid = requireAuth(req);

  // هذا endpoint يستقبل نتيجة درس/لعبة محسوبة من العميل لاحقاً
  // ولكن منع الغش الحقيقي يتطلب أن الحساب يتم في السيرفر وفق قواعدك.
  // حالياً: نطبّق قيماً مُرسلة ضمن حدود صارمة.
  const { xpDelta, goldDelta, ratingDelta } = req.data || {};

  const dxp = Number(xpDelta || 0);
  const dgold = Number(goldDelta || 0);
  const drating = Number(ratingDelta || 0);

  if (!Number.isFinite(dxp) || !Number.isFinite(dgold) || !Number.isFinite(drating))
    throw new HttpsError("invalid-argument", "Invalid");

  // حدود أمان أولية
  if (dxp < -5000 || dxp > 5000) throw new HttpsError("invalid-argument", "Invalid");
  if (dgold < -500 || dgold > 500) throw new HttpsError("invalid-argument", "Invalid");
  if (drating < -5000 || drating > 5000) throw new HttpsError("invalid-argument", "Invalid");

  const ref = db.doc(`users/${uid}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("failed-precondition", "NO_PROFILE");

  const u = snap.data();

  const newXp = Math.max(0, (u.xp || 0) + dxp);
  const newGold = Math.max(0, (u.gold || 0) + dgold);
  const newRating = Math.max(0, (u.ratingPoints || 0) + drating);

  // level بسيط: كل 1000 XP مستوى (قابل للتعديل لاحقاً)
  const newLevel = Math.max(1, Math.floor(newXp / 1000) + 1);

  await ref.update({
    xp: newXp,
    gold: newGold,
    ratingPoints: newRating,
    level: newLevel,
    lastSeenAt: nowTs(),
  });

  return { ok: true, xp: newXp, gold: newGold, ratingPoints: newRating, level: newLevel };
});

/** 4) إنهاء درس وتسجيل حضور + Streak — وقت سيرفر */
exports.finishLesson = onCall({ region: REGION }, async (req) => {
  const uid = requireAuth(req);
  const ref = db.doc(`users/${uid}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("failed-precondition", "NO_PROFILE");

  const ts = nowTs();
  const todayId = dailyGroupId(ts); // YYMMDD في توقيت برلين

  // نخزن آخر يوم حضور كـ string (آمن للمقارنة اليومية)
  // الحقول الحساسة لا يُسمح للعميل بكتابتها (rules تمنع)
  await db.runTransaction(async (tx) => {
    const s = await tx.get(ref);
    const u = s.data() || {};
    const lastAttendanceId = u.lastAttendanceId || null;

    let streak = Number(u.streakCurrent || 0);

    if (lastAttendanceId === todayId) {
      // نفس اليوم: لا تغيير
    } else {
      // إذا كان آخر حضور أمس => streak +1
      // إذا كان أقدم => streak = 1 (Start New Streak)
      // المقارنة هنا على مستوى YYMMDD string، مع منطق "فرق يوم" عبر Date
      streak = computeNewStreak(lastAttendanceId, todayId, streak);
      tx.update(ref, {
        streakCurrent: streak,
        lastAttendanceId: todayId,
        lastLessonFinishedAt: ts,
        lastSeenAt: ts,
      });
    }
  });

  const after = (await ref.get()).data();
  return { ok: true, streakCurrent: after.streakCurrent, lastAttendanceId: after.lastAttendanceId };
});

function computeNewStreak(lastId, todayId, currentStreak) {
  // lastId/todayId: YYMMDD
  if (!lastId) return 1;

  const toDate = (id) => {
    const yy = Number(id.slice(0,2));
    const mm = Number(id.slice(2,4));
    const dd = Number(id.slice(4,6));
    // نفترض 20YY
    return new Date(Date.UTC(2000 + yy, mm - 1, dd));
  };

  const last = toDate(lastId);
  const today = toDate(todayId);
  const diffDays = Math.round((today - last) / (1000*60*60*24));

  if (diffDays === 1) return currentStreak + 1;
  return 1;
}

/** 5) Leaderboard Top100 من السيرفر */
exports.getTop100 = onCall({ region: REGION }, async (req) => {
  requireAuth(req);

  const q = await db.collection("users")
    .orderBy("ratingPoints", "desc")
    .limit(100)
    .get();

  let place = 0;
  const list = q.docs.map((d) => {
    place += 1;
    const u = d.data();
    return {
      place,
      uid: u.uid,
      username: u.username,
      gender: u.gender,
      level: u.level || 1,
      ratingPoints: u.ratingPoints || 0,
      avatarKey: u.avatarKey,
      frameKey: u.frameKey,
      bgKey: u.bgKey,
      rankTier: u.rankTier,
      rankLevel: u.rankLevel,
      rankLabel: rankLabel(u.rankTier, u.rankLevel),
    };
  });

  return { list };
});

/** 6) Percentile للمستخدم (سيرفر) */
exports.getMyPercentile = onCall({ region: REGION }, async (req) => {
  const uid = requireAuth(req);

  const meSnap = await db.doc(`users/${uid}`).get();
  if (!meSnap.exists) throw new HttpsError("failed-precondition", "NO_PROFILE");
  const me = meSnap.data();
  const myRating = Number(me.ratingPoints || 0);

  // إجمالي المستخدمين
  const totalAgg = await db.collection("users").count().get();
  const total = totalAgg.data().count || 1;

  // عدد أعلى منه
  const higherAgg = await db.collection("users").where("ratingPoints", ">", myRating).count().get();
  const higher = higherAgg.data().count || 0;

  const percentile = Math.max(1, Math.round(((total - higher) / total) * 100));
  return { percentile, total, higher };
});

/** 7) معلومات الموسم + عداد الأيام المتبقية */
exports.getSeasonInfo = onCall({ region: REGION }, async (req) => {
  requireAuth(req);
  const cfg = await ensureGlobalConfig();

  const now = nowTs();
  const elapsedMs = now.toMillis() - cfg.seasonStartAt.toMillis();
  const daysPassed = Math.floor(elapsedMs / (1000*60*60*24));
  const daysLeft = Math.max(0, 100 - daysPassed);

  return { seasonId: cfg.seasonId, daysLeft };
});

/** 8) Scheduled Season Reset — شيك يومي، يطبق عند مرور 100 يوم */
exports.seasonResetJob = onSchedule(
  { schedule: "15 3 * * *", timeZone: TZ, region: REGION },
  async () => {
    const cfgRef = db.doc("config/global");
    const cfgSnap = await cfgRef.get();
    const now = nowTs();

    if (!cfgSnap.exists) {
      await cfgRef.set({ seasonId: 1, seasonStartAt: now, lastResetAt: null });
      return;
    }

    const cfg = cfgSnap.data();
    const seasonStartAt = cfg.seasonStartAt || now;
    const seasonId = cfg.seasonId || 1;

    const elapsedMs = now.toMillis() - seasonStartAt.toMillis();
    const days = Math.floor(elapsedMs / (1000*60*60*24));
    if (days < 100) return;

    const newSeasonId = seasonId + 1;
    await cfgRef.update({
      seasonId: newSeasonId,
      seasonStartAt: now,
      lastResetAt: now,
    });

    // Batch reset لجميع المستخدمين
    const usersCol = db.collection("users");
    const pageSize = 400;
    let last = null;
    let processed = 0;

    while (true) {
      let q = usersCol.orderBy("uid").limit(pageSize);
      if (last) q = q.startAfter(last);

      const snap = await q.get();
      if (snap.empty) break;

      const batch = db.batch();

      snap.docs.forEach((docSnap) => {
        const u = docSnap.data() || {};
        const reset = computeResetTarget(u.rankTier || "wood");

        batch.update(docSnap.ref, {
          seasonId: newSeasonId,
          ratingPoints: 0,
          rankTier: reset.rankTier,
          rankLevel: reset.rankLevel,
          lastSeenAt: now,
        });
      });

      await batch.commit();
      processed += snap.size;
      last = snap.docs[snap.docs.length - 1];
    }

    console.log(`Season reset done. Processed: ${processed}`);
  }
);
