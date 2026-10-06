import { CHARACTERS } from "./characters.js";

export const NAME_TOKEN = "{{name}}";
export const MAX_PLAYER_NAME_LENGTH = 20;

export const NAME_MODES = Object.freeze({
  RECEIVER_NAME: "receiverName",
  CUSTOM_NAME: "customName",
});

export function normalizePlayerName(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, MAX_PLAYER_NAME_LENGTH);
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function getCharacterNameMode(saveData, characterKey) {
  const value = saveData?.player?.nameModeByCharacter?.[characterKey];

  return value === NAME_MODES.CUSTOM_NAME
    ? NAME_MODES.CUSTOM_NAME
    : NAME_MODES.RECEIVER_NAME;
}

export function getResolvedPlayerName(saveData, characterKey) {
  const character = CHARACTERS[characterKey] ?? null;
  const customName = normalizePlayerName(saveData?.player?.customName);
  const mode = getCharacterNameMode(saveData, characterKey);

  if (mode === NAME_MODES.CUSTOM_NAME && customName) {
    return customName;
  }

  return character?.receiverName ?? customName ?? "あなた";
}

export function formatCharacterDialogue(template, saveData, characterKey) {
  const resolvedName = escapeHtml(getResolvedPlayerName(saveData, characterKey));

  return String(template ?? "").replaceAll(NAME_TOKEN, resolvedName);
}

export function hasCompletedNameSetup(saveData) {
  return normalizePlayerName(saveData?.player?.customName).length > 0;
}
