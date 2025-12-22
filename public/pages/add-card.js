import { api } from "../api.js";
import { renderShell, wireShellNav } from "../ui.js";

export function renderAddCard(){
  const root = document.getElementById("app");
  root.innerHTML = `
    ${renderShell({ title: "إضافة بطاقة", profile: { gold:0, streakCurrent:0 } })}
    <div class="page">
      <div class="card">
        <div class="field">
          <label>النص الأصلي</label>
          <input class="input" id="original" maxlength="45" />
        </div>
        <div class="field">
          <label>الترجمة أو التوضيح</label>
          <input class="input" id="translation" maxlength="45" />
        </div>
        <div class="field">
          <label>التلميح</label>
          <input class="input" id="hint" maxlength="60" />
        </div>

        <button class="btn primary" id="btnAdd">إضافة</button>
        <div class="msg" id="msg"></div>
      </div>
    </div>
  `;
  wireShellNav(root);

  const msg = root.querySelector("#msg");

  root.querySelector("#btnAdd").onclick = async () => {
    msg.textContent = "";
    const original = root.querySelector("#original").value;
    const translation = root.querySelector("#translation").value;
    const hint = root.querySelector("#hint").value;

    try{
      await api.createCard({ original, translation, hint });
      msg.textContent = "تم.";
      root.querySelector("#original").value = "";
      root.querySelector("#translation").value = "";
      root.querySelector("#hint").value = "";
    }catch{
      msg.textContent = "تعذر الإضافة.";
    }
  };
}
