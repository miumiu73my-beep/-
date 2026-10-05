import { SAVE_NAMESPACE } from "./storage.js";

const LAST_SAVED_AT_KEY = `${SAVE_NAMESPACE}:last-saved-at`;

export function loadLastSavedAt() {
  try {
    const value = localStorage.getItem(LAST_SAVED_AT_KEY);
    if (!value) return null;

    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  } catch (error) {
    console.warn("Could not read the last saved time:", error);
    return null;
  }
}

export function saveLastSavedAt(date = new Date()) {
  try {
    const isoString = date.toISOString();
    localStorage.setItem(LAST_SAVED_AT_KEY, isoString);
    return isoString;
  } catch (error) {
    console.warn("Could not save the current time:", error);
    return null;
  }
}
