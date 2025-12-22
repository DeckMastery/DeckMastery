import { auth } from "../firebase.js";
import { watchUserProfile } from "../db.js";
import { renderShell, wireShellNav } from "../ui.js";

let unsub = null;

export function renderHome() {
  const root = document.getElementById("app");
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  root.innerHTML = `<div class="page"><div class="card">...</div></div>`;

  if (unsub) { try{unsub();}catch{} }
  unsub = watchUserProfile(uid, (profile) => {
    root.innerHTML = `
      ${renderShell({ title: "الرئيسية", profile })}
      <div class="page">
        <div class="grid">
          <div class="card half">
            <div class="kpi">
              <span class="pill">الاسم: ${profile?.username ?? "-"}</span>
              <span class="pill">المستوى: ${profile?.level ?? 1}</span>
              <span class="pill">نقاط الخبرة: ${profile?.xp ?? 0}</span>
            </div>
            <div class="hr"></div>
            <div class="kpi">
              <span class="pill">نقاط التصنيف: ${profile?.ratingPoints ?? 0}</span>
              <span class="pill">الرتبة: ${formatRank(profile)}</span>
            </div>
          </div>

          <div class="card half">
            <div class="kpi">
              <span class="pill">آخر ظهور: ${profile?.lastSeenAt ? "مسجل" : "-"}</span>
              <span class="pill">الموسم: ${profile?.seasonId ?? 1}</span>
            </div>
          </div>
        </div>
      </div>
    `;
    wireShellNav(root);
  });
}

function formatRank(p){
  if(!p) return "-";
  const map = {
    wood:"خشبي", iron:"حديدي", bronze:"نحاسي", silver:"فضي", gold:"ذهبي",
    emerald:"زمردي", platinum:"بلاتيني", diamond:"ألماسي",
    master:"أستاذ", thinker:"مفكر", sage:"حكيم", inspirer:"ملهم"
  };
  return `${map[p.rankTier] ?? "خشبي"} ${p.rankLevel ?? 1}`;
}
