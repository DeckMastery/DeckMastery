import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  reload
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { auth } from "./firebase.js";
import { fx } from "./functionsClient.js";

export function watchAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

export async function loginEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await reload(cred.user);
  return cred.user;
}

export async function signupEmail({ email, password }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(cred.user);
  await reload(cred.user);
  return cred.user;
}

export async function startGoogleRedirect() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await signInWithRedirect(auth, provider);
}

export async function finishGoogleRedirectIfAny() {
  try {
    const res = await getRedirectResult(auth);
    return res?.user || null;
  } catch {
    return null;
  }
}

export async function logout() {
  await signOut(auth);
}

export async function postAuthSync() {
  try { await fx.touchLastSeen({}); } catch {}
}