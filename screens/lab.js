import {
  LAB_CHARACTERS,
  LIBRARY_TOPICS,
  RESEARCH_COURSES,
  COURSE_REVIEW_BONUS,
  countStudySessions,
  getCompletedCourseIds,
  getLabCharacter,
} from "../data/research.js";
import {
  calculateGeneralQuality,
  formatQualityScore,
  MAX_RESEARCH_BONUS,
} from "../data/quality.js";

function renderCharacterPanel(saveData) {
  const selectedKey = saveData?.player?.favoriteCharacter ?? null;
  const selected = getLabCharacter(selectedKey);
  const buttons = Object.values(LAB_CHARACTERS)
    .map((character) => {
      const active = character.key === selectedKey;

      return `
        <button
          class="lab-character-button${active ? " is-selected" : ""}"
          type="button"
          data-lab-character="${character.key}"
          aria-pressed="${active ? "true" : "false"}"
        >
          <span aria-hidden="true">${character.mark}</span>
          ${character.name}
        </button>
      `;
    })
    .join("");

  return `
    <section class="lab-character-card" aria-labelledby="lab-character-title">
      <div class="lab-character-display" aria-hidden="true">
        <span>${selected?.mark ?? "✦"}</span>
      </div>
      <div class="lab-character-copy">
        <p class="scene-kicker">固定キャラ</p>
        <h3 id="lab-character-title">${selected ? selected.name : "研究相棒を選ぶ"}</h3>
        <p class="lab-dialogue">
          ${selected?.dialogue ?? "4人のうち、研究所に一緒にいてほしい相手を選べます。"}
        </p>
      </div>
      <div class="lab-character-selector" aria-label="研究所の固定キャラ">
        ${buttons}
      </div>
    </section>
  `;
}

function renderCourses(saveData) {
  const completed = getCompletedCourseIds(saveData);

  return RESEARCH_COURSES.map((course) => {
    const isCompleted = completed.has(course.id);
    const bonus = isCompleted ? COURSE_REVIEW_BONUS : course.bonus;

    return `
      <article class="lab-action-card${isCompleted ? " is-complete" : ""}">
        <div>
          <p class="lab-action-kind">${isCompleted ? "復習" : "初回"}</p>
          <h4>${course.title}</h4>
          <p>${course.description}</p>
        </div>
        <div class="lab-action-meta">
          <span>研究 +${formatQualityScore(bonus)}</span>
          <button
            type="button"
            data-lab-course="${course.id}"
          >${isCompleted ? "復習する" : "受講する"}</button>
        </div>
      </article>
    `;
  }).join("");
}

function renderLibrary(saveData) {
  return LIBRARY_TOPICS.map((topic) => {
    const count = countStudySessions(saveData, topic.id);

    return `
      <article class="lab-action-card">
        <div>
          <p class="lab-action-kind">何度でも</p>
          <h4>${topic.title}</h4>
          <p>${topic.description}</p>
        </div>
        <div class="lab-action-meta">
          <span>研究 +${formatQualityScore(topic.bonus)}${count > 0 ? `・${count}回` : ""}</span>
          <button type="button" data-lab-study="${topic.id}">勉強する</button>
        </div>
      </article>
    `;
  }).join("");
}

export function renderLabScreen({ saveData, labNotice = "" } = {}) {
  const quality = calculateGeneralQuality(saveData);
  const shipmentBonusPercent = Math.round(quality.bonusRate * 100);
  const completedCount = getCompletedCourseIds(saveData).size;
  const studyCount = countStudySessions(saveData);

  return `
    <section class="scene scene-lab" aria-labelledby="lab-title">
      <div class="scene-visual lab-visual" aria-hidden="true">
        <span class="scene-symbol">⌘</span>
      </div>

      <div class="scene-card">
        <p class="scene-kicker">研究所</p>
        <h2 id="lab-title">知識を野菜の力に</h2>
        <p>
          講座は初回の学びが大きめ、復習と図書室は小さめの補正です。
          研究補正は+${formatQualityScore(MAX_RESEARCH_BONUS)}が上限なので、研究所だけで経済が壊れません。
        </p>
        <div class="lab-quality-grid" aria-label="現在の品質">
          <span>品質 <strong>${quality.levelName}</strong></span>
          <span>基礎 <strong>${formatQualityScore(quality.base)}</strong></span>
          <span>研究 <strong>+${formatQualityScore(quality.researchBonus)}</strong></span>
          <span>出荷 <strong>+${shipmentBonusPercent}%</strong></span>
        </div>
        <p class="lab-progress-note">
          初回受講 ${completedCount}/${RESEARCH_COURSES.length}・図書室 ${studyCount}回・研究上限 +${formatQualityScore(MAX_RESEARCH_BONUS)}
        </p>
      </div>

      ${renderCharacterPanel(saveData)}

      <section class="lab-section" aria-labelledby="lab-course-title">
        <div class="lab-section-heading">
          <p class="scene-kicker">講座</p>
          <h3 id="lab-course-title">好きなだけ受講する</h3>
        </div>
        <div class="lab-action-list">
          ${renderCourses(saveData)}
        </div>
      </section>

      <section class="lab-section" aria-labelledby="lab-library-title">
        <div class="lab-section-heading">
          <p class="scene-kicker">図書室</p>
          <h3 id="lab-library-title">好きなだけ勉強する</h3>
        </div>
        <div class="lab-action-list">
          ${renderLibrary(saveData)}
        </div>
      </section>

      <div class="field-guide">
        <p class="field-notice" role="status">
          ${labNotice || "研究所の利用は任意です。気になる講座や本から、好きな時に進めてください。"}
        </p>
        <p class="gentle-note">
          研究所を使わなくても野菜は育ち、収穫・出荷できます。
          好感度・ログイン頻度・デート回数は品質計算に入らず、研究補正が上限でも利用を強制しません。
        </p>
      </div>
    </section>
  `;
}
