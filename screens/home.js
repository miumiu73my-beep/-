import {
  formatCalendarDate,
  formatClockTime,
  formatElapsedDuration,
  getTimeSnapshot,
} from "../data/time.js";
import { renderHomeNameSettings } from "./name-settings.js";

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

      <div class="calendar-card" aria-label="現実の日時">
        <p class="scene-kicker">現実のカレンダー</p>
        <div class="calendar-date-row">
          <time class="calendar-date" datetime="${now.toISOString()}">
            ${formatCalendarDate(now)}（${time.weekday.label}）
          </time>
          <span class="time-period-badge">${time.period.label}</span>
        </div>
        <p class="calendar-clock">${formatClockTime(now)}</p>
        <p class="calendar-weekend-note">
          ${time.isWeekend ? "今日は土日です。" : "今日は平日です。"}
        </p>
      </div>

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
          <span>カレンダー</span>
          <span>会話</span>
          <span>${time.isWeekend ? "週末" : "平日"}</span>
        </div>
      </div>

      ${renderHomeNameSettings(context.saveData)}
    </section>
  `;
}
