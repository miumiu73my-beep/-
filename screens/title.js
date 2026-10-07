import { hasCompletedNameSetup, escapeHtml } from "../data/names.js";

// IndexedDBに初期状態だけが作られていても、初回設定完了までは「ゲームをはじめる」。
export function renderTitleScreen(saveData, saveHealth = {}) {
  const hasPlayableSave = hasCompletedNameSetup(saveData);
  const warning = saveHealth.status !== "ok" && saveHealth.message
    ? `<p class="title-save-warning" role="status">${escapeHtml(saveHealth.message)}</p>`
    : "";

  return `
    <section class="title-screen" role="dialog" aria-modal="true" aria-labelledby="title-heading">
      <h2 id="title-heading" class="title-screen-accessible-heading">野菜聖女</h2>
      <div class="title-art" role="img" aria-label="野菜聖女のファンタジー農園と中央のタイトルロゴ"></div>
      <div class="title-bottom-ui">
        <div class="title-menu">
          <button class="title-start-button" type="button" data-title-start>
            <span>${hasPlayableSave ? "つづきから" : "ゲームをはじめる"}</span>
            <span aria-hidden="true">▶</span>
          </button>
          <p class="title-menu-note">
            ${hasPlayableSave
              ? "前回の続きから遊べます。"
              : "最初に主人公の名前と呼び方を設定します。"}
          </p>
          ${warning}
        </div>
        <button class="title-bgm-button" type="button" data-title-bgm aria-pressed="false">
          ♪ BGM ON
        </button>
        <p class="title-bgm-status" role="status" aria-live="polite" data-title-bgm-status></p>
      </div>
    </section>
  `;
}
