function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatSavedAt(value) {
  if (!value) return "未記録";

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "未記録";

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function renderSaveManagement(saveData, saveHealth = {}, saveNotice = null) {
  const blocked = [
    "needs-recovery",
    "future-version",
    "storage-unavailable",
  ].includes(saveHealth.status);
  const disabled = blocked ? " disabled" : "";
  const noticeText =
    saveNotice?.text ||
    saveHealth.message ||
    "操作後・30秒ごと・バックグラウンド移行時に自動保存します。復旧用の端末内バックアップも最大5世代保持します。";
  const noticeType =
    saveNotice?.type ||
    (blocked ? "error" : saveHealth.status === "recovered" ? "warning" : "info");

  return `
    <section class="save-backup-card" aria-labelledby="save-backup-title">
      <div class="save-backup-heading">
        <div>
          <p class="scene-kicker">セーブ</p>
          <h2 id="save-backup-title">自動保存・バックアップ</h2>
        </div>
        <span class="save-version-badge">v${escapeHtml(saveData?.version ?? "—")}</span>
      </div>

      <p class="save-backup-description">
        普段は手動セーブを意識しなくて大丈夫です。必要な時だけJSONファイルへ書き出したり、
        端末内バックアップから前の状態へ戻したりできます。
      </p>

      <div class="save-status-grid" aria-label="セーブ状態">
        <span>最終保存</span>
        <strong>${escapeHtml(formatSavedAt(saveData?.lastSavedAt))}</strong>
        <span>保存先</span>
        <strong>この端末のIndexedDB</strong>
      </div>

      <div class="save-action-grid">
        <button type="button" data-save-now${disabled}>今すぐ保存</button>
        <button type="button" data-save-export${disabled}>JSONを書き出す</button>

        <label class="save-file-button">
          JSONを読み込む
          <input
            type="file"
            accept=".json,application/json"
            data-save-import
          />
        </label>

        <button type="button" data-save-restore${disabled}>
          端末内バックアップから復元
        </button>
      </div>

      ${saveHealth.status === "needs-recovery" ? `
        <button class="save-reset-button" type="button" data-save-reset>
          復旧できない場合だけ新規セーブを作る
        </button>
      ` : ""}

      <p class="save-management-notice is-${escapeHtml(noticeType)}" aria-live="polite">
        ${escapeHtml(noticeText)}
      </p>

      <details class="save-backup-details">
        <summary>バックアップの仕組み</summary>
        <p>
          メインセーブとは別に「最後に正常だったコピー」と一定間隔の世代バックアップを保持します。
          読み込み時にメインセーブが壊れていれば自動復旧を試みます。
          インポート時は内容とversionを検証し、古いversionは既存のmigrationを通してから保存します。
        </p>
      </details>
    </section>
  `;
}
