// Per-session cut-list state. Persists to sessionStorage so navigating away
// from the page (but staying in the tab) doesn't lose the pieces list.
//
// Uses a minimal Immer + useSyncExternalStore pattern — no third-party store.

import { produce, type Draft } from "immer";
import { useSyncExternalStore } from "react";

import type {
  Hardware,
  Piece,
  Results,
  Settings,
  Stock,
} from "@/lib/cutlist/types";
import type { Unit } from "@/lib/cutlist/units";

export type CutListState = {
  unit: Unit;
  pieces: Piece[];
  stock: Stock[];
  hardware: Hardware[];
  settings: Settings;
  source: string;
  results: Results | null;
  // Monotonic id generators. Stored in state so Immer produce can bump them.
  idSeq: { piece: number; stock: number; hw: number };
};

const STORAGE_KEY = "cutlist.state.v2";

const DEFAULT_SETTINGS: Settings = {
  kerf: 1 / 8,
  trim: 0,
  allowRotate: true,
  strategy: "best-area",
  thickTol: 1 / 32,
  currency: "$",
  defaultThickness: null,
  defaultMaterial: "",
};

const INITIAL: CutListState = {
  unit: "in",
  pieces: [],
  stock: [],
  hardware: [],
  settings: { ...DEFAULT_SETTINGS },
  source: "Standalone",
  results: null,
  idSeq: { piece: 1, stock: 1, hw: 1 },
};

function loadPersisted(): CutListState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CutListState> | null;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      ...INITIAL,
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      idSeq: { ...INITIAL.idSeq, ...(parsed.idSeq ?? {}) },
      // results are not persisted — recompute on demand
      results: null,
    };
  } catch {
    return null;
  }
}

let state: CutListState = loadPersisted() ?? INITIAL;
const listeners = new Set<() => void>();

function emit() {
  try {
    // `results` is intentionally not persisted — it can get large and is easy
    // to recompute.
    const { unit, pieces, stock, hardware, settings, source, idSeq } = state;
    const payload = { unit, pieces, stock, hardware, settings, source, idSeq };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage may be full or disabled; state is still in memory.
  }
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

export function useCutListState(): CutListState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function update(recipe: (draft: Draft<CutListState>) => void): void {
  state = produce(state, recipe);
  emit();
}

/** Replace entire state (used after import-from-project). */
export function replaceState(next: Partial<CutListState>): void {
  state = produce(state, (draft) => {
    Object.assign(draft, next);
  });
  emit();
}

export function resetAll(): void {
  state = produce(INITIAL, () => {});
  emit();
}

/** Returns the next id, mutating the seq counter. */
export function nextPieceId(): number {
  let id = 0;
  update((draft) => {
    id = draft.idSeq.piece;
    draft.idSeq.piece += 1;
  });
  return id;
}
export function nextStockId(): number {
  let id = 0;
  update((draft) => {
    id = draft.idSeq.stock;
    draft.idSeq.stock += 1;
  });
  return id;
}
export function nextHwId(): number {
  let id = 0;
  update((draft) => {
    id = draft.idSeq.hw;
    draft.idSeq.hw += 1;
  });
  return id;
}

export { DEFAULT_SETTINGS };
