// Stock presets in inches. These feed the "load preset" dropdown.

export const SOFTWOOD = "Softwood (pine/fir)";
export const PLY_BIRCH = "Birch plywood";
export const MDF = "MDF";
export const BOARD_LENGTHS = [72, 96, 120, 144] as const; // 6, 8, 10, 12 ft

export type NominalSize = {
  w: number; // actual width (inches)
  t: number; // actual thickness (inches)
};

export const NOMINAL: Record<string, NominalSize> = {
  "1x2": { w: 1.5, t: 0.75 },
  "1x3": { w: 2.5, t: 0.75 },
  "1x4": { w: 3.5, t: 0.75 },
  "1x6": { w: 5.5, t: 0.75 },
  "1x8": { w: 7.25, t: 0.75 },
  "1x10": { w: 9.25, t: 0.75 },
  "1x12": { w: 11.25, t: 0.75 },
  "2x2": { w: 1.5, t: 1.5 },
  "2x3": { w: 2.5, t: 1.5 },
  "2x4": { w: 3.5, t: 1.5 },
  "2x6": { w: 5.5, t: 1.5 },
  "2x8": { w: 7.25, t: 1.5 },
  "2x10": { w: 9.25, t: 1.5 },
  "2x12": { w: 11.25, t: 1.5 },
};

type StockDef = {
  label: string;
  length: number;
  width: number;
  thickness: number;
  material: string;
  have: number;
  price: number;
};

function boardStock(nick: string, lengths: readonly number[]): StockDef[] {
  const d = NOMINAL[nick];
  return lengths.map((L) => ({
    label: `${nick} — ${L / 12}'`,
    length: L,
    width: d.w,
    thickness: d.t,
    material: SOFTWOOD,
    have: 0,
    price: 0,
  }));
}

export type PresetKey =
  | "boards-basic"
  | "boards-full"
  | "sheets-ply"
  | "sheets-mdf"
  | "sheets-half"
  | "everything";

const boardsBasic: StockDef[] = [
  ...boardStock("2x4", BOARD_LENGTHS),
  ...boardStock("1x4", BOARD_LENGTHS),
  ...boardStock("1x6", BOARD_LENGTHS),
];
const boardsFull: StockDef[] = Object.keys(NOMINAL).flatMap((n) =>
  boardStock(n, BOARD_LENGTHS),
);
const sheetsPly: StockDef[] = [
  { label: `1/4" Plywood 4'x8'`, length: 96, width: 48, thickness: 0.25, material: PLY_BIRCH, have: 0, price: 0 },
  { label: `1/2" Plywood 4'x8'`, length: 96, width: 48, thickness: 0.5, material: PLY_BIRCH, have: 0, price: 0 },
  { label: `3/4" Plywood 4'x8'`, length: 96, width: 48, thickness: 0.75, material: PLY_BIRCH, have: 0, price: 0 },
];
const sheetsMdf: StockDef[] = [
  { label: `1/2" MDF 4'x8'`, length: 96, width: 48, thickness: 0.5, material: MDF, have: 0, price: 0 },
  { label: `3/4" MDF 4'x8'`, length: 96, width: 48, thickness: 0.75, material: MDF, have: 0, price: 0 },
];
const sheetsHalf: StockDef[] = [
  { label: `3/4" Plywood 4'x4'`, length: 48, width: 48, thickness: 0.75, material: PLY_BIRCH, have: 0, price: 0 },
  { label: `3/4" Plywood 2'x4'`, length: 48, width: 24, thickness: 0.75, material: PLY_BIRCH, have: 0, price: 0 },
];

export const PRESETS: Record<PresetKey, StockDef[]> = {
  "boards-basic": boardsBasic,
  "boards-full": boardsFull,
  "sheets-ply": sheetsPly,
  "sheets-mdf": sheetsMdf,
  "sheets-half": sheetsHalf,
  everything: [...boardsFull, ...sheetsPly, ...sheetsMdf],
};

export const PRESET_OPTIONS: { value: PresetKey; label: string }[] = [
  { value: "boards-basic", label: "Basic boards (2x4, 1x4, 1x6)" },
  { value: "boards-full", label: "All dimensional lumber (1x and 2x)" },
  { value: "sheets-ply", label: "Plywood 4'×8' (1/4\", 1/2\", 3/4\")" },
  { value: "sheets-mdf", label: "MDF 4'×8' (1/2\", 3/4\")" },
  { value: "sheets-half", label: "Plywood half/quarter sheets" },
  { value: "everything", label: "Everything above" },
];
