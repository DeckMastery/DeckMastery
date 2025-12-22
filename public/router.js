const routes = new Map();

export function registerRoute(path, renderFn) {
  routes.set(path, renderFn);
}

export function go(path) {
  history.pushState({}, "", path);
  render();
}

export function replace(path) {
  history.replaceState({}, "", path);
  render();
}

export function currentPath() {
  return location.pathname || "/";
}

export function render() {
  const fn = routes.get(currentPath()) || routes.get("/404");
  if (fn) fn();
}

window.addEventListener("popstate", render);
