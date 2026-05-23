"use client";

import { useEffect } from "react";

const STORAGE_KEY = "hk-usage-count";
const PROMPT_THRESHOLD = 5; // prompt after 5 interactions

/**
 * Tracks usage (audio plays / card swipes) in localStorage.
 * Call `track()` on each interaction. Returns true when
 * the soft prompt threshold is reached.
 */
export function getUsageCount(): number {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

export function incrementUsage(): number {
  const next = getUsageCount() + 1;
  try {
    localStorage.setItem(STORAGE_KEY, String(next));
  } catch {
    // localStorage not available
  }
  return next;
}

export function resetUsage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage not available
  }
}

export function shouldPromptLogin(): boolean {
  return getUsageCount() >= PROMPT_THRESHOLD;
}

export { PROMPT_THRESHOLD };
