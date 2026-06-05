// Bootstrap loader: يضمن تحميل البيانات من SQLite (إن وُجدت) إلى localStorage
// قبل تشغيل التطبيق الأساسي (app.js).

import { hydrateKeysToLocalStorage } from "./native_store.js";
import { LS_KEY } from "./state.js";

(async function boot(){
  // In Cordova/Monaca we must wait for deviceready so plugins are available
  // (sqlite/file/socialsharing...). If Cordova is not present, continue immediately.
  if(typeof window !== "undefined" && window.cordova){
    await new Promise((resolve)=>{
      let done = false;
      const finish = ()=>{ if(done) return; done = true; resolve(); };
      document.addEventListener("deviceready", finish, { once:true });
      // Safety net: never block the app forever.
      setTimeout(finish, 10000);
    });
  }

  // مفاتيح مهمّة (على الأقل حالة التطبيق الرئيسية)
  const keys = [
    LS_KEY,
    // مفاتيح الإعدادات (اختياري) – مفيد حتى لا تضيع في APK
    "dm_lang",
    "dm_theme",
    "dm_music",
    "dm_sfx",
    "dm_vibrate",
    // مفاتيح داخلية صغيرة
    "dm_nav_stack_v1",
    "dm_backup_reminder_saturday_last",
    "dm_last_backup_filename",
  ];

  try{
    await hydrateKeysToLocalStorage(keys);
  }catch(_){ /* ignore */ }

  // شغّل التطبيق بعد الترطيب
  await import("./app.js");
})();
