
import { playSfx } from "./audio.js";

export function h(tag, attrs={}, ...children){
  const el = document.createElement(tag);
  for(const [k,v] of Object.entries(attrs||{})){
    if(k==="class") el.className = v;
    else if(k==="html") el.innerHTML = v;
    else if(k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if(v === false || v === null || v === undefined) {}
    else el.setAttribute(k, String(v));
  }
  for(const c of children.flat()){
    if(c === null || c === undefined || c === false) continue;
    if(typeof c === "string") el.appendChild(document.createTextNode(c));
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
    h("button",{class:"icon-btn", "data-sfx":"close", ariaLabel:"إغلاق", onClick: ()=> close()}, h("i",{ "data-lucide":"x"}))
  );
  const act = h("div",{class:"row"}, ...actions.map(a=>{
    const btn = h("button",{class:`btn ${a.kind||"ghost"}`, "data-sfx": a.sfx||"tap_secondary", onClick: ()=> a.onClick(close)}, a.label);
    return btn;
  }));
  panel.append(head, h("div",{class:"hr"}), bodyNode, actions.length? h("div",{class:"hr"}):null, actions.length? act:null);
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
