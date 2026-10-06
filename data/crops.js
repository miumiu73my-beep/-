const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const MANUAL_GROWTH_RATE = 0.25;
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
  growHours,
  seedPrice,
  sellPrice,
  icon,
  qualityBase = 1,
}) {
  const growMs = growHours * HOUR_MS;

  return Object.freeze({
    id,
    name,
    season,
    growHours,
    // 既存コードとの互換用。STEP 18以降の調整単位は時間。
    growDays: growHours / 24,
    growMs,
    seedPrice,
    sellPrice,
    // STEP 8の品質計算で使う作物側の係数。現在は全作物1.0の中立値。
    qualityBase,
    // STEP 18: 短時間プレイでも進展を感じられるよう、
    // 植え付け後の水やり1回で必要時間の25%ぶんだけ成長を進める。
    manualGrowthMs: growMs * MANUAL_GROWTH_RATE,
    icon,
  });
}

export const CROPS = Object.freeze({
  turnip: defineCrop({
    id: "turnip",
    name: "かぶ",
    season: "spring",
    growHours: 12,
    seedPrice: 40,
    sellPrice: 80,
    icon: "🥬",
  }),
  potato: defineCrop({
    id: "potato",
    name: "じゃがいも",
    season: "spring",
    growHours: 18,
    seedPrice: 55,
    sellPrice: 120,
    icon: "🥔",
  }),
  cabbage: defineCrop({
    id: "cabbage",
    name: "キャベツ",
    season: "spring",
    growHours: 30,
    seedPrice: 85,
    sellPrice: 200,
    icon: "🥬",
  }),
  tomato: defineCrop({
    id: "tomato",
    name: "トマト",
    season: "summer",
    growHours: 18,
    seedPrice: 60,
    sellPrice: 135,
    icon: "🍅",
  }),
  corn: defineCrop({
    id: "corn",
    name: "とうもろこし",
    season: "summer",
    growHours: 30,
    seedPrice: 95,
    sellPrice: 235,
    icon: "🌽",
  }),
  cucumber: defineCrop({
    id: "cucumber",
    name: "きゅうり",
    season: "summer",
    growHours: 15,
    seedPrice: 50,
    sellPrice: 110,
    icon: "🥒",
  }),
  carrot: defineCrop({
    id: "carrot",
    name: "にんじん",
    season: "autumn",
    growHours: 18,
    seedPrice: 55,
    sellPrice: 125,
    icon: "🥕",
  }),
  sweetPotato: defineCrop({
    id: "sweetPotato",
    name: "さつまいも",
    season: "autumn",
    growHours: 24,
    seedPrice: 75,
    sellPrice: 175,
    icon: "🍠",
  }),
  pumpkin: defineCrop({
    id: "pumpkin",
    name: "かぼちゃ",
    season: "autumn",
    growHours: 36,
    seedPrice: 120,
    sellPrice: 310,
    icon: "🎃",
  }),
  daikon: defineCrop({
    id: "daikon",
    name: "だいこん",
    season: "winter",
    growHours: 18,
    seedPrice: 50,
    sellPrice: 115,
    icon: "🥬",
  }),
  spinach: defineCrop({
    id: "spinach",
    name: "ほうれん草",
    season: "winter",
    growHours: 12,
    seedPrice: 35,
    sellPrice: 80,
    icon: "🌿",
  }),
  napaCabbage: defineCrop({
    id: "napaCabbage",
    name: "はくさい",
    season: "winter",
    growHours: 30,
    seedPrice: 90,
    sellPrice: 220,
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
