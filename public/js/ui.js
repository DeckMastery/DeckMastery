import { logout } from "./auth.js";

const appEl = document.getElementById("app");
const splashEl = document.getElementById("splash");
const topbarRight = document.getElementById("topbarRight");

export function showSplash(on) {
  splashEl?.classList.toggle("hidden", !on);
}

export async function render(node) {
  appEl.innerHTML = "";
  appEl.appendChild(node);
}

export function setTopbar({ authed, go }) {
  topbarRight.innerHTML = "";

  if (!authed) {
    const b = btn("تسجيل الدخول", "secondary", () => go("/login"));
    topbarRight.appendChild(b);
    return;
  }

  const home = btn("الرئيسية", "secondary", () => go("/home"));
  const out = btn("خروج", "", async () => { await logout(); go("/login"); });

  topbarRight.append(home, out);
}

export function btn(text, variant = "", onClick) {
  const b = document.createElement("button");
  b.className = `btn ${variant}`.trim();
  b.type = "button";
  b.textContent = text;
  b.onclick = onClick;
  return b;
}

export function input({ type="text", placeholder="", maxLength=null }) {
  const i = document.createElement("input");
  i.className = "input";
  i.type = type;
  i.placeholder = placeholder;
  if (maxLength != null) i.maxLength = String(maxLength);
  return i;
}

export function select(options) {
  const s = document.createElement("select");
  s.className = "input";
  for (const { value, label } of options) {
    const o = document.createElement("option");
    o.value = value;
    o.textContent = label;
    s.appendChild(o);
  }
  return s;
}

export function card(titleText) {
  const c = document.createElement("div");
  c.className = "card";
  if (titleText) {
    const h = document.createElement("div");
    h.className = "h1";
    h.textContent = titleText;
    c.appendChild(h);
  }
  return c;
}

export function muted(text) {
  const d = document.createElement("div");
  d.className = "muted";
  d.textContent = text;
  return d;
}

export function spacer(h=10) {
  const d = document.createElement("div");
  d.style.height = `${h}px`;
  return d;
}