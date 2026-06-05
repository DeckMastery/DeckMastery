// AdMob Rewarded Ads setup (AdMob Plus / admob-plus-cordova)
// App ID (Android): ca-app-pub-4124078609590433~5831605973
// Rewarded Ad Unit ID (Android): ca-app-pub-4124078609590433/6186829199
//
// ملاحظة: هذا الملف يجهّز الإعلانات فقط. أزرار التشغيل/المكافآت ستتم إضافتها لاحقاً حسب ما سترسله.

export const ADMOB_APP_ID_ANDROID = "ca-app-pub-4124078609590433~5831605973";
export const REWARDED_AD_UNIT_ID_ANDROID = "ca-app-pub-4124078609590433/6186829199";

let rewarded = null;
let started = false;

export async function admobStart() {
  if (started) return true;
  if (!window.admob || typeof window.admob.start !== "function") {
    return false;
  }
  try {
    await window.admob.start();
    started = true;
    return true;
  } catch (e) {
    console.warn("[AdMob] start failed:", e);
    return false;
  }
}

export async function prepareRewarded() {
  const ok = await admobStart();
  if (!ok) return false;

  try {
    rewarded = new window.admob.RewardedAd({
      adUnitId: REWARDED_AD_UNIT_ID_ANDROID,
    });
    await rewarded.load();
    return true;
  } catch (e) {
    console.warn("[AdMob] rewarded load failed:", e);
    rewarded = null;
    return false;
  }
}

export async function showRewarded() {
  const ok = await admobStart();
  if (!ok) throw new Error("AdMob not available (plugin missing or not ready).");

  if (!rewarded) {
    const loaded = await prepareRewarded();
    if (!loaded) throw new Error("Rewarded ad not loaded.");
  }

  // Event-driven reward handling (يُفضّل ربط المكافأة من خلال event listener في app.js لاحقاً)
  await rewarded.show();
}
