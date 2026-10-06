import { SCREEN_META } from "./data/app-data.js";
import { DEFAULT_CROP_ID, getCrop } from "./data/crops.js";
import { applyResearchAction } from "./data/research.js";
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
let fieldCropId = DEFAULT_CROP_ID;
let fieldNotice = "育てる野菜を選び、タネを買ってから畑を耕して種まきしてください。";
let labNotice = "研究所の利用は任意です。気になる講座や本から、好きな時に進めてください。";

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
    fieldCropId,
    fieldNotice,
    labNotice,
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

function refreshTimeDrivenScreen() {
  if (activeScreen === "home" || activeScreen === "field") {
    renderScreen(activeScreen, { syncHash: false });
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

  const cropButton = event.target.closest("[data-field-crop]");
  if (cropButton) {
    const nextCropId = cropButton.dataset.fieldCrop;
    const crop = getCrop(nextCropId);

    if (crop) {
      fieldCropId = crop.id;
      fieldNotice = `${crop.name}を選びました。タネを用意して「種まき」で畑マスをタップしてください。`;
      renderScreen("field", { syncHash: false });
    }

    return;
  }

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
    const cropId = buyButton.dataset.fieldBuy;
    if (getCrop(cropId)) {
      fieldCropId = cropId;
    }
    runFieldAction("buy", { cropId });
    return;
  }

  const expandButton = event.target.closest("[data-field-expand]");
  if (expandButton) {
    runFieldAction("expand");
    return;
  }

  const plotButton = event.target.closest("[data-plot-index]");
  if (plotButton) {
    runFieldAction(fieldTool, {
      plotIndex: Number(plotButton.dataset.plotIndex),
      cropId: fieldCropId,
    });
  }
}

function runLabAction(action, id) {
  const result = applyResearchAction(gameState, {
    action,
    id,
    now: getCurrentDateTime(),
  });

  labNotice = result.message;

  if (result.changed) {
    void persistGameState();
  }

  renderScreen("lab", { syncHash: false });
}

function handleLabInteraction(event) {
  if (activeScreen !== "lab") return;

  const courseButton = event.target.closest("[data-lab-course]");
  if (courseButton) {
    runLabAction("course", courseButton.dataset.labCourse);
    return;
  }

  const studyButton = event.target.closest("[data-lab-study]");
  if (studyButton) {
    runLabAction("study", studyButton.dataset.labStudy);
    return;
  }

  const characterButton = event.target.closest("[data-lab-character]");
  if (characterButton) {
    runLabAction("character", characterButton.dataset.labCharacter);
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
  // 作物の放置成長はplantedAtから現在時刻を計算するため、
  // この保存で起動前の成長時間が失われることはない。
  await persistGameState(bootTime);

  for (const button of navButtons) {
    button.addEventListener("click", () => {
      renderScreen(button.dataset.screen);
    });
  }

  screenRoot.addEventListener("click", handleFieldInteraction);
  screenRoot.addEventListener("click", handleLabInteraction);

  window.addEventListener("hashchange", () => {
    renderScreen(location.hash.slice(1), { syncHash: false });
  });

  window.addEventListener("pagehide", () => {
    void persistGameState();
  });

  window.addEventListener("pageshow", refreshTimeDrivenScreen);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      void persistGameState();
    } else {
      // バックグラウンド中に経過した現実時間を、復帰直後の畑表示へ反映する。
      refreshTimeDrivenScreen();
    }
  });

  setInterval(() => {
    void persistGameState();
    // 自宅の時計だけでなく、畑の現実時間成長も一定間隔で再描画する。
    refreshTimeDrivenScreen();
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
