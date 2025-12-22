import { auth } from "../firebase.js";
import { renderShell, wireShellNav } from "../ui.js";

export function renderSettings() {
  const root = document.getElementById("app");
  root.innerHTML = `
    ${renderShell({ title: "الإعدادات", profile: { gold:0, streakCurrent:0 } })}
    <div class="page">
      <div class="grid">
        <div class="card half">
          <div style="font-weight:900; font-size:18px;">التحكم الصوتي</div>
          <div class="field">
            <label>مستوى صوت الموسيقى</label>
            <input class="input" type="range" min="0" max="100" value="60" />
          </div>
          <div class="field">
            <label>مستوى صوت التفاعلات</label>
            <input class="input" type="range" min="0" max="100" value="70" />
          </div>
        </div>

        <div class="card half">
          <div style="font-weight:900; font-size:18px;">إدارة الحساب والأمان</div>
          <button class="btn danger" id="btnLogout">تسجيل الخروج</button>
          <div class="hr"></div>
          <button class="btn danger" id="btnDelete">حذف الحساب</button>
          <div class="msg" id="msg"></div>
        </div>

        <div class="card">
          <div style="font-weight:900; font-size:18px;">الدعم الفني والتواصل</div>
          <div class="pill">deckmastery0@gmail.com</div>
        </div>
      </div>
    </div>
  `;

  wireShellNav(root);

  const msg = root.querySelector("#msg");

  root.querySelector("#btnLogout").onclick = async () => {
    msg.textContent = "";
    await auth.signOut();
  };

  root.querySelector("#btnDelete").onclick = async () => {
    msg.textContent = "";
    // حذف الحساب وفق نظام الحماية الثلاثي سيتم عبر Cloud Function لاحقاً (يتطلب كلمة السر وإعادة توثيق).
    msg.textContent = "غير متاح حالياً.";
  };
}
