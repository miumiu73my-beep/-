export function renderHomeScreen() {
  return `
    <section class="scene scene-home" aria-labelledby="home-title">
      <div class="window-placeholder" aria-hidden="true">
        <div class="window-sky"></div>
        <div class="window-hill"></div>
      </div>

      <div class="scene-card">
        <p class="scene-kicker">自宅</p>
        <h2 id="home-title">戻ってくる場所</h2>
        <p>
          現実のカレンダー・週末デート・自宅会話は後のSTEPで追加します。
          久しぶりに起動しても、不在を責める仕組みは作りません。
        </p>
        <div class="placeholder-row">
          <span>カレンダー</span>
          <span>会話</span>
          <span>週末</span>
        </div>
      </div>
    </section>
  `;
}
