import { registerRoute, render, replace } from "./router.js";
import { watchAuthState } from "./auth.js";

import { renderLogin } from "./pages/login.js";
import { renderSignup } from "./pages/signup.js";
import { renderForgot } from "./pages/forgot-password.js";
import { renderCompleteProfile } from "./pages/complete-profile.js";

import { renderHome } from "./pages/home.js";
import { renderLeaderboard } from "./pages/leaderboard.js";
import { renderSettings } from "./pages/settings.js";

import { renderPlay } from "./pages/play.js";
import { renderAddCard } from "./pages/add-card.js";
import { renderLibrary } from "./pages/library.js";
import { renderShop } from "./pages/shop.js";
import { renderTasks } from "./pages/tasks.js";
import { renderPath } from "./pages/path.js";
import { renderFriends } from "./pages/friends.js";
import { renderNotifications } from "./pages/notifications.js";

registerRoute("/login", renderLogin);
registerRoute("/signup", renderSignup);
registerRoute("/forgot-password", renderForgot);
registerRoute("/complete-profile", renderCompleteProfile);

registerRoute("/", renderHome);
registerRoute("/leaderboard", renderLeaderboard);
registerRoute("/settings", renderSettings);

registerRoute("/play", renderPlay);
registerRoute("/add-card", renderAddCard);
registerRoute("/library", renderLibrary);
registerRoute("/shop", renderShop);
registerRoute("/tasks", renderTasks);
registerRoute("/path", renderPath);
registerRoute("/friends", renderFriends);
registerRoute("/notifications", renderNotifications);

registerRoute("/404", () => {
  document.getElementById("app").innerHTML = `<div class="page"><div class="card">404</div></div>`;
});

watchAuthState({
  onReady: ({ user }) => {
    if (!user && location.pathname === "/") replace("/login");
    render();
  },
});
