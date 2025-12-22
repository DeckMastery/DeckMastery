import { auth } from "../firebase.js";
import { api } from "../api.js";
import { renderShell, wireShellNav } from "../ui.js";

export async function renderLeaderboard() {
  const root = document.getElementById("app");
  root.innerHTML = `<div class="page"><div class="card">...</div></div>`;

  const [seasonInfoRes, topRes] = await Promise.all([
    api.getSeasonInfo({}),
    api.getTop100({}),
  ]);

  const season = seasonInfoRes.data;
  const top = topRes.data?.list || [];

  // إذا المستخدم مو ضمن Top100: نجيب percentile
  let myBadge = "";
  const uid = auth.currentUser?.uid;
  const meInTop = top.some(x => x.uid === uid);

  if (!meInTop) {
    const percRes = await api.getMyPercentile({});
    const { percentile } = percRes.data;
    myBadge = `<div class="card" style="margin-top:14px;"><div style="font-weight:800;">${percentile}%</div></div>`;
  }

  root.innerHTML = `
    ${renderShell({ title: "التصنيف", profile: { gold:0, streakCurrent:0 } })}
    <div class="page">
      <div class="card">
        <div style="font-weight:900; font-size:18px;">باقي ${season.daysLeft} يوماً على نهاية الموسم</div>
      </div>

      <div class="card" style="margin-top:14px;">
        <div class="list">
          ${top.map(row => `
            <div class="item">
              <div class="meta">
                <div class="name">${row.place}. ${escapeHtml(row.username || "-")}</div>
                <div class="sub">المستوى: ${row.level} — نقاط التصنيف: ${row.ratingPoints}</div>
              </div>
              <div class="pill">${row.rankLabel}</div>
            </div>
          `).join("")}
        </div>
      </div>

      ${myBadge}
    </div>
  `;

  wireShellNav(root);
}

function escapeHtml(s){
  return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}
