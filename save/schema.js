export const SAVE_VERSION = 2;
export const STARTING_MONEY = 300;

export const CHARACTER_KEYS = Object.freeze([
  "ichika",
  "chihaya",
  "uryu",
  "shuka",
]);

export const NAME_MODE = Object.freeze({
  RECEIVER_NAME: "receiverName",
  CUSTOM_NAME: "customName",
});

function createDefaultPlot(index) {
  return {
    id: index,
    state: "empty",
    cropId: null,
    plantedAt: null,
    watered: false,
    growthMs: 0,
  };
}

function createDefaultPlots(rows, columns) {
  return Array.from({ length: rows * columns }, (_, index) =>
    createDefaultPlot(index)
  );
}

export function createDefaultSaveData(now = new Date()) {
  // STEP 7で初期畑サイズが確定するまでは、現在の仮3×3表示を保存構造の初期値にする。
  const rows = 3;
  const columns = 3;

  return {
    version: SAVE_VERSION,

    player: {
      customName: "",
      nameModeByCharacter: {
        ichika: NAME_MODE.RECEIVER_NAME,
        chihaya: NAME_MODE.RECEIVER_NAME,
        uryu: NAME_MODE.RECEIVER_NAME,
        shuka: NAME_MODE.RECEIVER_NAME,
      },
      favoriteCharacter: null,
    },

    economy: {
      money: STARTING_MONEY,
    },

    field: {
      size: {
        rows,
        columns,
      },
      plots: createDefaultPlots(rows, columns),
    },

    inventory: {
      seeds: {},
      harvests: {},
    },

    quality: {
      base: 0,
      researchBonus: 0,
      byCrop: {},
    },

    research: {
      completedCourses: [],
      studyRecords: [],
    },

    lastSavedAt: now.toISOString(),

    settings: {},
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeWithDefaults(defaultValue, savedValue) {
  if (Array.isArray(defaultValue)) {
    return Array.isArray(savedValue) ? savedValue : defaultValue;
  }

  if (isPlainObject(defaultValue)) {
    const source = isPlainObject(savedValue) ? savedValue : {};
    const merged = { ...source };

    for (const [key, value] of Object.entries(defaultValue)) {
      merged[key] = mergeWithDefaults(value, source[key]);
    }

    return merged;
  }

  return savedValue === undefined ? defaultValue : savedValue;
}

function normalizePlot(rawPlot, index) {
  const source = isPlainObject(rawPlot) ? rawPlot : {};
  const plot = {
    ...createDefaultPlot(index),
    ...source,
    id: index,
  };

  plot.cropId =
    typeof plot.cropId === "string" && plot.cropId.length > 0
      ? plot.cropId
      : null;
  plot.plantedAt =
    typeof plot.plantedAt === "string" && plot.plantedAt.length > 0
      ? plot.plantedAt
      : null;
  plot.watered = Boolean(plot.watered);
  plot.growthMs = Math.max(0, Number(plot.growthMs) || 0);

  if (plot.cropId) {
    plot.state = "growing";
  } else if (plot.state !== "tilled") {
    plot.state = "empty";
  }

  return plot;
}

export function migrateSaveData(rawData) {
  if (!isPlainObject(rawData)) {
    return createDefaultSaveData();
  }

  const version = Number(rawData.version ?? 0);

  if (version > SAVE_VERSION) {
    throw new Error(
      `このセーブデータは新しいバージョンです。saveVersion=${version}`
    );
  }

  let migrated = { ...rawData };

  if (version < 2) {
    const economy = isPlainObject(migrated.economy)
      ? { ...migrated.economy }
      : {};

    // STEP 3まではお金を使う機能が無かったため、既存セーブにも
    // STEP 4の初期資金を付与してゲームループを開始できるようにする。
    if ((Number(economy.money) || 0) <= 0) {
      economy.money = STARTING_MONEY;
    }

    migrated = {
      ...migrated,
      economy,
      version: 2,
    };
  }

  return {
    ...migrated,
    version: SAVE_VERSION,
  };
}

export function normalizeSaveData(rawData) {
  const migrated = migrateSaveData(rawData);
  const defaults = createDefaultSaveData();
  const normalized = mergeWithDefaults(defaults, migrated);

  const rows = Math.max(1, Number(normalized.field?.size?.rows) || 3);
  const columns = Math.max(1, Number(normalized.field?.size?.columns) || 3);
  const plotCount = rows * columns;
  const savedPlots = Array.isArray(migrated.field?.plots)
    ? migrated.field.plots
    : [];

  normalized.version = SAVE_VERSION;
  normalized.economy.money = Math.max(
    0,
    Number(normalized.economy.money) || 0
  );
  normalized.field.size = { rows, columns };
  normalized.field.plots = Array.from({ length: plotCount }, (_, index) =>
    normalizePlot(savedPlots[index], index)
  );

  return normalized;
}
