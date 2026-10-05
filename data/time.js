const WEEKDAY_LABELS = Object.freeze(["日", "月", "火", "水", "木", "金", "土"]);

export const TIME_PERIODS = Object.freeze({
  morning: Object.freeze({ key: "morning", label: "朝", startHour: 5, endHour: 12 }),
  daytime: Object.freeze({ key: "daytime", label: "昼", startHour: 12, endHour: 18 }),
  night: Object.freeze({ key: "night", label: "夜", startHour: 18, endHour: 5 }),
});

export function getCurrentDateTime() {
  return new Date();
}

export function getTimePeriod(date = getCurrentDateTime()) {
  const hour = date.getHours();

  if (hour >= TIME_PERIODS.morning.startHour && hour < TIME_PERIODS.morning.endHour) {
    return TIME_PERIODS.morning;
  }

  if (hour >= TIME_PERIODS.daytime.startHour && hour < TIME_PERIODS.daytime.endHour) {
    return TIME_PERIODS.daytime;
  }

  return TIME_PERIODS.night;
}

export function getWeekday(date = getCurrentDateTime()) {
  const index = date.getDay();
  return Object.freeze({ index, label: WEEKDAY_LABELS[index] });
}

export function isWeekend(date = getCurrentDateTime()) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function getElapsedMilliseconds(lastSavedAt, now = getCurrentDateTime()) {
  if (!lastSavedAt) return null;

  const previous = lastSavedAt instanceof Date ? lastSavedAt : new Date(lastSavedAt);
  const previousMs = previous.getTime();
  const nowMs = now.getTime();

  if (!Number.isFinite(previousMs) || !Number.isFinite(nowMs)) return null;
  return Math.max(0, nowMs - previousMs);
}

export function getTimeSnapshot(date = getCurrentDateTime()) {
  return Object.freeze({
    now: date,
    period: getTimePeriod(date),
    weekday: getWeekday(date),
    isWeekend: isWeekend(date),
  });
}

export function formatCalendarDate(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export function formatClockTime(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function formatElapsedDuration(milliseconds) {
  if (milliseconds === null) return "初回記録";

  const totalMinutes = Math.floor(milliseconds / 60_000);
  if (totalMinutes < 1) return "1分未満";
  if (totalMinutes < 60) return `${totalMinutes}分`;

  const totalHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (totalHours < 24) {
    return minutes === 0 ? `${totalHours}時間` : `${totalHours}時間${minutes}分`;
  }

  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return hours === 0 ? `${days}日` : `${days}日${hours}時間`;
}
