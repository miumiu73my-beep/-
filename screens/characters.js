import {
  CHARACTERS,
  getCharacterDialogue,
  getFavoriteCharacter,
} from "../data/characters.js";
import { getDialogueSelection } from "../data/dialogue-engine.js";
import { formatCharacterDialogue } from "../data/names.js";

const SCREEN_LABELS = Object.freeze({
  lab: "研究所",
  field: "畑",
  home: "自宅",
});

function renderCharacterButtons(selectedKey) {
  return Object.values(CHARACTERS)
    .map((character) => {
      const active = character.key === selectedKey;
      return `
        <button
          class="character-select-button${active ? " is-selected" : ""}"
          type="button"
          data-character-select="${character.key}"
          aria-pressed="${active ? "true" : "false"}"
        >
          <span class="character-select-mark" aria-hidden="true">${character.mark}</span>
          <span>${character.name}</span>
        </button>
      `;
    })
    .join("");
}

function renderCharacterArt(character, { chibi = false } = {}) {
  const src = chibi ? character.chibiSrc : character.portraitSrc;
  const className = chibi ? "character-chibi-image" : "character-portrait-image";

  return `
    <span class="character-art" data-character-art>
      <span class="character-art-fallback" aria-hidden="true">${character.mark}</span>
      <img
        class="${className}"
        src="${src}"
        alt="${chibi ? `${character.name}のちびキャラ` : `${character.name}の立ち絵`}"
        data-character-asset
        draggable="false"
      />
    </span>
  `;
}

export function renderCharacterStage(saveData, screenKey, context = {}) {
  const selected = getFavoriteCharacter(saveData);
  const screenLabel = SCREEN_LABELS[screenKey] ?? "この場所";
  const selection = getDialogueSelection({
    characterKey: selected.key,
    screenKey,
    now: context.now,
    eventType:
      screenKey === "home" && context.dateSession ? "date" : null,
  });
  const dialogueTemplate =
    selection.text || getCharacterDialogue(selected, screenKey);

  return `
    <section class="character-stage character-stage-${screenKey}" aria-labelledby="character-stage-title">
      <div class="character-stage-portrait">${renderCharacterArt(selected)}</div>
      <div class="character-stage-copy">
        <p class="scene-kicker">${screenLabel}の固定キャラ</p>
        <h2 id="character-stage-title">${selected.fullName}</h2>
        <p
          class="character-dialogue"
          data-dialogue-category="${selection.category}"
        >${formatCharacterDialogue(
          dialogueTemplate,
          saveData,
          selected.key
        )}</p>
      </div>
      <div class="character-selector" aria-label="固定表示するキャラクター">
        ${renderCharacterButtons(selected.key)}
      </div>
    </section>
  `;
}

export function renderFieldWalkers() {
  return `
    <div class="field-character-layer" aria-hidden="true">
      ${Object.values(CHARACTERS)
        .map(
          (character, index) => `
            <span class="field-character-walker" style="--walker-index:${index}; --walker-delay:${index * -4}s">
              ${renderCharacterArt(character, { chibi: true })}
            </span>
          `
        )
        .join("")}
    </div>
  `;
}
