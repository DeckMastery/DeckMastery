export const ASSETS = {
  frame: {
    woodDefault: "./assets/profile/frame-wood.png"
  },
  background: {
    femaleDefault: "./assets/profile/bg-female.png",
    maleDefault: "./assets/profile/bg-male.png",
    otherDefault: "./assets/profile/bg-other.png"
  },
  avatar: {
    femaleDefault: "./assets/profile/avatar-female.png",
    maleDefault: "./assets/profile/avatar-male.png",
    otherDefault: "./assets/profile/avatar-other.png"
  }
};

export function defaultsByGender(gender) {
  if (gender === "female") {
    return { frameKey: "woodDefault", bgKey: "femaleDefault", avatarKey: "femaleDefault" };
  }
  if (gender === "male") {
    return { frameKey: "woodDefault", bgKey: "maleDefault", avatarKey: "maleDefault" };
  }
  return { frameKey: "woodDefault", bgKey: "otherDefault", avatarKey: "otherDefault" };
}
