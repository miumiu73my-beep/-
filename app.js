import { SCREEN_META } from "./data/app-data.js";
import {
  getCurrentDateTime,
  getElapsedMilliseconds,
  getTimeSnapshot,
} from "./data/time.js";
import { loadGameData, saveGameData } from "./save/storage.js";
import { renderLabScreen } from "./screens/lab.js";
import {
  applyFieldAction,
  FIELD_TOOLS,
  renderFieldScreen,
} from "./screens/field.js";
import { renderHomeScreen } from "./screens/home.js";

const screenRoot = document.querySelector("#screen-root");
const screenCaption = document.querySelector("#screen-caption");
const navButtons = [...document.querySelectorAll("[data-screen]")];

const renderers = {
  lab: renderLabScreen,
  field: renderFieldScreen,
  home: renderHomeScreen,
};

let activeScreen = null;
let gameState = null;
let session = null;
let savePromise = Promise.resolve();
let fieldTool = "till";
let fieldNotice = "タネを買い、畑を耕してから種まきしてください。";

function normalizeScreen(value) {
  return Object.hasOwn(renderers, value) ? value : "field";
}

function buildRenderContext() {
  const now = getCurrentDateTime();

  return {
    now,
    time: getTimeSnapshot(now),
    session,
    saveData: gameState,
    fieldTool,
    fieldNotice,
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

function persistGameState(savedAt = getCurrentDateTime()) {
  if (!gameState) return Promise.resolve(null);

  savePromise = savePromise
    .catch(() => null)
    .then(async () => {
      gameState = await saveGameData(gameState, savedAt);
      return gameState;
    })
    .catch((error) => {
      console.warn("Autosave failed:", error);
      return null;
    });

  return savePromise;
}

function refreshHomeIfVisible() {
  if (activeScreen === "home") {
    renderScreen("home", { syncHash: false });
  }
}

function runFieldAction(action, options = {}) {
  const result = applyFieldAction(gameState, {
    action,
    now: getCurrentDateTime(),
    ...options,
  });

  fieldNotice = result.message;

  if (result.changed) {
    void persistGameState();
  }

  renderScreen("field", { syncHash: false });
}

function handleFieldInteraction(event) {
  if (activeScreen !== "field") return;

  const toolButton = event.target.closest("[data-field-tool]");
  if (toolButton) {
    const nextTool = toolButton.dataset.fieldTool;

    if (FIELD_TOOLS[nextTool]) {
      fieldTool = nextTool;
      fieldNotice = `「${FIELD_TOOLS[nextTool].label}」を選びました。畑マスをタップしてください。`;
      renderScreen("field", { syncHash: false });
    }

    return;
  }

  const buyButton = event.target.closest("[data-field-buy]");
  if (buyButton) {
    runFieldAction("buy", { cropId: buyButton.dataset.fieldBuy });
    return;
  }

  const plotButton = event.target.closest("[data-plot-index]");
  if (plotButton) {
    runFieldAction(fieldTool, {
      plotIndex: Number(plotButton.dataset.plotIndex),
    });
  }
}

async function bootstrap() {
  const bootTime = getCurrentDateTime();

  gameState = await loadGameData();

  const previousSavedAt = gameState.lastSavedAt
    ? new Date(gameState.lastSavedAt)
    : null;

  session = Object.freeze({
    previousSavedAt,
    elapsedSinceLastSaveMs: getElapsedMilliseconds(previousSavedAt, bootTime),
  });

  // 起動できた時点を自動保存する。sessionには起動前の値を保持する。
  await persistGameState(bootTime);

  for (const button of navButtons) {
    button.addEventListener("click", () => {
      renderScreen(button.dataset.screen);
    });
  }

  screenRoot.addEventListener("click", handleFieldInteraction);

  window.addEventListener("hashchange", () => {
    renderScreen(location.hash.slice(1), { syncHash: false });
  });

  window.addEventListener("pagehide", () => {
    void persistGameState();
  });

  window.addEventListener("pageshow", refreshHomeIfVisible);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      void persistGameState();
    } else {
      refreshHomeIfVisible();
    }
  });

  setInterval(() => {
    void persistGameState();
    refreshHomeIfVisible();
  }, 30_000);

  renderScreen(location.hash.slice(1));
}

bootstrap().catch((error) => {
  console.error("App startup failed:", error);
  screenRoot.innerHTML = `
    <section class="scene">
      <div class="scene-card">
        <p class="scene-kicker">起動エラー</p>
        <h2>セーブデータを読み込めませんでした</h2>
        <p>ページを再読み込みしてください。</p>
      </div>
    </section>
  `;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("Service Worker registration failed:", error);
    });
  });
}
