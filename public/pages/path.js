import { renderShell, wireShellNav } from "../ui.js";

export function renderPath(){
  const root = document.getElementById("app");
  root.innerHTML = `
    ${renderShell({ title: "طريق الإتقان", profile: { gold:0, streakCurrent:0 } })}
    <div class="page"><div class="card">سوف يتم إنشاء Mastery Path قريباً.</div></div>
  `;
  wireShellNav(root);
}
