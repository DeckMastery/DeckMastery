import { renderShell, wireShellNav } from "../ui.js";

export function renderPlay(){
  const root = document.getElementById("app");
  root.innerHTML = `
    ${renderShell({ title: "اللعب", profile: { gold:0, streakCurrent:0 } })}
    <div class="page"><div class="card">...</div></div>
  `;
  wireShellNav(root);
}
