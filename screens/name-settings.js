import { CHARACTERS } from "../data/characters.js";
import {
  escapeHtml,
  getCharacterNameMode,
  MAX_PLAYER_NAME_LENGTH,
  NAME_MODES,
  normalizePlayerName,
} from "../data/names.js";

function renderModeRows(saveData, suffix) {
  return Object.values(CHARACTERS)
    .map((character) => {
      const mode = getCharacterNameMode(saveData, character.key);
      const receiverId = `name-mode-${suffix}-${character.key}-receiver`;
      const customId = `name-mode-${suffix}-${character.key}-custom`;

      return `
        <fieldset class="name-mode-row">
          <legend>${escapeHtml(character.fullName)}からの呼び方</legend>
          <div class="name-mode-options">
            <label class="name-mode-option" for="${receiverId}">
              <input
                id="${receiverId}"
                type="radio"
                name="nameMode:${character.key}"
                value="${NAME_MODES.RECEIVER_NAME}"
                ${mode === NAME_MODES.RECEIVER_NAME ? "checked" : ""}
              />
              <span>
                <strong>${escapeHtml(character.receiverName)}</strong>
                <small>対応する受の名前</small>
              </span>
            </label>
            <label class="name-mode-option" for="${customId}">
              <input
                id="${customId}"
                type="radio"
                name="nameMode:${character.key}"
                value="${NAME_MODES.CUSTOM_NAME}"
                ${mode === NAME_MODES.CUSTOM_NAME ? "checked" : ""}
              />
              <span>
                <strong>任意名</strong>
                <small>上で入力した名前</small>
              </span>
            </label>
          </div>
        </fieldset>
      `;
    })
    .join("");
}

export function renderNameSettingsForm(saveData, { initial = false } = {}) {
  const suffix = initial ? "initial" : "home";
  const currentName = escapeHtml(normalizePlayerName(saveData?.player?.customName));

  return `
    <form
      class="name-settings-form"
      data-name-settings-form
      data-name-settings-kind="${initial ? "initial" : "home"}"
    >
      <label class="name-custom-field" for="custom-name-${suffix}">
        <span>主人公の任意名</span>
        <input
          id="custom-name-${suffix}"
          name="customName"
          type="text"
          value="${currentName}"
          maxlength="${MAX_PLAYER_NAME_LENGTH}"
          autocomplete="name"
          placeholder="例：みう"
          required
        />
      </label>

      <p class="name-settings-help">
        キャラクターごとに、対応する受の名前で呼ぶか、入力した任意名で呼ぶかを選べます。
      </p>

      <div class="name-mode-list">
        ${renderModeRows(saveData, suffix)}
      </div>

      <p class="name-settings-error" data-name-error role="alert"></p>

      <button class="name-settings-submit" type="submit">
        ${initial ? "この設定で始める" : "呼び方を保存"}
      </button>
    </form>
  `;
}

export function renderInitialNameSetup(saveData) {
  return `
    <div class="name-setup-overlay" role="presentation">
      <section
        class="name-setup-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="name-setup-title"
      >
        <p class="scene-kicker">初回設定</p>
        <h2 id="name-setup-title">主人公の名前と呼び方</h2>
        <p class="name-setup-copy">
          任意名を入力し、4人それぞれからどう呼ばれるかを選んでください。
          この設定はあとから自宅でも変更できます。
        </p>
        ${renderNameSettingsForm(saveData, { initial: true })}
      </section>
    </div>
  `;
}

export function renderHomeNameSettings(saveData) {
  return `
    <section class="name-settings-card" aria-labelledby="home-name-settings-title">
      <p class="scene-kicker">主人公設定</p>
      <h2 id="home-name-settings-title">名前と呼び方</h2>
      ${renderNameSettingsForm(saveData)}
    </section>
  `;
}
