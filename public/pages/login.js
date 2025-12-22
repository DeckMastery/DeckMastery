import { loginEmail, loginGoogle } from "../auth.js";
import { go } from "../router.js";

export function renderLogin() {
  const root = document.getElementById("app");
  root.innerHTML = `
    <div class="page">
      <div class="card">
        <div class="brand">
          <div class="title" style="font-size:28px;">DeckMastery</div>
        </div>

        <div class="field">
          <label>البريد الإلكتروني</label>
          <input class="input" id="email" placeholder="Email" />
        </div>

        <div class="field">
          <label>كلمة السر</label>
          <input class="input" id="pass" type="password" maxlength="30" placeholder="Password" />
        </div>

        <div class="row">
          <button class="btn primary" id="btnLogin">تسجيل الدخول</button>
          <button class="btn" id="btnGoogle">تسجيل الدخول عبر Google</button>
        </div>

        <div class="row">
          <button class="btn" id="btnSignup">إنشاء حساب جديد</button>
          <button class="btn" id="btnForgot">نسيت كلمة المرور</button>
        </div>

        <div class="msg" id="msg"></div>
      </div>
    </div>
  `;

  const msg = root.querySelector("#msg");

  root.querySelector("#btnLogin").onclick = async () => {
    msg.textContent = "";
    try {
      const email = root.querySelector("#email").value.trim();
      const pass = root.querySelector("#pass").value;
      await loginEmail(email, pass);
    } catch (e) {
      if (String(e.message) === "EMAIL_NOT_VERIFIED") {
        msg.textContent = "تم إرسال رابط تأكيد إلى بريدك الإلكتروني. يرجى التأكيد ثم المحاولة مجدداً، مع التحقق من صندوق الرسائل غير المرغوب فيها.";
      } else {
        msg.textContent = "تعذر تسجيل الدخول.";
      }
    }
  };

  root.querySelector("#btnGoogle").onclick = async () => {
    msg.textContent = "";
    try {
      await loginGoogle();
    } catch {
      msg.textContent = "تعذر تسجيل الدخول عبر Google.";
    }
  };

  root.querySelector("#btnSignup").onclick = () => go("/signup");
  root.querySelector("#btnForgot").onclick = () => go("/forgot-password");
}
