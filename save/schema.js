export const SAVE_VERSION = 1;

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

function createDefaultPlots(rows, columns) {
  return Array.from({ length: rows * columns }, (_, index) => ({
    id: index,
    state: "empty",
    cropId: null,
    plantedAt: null,
    watered: false,
  }));
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
      money: 0,
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

  // SAVE_VERSION=1 が最初の正式スキーマ。
  // 今後は version ごとの変換をここへ追加する。
  return {
    ...rawData,
    version: SAVE_VERSION,
  };
}

export function normalizeSaveData(rawData) {
  const migrated = migrateSaveData(rawData);
  const defaults = createDefaultSaveData();
  const normalized = mergeWithDefaults(defaults, migrated);

  normalized.version = SAVE_VERSION;
  return normalized;
}
