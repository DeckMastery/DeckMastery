import { resetPassword } from "../auth.js";
import { go } from "../router.js";

export function renderForgot() {
  const root = document.getElementById("app");
  root.innerHTML = `
    <div class="page">
      <div class="card">
        <div style="font-weight:900; font-size:18px;">استعادة كلمة المرور</div>

        <div class="field">
          <label>البريد الإلكتروني</label>
          <input class="input" id="email" placeholder="Email" />
        </div>

        <div class="row">
          <button class="btn primary" id="btnSend">إرسال رمز التحقق</button>
          <button class="btn" id="btnBack">رجوع</button>
        </div>

        <div class="msg" id="msg"></div>
      </div>
    </div>
  `;

  const msg = root.querySelector("#msg");
  root.querySelector("#btnBack").onclick = () => go("/login");

  root.querySelector("#btnSend").onclick = async () => {
    msg.textContent = "";
    const email = root.querySelector("#email").value.trim();
    if (!email) { msg.textContent = "تعذر الإرسال."; return; }
    try{
      await resetPassword(email);
      msg.textContent = "في حال لم يصلك رابط تغيير كلمة المرور خلال ثوانٍ، يرجى التحقق من صندوق الرسائل غير المرغوب فيها.";
    }catch{
      msg.textContent = "تعذر الإرسال.";
    }
  };
}
