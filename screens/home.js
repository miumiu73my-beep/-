import {
  formatCalendarDate,
  formatClockTime,
  formatElapsedDuration,
  getTimeSnapshot,
} from "../data/time.js";
import { getFavoriteCharacter } from "../data/characters.js";
import {
  getDateChoice,
  getDateEvent,
  getDateEventsForCharacter,
} from "../data/dates.js";
import { formatCharacterDialogue } from "../data/names.js";
import { renderHomeNameSettings } from "./name-settings.js";
import { renderSaveManagement } from "./save-management.js";

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

function renderDateList(character, saveData) {
  const events = getDateEventsForCharacter(character.key);

  return `
    <div class="home-date-entry" aria-label="${character.name}とのデート先">
      <div class="home-date-entry-header">
        <p class="scene-kicker">${character.name}との週末</p>
        <h3>どこへ出かける？</h3>
        <p>
          好きなデート先を選べます。行く・行かない、どの選択肢を選ぶかで
          好感度や野菜品質は変わりません。
        </p>
      </div>
      <div class="date-event-list">
        ${events
          .map(
            (dateEvent) => `
              <article class="date-event-card">
                <p class="date-event-place">${dateEvent.place}</p>
                <h3>${dateEvent.title}</h3>
                <p>${dateEvent.summary}</p>
                <button
                  class="date-action-button"
                  type="button"
                  data-date-start="${dateEvent.id}"
                  data-date-character="${character.key}"
                >
                  このデートに行く
                </button>
              </article>
            `
          )
          .join("")}
      </div>
      <p class="date-neutral-note">
        今週デートをしなくても、あとから責める台詞や不利益は発生しません。
      </p>
    </div>
  `;
}

function renderActiveDate(character, dateEvent, saveData, choiceId) {
  const choice = getDateChoice(dateEvent, choiceId);

  return `
    <div class="home-date-entry" aria-live="polite">
      <article class="date-active-card">
        <div class="date-active-heading">
          <p class="date-event-place">${dateEvent.place}</p>
          <h3>${character.name}と「${dateEvent.title}」</h3>
        </div>

        <p class="date-dialogue">
          ${formatCharacterDialogue(dateEvent.intro, saveData, character.key)}
        </p>

        ${
          choice
            ? `
              <div class="date-choice-result">
                <strong>${choice.label}</strong>
                <p>${formatCharacterDialogue(
                  choice.response,
                  saveData,
                  character.key
                )}</p>
                <p class="date-neutral-note">
                  この選択で好感度・野菜品質・ゲーム進行上の有利不利は変化しません。
                </p>
              </div>
            `
            : `
              <div class="date-choice-list" aria-label="デート中の選択肢">
                ${dateEvent.choices
                  .map(
                    (item) => `
                      <button
                        class="date-choice-button"
                        type="button"
                        data-date-choice="${item.id}"
                      >
                        ${item.label}
                      </button>
                    `
                  )
                  .join("")}
              </div>
            `
        }

        <div class="date-actions">
          <button class="date-back-button" type="button" data-date-back>
            別のデート先を選ぶ
          </button>
          <button class="date-back-button" type="button" data-date-end>
            自宅で過ごす
          </button>
        </div>
      </article>
    </div>
  `;
}

function renderWeekendEntry(isWeekend, saveData, dateSession) {
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

  const character = getFavoriteCharacter(saveData);
  const dateEvent =
    dateSession?.characterKey === character.key
      ? getDateEvent(character.key, dateSession.eventId)
      : null;

  return `
    <section class="home-weekend-card is-weekend" aria-labelledby="weekend-title">
      <p class="scene-kicker">週末イベント</p>
      <h2 id="weekend-title">今日は${character.name}とデートに出かけられます</h2>
      <p>
        土日だけ遊べる任意コンテンツです。遊ばなくても不利益はなく、
        選択肢にも正解・不正解はありません。
      </p>
      ${
        dateEvent
          ? renderActiveDate(
              character,
              dateEvent,
              saveData,
              dateSession?.choiceId ?? null
            )
          : renderDateList(character, saveData)
      }
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

      ${renderWeekendEntry(time.isWeekend, context.saveData, context.dateSession)}

      ${renderSaveManagement(
        context.saveData,
        context.saveHealth,
        context.saveNotice
      )}

      ${renderHomeNameSettings(context.saveData)}
    </section>
  `;
}
