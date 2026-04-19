// All dimensions stored in decimal inches.

export type Grain = "any" | "length" | "width";

export type Piece = {
  id: number;
  label: string;
  length: number | null;
  width: number | null;
  thickness: number | null;
  qty: number;
  material: string;
  grain: Grain;
};

export type Stock = {
  id: number;
  label: string;
  length: number | null;
  width: number | null;
  thickness: number | null;
  material: string;
  have: number;
  price: number;
};

export type Hardware = {
  id: number;
  item: string;
  qty: number;
  unit: string;
  price: number;
};

export type Strategy = "best-area" | "best-short" | "first-fit";

export type Settings = {
  kerf: number;
  trim: number;
  allowRotate: boolean;
  strategy: Strategy;
  thickTol: number;
  currency: string;
  defaultThickness: number | null;
  defaultMaterial: string;
};

export type PlacedPiece = {
  pid: number;
  label: string;
  instance: number;
  ofQty: number;
  thickness: number;
  material: string;
  origLength: number;
  x: number;
  y: number;
  w: number;
  h: number;
  rotated: boolean;
};

export type Sheet = {
  stockId: number;
  label: string;
  length: number;
  width: number;
  thickness: number;
  material: string;
  price: number;
  pieces: PlacedPiece[];
};

export type UnplacedPiece = {
  pid: number;
  label: string;
  instance: number;
  ofQty: number;
  length: number;
  width: number | null;
  thickness: number;
  material: string;
};

export type Results = {
  sheets: Sheet[];
  unplaced: UnplacedPiece[];
  totalArea: number;
  usedArea: number;
  stats: { usedStock: number; totalCost: number };
};
