import { SCREEN_META } from "./data/app-data.js";
import {
  getCurrentDateTime,
  getElapsedMilliseconds,
  getTimeSnapshot,
} from "./data/time.js";
import { loadLastSavedAt, saveLastSavedAt } from "./save/time-checkpoint.js";
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

const bootTime = getCurrentDateTime();
const previousSavedAt = loadLastSavedAt();
const session = Object.freeze({
  previousSavedAt,
  elapsedSinceLastSaveMs: getElapsedMilliseconds(previousSavedAt, bootTime),
});

let activeScreen = null;
saveLastSavedAt(bootTime);

function normalizeScreen(value) {
  return Object.hasOwn(renderers, value) ? value : "field";
}

function buildRenderContext() {
  const now = getCurrentDateTime();
  return {
    now,
    time: getTimeSnapshot(now),
    session,
  };
}

function renderScreen(screenKey, { syncHash = true } = {}) {
  const nextScreen = normalizeScreen(screenKey);
  activeScreen = nextScreen;

  screenRoot.innerHTML = renderers[nextScreen](buildRenderContext());
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

function saveTimeCheckpoint() {
  saveLastSavedAt(getCurrentDateTime());
}

function refreshHomeIfVisible() {
  if (activeScreen === "home") {
    renderScreen("home", { syncHash: false });
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

window.addEventListener("pagehide", saveTimeCheckpoint);
window.addEventListener("pageshow", refreshHomeIfVisible);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    saveTimeCheckpoint();
  } else {
    refreshHomeIfVisible();
  }
});

setInterval(refreshHomeIfVisible, 30_000);

renderScreen(location.hash.slice(1));

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("Service Worker registration failed:", error);
    });
  });
}
