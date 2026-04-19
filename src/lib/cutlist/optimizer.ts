// 2D MaxRects FFD packer, with a 1D fallback for pieces that have no width.
// Pieces are grouped by (thickness, material) into "buckets". Each bucket is
// packed against compatible stock using guillotine-style free-rect splitting.

import type {
  PlacedPiece,
  Piece,
  Results,
  Settings,
  Sheet,
  Stock,
  UnplacedPiece,
} from "@/lib/cutlist/types";
import { fmt, fmtLong, type Unit } from "@/lib/cutlist/units";

type ExpandedPiece = {
  pid: number;
  label: string;
  length: number;
  width: number | null;
  thickness: number;
  material: string;
  grain: Piece["grain"];
  instance: number;
  ofQty: number;
  origLength: number;
};

type FreeRect = { x: number; y: number; w: number; h: number };

type OpenSheet = Omit<Sheet, "pieces"> & {
  pieces: PlacedPiece[];
  freeRects: FreeRect[];
};

function compatThick(a: number, b: number, tol: number): boolean {
  return Math.abs((a || 0) - (b || 0)) <= tol + 1e-9;
}

/**
 * Map a free-form material string onto a broad category so pieces can match
 * stock without exact name agreement. "Siberian Larch Timber" -> lumber;
 * "3/4 Baltic Birch Plywood" -> plywood; etc.
 */
function materialCategory(name: string): string {
  const s = String(name || "").toLowerCase();
  if (!s) return "";
  if (/\bmdf\b/.test(s)) return "mdf";
  if (/\bosb\b/.test(s)) return "osb";
  if (/\b(?:melamine|particleboard|particle\s*board|chipboard)\b/.test(s))
    return "composite";
  if (/\b(?:ply|plywood|bb\/bb|birch\s*ply)\b/.test(s)) return "plywood";
  if (/\b(?:hardboard|masonite)\b/.test(s)) return "hardboard";
  return "lumber";
}

function compatMaterial(a: string, b: string): boolean {
  const na = (a || "").trim().toLowerCase();
  const nb = (b || "").trim().toLowerCase();
  if (!na || !nb) return true;
  if (na === nb) return true;
  const ca = materialCategory(na);
  const cb = materialCategory(nb);
  if (ca && cb && ca === cb) return true;
  return false;
}

function stockLabelFor(s: Pick<Stock, "length" | "width" | "thickness" | "material">, unit: Unit): string {
  const len = s.length || 0;
  const wid = s.width || 0;
  const th = s.thickness || 0;
  return `${fmtLong(len, unit)} × ${fmtLong(wid, unit)} × ${fmt(th, unit)}${s.material ? " " + s.material : ""}`;
}

type Placement = {
  x: number;
  y: number;
  w: number;
  h: number;
  rotated: boolean;
};

function tryPlace(
  sheet: OpenSheet,
  pL: number,
  pW: number,
  grain: Piece["grain"],
  allowRotateGlobal: boolean,
  kerf: number,
  strategy: Settings["strategy"],
): Placement | null {
  const rects = sheet.freeRects;
  const canRotate = allowRotateGlobal && grain === "any" && pW > 0;
  type Candidate = Placement & { score: number };
  let best: Candidate | null = null;

  const consider = (
    x: number,
    y: number,
    w: number,
    h: number,
    rotated: boolean,
    score: number,
  ) => {
    if (!best || score < best.score) best = { x, y, w, h, rotated, score };
  };

  const width = Math.max(pW, 0.0001);
  for (const r of rects) {
    if (r.w + 1e-9 >= pL && r.h + 1e-9 >= width) {
      const leftover = r.w * r.h - pL * width;
      const shortLeftover = Math.min(r.w - pL, r.h - width);
      const score =
        strategy === "best-short"
          ? shortLeftover
          : strategy === "first-fit"
            ? 0
            : leftover;
      consider(r.x, r.y, pL, width, false, score);
      if (strategy === "first-fit" && best) break;
    }
    if (canRotate && r.w + 1e-9 >= width && r.h + 1e-9 >= pL) {
      const leftover = r.w * r.h - width * pL;
      const shortLeftover = Math.min(r.w - width, r.h - pL);
      const score =
        strategy === "best-short"
          ? shortLeftover
          : strategy === "first-fit"
            ? 0
            : leftover;
      consider(r.x, r.y, width, pL, true, score);
      if (strategy === "first-fit" && best) break;
    }
  }
  const chosen = best as Candidate | null;
  if (!chosen) return null;
  splitFreeRects(sheet, chosen, kerf);
  return {
    x: chosen.x,
    y: chosen.y,
    w: chosen.w,
    h: chosen.h,
    rotated: chosen.rotated,
  };
}

function splitFreeRects(sheet: OpenSheet, place: Placement, kerf: number): void {
  const rects = sheet.freeRects;
  const newRects: FreeRect[] = [];
  for (const r of rects) {
    if (
      place.x >= r.x + r.w ||
      place.x + place.w <= r.x ||
      place.y >= r.y + r.h ||
      place.y + place.h <= r.y
    ) {
      newRects.push(r);
      continue;
    }
    if (place.x > r.x) {
      newRects.push({ x: r.x, y: r.y, w: place.x - r.x - kerf, h: r.h });
    }
    if (place.x + place.w < r.x + r.w) {
      const nx = place.x + place.w + kerf;
      newRects.push({ x: nx, y: r.y, w: r.x + r.w - nx, h: r.h });
    }
    if (place.y > r.y) {
      newRects.push({ x: r.x, y: r.y, w: r.w, h: place.y - r.y - kerf });
    }
    if (place.y + place.h < r.y + r.h) {
      const ny = place.y + place.h + kerf;
      newRects.push({ x: r.x, y: ny, w: r.w, h: r.y + r.h - ny });
    }
  }
  const cleaned = newRects.filter((r) => r.w > 1e-6 && r.h > 1e-6);
  const out: FreeRect[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    let contained = false;
    for (let j = 0; j < cleaned.length; j++) {
      if (i === j) continue;
      const a = cleaned[i];
      const b = cleaned[j];
      if (
        a.x >= b.x - 1e-9 &&
        a.y >= b.y - 1e-9 &&
        a.x + a.w <= b.x + b.w + 1e-9 &&
        a.y + a.h <= b.y + b.h + 1e-9
      ) {
        contained = true;
        break;
      }
    }
    if (!contained) out.push(cleaned[i]);
  }
  sheet.freeRects = out;
}

export function optimize(
  pieces: Piece[],
  stock: Stock[],
  settings: Settings,
  unit: Unit = "in",
): Results {
  const kerf = settings.kerf || 0;
  const trim = settings.trim || 0;
  const allowRotateGlobal = settings.allowRotate;
  const tol = settings.thickTol || 0;

  // Expand by qty so each copy is placed individually.
  const expanded: ExpandedPiece[] = [];
  for (const p of pieces) {
    if (!p.length || p.length <= 0) continue;
    const len = p.length + trim;
    const wid = p.width && p.width > 0 ? p.width : null;
    const th = p.thickness ?? 0;
    const mat = p.material || "";
    const qty = Math.max(1, p.qty | 0);
    for (let i = 0; i < qty; i++) {
      expanded.push({
        pid: p.id,
        label: p.label || "P" + p.id,
        length: len,
        width: wid,
        thickness: th,
        material: mat,
        grain: p.grain || "any",
        instance: i + 1,
        ofQty: qty,
        origLength: p.length,
      });
    }
  }

  if (expanded.length === 0) {
    return {
      sheets: [],
      unplaced: [],
      totalArea: 0,
      usedArea: 0,
      stats: { usedStock: 0, totalCost: 0 },
    };
  }

  // Bucket by (thickness, material).
  type Bucket = {
    thickness: number;
    material: string;
    pieces: ExpandedPiece[];
  };
  const buckets: Bucket[] = [];
  for (const piece of expanded) {
    let b = buckets.find(
      (b) =>
        compatThick(b.thickness, piece.thickness, tol) &&
        compatMaterial(b.material, piece.material),
    );
    if (!b) {
      b = { thickness: piece.thickness, material: piece.material, pieces: [] };
      buckets.push(b);
    }
    b.pieces.push(piece);
  }

  const sheets: Sheet[] = [];
  const unplaced: UnplacedPiece[] = [];
  const stockUseCounts = new Map<number, number>();

  for (const bucket of buckets) {
    const compatStock = stock.filter(
      (s) =>
        s.length != null &&
        s.width != null &&
        s.length > 0 &&
        s.width > 0 &&
        compatThick(s.thickness ?? 0, bucket.thickness, tol) &&
        compatMaterial(s.material, bucket.material),
    );
    const candStock =
      compatStock.length > 0
        ? compatStock
        : stock.filter(
            (s) =>
              s.length != null &&
              s.width != null &&
              s.length > 0 &&
              s.width > 0 &&
              compatThick(s.thickness ?? 0, bucket.thickness, tol),
          );

    if (candStock.length === 0) {
      for (const pc of bucket.pieces) {
        unplaced.push({
          pid: pc.pid,
          label: pc.label,
          instance: pc.instance,
          ofQty: pc.ofQty,
          length: pc.length,
          width: pc.width,
          thickness: pc.thickness,
          material: pc.material,
        });
      }
      continue;
    }

    const orderedPieces = bucket.pieces.slice().sort((a, b) => {
      const la = Math.max(a.length, a.width ?? a.length);
      const lb = Math.max(b.length, b.width ?? b.length);
      return lb - la;
    });

    const openSheets: OpenSheet[] = [];

    for (const piece of orderedPieces) {
      const is1D = piece.width == null;
      let placed = false;

      for (const sh of openSheets) {
        const pieceW = is1D ? sh.width : (piece.width as number);
        const allowR = is1D ? false : allowRotateGlobal;
        const placement = tryPlace(
          sh,
          piece.length,
          pieceW,
          piece.grain,
          allowR,
          kerf,
          settings.strategy,
        );
        if (placement) {
          sh.pieces.push({
            pid: piece.pid,
            label: piece.label,
            instance: piece.instance,
            ofQty: piece.ofQty,
            thickness: piece.thickness,
            material: piece.material,
            origLength: piece.origLength,
            ...placement,
          });
          placed = true;
          break;
        }
      }

      if (placed) continue;

      const fits = candStock.filter((s) => {
        const sL = s.length as number;
        const sW = s.width as number;
        if (is1D) return sL >= piece.length;
        const w = piece.width as number;
        const fitsNormal = sL >= piece.length && sW >= w;
        const fitsRot =
          allowRotateGlobal &&
          piece.grain === "any" &&
          sL >= w &&
          sW >= piece.length;
        return fitsNormal || fitsRot;
      });

      if (fits.length === 0) {
        unplaced.push({
          pid: piece.pid,
          label: piece.label,
          instance: piece.instance,
          ofQty: piece.ofQty,
          length: piece.length,
          width: piece.width,
          thickness: piece.thickness,
          material: piece.material,
        });
        continue;
      }

      fits.sort((a, b) => {
        const ha = a.have - (stockUseCounts.get(a.id) ?? 0);
        const hb = b.have - (stockUseCounts.get(b.id) ?? 0);
        if ((ha > 0) !== (hb > 0)) return hb > 0 ? 1 : -1;
        if (is1D) return (a.length as number) - (b.length as number);
        return (
          (a.length as number) * (a.width as number) -
          (b.length as number) * (b.width as number)
        );
      });

      const chosen = fits[0];
      const sL = chosen.length as number;
      const sW = chosen.width as number;
      const sheet: OpenSheet = {
        stockId: chosen.id,
        label: chosen.label || stockLabelFor(chosen, unit),
        length: sL,
        width: sW,
        thickness: chosen.thickness ?? 0,
        material: chosen.material,
        price: chosen.price || 0,
        pieces: [],
        freeRects: [{ x: 0, y: 0, w: sL, h: sW }],
      };

      const pieceW = is1D ? sW : (piece.width as number);
      const allowR = is1D ? false : allowRotateGlobal;
      const placement = tryPlace(
        sheet,
        piece.length,
        pieceW,
        piece.grain,
        allowR,
        kerf,
        settings.strategy,
      );

      if (placement) {
        sheet.pieces.push({
          pid: piece.pid,
          label: piece.label,
          instance: piece.instance,
          ofQty: piece.ofQty,
          thickness: piece.thickness,
          material: piece.material,
          origLength: piece.origLength,
          ...placement,
        });
        openSheets.push(sheet);
        stockUseCounts.set(
          chosen.id,
          (stockUseCounts.get(chosen.id) ?? 0) + 1,
        );
      } else {
        unplaced.push({
          pid: piece.pid,
          label: piece.label,
          instance: piece.instance,
          ofQty: piece.ofQty,
          length: piece.length,
          width: piece.width,
          thickness: piece.thickness,
          material: piece.material,
        });
      }
    }

    for (const sh of openSheets) {
      sheets.push({
        stockId: sh.stockId,
        label: sh.label,
        length: sh.length,
        width: sh.width,
        thickness: sh.thickness,
        material: sh.material,
        price: sh.price,
        pieces: sh.pieces,
      });
    }
  }

  let totalArea = 0;
  let usedArea = 0;
  let totalCost = 0;
  for (const sh of sheets) {
    totalArea += sh.length * sh.width;
    for (const pc of sh.pieces) usedArea += pc.w * pc.h;
    totalCost += sh.price || 0;
  }

  return {
    sheets,
    unplaced,
    totalArea,
    usedArea,
    stats: { usedStock: sheets.length, totalCost },
  };
}

export { stockLabelFor };
