import {
  SAVE_VERSION,
  createDefaultSaveData,
  normalizeSaveData,
} from "./schema.js";

export { SAVE_VERSION };

export const SAVE_NAMESPACE = "yasai-seijo";

const DB_NAME = `${SAVE_NAMESPACE}-db`;
const DB_VERSION = 1;
const STORE_NAME = "game-state";
const MAIN_SAVE_KEY = "main";

let databasePromise = null;

function openDatabase() {
  if (!("indexedDB" in globalThis)) {
    return Promise.reject(new Error("IndexedDB is not available."));
  }

  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.addEventListener("upgradeneeded", () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    });

    request.addEventListener("success", () => {
      const database = request.result;

      database.addEventListener("versionchange", () => {
        database.close();
        databasePromise = null;
      });

      resolve(database);
    });

    request.addEventListener("error", () => {
      databasePromise = null;
      reject(request.error ?? new Error("IndexedDB could not be opened."));
    });

    request.addEventListener("blocked", () => {
      console.warn("IndexedDB upgrade is blocked by another open tab.");
    });
  });

  return databasePromise;
}

async function readRecord() {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(MAIN_SAVE_KEY);

    request.addEventListener("success", () => {
      resolve(request.result ?? null);
    });

    request.addEventListener("error", () => {
      reject(request.error ?? new Error("Save data could not be read."));
    });
  });
}

async function writeRecord(data) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    store.put({
      id: MAIN_SAVE_KEY,
      data,
    });

    transaction.addEventListener("complete", () => resolve(data));
    transaction.addEventListener("error", () => {
      reject(transaction.error ?? new Error("Save data could not be written."));
    });
    transaction.addEventListener("abort", () => {
      reject(transaction.error ?? new Error("Save transaction was aborted."));
    });
  });
}

export async function loadGameData() {
  try {
    const record = await readRecord();

    if (!record?.data) {
      const initialData = createDefaultSaveData();
      return writeRecord(initialData);
    }

    const normalized = normalizeSaveData(record.data);

    // 欠落項目の補完や将来のmigration結果も、その場で保存し直す。
    return writeRecord(normalized);
  } catch (error) {
    console.warn("Could not load save data. Using a temporary default state:", error);
    return createDefaultSaveData();
  }
}

export async function saveGameData(gameData, savedAt = new Date()) {
  const normalized = normalizeSaveData({
    ...gameData,
    lastSavedAt: savedAt.toISOString(),
  });

  return writeRecord(normalized);
}

export async function updateGameData(update, savedAt = new Date()) {
  const current = await loadGameData();
  const next =
    typeof update === "function"
      ? update(structuredClone(current))
      : { ...current, ...update };

  return saveGameData(next, savedAt);
}

export async function resetGameData() {
  const freshData = createDefaultSaveData();
  return writeRecord(freshData);
}
