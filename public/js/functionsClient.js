import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js";
import { functions } from "./firebase.js";

function call(name) {
  const fn = httpsCallable(functions, name);
  return async (data = {}) => {
    try {
      const res = await fn(data);
      return res.data;
    } catch (e) {
      const msg = e?.message || "تعذّر إتمام العملية.";
      const err = new Error(msg);
      err.code = e?.code;
      throw err;
    }
  };
}

export const fx = {
  userGetMe: call("user_getMe"),
  userCompleteProfile: call("user_completeProfile"),
  usernameCheck: call("username_check"),
  leaderboardTop100: call("leaderboard_top100"),
  leaderboardMyRank: call("leaderboard_myRank"),
  touchLastSeen: call("user_touchLastSeen")
};