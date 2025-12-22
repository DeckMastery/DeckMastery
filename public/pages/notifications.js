import { renderShell, wireShellNav } from "../ui.js";

export function renderNotifications(){
  const root = document.getElementById("app");
  root.innerHTML = `
    ${renderShell({ title: "التنبيهات", profile: { gold:0, streakCurrent:0 } })}
    <div class="page">
      <div class="card">
        <div class="list">
          <div class="item"><div class="meta"><div class="name">طلبات الصداقة</div></div></div>
          <div class="item"><div class="meta"><div class="name">الهدايا المستلمة</div></div></div>
          <div class="item"><div class="meta"><div class="name">رسائل التهنئة</div></div></div>
          <div class="item"><div class="meta"><div class="name">تنبيهات التصنيف</div></div></div>
          <div class="item"><div class="meta"><div class="name">تذكير بالدرس اليومي</div></div></div>
          <div class="item"><div class="meta"><div class="name">تحديثات طريق الإتقان</div></div></div>
          <div class="item"><div class="meta"><div class="name">انتهاء صلاحية البطاقات</div></div></div>
          <div class="item"><div class="meta"><div class="name">إعلانات النظام</div></div></div>
          <div class="item"><div class="meta"><div class="name">طلبات المساعدة</div></div></div>
        </div>
      </div>

      <div class="card" style="margin-top:14px;">
        <button class="btn" onclick="history.back()">رجوع</button>
      </div>
    </div>
  `;
  wireShellNav(root);
}
