import { go } from "./router.js";
import { logout } from "./auth.js";

export function renderShell({ title, profile }) {
  const gold = profile?.gold ?? 0;
  const streak = profile?.streakCurrent ?? 0;

  return `
    <div class="page">
      <div class="header">
        <div class="brand">
          <div class="title">DeckMastery</div>
          <div style="color:var(--muted); font-size:12px;">${title}</div>
        </div>

        <div class="nav">
          <button class="btn primary" data-nav="play">لعب</button>
          <button class="btn" data-nav="addCard">إضافة بطاقة</button>
          <button class="btn" data-nav="library">رزم البطاقات</button>
          <button class="btn" data-nav="shop">المتجر</button>
          <button class="btn" data-nav="leaderboard">التصنيف</button>
          <button class="btn" data-nav="tasks">المهمات</button>
          <button class="btn" data-nav="path">طريق الإتقان</button>
          <span class="pill">الذهب: ${gold}</span>
          <span class="pill">الالتزام: ${streak}</span>
          <button class="btn" data-nav="friends">الأصدقاء</button>
          <button class="btn" data-nav="notifications">التنبيهات</button>
          <button class="btn" data-nav="settings">الإعدادات</button>
          <button class="btn danger" data-nav="logout">تسجيل الخروج</button>
        </div>
      </div>
    </div>
  `;
}

export function wireShellNav(root) {
  root.querySelectorAll("[data-nav]").forEach((b) => {
    b.onclick = async () => {
      const v = b.getAttribute("data-nav");
      if (v === "logout") return logout();
      if (v === "play") return go("/play");
      if (v === "addCard") return go("/add-card");
      if (v === "library") return go("/library");
      if (v === "shop") return go("/shop");
      if (v === "leaderboard") return go("/leaderboard");
      if (v === "tasks") return go("/tasks");
      if (v === "path") return go("/path");
      if (v === "friends") return go("/friends");
      if (v === "notifications") return go("/notifications");
      if (v === "settings") return go("/settings");
    };
  });
}
