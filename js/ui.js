import { tr } from "./i18n.js";

import { playSfx } from "./audio.js";

export function h(tag, attrs={}, ...children){
  const el = document.createElement(tag);

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
    if(typeof c === "string") el.appendChild(document.createTextNode(tr(c)));
    else el.appendChild(c);
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
