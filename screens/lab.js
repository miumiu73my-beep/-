import {
  calculateGeneralQuality,
  formatQualityScore,
} from "../data/quality.js";

export function renderLabScreen({ saveData } = {}) {
  const quality = calculateGeneralQuality(saveData);
  const shipmentBonusPercent = Math.round(quality.bonusRate * 100);

  return `
    <section class="scene scene-lab" aria-labelledby="lab-title">
      <div class="scene-visual" aria-hidden="true">
        <span class="scene-symbol">⌘</span>
      </div>
      <div class="scene-card">
        <p class="scene-kicker">研究所</p>
        <h2 id="lab-title">知識を野菜の力に</h2>
        <p>
          STEP 8で野菜の品質システムが有効になりました。
          研究所の講座・図書室で品質補正を増やす操作はSTEP 9で追加します。
        </p>
        <div class="placeholder-row" aria-label="現在の品質">
          <span>品質 ${quality.levelName}</span>
          <span>基礎 ${formatQualityScore(quality.base)}</span>
          <span>研究 +${formatQualityScore(quality.researchBonus)}</span>
          <span>出荷 +${shipmentBonusPercent}%</span>
        </div>
        <p class="gentle-note">
          研究補正は品質を少し有利にするための加点だけです。
          勉強をしなくても野菜は通常どおり育ち、収穫・出荷できます。
        </p>
      </div>
    </section>
  `;
}
