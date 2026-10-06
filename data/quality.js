export const DEFAULT_BASE_QUALITY = 1;
export const MAX_RESEARCH_BONUS = 0.6;

export const QUALITY_LEVELS = Object.freeze(
  [
    {
      id: "standard",
      name: "ふつう",
      minScore: 0,
      bonusRate: 0,
    },
    {
      id: "good",
      name: "良質",
      minScore: 1.15,
      bonusRate: 0.05,
    },
    {
      id: "fine",
      name: "上質",
      minScore: 1.3,
      bonusRate: 0.1,
    },
    {
      id: "special",
      name: "特選",
      minScore: 1.45,
      bonusRate: 0.15,
    },
    {
      id: "premium",
      name: "極上",
      minScore: 1.6,
      bonusRate: 0.2,
    },
  ].map((level) => Object.freeze(level))
);

function nonNegativeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
}

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

export function getQualityLevel(score) {
  const normalizedScore = nonNegativeNumber(score);

  return (
    [...QUALITY_LEVELS]
      .reverse()
      .find((level) => normalizedScore >= level.minScore) ??
    QUALITY_LEVELS[0]
  );
}

export function calculateCropQuality(saveData, crop = null) {
  const base = positiveNumber(
    saveData?.quality?.base,
    DEFAULT_BASE_QUALITY
  );
  const researchBonus = Math.min(
    MAX_RESEARCH_BONUS,
    nonNegativeNumber(saveData?.quality?.researchBonus)
  );
  const cropBonus = crop?.id
    ? nonNegativeNumber(saveData?.quality?.byCrop?.[crop.id])
    : 0;

  const rawCropWeight = Number(crop?.qualityBase);
  const cropWeight = Number.isFinite(rawCropWeight)
    ? Math.max(0, rawCropWeight)
    : 1;

  const baseScore = base * cropWeight;
  const score = baseScore + researchBonus + cropBonus;
  const level = getQualityLevel(score);

  return {
    score,
    base,
    baseScore,
    researchBonus,
    cropBonus,
    cropWeight,
    levelId: level.id,
    levelName: level.name,
    bonusRate: level.bonusRate,
  };
}

export function calculateGeneralQuality(saveData) {
  return calculateCropQuality(saveData, {
    id: null,
    qualityBase: 1,
  });
}

export function formatQualityScore(value) {
  const score = nonNegativeNumber(value);
  return score.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}
