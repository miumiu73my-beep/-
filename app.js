import { SCREEN_META } from "./data/app-data.js";
import { renderLabScreen } from "./screens/lab.js";
import { renderFieldScreen } from "./screens/field.js";
import { renderHomeScreen } from "./screens/home.js";

const screenRoot = document.querySelector("#screen-root");
const screenCaption = document.querySelector("#screen-caption");
const navButtons = [...document.querySelectorAll("[data-screen]")];

const renderers = {
  lab: renderLabScreen,
  field: renderFieldScreen,
  home: renderHomeScreen,
};

function normalizeScreen(value) {
  return Object.hasOwn(renderers, value) ? value : "field";
}

function renderScreen(screenKey, { syncHash = true } = {}) {
  const nextScreen = normalizeScreen(screenKey);

  screenRoot.innerHTML = renderers[nextScreen]();
  screenRoot.dataset.screen = nextScreen;
  screenCaption.textContent = SCREEN_META[nextScreen].label;

  for (const button of navButtons) {
    const active = button.dataset.screen === nextScreen;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  }

  if (syncHash && location.hash !== `#${nextScreen}`) {
    history.replaceState(null, "", `#${nextScreen}`);
  }
}

for (const button of navButtons) {
  button.addEventListener("click", () => {
    renderScreen(button.dataset.screen);
  });
}

window.addEventListener("hashchange", () => {
  renderScreen(location.hash.slice(1), { syncHash: false });
});

renderScreen(location.hash.slice(1));

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("Service Worker registration failed:", error);
    });
  });
}
