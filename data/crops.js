const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const DEFAULT_CROP_ID = "turnip";

export const SEASONS = Object.freeze({
  spring: Object.freeze({
    id: "spring",
    name: "春",
    months: Object.freeze([3, 4, 5]),
  }),
  summer: Object.freeze({
    id: "summer",
    name: "夏",
    months: Object.freeze([6, 7, 8]),
  }),
  autumn: Object.freeze({
    id: "autumn",
    name: "秋",
    months: Object.freeze([9, 10, 11]),
  }),
  winter: Object.freeze({
    id: "winter",
    name: "冬",
    months: Object.freeze([12, 1, 2]),
  }),
});

export const SEASON_ORDER = Object.freeze([
  "spring",
  "summer",
  "autumn",
  "winter",
]);

function defineCrop({
  id,
  name,
  season,
  growDays,
  seedPrice,
  sellPrice,
  icon,
  qualityBase = 1,
}) {
  const growMs = growDays * DAY_MS;

  return Object.freeze({
    id,
    name,
    season,
    growDays,
    growMs,
    seedPrice,
    sellPrice,
    // STEP 8の品質計算で使う中立の基準値。現段階では全作物1.0。
    qualityBase,
    // STEP 5の「遊んだ分だけ少し進む」を作物ごとの成長時間に合わせる。
    // 3回の水やりで必要成長時間ぶんの補助になる暫定値で、STEP 18で調整可能。
    manualGrowthMs: growMs / 3,
    icon,
  });
}

export const CROPS = Object.freeze({
  turnip: defineCrop({
    id: "turnip",
    name: "かぶ",
    season: "spring",
    growDays: 3,
    seedPrice: 40,
    sellPrice: 90,
    icon: "🥬",
  }),
  potato: defineCrop({
    id: "potato",
    name: "じゃがいも",
    season: "spring",
    growDays: 4,
    seedPrice: 55,
    sellPrice: 130,
    icon: "🥔",
  }),
  cabbage: defineCrop({
    id: "cabbage",
    name: "キャベツ",
    season: "spring",
    growDays: 6,
    seedPrice: 90,
    sellPrice: 230,
    icon: "🥬",
  }),
  tomato: defineCrop({
    id: "tomato",
    name: "トマト",
    season: "summer",
    growDays: 4,
    seedPrice: 70,
    sellPrice: 170,
    icon: "🍅",
  }),
  corn: defineCrop({
    id: "corn",
    name: "とうもろこし",
    season: "summer",
    growDays: 6,
    seedPrice: 110,
    sellPrice: 280,
    icon: "🌽",
  }),
  cucumber: defineCrop({
    id: "cucumber",
    name: "きゅうり",
    season: "summer",
    growDays: 4,
    seedPrice: 65,
    sellPrice: 160,
    icon: "🥒",
  }),
  carrot: defineCrop({
    id: "carrot",
    name: "にんじん",
    season: "autumn",
    growDays: 4,
    seedPrice: 70,
    sellPrice: 175,
    icon: "🥕",
  }),
  sweetPotato: defineCrop({
    id: "sweetPotato",
    name: "さつまいも",
    season: "autumn",
    growDays: 5,
    seedPrice: 80,
    sellPrice: 210,
    icon: "🍠",
  }),
  pumpkin: defineCrop({
    id: "pumpkin",
    name: "かぼちゃ",
    season: "autumn",
    growDays: 7,
    seedPrice: 130,
    sellPrice: 360,
    icon: "🎃",
  }),
  daikon: defineCrop({
    id: "daikon",
    name: "だいこん",
    season: "winter",
    growDays: 4,
    seedPrice: 65,
    sellPrice: 155,
    icon: "🥬",
  }),
  spinach: defineCrop({
    id: "spinach",
    name: "ほうれん草",
    season: "winter",
    growDays: 3,
    seedPrice: 50,
    sellPrice: 120,
    icon: "🌿",
  }),
  napaCabbage: defineCrop({
    id: "napaCabbage",
    name: "はくさい",
    season: "winter",
    growDays: 6,
    seedPrice: 95,
    sellPrice: 250,
    icon: "🥬",
  }),
});

export const CROP_LIST = Object.freeze(Object.values(CROPS));

export function getCrop(cropId) {
  return CROPS[cropId] ?? null;
}

export function getSeasonForMonth(month) {
  const normalizedMonth = Number(month);

  if (!Number.isInteger(normalizedMonth) || normalizedMonth < 1 || normalizedMonth > 12) {
    return null;
  }

  return (
    SEASON_ORDER.find((seasonId) =>
      SEASONS[seasonId].months.includes(normalizedMonth)
    ) ?? null
  );
}

export function getSeasonForDate(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date);
  if (!Number.isFinite(value.getTime())) return null;
  return getSeasonForMonth(value.getMonth() + 1);
}

export function getSeasonName(seasonId) {
  return SEASONS[seasonId]?.name ?? "通年";
}

export function isCropInSeason(cropId, date = new Date()) {
  const crop = getCrop(cropId);
  if (!crop) return false;
  return crop.season === getSeasonForDate(date);
}

export function getCropsForSeason(seasonId) {
  return CROP_LIST.filter((crop) => crop.season === seasonId);
}

export function formatGrowthTime(milliseconds) {
  const totalHours = Math.max(0, Math.round(milliseconds / HOUR_MS));

  if (totalHours < 24) return `${totalHours}時間`;

  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return hours === 0 ? `${days}日` : `${days}日${hours}時間`;
}
