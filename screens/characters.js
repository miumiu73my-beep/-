import {
  CHARACTERS,
  CHIBI_ATLAS_SRC,
  PORTRAIT_ATLAS_SRC,
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

const EXPRESSION_INDEX = Object.freeze({
  normal: 0,
  smile: 1,
  worry: 2,
  blush: 3,
});

function atlasPosition(index, total) {
  if (total <= 1) return "0%";
  return `${(index / (total - 1)) * 100}%`;
}

function getPortraitExpression(screenKey, selectionCategory, context = {}) {
  if (screenKey === "home" && context.dateSession) return "blush";
  if (selectionCategory === "date") return "blush";

  if (selectionCategory === "screen:lab" || selectionCategory === "night") {
    return "worry";
  }

  if (
    selectionCategory === "screen:field" ||
    selectionCategory === "screen:home" ||
    selectionCategory === "morning" ||
    selectionCategory === "daytime" ||
    selectionCategory === "weekend"
  ) {
    return "smile";
  }

  return "normal";
}

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

function renderPortraitArt(character, expression = "normal") {
  const expressionIndex = EXPRESSION_INDEX[expression] ?? EXPRESSION_INDEX.normal;
  const characterIndex = Number(character.atlasIndex) || 0;

  return `
    <span class="character-art has-image" data-character-art>
      <span class="character-art-fallback" aria-hidden="true">${character.mark}</span>
      <span
        class="character-portrait-sprite"
        role="img"
        aria-label="${character.name}の${expression === "normal" ? "通常" : expression === "smile" ? "笑顔" : expression === "worry" ? "心配" : "照れ"}立ち絵"
        style="--portrait-atlas:url('${PORTRAIT_ATLAS_SRC}'); --portrait-x:${atlasPosition(expressionIndex, 4)}; --portrait-y:${atlasPosition(characterIndex, 4)}"
      ></span>
    </span>
  `;
}

function renderChibiArt(character) {
  const baseRow = (Number(character.atlasIndex) || 0) * 4;

  return `
    <span class="character-art has-image character-art-chibi" data-character-art>
      <span class="character-art-fallback" aria-hidden="true">${character.mark}</span>
      <span
        class="character-chibi-sprite"
        style="--chibi-atlas:url('${CHIBI_ATLAS_SRC}'); --chibi-front-y:${atlasPosition(baseRow, 16)}; --chibi-back-y:${atlasPosition(baseRow + 1, 16)}; --chibi-right-y:${atlasPosition(baseRow + 2, 16)}; --chibi-left-y:${atlasPosition(baseRow + 3, 16)}"
      ></span>
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
  const expression = getPortraitExpression(
    screenKey,
    selection.category,
    context
  );

  return `
    <section class="character-stage character-stage-${screenKey}" aria-labelledby="character-stage-title">
      <div class="character-stage-portrait">${renderPortraitArt(selected, expression)}</div>
      <div class="character-stage-copy">
        <p class="scene-kicker">${screenLabel}の固定キャラ</p>
        <h2 id="character-stage-title">${selected.fullName}</h2>
        <p
          class="character-dialogue"
          data-dialogue-category="${selection.category}"
          data-character-expression="${expression}"
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
            <span
              class="field-character-walker"
              style="--walker-index:${index}; --walker-delay:${index * -4}s; --walker-y:${6 + index * 20}%"
            >
              ${renderChibiArt(character)}
            </span>
          `
        )
        .join("")}
    </div>
  `;
}
