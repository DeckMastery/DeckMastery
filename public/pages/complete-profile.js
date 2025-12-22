import { auth } from "../firebase.js";
import { api } from "../api.js";

export function renderCompleteProfile() {
  const root = document.getElementById("app");
  root.innerHTML = `
    <div class="page">
      <div class="card">
        <div style="font-weight:900; font-size:18px;">إكمال البيانات</div>

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

        <button class="btn primary" id="btnSave">حفظ</button>
        <div class="msg" id="msg"></div>
      </div>
    </div>
  `;

  const msg = root.querySelector("#msg");

  root.querySelector("#btnSave").onclick = async () => {
    msg.textContent = "";
    const user = auth.currentUser;
    if (!user) { msg.textContent = "تعذر الحفظ."; return; }

    const username = root.querySelector("#username").value.trim();
    const gender = root.querySelector("#gender").value;

    if (username.length < 3 || username.length > 30) { msg.textContent = "تعذر الحفظ."; return; }
    if (!/^[A-Za-z0-9_]+$/.test(username)) { msg.textContent = "تعذر الحفظ."; return; }
    if (!gender) { msg.textContent = "تعذر الحفظ."; return; }

    try{
      await api.completeProfile({ username, gender });
      msg.textContent = "تم.";
    }catch(e){
      msg.textContent = "تعذر الحفظ.";
    }
  };
}
