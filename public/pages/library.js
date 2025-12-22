import { renderShell, wireShellNav } from "../ui.js";

export function renderLibrary(){
  const root = document.getElementById("app");
  root.innerHTML = `
    ${renderShell({ title: "رزم البطاقات", profile: { gold:0, streakCurrent:0 } })}
    <div class="page">
      <div class="card">
        <div class="list">
          <div class="item"><div class="meta"><div class="name">جميع البطاقات</div></div></div>
          <div class="item"><div class="meta"><div class="name">المجموعات اليومية</div></div></div>
          <div class="item"><div class="meta"><div class="name">سهل</div></div></div>
          <div class="item"><div class="meta"><div class="name">متوسط</div></div></div>
          <div class="item"><div class="meta"><div class="name">صعب</div></div></div>
          <div class="item"><div class="meta"><div class="name">التجاهل</div></div></div>
          <div class="item"><div class="meta"><div class="name">المكتملة</div></div></div>
        </div>
      </div>
    </div>
  `;
  wireShellNav(root);
}
