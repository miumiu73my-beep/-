import {
  formatCalendarDate,
  formatClockTime,
  formatElapsedDuration,
  getTimeSnapshot,
} from "../data/time.js";
import { renderHomeNameSettings } from "./name-settings.js";

const CALENDAR_WEEKDAYS = Object.freeze(["日", "月", "火", "水", "木", "金", "土"]);

function toLocalDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function renderMonthCalendar(now) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = toLocalDateKey(now);
  const requiredCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  const weekdayHead = CALENDAR_WEEKDAYS
    .map((label, index) => {
      const weekendClass =
        index === 0 ? " is-sunday" : index === 6 ? " is-saturday" : "";
      return `<span class="month-calendar-weekday${weekendClass}">${label}</span>`;
    })
    .join("");

  const dayCells = Array.from({ length: requiredCells }, (_, index) => {
    const day = index - firstWeekday + 1;

    if (day < 1 || day > daysInMonth) {
      return '<span class="month-calendar-day is-empty" aria-hidden="true"></span>';
    }

    const date = new Date(year, month, day);
    const dateKey = toLocalDateKey(date);
    const weekday = date.getDay();
    const isToday = dateKey === todayKey;
    const weekendClass =
      weekday === 0 ? " is-sunday" : weekday === 6 ? " is-saturday" : "";

    return `
      <time
        class="month-calendar-day${weekendClass}${isToday ? " is-today" : ""}"
        datetime="${dateKey}"
        aria-label="${year}年${month + 1}月${day}日（${CALENDAR_WEEKDAYS[weekday]}曜日）${isToday ? " 今日" : ""}"
      >${day}</time>
    `;
  }).join("");

  return `
    <section class="month-calendar-card" aria-labelledby="month-calendar-title">
      <div class="month-calendar-heading">
        <div>
          <p class="scene-kicker">現実のカレンダー</p>
          <h2 id="month-calendar-title">${year}年${month + 1}月</h2>
        </div>
        <span class="month-calendar-today">今日 ${now.getDate()}日</span>
      </div>
      <div class="month-calendar-grid" role="grid" aria-label="${year}年${month + 1}月のカレンダー">
        ${weekdayHead}
        ${dayCells}
      </div>
    </section>
  `;
}

function renderWeekendEntry(isWeekend) {
  if (!isWeekend) {
    return `
      <section class="home-weekend-card is-weekday" aria-labelledby="weekend-title">
        <p class="scene-kicker">週末イベント</p>
        <h2 id="weekend-title">デートは週末に</h2>
        <p>今日は平日です。デート入口は土日に表示されます。</p>
        <p class="home-weekend-note">行かなくても好感度や野菜の品質には影響しません。</p>
      </section>
    `;
  }

  return `
    <section class="home-weekend-card is-weekend" aria-labelledby="weekend-title">
      <p class="scene-kicker">週末イベント</p>
      <h2 id="weekend-title">今日はデートに出かけられます</h2>
      <p>土日だけ表示される任意の入口です。遊ばなくても不利益はありません。</p>
      <details class="home-date-entry">
        <summary>デート入口</summary>
        <p>
          デート先・会話イベント・選択肢などの本編はSTEP 14で追加します。
          STEP 13では週末だけ入口が現れるところまで実装しています。
        </p>
      </details>
    </section>
  `;
}

export function renderHomeScreen(context = {}) {
  const now = context.now instanceof Date ? context.now : new Date();
  const time = context.time ?? getTimeSnapshot(now);
  const previousSavedAt = context.session?.previousSavedAt ?? null;
  const elapsedSinceLastSaveMs = context.session?.elapsedSinceLastSaveMs ?? null;

  const previousSaveText = previousSavedAt
    ? `${formatCalendarDate(previousSavedAt)} ${formatClockTime(previousSavedAt)}`
    : "この端末では今回が初回記録です";

  return `
    <section class="scene scene-home" aria-labelledby="home-title">
      <div class="window-placeholder" aria-hidden="true">
        <div class="window-sky"></div>
        <div class="window-hill"></div>
      </div>

      <div class="calendar-card" aria-label="今日の現実日時">
        <p class="scene-kicker">今日</p>
        <div class="calendar-date-row">
          <time class="calendar-date" datetime="${toLocalDateKey(now)}">
            ${formatCalendarDate(now)}（${time.weekday.label}）
          </time>
          <span class="time-period-badge">${time.period.label}</span>
        </div>
        <p class="calendar-clock">${formatClockTime(now)}</p>
        <p class="calendar-weekend-note">
          ${time.isWeekend ? "今日は土日です。デート入口を利用できます。" : "今日は平日です。デート入口は週末に表示されます。"}
        </p>
      </div>

      ${renderMonthCalendar(now)}

      <div class="scene-card">
        <p class="scene-kicker">自宅</p>
        <h2 id="home-title">戻ってくる場所</h2>
        <p>
          現実の日付・曜日・時間帯を基準に動きます。
          久しぶりに起動しても、不在を責める仕組みは作りません。
        </p>
        <div class="time-status" aria-label="前回保存時刻からの経過">
          <span>前回の記録</span>
          <strong>${previousSaveText}</strong>
          <span>前回記録からの経過</span>
          <strong>${formatElapsedDuration(elapsedSinceLastSaveMs)}</strong>
        </div>
        <div class="placeholder-row">
          <span>カレンダー確認</span>
          <span>キャラと会話</span>
          <span>${time.isWeekend ? "週末イベント" : "平日"}</span>
        </div>
      </div>

      ${renderWeekendEntry(time.isWeekend)}

      ${renderHomeNameSettings(context.saveData)}
    </section>
  `;
}
