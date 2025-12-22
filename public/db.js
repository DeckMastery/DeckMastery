import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import { db } from "./firebase.js";

export function userRef(uid) {
  return doc(db, "users", uid);
}

export async function getUserProfile(uid) {
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? snap.data() : null;
}

export function watchUserProfile(uid, cb) {
  return onSnapshot(userRef(uid), (snap) => {
    cb(snap.exists() ? snap.data() : null);
  });
}

export async function isUsernameTaken(username) {
  const q = query(collection(db, "usernames"), where("username", "==", username));
  const res = await getDocs(q);
  return !res.empty;
}
