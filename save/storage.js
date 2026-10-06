import {
  SAVE_VERSION,
  createDefaultSaveData,
  normalizeSaveData,
  validateSaveData,
} from "./schema.js";

export { SAVE_VERSION };

export const SAVE_NAMESPACE = "yasai-seijo";

const DB_NAME = `${SAVE_NAMESPACE}-db`;
const DB_VERSION = 1;
const STORE_NAME = "game-state";
const MAIN_SAVE_KEY = "main";
const RECOVERY_SAVE_KEY = "recovery:last-good";
const BACKUP_PREFIX = "backup:";
const CORRUPT_PREFIX = "corrupt:";
const LEGACY_LAST_SAVED_AT_KEY = `${SAVE_NAMESPACE}:last-saved-at`;
const EXPORT_FORMAT = "yasai-seijo-save";
const EXPORT_FORMAT_VERSION = 1;
const BACKUP_LIMIT = 5;
const CORRUPT_RECORD_LIMIT = 2;
const BACKUP_INTERVAL_MS = 5 * 60 * 1000;

let databasePromise = null;
let backupSequence = 0;
let lastSnapshotAt = 0;
let writesBlocked = false;
let saveHealth = Object.freeze({
  status: "ok",
  message: "",
});

function setSaveHealth(status, message = "") {
  saveHealth = Object.freeze({ status, message });
}

export function getSaveHealth() {
  return { ...saveHealth };
}

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

function readLegacyLastSavedAt() {
  try {
    const value = localStorage.getItem(LEGACY_LAST_SAVED_AT_KEY);
    if (!value) return null;

    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  } catch {
    return null;
  }
}

function clearLegacyLastSavedAt() {
  try {
    localStorage.removeItem(LEGACY_LAST_SAVED_AT_KEY);
  } catch {
    // localStorageが利用できない環境では何もしない。
  }
}

async function readRecord(id = MAIN_SAVE_KEY) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.addEventListener("success", () => {
      resolve(request.result ?? null);
    });

    request.addEventListener("error", () => {
      reject(request.error ?? new Error("Save data could not be read."));
    });
  });
}

async function readAllRecords() {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.addEventListener("success", () => {
      resolve(Array.isArray(request.result) ? request.result : []);
    });

    request.addEventListener("error", () => {
      reject(request.error ?? new Error("Save records could not be read."));
    });
  });
}

async function putRecord(record) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    store.put(record);

    transaction.addEventListener("complete", () => resolve(record));
    transaction.addEventListener("error", () => {
      reject(transaction.error ?? new Error("Save data could not be written."));
    });
    transaction.addEventListener("abort", () => {
      reject(transaction.error ?? new Error("Save transaction was aborted."));
    });
  });
}

async function deleteRecords(ids) {
  if (!ids.length) return;

  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    for (const id of ids) {
      store.delete(id);
    }

    transaction.addEventListener("complete", () => resolve());
    transaction.addEventListener("error", () => {
      reject(transaction.error ?? new Error("Old backups could not be removed."));
    });
    transaction.addEventListener("abort", () => {
      reject(transaction.error ?? new Error("Backup cleanup was aborted."));
    });
  });
}

async function trimRecords(prefix, limit) {
  const records = (await readAllRecords())
    .filter((record) => String(record?.id ?? "").startsWith(prefix))
    .sort((a, b) => {
      const aTime = Date.parse(a.createdAt ?? "") || 0;
      const bTime = Date.parse(b.createdAt ?? "") || 0;
      return bTime - aTime;
    });

  await deleteRecords(records.slice(limit).map((record) => record.id));
}

async function writeMainData(data) {
  await putRecord({
    id: MAIN_SAVE_KEY,
    data,
  });
  return data;
}

async function writeRecoveryCopy(data, reason, createdAt = new Date()) {
  await putRecord({
    id: RECOVERY_SAVE_KEY,
    data,
    reason,
    createdAt: createdAt.toISOString(),
    saveVersion: data.version,
  });
}

async function writeBackupSnapshot(data, reason, createdAt = new Date()) {
  const normalized = validateSaveData(data);
  const id = `${BACKUP_PREFIX}${createdAt.getTime()}-${backupSequence++}`;

  await putRecord({
    id,
    data: normalized,
    reason,
    createdAt: createdAt.toISOString(),
    saveVersion: normalized.version,
  });

  lastSnapshotAt = createdAt.getTime();
  await trimRecords(BACKUP_PREFIX, BACKUP_LIMIT);
  return id;
}

async function snapshotMainIfNeeded(
  reason,
  { force = false, createdAt = new Date() } = {}
) {
  if (
    !force &&
    lastSnapshotAt > 0 &&
    createdAt.getTime() - lastSnapshotAt < BACKUP_INTERVAL_MS
  ) {
    return false;
  }

  const record = await readRecord(MAIN_SAVE_KEY);
  if (!record?.data) return false;

  try {
    await writeBackupSnapshot(record.data, reason, createdAt);
    return true;
  } catch {
    return false;
  }
}

async function preserveUnreadableMain(data, error) {
  try {
    const createdAt = new Date();

    await putRecord({
      id: `${CORRUPT_PREFIX}${createdAt.getTime()}-${backupSequence++}`,
      data,
      reason: "unreadable-main",
      createdAt: createdAt.toISOString(),
      error: error instanceof Error ? error.message : String(error),
    });

    await trimRecords(CORRUPT_PREFIX, CORRUPT_RECORD_LIMIT);
  } catch {
    // 復旧用コピーの保存自体に失敗しても、元の読み込み処理を続ける。
  }
}

async function findValidRecoveryData() {
  const records = await readAllRecords();
  const recovery = records.find((record) => record.id === RECOVERY_SAVE_KEY);
  const snapshots = records
    .filter((record) => String(record?.id ?? "").startsWith(BACKUP_PREFIX))
    .sort((a, b) => {
      const aTime = Date.parse(a.createdAt ?? "") || 0;
      const bTime = Date.parse(b.createdAt ?? "") || 0;
      return bTime - aTime;
    });

  for (const record of [recovery, ...snapshots].filter(Boolean)) {
    try {
      return {
        data: validateSaveData(record.data),
        source: record,
      };
    } catch {
      // 壊れた候補は飛ばして、次の世代を確認する。
    }
  }

  return null;
}

function isFutureSaveData(data) {
  const version = Number(data?.version);
  return Number.isFinite(version) && version > SAVE_VERSION;
}

export async function loadGameData() {
  try {
    const record = await readRecord(MAIN_SAVE_KEY);

    if (!record?.data) {
      const initialData = createDefaultSaveData();
      const legacyLastSavedAt = readLegacyLastSavedAt();

      if (legacyLastSavedAt) {
        initialData.lastSavedAt = legacyLastSavedAt.toISOString();
      }

      await writeMainData(initialData);
      await writeRecoveryCopy(initialData, "initial-save");
      clearLegacyLastSavedAt();
      writesBlocked = false;
      setSaveHealth("ok");
      return initialData;
    }

    try {
      const normalized = validateSaveData(record.data);

      await writeMainData(normalized);
      await writeRecoveryCopy(normalized, "validated-load");
      writesBlocked = false;
      setSaveHealth("ok");
      return normalized;
    } catch (error) {
      if (isFutureSaveData(record.data)) {
        writesBlocked = true;
        setSaveHealth(
          "future-version",
          "この端末には、現在のアプリより新しい形式のセーブがあります。アプリを更新してから再読み込みしてください。"
        );
        return createDefaultSaveData();
      }

      await preserveUnreadableMain(record.data, error);
      const recovery = await findValidRecoveryData();

      if (recovery) {
        const restored = normalizeSaveData({
          ...recovery.data,
          lastSavedAt: new Date().toISOString(),
        });

        await writeMainData(restored);
        await writeRecoveryCopy(restored, "automatic-recovery");
        writesBlocked = false;
        setSaveHealth(
          "recovered",
          "メインセーブに問題があったため、端末内バックアップから自動復旧しました。"
        );
        return restored;
      }

      writesBlocked = true;
      setSaveHealth(
        "needs-recovery",
        "セーブデータを安全に読み込めませんでした。元データは保持したままです。バックアップファイルを読み込むか、新規セーブを作成してください。"
      );
      return createDefaultSaveData();
    }
  } catch (error) {
    console.warn("Could not access save storage:", error);
    writesBlocked = true;
    setSaveHealth(
      "storage-unavailable",
      "端末の保存領域にアクセスできません。ブラウザの保存設定を確認してから再読み込みしてください。"
    );
    return createDefaultSaveData();
  }
}

export async function saveGameData(gameData, savedAt = new Date()) {
  if (writesBlocked) {
    throw new Error(
      saveHealth.message || "セーブ領域が保護されているため保存できません。"
    );
  }

  const normalized = normalizeSaveData({
    ...gameData,
    lastSavedAt: savedAt.toISOString(),
  });

  await snapshotMainIfNeeded("autosave-before-write", { createdAt: savedAt });
  await writeMainData(normalized);
  await writeRecoveryCopy(normalized, "last-good", savedAt);

  return normalized;
}

export async function updateGameData(update, savedAt = new Date()) {
  const current = await loadGameData();
  const draft =
    typeof structuredClone === "function"
      ? structuredClone(current)
      : JSON.parse(JSON.stringify(current));

  const next =
    typeof update === "function"
      ? update(draft)
      : { ...current, ...update };

  return saveGameData(next, savedAt);
}

function parseImportPayload(serialized) {
  let parsed;

  try {
    parsed =
      typeof serialized === "string" ? JSON.parse(serialized) : serialized;
  } catch {
    throw new Error("JSONファイルを読み取れませんでした。");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("バックアップファイルの形式が正しくありません。");
  }

  if (Object.hasOwn(parsed, "format")) {
    if (parsed.format !== EXPORT_FORMAT) {
      throw new Error("野菜聖女のバックアップファイルではありません。");
    }

    const formatVersion = Number(parsed.formatVersion ?? 0);

    if (
      !Number.isInteger(formatVersion) ||
      formatVersion < 1 ||
      formatVersion > EXPORT_FORMAT_VERSION
    ) {
      throw new Error("このバックアップ形式にはまだ対応していません。");
    }

    return parsed.data;
  }

  // 初期版で手動保存した生のセーブJSONも読み込めるようにする。
  return parsed;
}

function buildExportFileName(exportedAt) {
  const stamp = exportedAt
    .toISOString()
    .replace(/[-:]/g, "")
    .replace("T", "-")
    .slice(0, 15);

  return `yasai-seijo-save-${stamp}.json`;
}

export function createSaveExport(gameData, exportedAt = new Date()) {
  const normalized = validateSaveData(gameData);
  const payload = {
    format: EXPORT_FORMAT,
    formatVersion: EXPORT_FORMAT_VERSION,
    exportedAt: exportedAt.toISOString(),
    saveVersion: normalized.version,
    data: normalized,
  };

  return {
    filename: buildExportFileName(exportedAt),
    text: JSON.stringify(payload, null, 2),
  };
}

export async function importGameData(serialized, importedAt = new Date()) {
  const rawData = parseImportPayload(serialized);
  const validated = validateSaveData(rawData);
  const normalized = normalizeSaveData({
    ...validated,
    lastSavedAt: importedAt.toISOString(),
  });

  await snapshotMainIfNeeded("before-import", {
    force: true,
    createdAt: importedAt,
  });
  await writeMainData(normalized);
  await writeRecoveryCopy(normalized, "imported-save", importedAt);

  writesBlocked = false;
  setSaveHealth("ok");

  return normalized;
}

export async function restoreLatestBackup(restoredAt = new Date()) {
  const records = (await readAllRecords())
    .filter((record) => String(record?.id ?? "").startsWith(BACKUP_PREFIX))
    .sort((a, b) => {
      const aTime = Date.parse(a.createdAt ?? "") || 0;
      const bTime = Date.parse(b.createdAt ?? "") || 0;
      return bTime - aTime;
    });

  let selected = null;

  for (const record of records) {
    try {
      selected = validateSaveData(record.data);
      break;
    } catch {
      // 壊れている世代は飛ばす。
    }
  }

  if (!selected) {
    throw new Error("復元できる端末内バックアップが見つかりません。");
  }

  // 復元対象を先に確定してから、現在状態を「復元前」として退避する。
  await snapshotMainIfNeeded("before-manual-restore", {
    force: true,
    createdAt: restoredAt,
  });

  const restored = normalizeSaveData({
    ...selected,
    lastSavedAt: restoredAt.toISOString(),
  });

  await writeMainData(restored);
  await writeRecoveryCopy(restored, "manual-restore", restoredAt);

  writesBlocked = false;
  setSaveHealth("ok");

  return restored;
}

export async function resetGameData(resetAt = new Date()) {
  await snapshotMainIfNeeded("before-reset", {
    force: true,
    createdAt: resetAt,
  });

  const freshData = createDefaultSaveData(resetAt);
  await writeMainData(freshData);
  await writeRecoveryCopy(freshData, "manual-reset", resetAt);

  writesBlocked = false;
  setSaveHealth("ok");

  return freshData;
}
