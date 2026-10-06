import { calculateCropQuality } from "./quality.js";

export const INITIAL_FIELD_LEVEL = 0;

export const FIELD_EXPANSION_LEVELS = Object.freeze(
  [
    {
      level: 0,
      label: "はじまりの畑",
      rows: 3,
      columns: 3,
      price: 0,
    },
    {
      level: 1,
      label: "ひろがる畑",
      rows: 4,
      columns: 4,
      price: 1400,
    },
    {
      level: 2,
      label: "大きな畑",
      rows: 5,
      columns: 5,
      price: 4200,
    },
  ].map((level) => Object.freeze(level))
);

export function getFieldExpansionLevel(level) {
  const normalizedLevel = Number(level);

  if (!Number.isInteger(normalizedLevel)) return null;

  return (
    FIELD_EXPANSION_LEVELS.find(
      (fieldLevel) => fieldLevel.level === normalizedLevel
    ) ?? null
  );
}

export function inferFieldExpansionLevel(rows, columns) {
  const normalizedRows = Number(rows);
  const normalizedColumns = Number(columns);

  return (
    FIELD_EXPANSION_LEVELS.find(
      (fieldLevel) =>
        fieldLevel.rows === normalizedRows &&
        fieldLevel.columns === normalizedColumns
    ) ?? getFieldExpansionLevel(INITIAL_FIELD_LEVEL)
  );
}

export function resolveFieldExpansionLevel(field = {}) {
  const configured = getFieldExpansionLevel(field?.level);
  const rows = Number(field?.size?.rows);
  const columns = Number(field?.size?.columns);

  if (
    configured &&
    configured.rows === rows &&
    configured.columns === columns
  ) {
    return configured;
  }

  return inferFieldExpansionLevel(rows, columns);
}

export function getNextFieldExpansion(field = {}) {
  const current = resolveFieldExpansionLevel(field);

  return (
    FIELD_EXPANSION_LEVELS.find(
      (fieldLevel) => fieldLevel.level === current.level + 1
    ) ?? null
  );
}

export function calculateCropShipment(saveData, crop) {
  const basePrice = Math.max(0, Number(crop?.sellPrice) || 0);
  const quality = calculateCropQuality(saveData, crop);
  const qualityBonus = Math.max(
    0,
    Math.round(basePrice * quality.bonusRate)
  );

  return {
    basePrice,
    qualityBonus,
    totalPrice: basePrice + qualityBonus,
    bonusRate: quality.bonusRate,
    quality,
  };
}
