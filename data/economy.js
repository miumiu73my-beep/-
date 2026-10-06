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
      price: 1200,
    },
    {
      level: 2,
      label: "大きな畑",
      rows: 5,
      columns: 5,
      price: 3600,
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

function nonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

export function calculateCropShipment(saveData, crop) {
  const basePrice = Math.max(0, Number(crop?.sellPrice) || 0);

  const baseQualityBonus = nonNegativeNumber(saveData?.quality?.base);
  const researchBonus = nonNegativeNumber(saveData?.quality?.researchBonus);
  const cropBonus = nonNegativeNumber(
    saveData?.quality?.byCrop?.[crop?.id]
  );

  const rawQualityWeight = Number(crop?.qualityBase);
  const qualityWeight = Number.isFinite(rawQualityWeight)
    ? Math.max(0, rawQualityWeight)
    : 1;

  // STEP 8で品質段階を正式実装するまで、保存済みの品質値は
  // 「基礎売価に対する加算率」として扱う。初期値はすべて0なので、
  // 現段階では基礎売価と出荷額は同額になる。
  const bonusRate = Math.min(
    10,
    (baseQualityBonus + researchBonus + cropBonus) * qualityWeight
  );
  const qualityBonus = Math.max(0, Math.round(basePrice * bonusRate));

  return {
    basePrice,
    qualityBonus,
    totalPrice: basePrice + qualityBonus,
    bonusRate,
  };
}
