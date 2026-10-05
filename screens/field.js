import {
  CROPS,
  DEFAULT_CROP_ID,
  formatGrowthTime,
  getCrop,
} from "../data/crops.js";

export const FIELD_TOOLS = Object.freeze({
  till: Object.freeze({ key: "till", label: "耕す" }),
  plant: Object.freeze({ key: "plant", label: "種まき" }),
  water: Object.freeze({ key: "water", label: "水やり" }),
  harvest: Object.freeze({ key: "harvest", label: "収穫" }),
  clear: Object.freeze({ key: "clear", label: "片付け" }),
});

function moneyText(value) {
  return `${Math.max(0, Number(value) || 0).toLocaleString("ja-JP")}G`;
}

function clampProgress(value, max) {
  return Math.max(0, Math.min(max, Number(value) || 0));
}

function getPassiveGrowthMs(plot, now = new Date()) {
  if (!plot?.plantedAt) return 0;

  const plantedAtMs = new Date(plot.plantedAt).getTime();
  const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime();

  if (!Number.isFinite(plantedAtMs) || !Number.isFinite(nowMs)) return 0;

  return Math.max(0, nowMs - plantedAtMs);
}

function cropProgress(plot, crop, now = new Date()) {
  if (!crop) return 0;

  // growthMsは「ゲームを触った分だけ進む」手動成長ボーナスとして保持する。
  // 現実時間ぶんはplantedAtから毎回計算するため、アプリを閉じていても
  // 再起動時に自然に追いつき、起動中の再描画でも二重加算されない。
  const manualGrowthMs = Math.max(0, Number(plot.growthMs) || 0);
  const passiveGrowthMs = getPassiveGrowthMs(plot, now);

  return clampProgress(passiveGrowthMs + manualGrowthMs, crop.growMs);
}

function cropProgressPercent(plot, crop, now = new Date()) {
  if (!crop || crop.growMs <= 0) return 0;

  return Math.min(
    100,
    Math.round((cropProgress(plot, crop, now) / crop.growMs) * 100)
  );
}

function isCropReady(plot, crop, now = new Date()) {
  return Boolean(crop) && cropProgress(plot, crop, now) >= crop.growMs;
}

function renderPlot(plot, index, now) {
  const crop = getCrop(plot.cropId);
  const state = crop ? "growing" : plot.state === "tilled" ? "tilled" : "empty";
  const percent = cropProgressPercent(plot, crop, now);
  const ready = isCropReady(plot, crop, now);

  let title = `${index + 1}番`;
  let detail = "草地";

  if (state === "tilled") {
    detail = "耕した土";
  } else if (crop) {
    title = crop.name;
    detail = ready ? "収穫できます" : `成長 ${percent}%`;
  }

  return `
    <button
      class="plot-cell is-${state}${ready ? " is-ready" : ""}"
      type="button"
      data-plot-index="${index}"
      aria-label="${index + 1}番の畑：${detail}"
    >
      <span class="plot-number">${index + 1}</span>
      <span class="plot-icon" aria-hidden="true">${crop ? (ready ? "🥬" : "🌱") : state === "tilled" ? "・" : "✦"}</span>
      <span class="plot-title">${title}</span>
      <span class="plot-detail">${detail}</span>
      ${
        crop
          ? `<span class="plot-progress" aria-hidden="true"><span style="width:${percent}%"></span></span>`
          : ""
      }
    </button>
  `;
}

function ensureFieldData(saveData) {
  saveData.economy ??= { money: 0 };
  saveData.inventory ??= { seeds: {}, harvests: {} };
  saveData.inventory.seeds ??= {};
  saveData.inventory.harvests ??= {};
  saveData.field ??= { size: { rows: 3, columns: 3 }, plots: [] };
  saveData.field.plots ??= [];
}

function resetPlot(plot, state = "empty") {
  plot.state = state;
  plot.cropId = null;
  plot.plantedAt = null;
  plot.watered = false;
  plot.growthMs = 0;
}

export function renderFieldScreen({
  saveData,
  fieldTool = "till",
  fieldNotice = "",
  now = new Date(),
} = {}) {
  const field = saveData?.field;
  const plots = Array.isArray(field?.plots) ? field.plots : [];
  const crop = CROPS[DEFAULT_CROP_ID];
  const seedCount = Number(saveData?.inventory?.seeds?.[crop.id]) || 0;
  const money = Number(saveData?.economy?.money) || 0;

  const toolButtons = Object.values(FIELD_TOOLS)
    .map(
      (tool) => `
        <button
          class="field-tool${tool.key === fieldTool ? " is-selected" : ""}"
          type="button"
          data-field-tool="${tool.key}"
          aria-pressed="${tool.key === fieldTool ? "true" : "false"}"
        >${tool.label}</button>
      `
    )
    .join("");

  const plotButtons = plots
    .map((plot, index) => renderPlot(plot, index, now))
    .join("");

  return `
    <section class="scene scene-field" aria-labelledby="field-title">
      <div class="field-summary">
        <div>
          <p class="scene-kicker">畑</p>
          <h2 id="field-title">与えられた畑で、のんびり育てよう</h2>
        </div>
        <div class="field-money" aria-label="所持金">${moneyText(money)}</div>
      </div>

      <div class="field-shop-card">
        <div>
          <strong>${crop.name}のタネ</strong>
          <span>所持 ${seedCount}個</span>
          <small>
            1個 ${moneyText(crop.seedPrice)} ／ 出荷 ${moneyText(crop.sellPrice)} ／
            成長目安 ${formatGrowthTime(crop.growMs)}
          </small>
        </div>
        <button type="button" data-field-buy="${crop.id}">1個買う</button>
      </div>

      <div class="field-toolbar" aria-label="畑の作業">
        ${toolButtons}
      </div>

      <div class="plot-wrap" aria-label="畑">
        <div class="plot-grid">${plotButtons}</div>
      </div>

      <div class="field-guide">
        <p class="field-notice" role="status">
          ${fieldNotice || "タネを買い、畑を耕してから種まきしてください。"}
        </p>
        <p class="gentle-note">
          野菜は現実時間で自動的に育ちます。
          水やり1回でさらに${formatGrowthTime(crop.manualGrowthMs)}分だけ成長が進みます。
          長く離れていても枯れません。
        </p>
      </div>
    </section>
  `;
}

export function applyFieldAction(
  saveData,
  {
    action,
    plotIndex = null,
    cropId = DEFAULT_CROP_ID,
    now = new Date(),
  } = {}
) {
  ensureFieldData(saveData);

  const crop = getCrop(cropId);

  if (action === "buy") {
    if (!crop) {
      return { changed: false, message: "そのタネはまだ販売されていません。" };
    }

    if (saveData.economy.money < crop.seedPrice) {
      return { changed: false, message: "所持金が足りません。" };
    }

    saveData.economy.money -= crop.seedPrice;
    saveData.inventory.seeds[crop.id] =
      (Number(saveData.inventory.seeds[crop.id]) || 0) + 1;

    return {
      changed: true,
      message: `${crop.name}のタネを1個買いました。-${moneyText(crop.seedPrice)}`,
    };
  }

  if (!FIELD_TOOLS[action]) {
    return { changed: false, message: "作業を選んでください。" };
  }

  const index = Number(plotIndex);
  const plot = saveData.field.plots[index];

  if (!Number.isInteger(index) || !plot) {
    return { changed: false, message: "畑マスを選んでください。" };
  }

  if (action === "till") {
    if (plot.cropId || plot.state === "tilled") {
      return { changed: false, message: "ここはもう耕してあります。" };
    }

    resetPlot(plot, "tilled");
    return { changed: true, message: `${index + 1}番の畑を耕しました。` };
  }

  if (action === "plant") {
    if (plot.cropId) {
      return { changed: false, message: "ここにはすでに野菜が植わっています。" };
    }

    if (plot.state !== "tilled") {
      return { changed: false, message: "種は耕した畑にまけます。" };
    }

    if (!crop) {
      return { changed: false, message: "植えるタネが見つかりません。" };
    }

    const seeds = Number(saveData.inventory.seeds[crop.id]) || 0;
    if (seeds <= 0) {
      return { changed: false, message: `${crop.name}のタネがありません。` };
    }

    saveData.inventory.seeds[crop.id] = seeds - 1;
    plot.state = "growing";
    plot.cropId = crop.id;
    plot.plantedAt = now.toISOString();
    plot.watered = false;
    plot.growthMs = 0;

    return { changed: true, message: `${crop.name}のタネをまきました。` };
  }

  const plantedCrop = getCrop(plot.cropId);

  if (action === "water") {
    if (!plantedCrop) {
      return { changed: false, message: "ここには水やりできる野菜がありません。" };
    }

    if (isCropReady(plot, plantedCrop, now)) {
      return { changed: false, message: `${plantedCrop.name}はもう収穫できます。` };
    }

    plot.watered = true;
    plot.growthMs = Math.min(
      plantedCrop.growMs,
      Math.max(0, Number(plot.growthMs) || 0) + plantedCrop.manualGrowthMs
    );

    const ready = isCropReady(plot, plantedCrop, now);
    return {
      changed: true,
      message: ready
        ? `${plantedCrop.name}が育ちました。収穫できます。`
        : `${plantedCrop.name}に水をやりました。成長 ${cropProgressPercent(plot, plantedCrop, now)}%`,
    };
  }

  if (action === "harvest") {
    if (!plantedCrop) {
      return { changed: false, message: "収穫できる野菜がありません。" };
    }

    if (!isCropReady(plot, plantedCrop, now)) {
      return {
        changed: false,
        message: `${plantedCrop.name}はまだ育っています。成長 ${cropProgressPercent(plot, plantedCrop, now)}%`,
      };
    }

    saveData.economy.money += plantedCrop.sellPrice;
    resetPlot(plot, "tilled");

    return {
      changed: true,
      message: `${plantedCrop.name}を収穫して出荷しました。+${moneyText(plantedCrop.sellPrice)}`,
    };
  }

  if (action === "clear") {
    const alreadyEmpty =
      !plot.cropId &&
      plot.state === "empty" &&
      !plot.plantedAt &&
      !plot.watered &&
      !plot.growthMs;

    if (alreadyEmpty) {
      return { changed: false, message: "片付けるものがありません。" };
    }

    resetPlot(plot, "empty");
    return { changed: true, message: `${index + 1}番の畑を片付けました。` };
  }

  return { changed: false, message: "その作業はまだ使えません。" };
}
