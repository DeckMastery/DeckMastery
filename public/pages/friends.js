import { renderShell, wireShellNav } from "../ui.js";

export function renderFriends(){
  const root = document.getElementById("app");
  root.innerHTML = `
    ${renderShell({ title: "الأصدقاء", profile: { gold:0, streakCurrent:0 } })}
    <div class="page">
      <div class="card">
        <div class="field">
          <label>البحث</label>
          <input class="input" placeholder="..." />
        </div>
        <div class="hr"></div>
        <div class="list">
          <div class="item"><div class="meta"><div class="name">-</div><div class="sub">-</div></div></div>
        </div>
      </div>
    </div>
  `;
  wireShellNav(root);
}
