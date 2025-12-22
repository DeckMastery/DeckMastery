import { signupEmail } from "../auth.js";
import { api } from "../api.js";
import { auth } from "../firebase.js";
import { go } from "../router.js";

export function renderSignup() {
  const root = document.getElementById("app");
  root.innerHTML = `
    <div class="page">
      <div class="card">
        <div style="font-weight:900; font-size:18px;">إنشاء حساب جديد</div>

        <div class="field">
          <label>الاسم المستعار</label>
          <input class="input" id="username" placeholder="Username" />
        </div>

        <div class="field">
          <label>تحديد الجنس</label>
          <select id="gender">
            <option value="">اختر</option>
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
            <option value="other">محايد</option>
          </select>
        </div>

        <div class="field">
          <label>البريد الإلكتروني</label>
          <input class="input" id="email" placeholder="Email" />
        </div>

        <div class="field">
          <label>كلمة السر</label>
          <input class="input" id="pass" type="password" maxlength="30" />
        </div>

        <div class="field">
          <label>تأكيد كلمة السر</label>
          <input class="input" id="pass2" type="password" maxlength="30" />
        </div>

        <div class="row">
          <button class="btn primary" id="btnCreate">إنشاء حساب</button>
          <button class="btn" id="btnBack">رجوع</button>
        </div>

        <div class="msg" id="msg"></div>
      </div>
    </div>
  `;

  const msg = root.querySelector("#msg");

  root.querySelector("#btnBack").onclick = () => go("/login");

  root.querySelector("#btnCreate").onclick = async () => {
    msg.textContent = "";

    const username = root.querySelector("#username").value.trim();
    const gender = root.querySelector("#gender").value;
    const email = root.querySelector("#email").value.trim();
    const pass = root.querySelector("#pass").value;
    const pass2 = root.querySelector("#pass2").value;

    if (username.length < 3 || username.length > 30) { msg.textContent = "تعذر إنشاء الحساب."; return; }
    if (!/^[A-Za-z0-9_]+$/.test(username)) { msg.textContent = "تعذر إنشاء الحساب."; return; }
    if (!gender) { msg.textContent = "تعذر إنشاء الحساب."; return; }
    if (!email || !pass || pass !== pass2) { msg.textContent = "تعذر إنشاء الحساب."; return; }

    try {
      // إنشاء مستخدم Auth + إرسال تأكيد، ثم خروج
      await signupEmail({ email, password: pass });

      // إنشاء بروفايل Firestore يتم عبر Cloud Function عند أول تسجيل دخول بعد التحقق.
      // لكن هنا المستخدم خارج الآن، لذلك نعرض رسالة فقط:
      msg.textContent = "تم إرسال رابط تأكيد إلى بريدك الإلكتروني. يرجى التأكيد ثم العودة لتسجيل الدخول، مع التحقق من صندوق الرسائل غير المرغوب فيها.";

      // نحفظ بيانات التسجيل المطلوبة في URL مؤقت؟ ممنوع LocalStorage.
      // لذلك: بعد التأكيد والدخول أول مرة، سيتم تحويله إلى إكمال البيانات إذا لم تكن مكتملة.
      // لتطبيق “ثبات الاسم والجنس”: ننقل هذا المنطق إلى /complete-profile أيضاً.
      setTimeout(() => go("/login"), 1800);
    } catch {
      msg.textContent = "تعذر إنشاء الحساب.";
    }
  };
}
