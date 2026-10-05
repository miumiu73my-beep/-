export function renderFieldScreen() {
  const plots = Array.from({ length: 9 }, (_, index) => {
    const label = index === 4 ? "準備中" : "";
    return `<div class="plot-cell"><span>${label}</span></div>`;
  }).join("");

  return `
    <section class="scene scene-field" aria-labelledby="field-title">
      <div class="scene-card">
        <p class="scene-kicker">畑</p>
        <h2 id="field-title">与えられた畑で、のんびり育てよう</h2>
        <p>
          STEP 1では畑の見た目だけを配置しています。
          耕す・種まき・水やり・収穫は後のSTEPで実装します。
        </p>
      </div>

      <div class="plot-wrap" aria-label="畑の仮レイアウト">
        <div class="plot-grid">${plots}</div>
      </div>

      <p class="gentle-note">野菜は枯れない設計です。</p>
    </section>
  `;
}
