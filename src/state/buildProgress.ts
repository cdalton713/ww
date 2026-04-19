import { produce } from "immer";
import { useSyncExternalStore } from "react";

/**
 * Per-project "step complete" state, persisted to localStorage.
 *
 * Mini custom store (rather than dragging in zustand for this one thing):
 *   - the store is a plain object {projectId: number[]}
 *   - we use Immer to produce the next state immutably
 *   - React subscribes via useSyncExternalStore
 *   - every write is persisted synchronously
 */

const STORAGE_KEY = "workshop.buildProgress.v1";

type ProgressMap = Record<string, number[]>;

function load(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    // Defensive copy + type check
    const out: ProgressMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(v) && v.every((n) => typeof n === "number")) {
        out[k] = [...v];
      }
    }
    return out;
  } catch {
    return {};
  }
}

let state: ProgressMap = load();
const listeners = new Set<() => void>();

function emit() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage could be full or disabled (incognito Safari). Fall through.
  }
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ProgressMap {
  return state;
}

/** React hook: completed step numbers for a given project (stable array). */
export function useCompletedSteps(projectId: string | undefined): number[] {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (!projectId) return EMPTY;
  return snap[projectId] ?? EMPTY;
}

const EMPTY: number[] = [];

/** Toggle a step's completion state. */
export function toggleStep(projectId: string, stepNumber: number): void {
  state = produce(state, (draft) => {
    const arr = draft[projectId] ?? [];
    const idx = arr.indexOf(stepNumber);
    if (idx >= 0) arr.splice(idx, 1);
    else {
      arr.push(stepNumber);
      arr.sort((a, b) => a - b);
    }
    draft[projectId] = arr;
  });
  emit();
}

/** Explicitly mark a step complete (idempotent). Used by "Next ▶". */
export function markStepDone(projectId: string, stepNumber: number): void {
  state = produce(state, (draft) => {
    const arr = draft[projectId] ?? [];
    if (!arr.includes(stepNumber)) {
      arr.push(stepNumber);
      arr.sort((a, b) => a - b);
    }
    draft[projectId] = arr;
  });
  emit();
}

/** Clear progress for a project. */
export function resetProgress(projectId: string): void {
  state = produce(state, (draft) => {
    delete draft[projectId];
  });
  emit();
}
