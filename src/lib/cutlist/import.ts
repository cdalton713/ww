// Translate a Woodsense-shaped project into pieces + hardware + seed stock.

import { MM_PER_IN, fmtInFrac, parseLen } from "@/lib/cutlist/units";
import type { Piece, Stock, Hardware } from "@/lib/cutlist/types";
import { PRESETS, BOARD_LENGTHS } from "@/lib/cutlist/presets";
import type { Project } from "@/types/project";

type ParsedWood = {
  length_in: number | null;
  width_in: number | null;
  thickness_in: number | null;
  material: string;
};

/** Parse "800*100*15mm Siberian Larch Timber" -> dimensions + material. */
export function parseWoodItem(itemStr: string | undefined): ParsedWood | null {
  if (!itemStr) return null;
  const m = String(itemStr).match(
    /^\s*(\d+(?:\.\d+)?)\s*[*x×]\s*(\d+(?:\.\d+)?)\s*[*x×]\s*(\d+(?:\.\d+)?)\s*(mm|cm|in|")?\s*(.*)$/i,
  );
  if (!m) return null;
  const L = parseFloat(m[1]);
  const W = parseFloat(m[2]);
  const T = parseFloat(m[3]);
  const unit = (m[4] || "mm").toLowerCase();
  const scale = unit === "cm" ? 10 : unit === "in" || unit === '"' ? 25.4 : 1;
  return {
    length_in: (L * scale) / MM_PER_IN,
    width_in: (W * scale) / MM_PER_IN,
    thickness_in: (T * scale) / MM_PER_IN,
    material: (m[5] || "Wood").trim() || "Wood",
  };
}

// Nominal softwood/hardwood lumber: "1x4" -> [thickness, width] in inches.
const NOMINAL_LUMBER: Record<string, [number, number]> = {
  "1x2": [0.75, 1.5],
  "1x3": [0.75, 2.5],
  "1x4": [0.75, 3.5],
  "1x6": [0.75, 5.5],
  "1x8": [0.75, 7.25],
  "1x10": [0.75, 9.25],
  "1x12": [0.75, 11.25],
  "2x2": [1.5, 1.5],
  "2x3": [1.5, 2.5],
  "2x4": [1.5, 3.5],
  "2x6": [1.5, 5.5],
  "2x8": [1.5, 7.25],
  "2x10": [1.5, 9.25],
  "2x12": [1.5, 11.25],
  "4x4": [3.5, 3.5],
  "6x6": [5.5, 5.5],
};

// Rough-sawn hardwood quarter stock: "4/4" -> 1.0" thickness.
const QUARTER_STOCK: Record<string, number> = {
  "4/4": 1.0,
  "5/4": 1.25,
  "6/4": 1.5,
  "8/4": 2.0,
  "10/4": 2.5,
  "12/4": 3.0,
  "16/4": 4.0,
};

function normalizeKregStr(s: string): string {
  return s
    .replace(/¼/g, "1/4")
    .replace(/½/g, "1/2")
    .replace(/¾/g, "3/4")
    .replace(/⅛/g, "1/8")
    .replace(/⅜/g, "3/8")
    .replace(/⅝/g, "5/8")
    .replace(/⅞/g, "7/8")
    .replace(/⅓/g, "1/3")
    .replace(/⅔/g, "2/3")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');
}

type FieldParse = {
  length?: number;
  width?: number;
  thickness?: number;
  unclassified?: number;
};

/** Extract length/width/thickness candidates from one comma-separated field. */
function parseDimField(field: string): FieldParse {
  // Drop descriptive suffixes that would confuse parseLen.
  const stripped = field
    .replace(/\b(thick|long|length|wide|width|nominal size)\b\.?/gi, "")
    .replace(/\bSheet\b/gi, "")
    .trim();
  if (!stripped) return {};

  // Quarter stock: "5/4", "5/4 x 6"", etc.
  const qMatch = stripped.match(/^(\d+\/4)\b(.*)$/);
  if (qMatch && QUARTER_STOCK[qMatch[1]]) {
    const t = QUARTER_STOCK[qMatch[1]];
    const rest = qMatch[2].replace(/^\s*[xX×]\s*/, "").trim();
    if (rest) {
      const restVal = parseLen(rest);
      if (isFinite(restVal) && restVal > 0) {
        return { thickness: t, width: restVal };
      }
    }
    return { thickness: t };
  }

  // Nominal lumber: "1x4", "2x6 x 96"", etc.
  const nMatch = stripped.match(/^(\d+x\d+)\b(.*)$/i);
  if (nMatch) {
    const key = nMatch[1].toLowerCase();
    const nom = NOMINAL_LUMBER[key];
    if (nom) {
      const [t, w] = nom;
      const rest = nMatch[2].replace(/^\s*[xX×]\s*/, "").trim();
      if (rest) {
        const restVal = parseLen(rest);
        if (isFinite(restVal) && restVal > 0) {
          return { thickness: t, width: w, length: restVal };
        }
      }
      return { thickness: t, width: w };
    }
  }

  // Split on x/×/* for A x B and A x B x C patterns.
  const pieces = stripped.split(/\s*[xX×*]\s*/);
  if (pieces.length === 3) {
    const vals = pieces.map((p) => parseLen(p));
    if (vals.every((v) => isFinite(v) && v > 0)) {
      const sorted = [...vals].sort((a, b) => a - b);
      return { thickness: sorted[0], width: sorted[1], length: sorted[2] };
    }
  }
  if (pieces.length === 2) {
    const vals = pieces.map((p) => parseLen(p));
    if (vals.every((v) => isFinite(v) && v > 0)) {
      const [a, b] = [...vals].sort((x, y) => x - y);
      // Small × larger: treat small as thickness.
      if (a < 3) {
        return b >= 24
          ? { thickness: a, length: b }
          : { thickness: a, width: b };
      }
      // Both sheet-sized: bigger is length.
      if (a >= 12) return { length: b, width: a };
      // Board-sized pair: bigger is length, smaller is width.
      return { length: b, width: a };
    }
  }

  // Single scalar. Let the caller classify by size against siblings.
  const v = parseLen(stripped);
  if (isFinite(v) && v > 0) return { unclassified: v };
  return {};
}

/**
 * Parse a Kreg-style comma-separated wood item like
 * `Red oak plywood , 96" x 48" , , 3/4`. Returns as much as we can extract;
 * missing dimensions are left null so the UI shows empty rather than guessed.
 */
export function parseKregItem(itemStr: string | undefined): ParsedWood | null {
  if (!itemStr) return null;
  const raw = normalizeKregStr(String(itemStr)).trim();
  if (!raw) return null;
  const parts = raw.split(",").map((s) => s.trim());
  if (parts.length < 2) return null;
  const material = parts[0];
  if (!material) return null;

  let thickness: number | null = null;
  let width: number | null = null;
  let length: number | null = null;
  const unclassified: number[] = [];

  for (let i = 1; i < parts.length; i++) {
    if (!parts[i]) continue;
    const fp = parseDimField(parts[i]);
    if (fp.thickness != null && thickness == null) thickness = fp.thickness;
    if (fp.width != null && width == null) width = fp.width;
    if (fp.length != null && length == null) length = fp.length;
    if (fp.unclassified != null) unclassified.push(fp.unclassified);
  }

  // Assign unclassified scalars to empty slots by size.
  for (const v of unclassified) {
    if (v < 3 && thickness == null) thickness = v;
    else if (v >= 24 && length == null) length = v;
    else if (width == null) width = v;
    else if (length == null) length = v;
  }

  if (thickness == null && width == null && length == null) return null;

  return {
    length_in: length,
    width_in: width,
    thickness_in: thickness,
    material,
  };
}

export type ImportResult = {
  pieces: Piece[];
  hardware: Hardware[];
  stock: Stock[];
  source: string;
};

type IdBag = { piece: number; stock: number; hw: number };

function makePiece(id: number, init: Partial<Piece>): Piece {
  return {
    id,
    label: "",
    length: null,
    width: null,
    thickness: null,
    qty: 1,
    material: "",
    grain: "any",
    ...init,
  };
}

function makeStock(id: number, init: Partial<Stock>): Stock {
  return {
    id,
    label: "",
    length: null,
    width: null,
    thickness: null,
    material: "",
    have: 0,
    price: 0,
    ...init,
  };
}

function makeHardware(id: number, init: Partial<Hardware>): Hardware {
  return {
    id,
    item: "",
    qty: 1,
    unit: "ea",
    price: 0,
    ...init,
  };
}

/**
 * Build pieces + hardware from the project's materials, and seed stock if the
 * user's stock list is empty. Mirrors the logic in the original index.html.
 */
export function importFromProject(
  project: Project,
  hasExistingStock: boolean,
  idSeed: IdBag = { piece: 1, stock: 1, hw: 1 },
): ImportResult {
  const pieces: Piece[] = [];
  const hardware: Hardware[] = [];
  const stock: Stock[] = [];

  const ids = { ...idSeed };

  const woods = project.materials?.wood ?? [];
  let labelIdx = 1;
  for (const row of woods) {
    const parsed = parseWoodItem(row.item) ?? parseKregItem(row.item);
    const qty = Math.max(1, parseInt(row.quantity, 10) || 1);
    if (parsed) {
      const init: Partial<Piece> = {
        label: `Part ${labelIdx++}`,
        qty,
        material: parsed.material,
      };
      if (parsed.length_in != null) init.length = parsed.length_in;
      if (parsed.width_in != null) init.width = parsed.width_in;
      if (parsed.thickness_in != null) init.thickness = parsed.thickness_in;
      pieces.push(makePiece(ids.piece++, init));
    } else {
      pieces.push(
        makePiece(ids.piece++, {
          label: row.item || `Part ${labelIdx++}`,
          qty,
          material: "",
        }),
      );
    }
  }

  const hw = project.materials?.hardware ?? [];
  for (const row of hw) {
    hardware.push(
      makeHardware(ids.hw++, {
        item: row.item || "",
        qty: Math.max(1, parseInt(row.quantity, 10) || 1),
        unit: "ea",
        price: 0,
      }),
    );
  }

  if (!hasExistingStock) {
    const anySheet = pieces.some((p) => p.width != null && p.width > 12);
    if (anySheet) {
      for (const d of PRESETS["sheets-ply"])
        stock.push(makeStock(ids.stock++, d));
    }

    type Group = { thickness: number; widths: Set<number> };
    const tol = 1 / 32;
    const groups: Group[] = [];
    for (const p of pieces) {
      if (!p.thickness) continue;
      let g = groups.find((g) => Math.abs(g.thickness - p.thickness!) <= tol);
      if (!g) {
        g = { thickness: p.thickness, widths: new Set() };
        groups.push(g);
      }
      if (p.width && p.width > 0) g.widths.add(p.width);
    }

    const allStandard = groups.every(
      (g) =>
        Math.abs(g.thickness - 0.75) <= 1 / 8 ||
        Math.abs(g.thickness - 1.5) <= 1 / 8,
    );

    if (allStandard && groups.length > 0) {
      for (const d of PRESETS["boards-full"])
        stock.push(makeStock(ids.stock++, d));
    } else {
      for (const g of groups) {
        const maxNeeded = g.widths.size ? Math.max(...g.widths) : 5.5;
        const widthSet = new Set<number>([
          Math.max(maxNeeded, 3.5),
          Math.max(maxNeeded, 5.5),
          Math.max(maxNeeded, 7.25),
        ]);
        widthSet.add(Math.ceil(maxNeeded * 2) / 2);
        const widths = Array.from(widthSet).sort((a, b) => a - b);
        const tFrac =
          g.thickness < 0.45
            ? `3/8"`
            : g.thickness < 0.56
              ? `1/2"`
              : g.thickness < 0.7
                ? `5/8"`
                : g.thickness < 0.85
                  ? `3/4"`
                  : g.thickness < 1.1
                    ? `1"`
                    : g.thickness < 1.35
                      ? `1 1/4"`
                      : fmtInFrac(g.thickness);
        for (const w of widths) {
          for (const L of BOARD_LENGTHS) {
            stock.push(
              makeStock(ids.stock++, {
                label: `${tFrac} × ${fmtInFrac(w)} — ${L / 12}'`,
                length: L,
                width: w,
                thickness: g.thickness,
                material: "Project lumber",
                have: 0,
                price: 0,
              }),
            );
          }
        }
      }
      for (const d of PRESETS["boards-full"])
        stock.push(makeStock(ids.stock++, d));
    }
  }

  return {
    pieces,
    hardware,
    stock,
    source: project.title || "Project",
  };
}
