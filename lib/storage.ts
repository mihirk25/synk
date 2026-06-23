import type { AppState } from "./types";
import { STORAGE_KEY } from "./constants";
import { createSeedState } from "./seedData";

export function loadState(): AppState {
  if (typeof window === "undefined") return createSeedState();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedState();
    return JSON.parse(raw) as AppState;
  } catch {
    return createSeedState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
