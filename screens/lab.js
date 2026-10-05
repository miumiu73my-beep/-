export function renderLabScreen() {
  return `
    <section class="scene scene-lab" aria-labelledby="lab-title">
      <div class="scene-visual" aria-hidden="true">
        <span class="scene-symbol">⌘</span>
      </div>
      <div class="scene-card">
        <p class="scene-kicker">研究所</p>
        <h2 id="lab-title">知識を野菜の力に</h2>
        <p>
          講座・図書室・品質アップは後のSTEPで追加します。
          今は3画面を行き来できる土台だけを用意しています。
        </p>
        <div class="placeholder-row">
          <span>講座</span>
          <span>図書室</span>
          <span>固定キャラ</span>
        </div>
      </div>
    </section>
  `;
}
