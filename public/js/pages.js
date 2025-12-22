import { btn, input, select, card, muted, spacer } from "./ui.js";
import { loginEmail, signupEmail, startGoogleRedirect } from "./auth.js";
import { fx } from "./functionsClient.js";
import { ASSETS, defaultsByGender } from "./assets.js";

function validateUsername(u) {
  if (u.length < 3 || u.length > 30) return "اسم المستخدم غير صالح.";
  if (!/^[A-Za-z0-9_]+$/.test(u)) return "اسم المستخدم غير صالح.";
  return null;
}

function profileWidget(user) {
  const wrap = document.createElement("div");
  wrap.className = "profile-block";

  const pfp = document.createElement("div");
  pfp.className = "pfp";

  const frame = document.createElement("div");
  frame.className = "frame";

  const bg = document.createElement("div");
  bg.className = "bg";

  const av = document.createElement("div");
  av.className = "avatar";

  const gender = user?.gender || "other";
  const def = defaultsByGender(gender);

  const frameUrl = ASSETS.frame[user?.frameKey || def.frameKey] || ASSETS.frame.woodDefault;
  const bgUrl = ASSETS.background[user?.backgroundKey || def.bgKey] || ASSETS.background.otherDefault;
  const avUrl = ASSETS.avatar[user?.avatarKey || def.avatarKey] || ASSETS.avatar.otherDefault;

  frame.style.backgroundImage = `url('${frameUrl}')`;
  bg.style.backgroundImage = `url('${bgUrl}')`;
  av.style.backgroundImage = `url('${avUrl}')`;

  pfp.append(frame, bg, av);

  const info = document.createElement("div");
  info.style.display = "flex";
  info.style.flexDirection = "column";
  info.style.gap = "6px";

  const name = document.createElement("div");
  name.style.fontWeight = "900";
  name.textContent = user?.username ? user.username : "—";

  const kpi = document.createElement("div");
  kpi.className = "kpi";
  kpi.innerHTML = `
    <span class="badge">المستوى ${user?.level ?? 1}</span>
    <span class="badge">ذهب ${user?.gold ?? 0}</span>
    <span class="badge">تصنيف ${user?.ratingPoints ?? 0}</span>
  `;

  info.append(name, kpi);
  wrap.append(pfp, info);
  return wrap;
}

export const pages = {
  "/login": ({ go }) => {
    const root = card("تسجيل الدخول");
    root.style.maxWidth = "560px";
    root.style.margin = "0 auto";

    const email = input({ type:"email", placeholder:"البريد الإلكتروني" });
    const pass = input({ type:"password", placeholder:"كلمة المرور", maxLength: 30 });
    const msg = muted("");

    const loginBtn = btn("دخول", "", async () => {
      msg.textContent = "…";
      try {
        await loginEmail(email.value.trim(), pass.value);
        go("/home");
      } catch (e) {
        msg.textContent = e.message || "تعذّر الدخول.";
      }
    });

    const googleBtn = btn("Google", "secondary", async () => {
      msg.textContent = "…";
      try {
        await startGoogleRedirect();
      } catch (e) {
        msg.textContent = e.message || "تعذّر المتابعة.";
      }
    });

    const signupBtn = btn("إنشاء حساب", "secondary", () => go("/signup"));

    root.append(
      spacer(10),
      email,
      spacer(10),
      pass,
      spacer(12),
      loginBtn,
      spacer(10),
      googleBtn,
      spacer(14),
      signupBtn,
      spacer(10),
      msg
    );
    return root;
  },

  "/signup": ({ go }) => {
    const root = card("إنشاء حساب");
    root.style.maxWidth = "560px";
    root.style.margin = "0 auto";

    const username = input({ placeholder:"اسم المستخدم" });
    const gender = select([
      { value:"", label:"الجنس" },
      { value:"male", label:"ذكر" },
      { value:"female", label:"أنثى" },
      { value:"other", label:"آخر" }
    ]);

    const email = input({ type:"email", placeholder:"البريد الإلكتروني" });
    const pass = input({ type:"password", placeholder:"كلمة المرور", maxLength: 30 });
    const pass2 = input({ type:"password", placeholder:"تأكيد كلمة المرور", maxLength: 30 });

    const msg = muted("");

    const createBtn = btn("إنشاء", "", async () => {
      msg.textContent = "…";
      const u = username.value.trim();

      if (pass.value !== pass2.value) { msg.textContent = "كلمة المرور غير متطابقة."; return; }
      if (!gender.value) { msg.textContent = "اختر الجنس."; return; }

      const err = validateUsername(u);
      if (err) { msg.textContent = err; return; }

      try {
        const chk = await fx.usernameCheck({ username: u });
        if (!chk?.available) { msg.textContent = "اسم المستخدم غير متاح."; return; }

        await signupEmail({ email: email.value.trim(), password: pass.value });

        // تثبيت البيانات على السيرفر فورًا
        await fx.userCompleteProfile({ username: u, gender: gender.value });

        go("/verify-email");
      } catch (e) {
        msg.textContent = e.message || "تعذّر إنشاء الحساب.";
      }
    });

    root.append(
      spacer(10),
      username,
      spacer(10),
      gender,
      spacer(10),
      email,
      spacer(10),
      pass,
      spacer(10),
      pass2,
      spacer(12),
      createBtn,
      spacer(10),
      btn("عودة", "secondary", () => go("/login")),
      spacer(10),
      msg
    );
    return root;
  },

  "/verify-email": ({ go, authUser }) => {
    const root = card("تأكيد البريد");
    root.style.maxWidth = "560px";
    root.style.margin = "0 auto";

    root.append(
      spacer(8),
      muted(authUser?.email ? authUser.email : ""),
      spacer(10),
      muted("تم إرسال رابط التأكيد."),
      spacer(10),
      muted("تحقّق من البريد غير المرغوب فيه عند الحاجة."),
      spacer(14),
      btn("تم", "secondary", () => go("/home"))
    );
    return root;
  },

  "/complete-profile": ({ go }) => {
    const root = card("إكمال البيانات");
    root.style.maxWidth = "560px";
    root.style.margin = "0 auto";

    const username = input({ placeholder:"اسم المستخدم" });
    const gender = select([
      { value:"", label:"الجنس" },
      { value:"male", label:"ذكر" },
      { value:"female", label:"أنثى" },
      { value:"other", label:"آخر" }
    ]);

    const msg = muted("");

    const saveBtn = btn("حفظ", "", async () => {
      msg.textContent = "…";
      const u = username.value.trim();
      const err = validateUsername(u);
      if (err) { msg.textContent = err; return; }
      if (!gender.value) { msg.textContent = "اختر الجنس."; return; }

      try {
        const chk = await fx.usernameCheck({ username: u });
        if (!chk?.available) { msg.textContent = "اسم المستخدم غير متاح."; return; }

        await fx.userCompleteProfile({ username: u, gender: gender.value });
        go("/home");
      } catch (e) {
        msg.textContent = e.message || "تعذّر الحفظ.";
      }
    });

    root.append(
      spacer(10),
      username,
      spacer(10),
      gender,
      spacer(12),
      saveBtn,
      spacer(10),
      msg
    );
    return root;
  },

  "/home": ({ go, userDoc }) => {
    const root = card("الرئيسية");

    root.append(profileWidget(userDoc), spacer(14));

    const grid = document.createElement("div");
    grid.className = "grid";

    const items = [
      ["لعب", () => go("/play")],
      ["إضافة بطاقة", () => go("/add-card")],
      ["رزم البطاقات", () => go("/library")],
      ["المتجر", () => go("/shop")],
      ["التصنيف", () => go("/leaderboard")],
      ["المهمات", () => go("/missions")],
      ["طريق الإتقان", () => go("/mastery")],
      ["الأصدقاء", () => go("/friends")],
      ["التنبيهات", () => go("/notifications")],
      ["الإعدادات", () => go("/settings")]
    ];

    for (const [label, fn] of items) {
      grid.appendChild(btn(label, "secondary", fn));
    }

    root.append(grid);
    return root;
  },

  "/missions": ({ go }) => {
    const root = card("المهمات");
    root.append(spacer(10), muted("سوف يتم إضافة مهمات قريبًا."), spacer(14), btn("رجوع", "secondary", () => go("/home")));
    return root;
  },

  "/mastery": ({ go }) => {
    const root = card("طريق الإتقان");
    root.append(spacer(10), muted("سوف يتم إنشاء طريق الإتقان قريبًا."), spacer(14), btn("رجوع", "secondary", () => go("/home")));
    return root;
  },

  "/leaderboard": ({ go }) => {
    const root = card("التصنيف العالمي");

    const list = document.createElement("div");
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "10px";

    const myBox = document.createElement("div");
    myBox.className = "card";

    root.append(
      btn("رجوع", "secondary", () => go("/home")),
      spacer(12),
      list,
      spacer(12),
      myBox
    );

    (async () => {
      list.innerHTML = `<div class="muted">…</div>`;
      try {
        const top = await fx.leaderboardTop100({});
        const users = top?.users || [];
        list.innerHTML = "";

        users.forEach((u, idx) => {
          const row = document.createElement("div");
          row.className = "card";
          row.style.display = "flex";
          row.style.alignItems = "center";
          row.style.justifyContent = "space-between";
          row.style.cursor = "pointer";

          const left = document.createElement("div");
          left.style.display = "flex";
          left.style.gap = "10px";
          left.style.alignItems = "center";

          const rank = document.createElement("div");
          rank.style.minWidth = "30px";
          rank.style.fontWeight = "900";
          rank.style.color = "rgba(214,179,95,.95)";
          rank.textContent = String(idx + 1);

          const name = document.createElement("div");
          name.style.fontWeight = "800";
          name.textContent = u.username || "—";

          const meta = document.createElement("div");
          meta.className = "muted";
          meta.textContent = `المستوى ${u.level ?? 1} • ${u.ratingPoints ?? 0}`;

          const stack = document.createElement("div");
          stack.append(name, meta);

          left.append(rank, stack);

          const right = document.createElement("div");
          right.className = "muted";
          right.textContent = u.gender === "male" ? "ذكر" : u.gender === "female" ? "أنثى" : "آخر";

          row.append(left, right);

          row.onclick = () => go(`/profile/${u.uid}`);

          list.appendChild(row);
        });

        const mine = await fx.leaderboardMyRank({});
        if (mine?.inTop100) {
          myBox.innerHTML = `<div><b>مركزك:</b> ${mine.rank}</div>`;
        } else {
          myBox.innerHTML = `<div><b>ضمن أفضل:</b> ${mine.percent}%</div>`;
        }
      } catch (e) {
        list.innerHTML = `<div class="muted">${e.message || "تعذّر التحميل."}</div>`;
        myBox.innerHTML = "";
      }
    })();

    return root;
  },

  "/play": ({ go }) => {
    const root = card("اللعب");
    root.append(btn("رجوع", "secondary", () => go("/home")));
    return root;
  },
  "/add-card": ({ go }) => {
    const root = card("إضافة بطاقة");
    root.append(btn("رجوع", "secondary", () => go("/home")));
    return root;
  },
  "/library": ({ go }) => {
    const root = card("رزم البطاقات");
    root.append(btn("رجوع", "secondary", () => go("/home")));
    return root;
  },
  "/shop": ({ go }) => {
    const root = card("المتجر");
    root.append(btn("رجوع", "secondary", () => go("/home")));
    return root;
  },
  "/friends": ({ go }) => {
    const root = card("الأصدقاء");
    root.append(btn("رجوع", "secondary", () => go("/home")));
    return root;
  },
  "/notifications": ({ go }) => {
    const root = card("التنبيهات");
    root.append(btn("رجوع", "secondary", () => go("/home")));
    return root;
  },
  "/settings": ({ go }) => {
    const root = card("الإعدادات");
    root.append(btn("رجوع", "secondary", () => go("/home")));
    return root;
  }
};