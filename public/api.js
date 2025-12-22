import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-functions.js";
import { functions } from "./firebase.js";

const call = (name) => httpsCallable(functions, name);

export const api = {
  completeProfile: call("completeProfile"),
  createCard: call("createCard"),
  applyRewards: call("applyRewards"),
  finishLesson: call("finishLesson"),
  getTop100: call("getTop100"),
  getMyPercentile: call("getMyPercentile"),
  getSeasonInfo: call("getSeasonInfo"),
};
