const HOUR_MS = 60 * 60 * 1000;

export const DEFAULT_CROP_ID = "turnip";

export const CROPS = Object.freeze({
  turnip: Object.freeze({
    id: "turnip",
    name: "かぶ",
    seedPrice: 40,
    sellPrice: 90,
    growMs: 24 * HOUR_MS,
    manualGrowthMs: 8 * HOUR_MS,
  }),
});

export function getCrop(cropId) {
  return CROPS[cropId] ?? null;
}

export function formatGrowthTime(milliseconds) {
  const totalHours = Math.max(0, Math.round(milliseconds / HOUR_MS));

  if (totalHours < 24) return `${totalHours}時間`;

  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return hours === 0 ? `${days}日` : `${days}日${hours}時間`;
}
