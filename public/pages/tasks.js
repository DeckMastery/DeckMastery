import { renderShell, wireShellNav } from "../ui.js";

export function renderTasks(){
  const root = document.getElementById("app");
  root.innerHTML = `
    ${renderShell({ title: "المهمات", profile: { gold:0, streakCurrent:0 } })}
    <div class="page"><div class="card">سوف يتم إضافة مهمات قريباً</div></div>
  `;
  wireShellNav(root);
}
