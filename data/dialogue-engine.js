import { getDialogueSet } from "./dialogues.js";
import { getTimeSnapshot } from "./time.js";

function normalizeDate(value) {
  const date = value instanceof Date ? value : new Date(value ?? Date.now());
  return Number.isFinite(date.getTime()) ? date : new Date();
}

function stableHash(value) {
  let hash = 2166136261;

  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function pickLine(lines, seed) {
  if (!Array.isArray(lines) || lines.length === 0) return "";
  return lines[stableHash(seed) % lines.length] ?? "";
}

function addBucket(buckets, key, lines, weight = 1) {
  if (!Array.isArray(lines) || lines.length === 0) return;

  buckets.push({
    key,
    lines,
    weight: Math.max(1, Math.floor(Number(weight) || 1)),
  });
}

function pickBucket(buckets, seed) {
  const weighted = buckets.flatMap((bucket) =>
    Array.from({ length: bucket.weight }, () => bucket)
  );

  if (weighted.length === 0) return null;
  return weighted[stableHash(seed) % weighted.length] ?? null;
}

function buildSeed(characterKey, screenKey, now, periodKey, eventType) {
  const dateKey = [
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  ].join("-");

  // 30秒ごとの画面再描画で台詞が飛ばないよう、2時間単位でだけローテーションする。
  const hourSlot = Math.floor(now.getHours() / 2);

  return [
    characterKey,
    screenKey,
    dateKey,
    periodKey,
    hourSlot,
    eventType ?? "none",
  ].join("|");
}

export function getDialogueSelection({
  characterKey,
  screenKey = "home",
  now = new Date(),
  eventType = null,
} = {}) {
  const dialogueSet = getDialogueSet(characterKey);

  if (!dialogueSet) {
    return Object.freeze({ text: "", category: "none" });
  }

  const current = normalizeDate(now);
  const time = getTimeSnapshot(current);
  const seed = buildSeed(
    characterKey,
    screenKey,
    current,
    time.period.key,
    eventType
  );

  // デート中は、イベントに合う台詞を必ず優先する。
  if (eventType === "date" && dialogueSet.date.length > 0) {
    return Object.freeze({
      text: pickLine(dialogueSet.date, `${seed}|date`),
      category: "date",
    });
  }

  const buckets = [];
  const month = String(current.getMonth() + 1);

  // 画面固有台詞をやや多めにしつつ、時刻・月・土日・通常台詞も混ぜる。
  addBucket(buckets, `screen:${screenKey}`, dialogueSet.screens?.[screenKey], 3);
  addBucket(buckets, time.period.key, dialogueSet[time.period.key], 2);

  if (time.isWeekend) {
    addBucket(buckets, "weekend", dialogueSet.weekend, 2);
  }

  addBucket(buckets, `month:${month}`, dialogueSet.months?.[month], 1);
  addBucket(buckets, "normal", dialogueSet.normal, 1);

  const bucket = pickBucket(buckets, seed);

  if (!bucket) {
    return Object.freeze({ text: "", category: "none" });
  }

  return Object.freeze({
    text: pickLine(bucket.lines, `${seed}|${bucket.key}`),
    category: bucket.key,
  });
}

export function getDialogueText(options = {}) {
  return getDialogueSelection(options).text;
}
