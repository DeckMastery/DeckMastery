import { tr } from "./i18n.js";

import { playSfx } from "./audio.js";

// --- Bidi / RTL punctuation fix ---
// In RTL UI, mixed-direction text that starts with neutral chars (e.g. '-', '.', '(')
// can visually "jump" to the other side. We wrap text in <bdi dir="auto"> and
// (when needed) prefix an explicit directional mark to anchor leading neutrals.
const _RTL_STRONG_RE = /[\u0590-\u08FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
const _LTR_STRONG_RE = /[A-Za-z\u00C0-\u024F]/;
const _DIGIT_RE = /[0-9]/;

function _detectStrongDir(s){
  if(!s) return null;
  for(const ch of s){
    if(_RTL_STRONG_RE.test(ch)) return "rtl";
    if(_LTR_STRONG_RE.test(ch) || _DIGIT_RE.test(ch)) return "ltr";
  }
  return null;
}
function _isStrong(ch){
  return _RTL_STRONG_RE.test(ch) || _LTR_STRONG_RE.test(ch) || _DIGIT_RE.test(ch);
}
function _needsLeadingMark(s){
  if(!s) return false;
  let i = 0;
  while(i < s.length && /\s/.test(s[i])) i++;
  if(i >= s.length) return false;
  return !_isStrong(s[i]); // starts (after spaces) with neutral punctuation/symbol
}
function _addLeadingMarkIfNeeded(s){
  const dir = _detectStrongDir(s);
  if(!dir) return s;
  if(!_needsLeadingMark(s)) return s;
  const mark = (dir === "rtl") ? "\u200F" : "\u200E"; // RLM / LRM
  return mark + s;
}


export function h(tag, attrs={}, ...children){
  const el = document.createElement(tag);

  // In RTL UI, let text inputs decide their own direction (auto) to avoid bidi issues
  // with mixed LTR/RTL content and leading punctuation.
  try{
    if((tag === "input" || tag === "textarea") && document.documentElement.dir === "rtl"){
      if(!("dir" in (attrs||{}))) el.setAttribute("dir","auto");
    }
  }catch(_){}

  // Wrap click handlers so the global SFX delegator can play sounds
  // ONLY when the action actually runs (handler returns !== false).
  const wrapClick = (fn) => {
    if (typeof fn !== "function") return fn;
    return (e) => {
      let r;
      try {
        r = fn(e);
      } finally {
        try {
          // Only wireSfx() should read this.
          if (e && typeof e === "object") e.__dm_sfx_ok = (r !== false);
        } catch (_) {}
      }
      return r;
    };
  };

  const TRANSLATE_ATTRS = new Set(["placeholder","title","alt","aria-label","ariaLabel","label","value"]);
  for(const [k,v] of Object.entries(attrs||{})){
    const vv = (typeof v === "string" && TRANSLATE_ATTRS.has(k)) ? tr(v) : v;
    if(k==="class") el.className = vv;
    else if(k==="html") el.innerHTML = vv;
    else if(k==="on" && vv && typeof vv === "object"){
      for(const [ev, fn] of Object.entries(vv)){
        if(typeof fn === "function"){
          el.addEventListener(ev, ev === "click" ? wrapClick(fn) : fn);
        }
      }
    }
    else if(k.startsWith("on") && typeof vv === "function"){
      const ev = k.slice(2).toLowerCase();
      el.addEventListener(ev, ev === "click" ? wrapClick(vv) : v);
    }
    else if(vv === false || vv === null || vv === undefined) {}
    else el.setAttribute(k, String(vv));
  }
  for(const c of children.flat()){
    if(c === null || c === undefined || c === false) continue;

    if(typeof c === "string"){
      const t = _addLeadingMarkIfNeeded(tr(c));
      // In RTL UI, wrap strings in <bdi dir="auto"> so punctuation stays where it belongs.
      if(document && document.documentElement && document.documentElement.dir === "rtl"){
        const b = document.createElement("bdi");
        b.setAttribute("dir","auto");
        b.className = "bidi";
        b.textContent = t;
        el.appendChild(b);
      }else{
        el.appendChild(document.createTextNode(t));
      }
      continue;
    }

    el.appendChild(c);
  }
  return el;
}

export function clear(el){ el.innerHTML = ""; }

export function toast(msg){
  const root = document.body;
  const t = h("div", {class:"toast glass gold"}, h("div", {class:"panel"}, msg));
  root.appendChild(t);
  try{ playSfx("popup"); }catch{}
  requestAnimationFrame(()=>{
    t.style.opacity = "0";
    t.style.transform = "translateX(-50%) translateY(8px)";
    t.style.transition = "opacity .18s ease, transform .18s ease";
    t.style.opacity = "1";
    t.style.transform = "translateX(-50%) translateY(0)";
  });
  setTimeout(()=>{
    t.style.opacity = "0";
    t.style.transform = "translateX(-50%) translateY(8px)";
    setTimeout(()=> t.remove(), 220);
  }, 1600);
}

export function modal(title, bodyNode, actions=[]){
  const backdrop = h("div", {class:"modal-backdrop"});
  const box = h("div", {class:"modal glass gold"});
  const panel = h("div", {class:"panel"});
  const head = h("div", {class:"panel-title"}, h("h2",{class:"h1"}, title),
    h("button",{class:"icon-btn", "data-sfx":"close", ariaLabel:"إغلاق", onClick: ()=> close()}, h("i",{class:"fas fa-xmark", ariaHidden:"true"}))
  );
  const act = h("div",{class:"row"}, ...actions.map(a=>{
    const btn = h("button",{class:`btn ${a.kind||"ghost"}`, "data-sfx": a.sfx||"tap_secondary", onClick: ()=> a.onClick(close)}, a.label);
    return btn;
  }));
  const bodyWrap = h("div",{class:"modal-body"}, bodyNode);
panel.append(head, h("div",{class:"hr"}), bodyWrap, actions.length? h("div",{class:"hr"}):null, actions.length? act:null);
  box.appendChild(panel);
  backdrop.appendChild(box);

  function close(){
    backdrop.remove();
  }
  document.getElementById("modalRoot").appendChild(backdrop);
  window.lucide?.createIcons?.();
  return { close };
}

export function placeholderPage(text){
  return h("section",{class:"glass gold panel center"}, h("div",{class:"subtle"}, text));
}

// Tooltip صغير مرتبط بعنصر (للرسائل السريعة بدون توست عام)
export function tip(anchorEl, msg, ms=1200){
  if(!anchorEl) return;
  const t = h("div", {class:"tooltip glass gold"}, h("div", {class:"panel"}, msg));
  document.body.appendChild(t);
  try{ playSfx("popup"); }catch{}

  // موضع فوق الزر (مع ضمان البقاء داخل الشاشة)
  const r = anchorEl.getBoundingClientRect();
  const cx = r.left + r.width/2;
  // render ثم احسب العرض الحقيقي
  requestAnimationFrame(()=>{
    const tw = t.offsetWidth || 220;
    const th = t.offsetHeight || 44;
    const pad = 10;
    let left = cx - tw/2;
    left = Math.max(pad, Math.min(left, window.innerWidth - tw - pad));
    let top = r.top - th - 10;
    if(top < pad) top = r.bottom + 10;
    t.style.left = `${left}px`;
    t.style.top = `${top}px`;
    t.style.opacity = "0";
    t.style.transform = "translateY(6px)";
    t.style.transition = "opacity .16s ease, transform .16s ease";
    // fade in
    requestAnimationFrame(()=>{
      t.style.opacity = "1";
      t.style.transform = "translateY(0)";
    });
  });

  setTimeout(()=>{
    t.style.opacity = "0";
    t.style.transform = "translateY(6px)";
    setTimeout(()=> t.remove(), 220);
  }, ms);
}