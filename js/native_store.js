/*
  DeckMastery – Native-persistent key/value store for Cordova/Monaca

  الهدف: جعل التخزين مناسب لتطبيق Android (Cordova/Monaca) بدل الاعتماد على localStorage فقط.

  - إذا كان Cordova + cordova-sqlite-storage متوفرين: نخزن/نقرأ القيم من SQLite.
  - في كل الحالات: نبقي نسخة مرآة في localStorage لتجنّب كسر الكود الحالي (سريع/متزامن).

  ملاحظة مهمة (Monaca): أضف الإضافة التالية للمشروع:
    cordova-sqlite-storage
  بدونها سيبقى التطبيق يعمل بـ localStorage كـ fallback.
*/

const DB_FILE = "deckmastery_store.db";
const TABLE_SQL = "CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT)";

let _db = null;
let _initPromise = null;

function isCordova(){
  return (typeof window !== "undefined") && !!window.cordova;
}

function waitDeviceReady(){
  if(!isCordova()) return Promise.resolve();
  return new Promise((resolve)=>{
    let done = false;
    const finish = ()=>{ if(done) return; done = true; resolve(); };

    // 1) Normal Cordova path
    document.addEventListener("deviceready", finish, { once:true });

    // 2) If this module is evaluated after DOMContentLoaded, the event won't fire again.
    //    So we add a small timeout fallback to avoid hanging forever.
    const rs = (document && document.readyState) ? String(document.readyState) : "";
    if(rs === "interactive" || rs === "complete"){
      setTimeout(finish, 2500);
    }else{
      window.addEventListener("DOMContentLoaded", ()=> setTimeout(finish, 2500), { once:true });
    }

    // 3) Absolute safety net
    setTimeout(finish, 10000);
  });
}

function hasSQLitePlugin(){
  return (typeof window !== "undefined") && !!window.sqlitePlugin && typeof window.sqlitePlugin.openDatabase === "function";
}

function txExec(sql, params){
  return new Promise((resolve, reject)=>{
    if(!_db) return resolve(null);
    _db.transaction((tx)=>{
      tx.executeSql(
        sql,
        params || [],
        (_tx, rs)=> resolve(rs),
        (_tx, err)=> { reject(err); return false; }
      );
    }, reject);
  });
}

export async function initNativeStore(){
  if(_initPromise) return _initPromise;
  _initPromise = (async()=>{
    await waitDeviceReady();
    if(!hasSQLitePlugin()) return;
    try{
      _db = window.sqlitePlugin.openDatabase({ name: DB_FILE, location: "default" });
      await txExec(TABLE_SQL, []);
    }catch(e){
      // إذا فشل فتح SQLite لأي سبب، نرجع لـ localStorage.
      _db = null;
    }
  })();
  return _initPromise;
}

async function dbGet(key){
  await initNativeStore();
  if(!_db) return null;
  const rs = await txExec("SELECT v FROM kv WHERE k = ? LIMIT 1", [key]);
  if(!rs || !rs.rows || rs.rows.length === 0) return null;
  return rs.rows.item(0).v;
}

async function dbSet(key, value){
  await initNativeStore();
  if(!_db) return;
  await txExec("INSERT OR REPLACE INTO kv (k, v) VALUES (?, ?)", [key, value]);
}

async function dbRemove(key){
  await initNativeStore();
  if(!_db) return;
  await txExec("DELETE FROM kv WHERE k = ?", [key]);
}

/**
 * Hydrate: إذا localStorage ما عنده المفتاح لكن SQLite عندها، ننقله إلى localStorage.
 * مهم لأنه الكود الحالي يقرأ متزامنًا من localStorage.
 */
export async function hydrateKeysToLocalStorage(keys){
  try{
    await initNativeStore();
    if(!_db) return;
    for(const k of keys){
      try{
        if(localStorage.getItem(k) != null) continue;
      }catch{}
      const v = await dbGet(k);
      if(v == null) continue;
      try{ localStorage.setItem(k, v); }catch{}
    }
  }catch{
    // ignore
  }
}

/**
 * Persist: نكتب فورًا إلى localStorage (متزامن)، ونكتب إلى SQLite بالخفاء (غير متزامن).
 */
export function persistKey(key, value){
  try{ localStorage.setItem(key, value); }catch{}
  // Fire-and-forget
  dbSet(key, value).catch(()=>{});
}

/**
 * Remove: نحذف من localStorage فورًا، ومن SQLite بالخفاء.
 */
export function removeKey(key){
  try{ localStorage.removeItem(key); }catch{}
  dbRemove(key).catch(()=>{});
}
