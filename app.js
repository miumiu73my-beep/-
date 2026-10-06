import { SCREEN_META } from "./data/app-data.js";
import {
  CHARACTER_KEYS,
  getCharacter,
  getFavoriteCharacter,
} from "./data/characters.js";
import { getDateChoice, getDateEvent } from "./data/dates.js";
import {
  hasCompletedNameSetup,
  NAME_MODES,
  normalizePlayerName,
} from "./data/names.js";
import { DEFAULT_CROP_ID, getCrop } from "./data/crops.js";
import { applyResearchAction } from "./data/research.js";
import {
  getCurrentDateTime,
  getElapsedMilliseconds,
  getTimeSnapshot,
} from "./data/time.js";
import {
  createSaveExport,
  getSaveHealth,
  importGameData,
  loadGameData,
  resetGameData,
  restoreLatestBackup,
  saveGameData,
} from "./save/storage.js";
import { renderLabScreen } from "./screens/lab.js";
import {
  applyFieldAction,
  FIELD_TOOLS,
  renderFieldScreen,
} from "./screens/field.js";
import { renderHomeScreen } from "./screens/home.js";
import { renderInitialNameSetup } from "./screens/name-settings.js";
import {
  renderCharacterStage,
  renderFieldWalkers,
} from "./screens/characters.js";

const screenRoot = document.querySelector("#screen-root");
const screenCaption = document.querySelector("#screen-caption");
const navButtons = [...document.querySelectorAll("[data-screen]")];
const nameSetupRoot = document.querySelector("#name-setup-root");

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
let dateSession = null;
let saveNotice = null;
let saveMutationInProgress = false;

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
    dateSession,
    saveHealth: getSaveHealth(),
    saveNotice,
  };
}

function activateCharacterAssets() {
  for (const image of screenRoot.querySelectorAll("[data-character-asset]")) {
    const wrapper = image.closest("[data-character-art]");
    if (!wrapper) continue;

    const sync = () => {
      const available = image.complete && image.naturalWidth > 0;
      wrapper.classList.toggle("has-image", available);
    };

    image.addEventListener("load", sync, { once: true });
    image.addEventListener("error", sync, { once: true });

    if (image.complete) sync();
  }
}

function decorateCharacterSystem(screenKey, context) {
  const scene = screenRoot.querySelector(".scene");
  if (!scene) return;

  scene.insertAdjacentHTML(
    "afterbegin",
    renderCharacterStage(gameState, screenKey, context)
  );

  if (screenKey === "field") {
    const plotWrap = scene.querySelector(".plot-wrap");
    if (plotWrap) {
      plotWrap.insertAdjacentHTML("beforeend", renderFieldWalkers());
    }
  }

  activateCharacterAssets();
}

function renderScreen(screenKey, { syncHash = true } = {}) {
  const nextScreen = normalizeScreen(screenKey);
  activeScreen = nextScreen;

  const context = buildRenderContext();

  screenRoot.innerHTML = renderers[nextScreen](context);
  decorateCharacterSystem(nextScreen, context);
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
  if (!gameState || saveMutationInProgress) return Promise.resolve(gameState);

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
  if (activeScreen === "home") {
    const now = getCurrentDateTime();
    if (!getTimeSnapshot(now).isWeekend) {
      dateSession = null;
    }
    renderScreen("home", { syncHash: false });
    return;
  }

  if (activeScreen === "field" || activeScreen === "lab") {
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

function syncNameSetupOverlay() {
  if (!nameSetupRoot || !gameState) return;

  const needsSetup = !hasCompletedNameSetup(gameState);
  nameSetupRoot.innerHTML = needsSetup
    ? renderInitialNameSetup(gameState)
    : "";
  document.body.classList.toggle("has-name-setup", needsSetup);
}

async function handleNameSettingsSubmit(event) {
  const form = event.target.closest("[data-name-settings-form]");
  if (!form || !gameState) return;

  event.preventDefault();

  const formData = new FormData(form);
  const customName = normalizePlayerName(formData.get("customName"));
  const errorElement = form.querySelector("[data-name-error]");

  if (!customName) {
    if (errorElement) {
      errorElement.textContent = "主人公の任意名を入力してください。";
    }
    form.querySelector('[name="customName"]')?.focus();
    return;
  }

  gameState.player ??= {};
  gameState.player.customName = customName;
  gameState.player.nameModeByCharacter ??= {};

  for (const characterKey of CHARACTER_KEYS) {
    const requestedMode = formData.get(`nameMode:${characterKey}`);

    gameState.player.nameModeByCharacter[characterKey] =
      requestedMode === NAME_MODES.CUSTOM_NAME
        ? NAME_MODES.CUSTOM_NAME
        : NAME_MODES.RECEIVER_NAME;
  }

  await persistGameState();
  syncNameSetupOverlay();
  renderScreen(activeScreen ?? "field", { syncHash: false });
}

function handleCharacterInteraction(event) {
  const button = event.target.closest("[data-character-select]");
  if (!button || !activeScreen || !gameState) return;

  const character = getCharacter(button.dataset.characterSelect);
  if (!character) return;

  gameState.player ??= {};

  if (gameState.player.favoriteCharacter !== character.key) {
    gameState.player.favoriteCharacter = character.key;

    if (activeScreen === "home") {
      dateSession = null;
    }

    void persistGameState();
  }

  renderScreen(activeScreen, { syncHash: false });
}

function handleHomeInteraction(event) {
  if (activeScreen !== "home" || !gameState) return;

  const now = getCurrentDateTime();
  const isWeekend = getTimeSnapshot(now).isWeekend;

  if (!isWeekend) {
    if (dateSession) {
      dateSession = null;
      renderScreen("home", { syncHash: false });
    }
    return;
  }

  const startButton = event.target.closest("[data-date-start]");
  if (startButton) {
    const character = getFavoriteCharacter(gameState);
    const requestedCharacter = startButton.dataset.dateCharacter;
    const dateEvent = getDateEvent(character.key, startButton.dataset.dateStart);

    if (requestedCharacter !== character.key || !dateEvent) return;

    dateSession = {
      characterKey: character.key,
      eventId: dateEvent.id,
      choiceId: null,
    };
    renderScreen("home", { syncHash: false });
    return;
  }

  const choiceButton = event.target.closest("[data-date-choice]");
  if (choiceButton && dateSession) {
    const dateEvent = getDateEvent(
      dateSession.characterKey,
      dateSession.eventId
    );
    const choice = getDateChoice(dateEvent, choiceButton.dataset.dateChoice);

    if (!dateEvent || !choice) return;

    dateSession = {
      ...dateSession,
      choiceId: choice.id,
    };
    renderScreen("home", { syncHash: false });
    return;
  }

  const backButton = event.target.closest("[data-date-back]");
  const endButton = event.target.closest("[data-date-end]");

  if ((backButton || endButton) && dateSession) {
    dateSession = null;
    renderScreen("home", { syncHash: false });
  }
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

function setSaveNotice(type, text) {
  saveNotice = { type, text };
}

function refreshSessionFromGameState() {
  const now = getCurrentDateTime();
  const savedAt = gameState?.lastSavedAt ? new Date(gameState.lastSavedAt) : null;
  const validSavedAt =
    savedAt && Number.isFinite(savedAt.getTime()) ? savedAt : null;

  session = Object.freeze({
    previousSavedAt: validSavedAt,
    elapsedSinceLastSaveMs: getElapsedMilliseconds(validSavedAt, now),
  });
}

async function replaceStoredGameState(operation) {
  saveMutationInProgress = true;

  try {
    await savePromise.catch(() => null);
    gameState = await operation();
    dateSession = null;
    refreshSessionFromGameState();
    syncNameSetupOverlay();
    return gameState;
  } finally {
    saveMutationInProgress = false;
  }
}

function downloadSaveExport(exported) {
  const blob = new Blob([exported.text], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = exported.filename;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function handleSaveInteraction(event) {
  if (activeScreen !== "home" || !gameState) return;

  const saveNowButton = event.target.closest("[data-save-now]");
  if (saveNowButton) {
    const saved = await persistGameState();

    if (saved) {
      setSaveNotice("success", "現在の状態を保存しました。");
    } else {
      setSaveNotice(
        "error",
        getSaveHealth().message || "保存できませんでした。"
      );
    }

    renderScreen("home", { syncHash: false });
    return;
  }

  const exportButton = event.target.closest("[data-save-export]");
  if (exportButton) {
    const saved = await persistGameState();

    if (!saved) {
      setSaveNotice(
        "error",
        getSaveHealth().message || "保存できないため書き出しを中止しました。"
      );
      renderScreen("home", { syncHash: false });
      return;
    }

    try {
      downloadSaveExport(createSaveExport(gameState));
      setSaveNotice(
        "success",
        "セーブデータをJSONファイルとして書き出しました。"
      );
    } catch (error) {
      setSaveNotice(
        "error",
        error instanceof Error ? error.message : "書き出しに失敗しました。"
      );
    }

    renderScreen("home", { syncHash: false });
    return;
  }

  const restoreButton = event.target.closest("[data-save-restore]");
  if (restoreButton) {
    const approved = window.confirm(
      "端末内の直近バックアップへ戻します。現在の状態も復元前バックアップとして残します。続けますか？"
    );
    if (!approved) return;

    try {
      await replaceStoredGameState(() => restoreLatestBackup());
      setSaveNotice(
        "success",
        "端末内バックアップからセーブデータを復元しました。"
      );
    } catch (error) {
      setSaveNotice(
        "error",
        error instanceof Error ? error.message : "復元に失敗しました。"
      );
    }

    renderScreen("home", { syncHash: false });
    return;
  }

  const resetButton = event.target.closest("[data-save-reset]");
  if (resetButton) {
    const approved = window.confirm(
      "新しいセーブデータを作ります。復旧不能な元データは退避済みですが、ゲームは初期状態から再開します。続けますか？"
    );
    if (!approved) return;

    try {
      await replaceStoredGameState(() => resetGameData());
      setSaveNotice("success", "新しいセーブデータを作成しました。");
    } catch (error) {
      setSaveNotice(
        "error",
        error instanceof Error ? error.message : "初期化に失敗しました。"
      );
    }

    renderScreen("home", { syncHash: false });
  }
}

async function handleSaveImport(event) {
  const input = event.target.closest("[data-save-import]");
  if (!input || !gameState) return;

  const file = input.files?.[0];
  if (!file) return;

  const approved = window.confirm(
    "選んだJSONからセーブデータを読み込みます。現在の状態は端末内バックアップへ退避してから置き換えます。続けますか？"
  );

  if (!approved) {
    input.value = "";
    return;
  }

  try {
    const text = await file.text();
    await replaceStoredGameState(() => importGameData(text));
    setSaveNotice(
      "success",
      "バックアップファイルを検証してセーブデータを復元しました。"
    );
  } catch (error) {
    setSaveNotice(
      "error",
      error instanceof Error ? error.message : "読み込みに失敗しました。"
    );
  } finally {
    input.value = "";
  }

  renderScreen("home", { syncHash: false });
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

  document.addEventListener("submit", handleNameSettingsSubmit);

  for (const button of navButtons) {
    button.addEventListener("click", () => {
      renderScreen(button.dataset.screen);
    });
  }

  screenRoot.addEventListener("click", handleCharacterInteraction);
  screenRoot.addEventListener("click", handleHomeInteraction);
  screenRoot.addEventListener("click", handleFieldInteraction);
  screenRoot.addEventListener("click", handleLabInteraction);
  screenRoot.addEventListener("click", (event) => {
    void handleSaveInteraction(event);
  });
  screenRoot.addEventListener("change", (event) => {
    void handleSaveImport(event);
  });

  window.addEventListener("hashchange", () => {
    renderScreen(location.hash.slice(1), { syncHash: false });
  });

  window.addEventListener("pagehide", () => {
    void persistGameState();
  });

  window.addEventListener("beforeunload", () => {
    void persistGameState();
  });

  document.addEventListener("freeze", () => {
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
  syncNameSetupOverlay();
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
