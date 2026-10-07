import { CHARACTER_KEYS, CHARACTERS } from "../data/characters.js";
import { escapeHtml, hasCompletedNameSetup } from "../data/names.js";

export function renderTitleScreen(saveData, saveHealth = {}) {
  const hasSave = hasCompletedNameSetup(saveData);
  const cast = CHARACTER_KEYS.map((key, index) => {
    const character = CHARACTERS[key];
    const rowPosition = index === 0 ? 0 : index === 3 ? 100 : index * 100 / 3;

    return `
      <div class="title-character">
        <div class="title-character-picture" aria-hidden="true">
          <span class="title-character-fallback">${escapeHtml(character.mark)}</span>
          <span class="title-character-sprite" style="--title-portrait-y: ${rowPosition}%"></span>
        </div>
        <span class="title-character-name">${escapeHtml(character.name)}</span>
      </div>
    `;
  }).join("");

  const warning = saveHealth.status && saveHealth.status !== "ok" && saveHealth.message
    ? `<p class="title-save-warning" role="status">${escapeHtml(saveHealth.message)}</p>`
    : "";

  return `
    <section class="title-screen" role="dialog" aria-modal="true" aria-labelledby="title-heading">
      <div class="title-content">
        <header class="title-brand">
          <p class="title-overline">異世界で、のんびり農業。</p>
          <h2 id="title-heading">野菜聖女</h2>
          <p class="title-tagline">種をまいて、少しずつ育てる。<br />あなたと四人の、やさしい日々。</p>
        </header>

        <div class="title-cast" aria-label="登場キャラクター">
          ${cast}
        </div>

        <div class="title-menu">
          <p class="title-menu-label">${hasSave ? "おかえりなさい。畑が待っています。" : "ここから、あなたの物語が始まります。"}</p>
          <button class="title-start-button" type="button" data-title-start>
            <span>${hasSave ? "つづきから" : "ゲームをはじめる"}</span>
            <span aria-hidden="true">▶</span>
          </button>
          <p class="title-menu-note">${hasSave ? "保存した畑や設定をそのまま読み込みます。" : "最初に主人公の名前と呼び方を設定します。"}</p>
          ${warning}
          <button class="title-bgm-button" type="button" data-title-bgm aria-pressed="false">♪ BGM ON</button>
          <p class="title-bgm-status" role="status" aria-live="polite" data-title-bgm-status></p>
        </div>

        <p class="title-footer">育てたいときに、あなたのペースで。</p>
      </div>
    </section>
  `;
}
