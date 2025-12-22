import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import { auth } from "./firebase.js";
import { getUserProfile } from "./db.js";
import { replace } from "./router.js";

export function watchAuthState({ onReady } = {}) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      if (!isPublicRoute()) replace("/login");
      onReady?.({ user: null, profile: null });
      return;
    }

    const isPasswordProvider = user.providerData.some((p) => p.providerId === "password");
    if (isPasswordProvider && !user.emailVerified) {
      await signOut(auth);
      replace("/login");
      onReady?.({ user: null, profile: null, unverified: true });
      return;
    }

    const profile = await getUserProfile(user.uid);

    if (profile && profile.profileComplete === false) {
      if (location.pathname !== "/complete-profile") replace("/complete-profile");
      onReady?.({ user, profile });
      return;
    }

    if (isPublicRoute() && location.pathname !== "/complete-profile") {
      replace("/");
    }

    onReady?.({ user, profile });
  });
}

function isPublicRoute() {
  return ["/login", "/signup", "/forgot-password", "/complete-profile"].includes(location.pathname);
}

export async function loginEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  if (!cred.user.emailVerified) {
    await signOut(auth);
    throw new Error("EMAIL_NOT_VERIFIED");
  }
  return cred.user;
}

export async function signupEmail({ email, password }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(cred.user);
  await signOut(auth);
  return true;
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
  return true;
}

export async function loginGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}
