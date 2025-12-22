import { watchAuth, finishGoogleRedirectIfAny, postAuthSync } from "./auth.js";
import { fx } from "./functionsClient.js";
import { render, setTopbar, showSplash } from "./ui.js";
import { pages } from "./pages.js";

let authUser = null;
let userDoc = null;

let authReady = false;
let userReady = false;

function path() {
  const h = location.hash.replace("#", "");
  return h.startsWith("/") ? h : "/home";
}
function go(p) {
  if (!p.startsWith("/")) p = "/" + p;
  location.hash = p;
}

function canAccess(p) {
  const publicRoutes = ["/login", "/signup", "/verify-email", "/complete-profile"];
  const isPublic = publicRoutes.includes(p);

  if (!authUser) {
    return isPublic ? { ok:true } : { ok:false, to:"/login" };
  }

  if (!authUser.emailVerified && p !== "/verify-email") {
    return { ok:false, to:"/verify-email" };
  }

  if (authUser.emailVerified && userDoc && userDoc.profileComplete === false && p !== "/complete-profile") {
    return { ok:false, to:"/complete-profile" };
  }

  if (authUser.emailVerified && userDoc?.profileComplete && isPublic) {
    return { ok:false, to:"/home" };
  }

  return { ok:true };
}

async function loadUserFromServer() {
  userReady = false;
  try {
    const me = await fx.userGetMe({});
    userDoc = me?.user || null;
  } catch {
    userDoc = null;
  } finally {
    userReady = true;
  }
}

async function route() {
  const p = path();
  showSplash(true);

  if (!authReady) return;

  if (authUser && !userReady) {
    await loadUserFromServer();
  }

  const gate = canAccess(p);
  if (!gate.ok) {
    go(gate.to);
    showSplash(false);
    return;
  }

  const pageFn = pages[p] || pages["/home"];
  await render(pageFn({ go, authUser, userDoc }));

  setTopbar({ authed: !!authUser, go });
  showSplash(false);
}

await finishGoogleRedirectIfAny();

watchAuth(async (u) => {
  authUser = u || null;
  authReady = true;

  userDoc = null;
  userReady = !authUser;

  if (authUser) {
    try { await postAuthSync(); } catch {}
    await loadUserFromServer();
  }

  await route();
});

window.addEventListener("hashchange", route);
window.addEventListener("load", () => {
  if (!location.hash) location.hash = "/home";
  route();
});