// Consolidated project schema shared across Woodsense, Kreg, and AnaWhite.
// See wood-working/schema.md for the full spec.

export type Difficulty = "easy" | "moderate" | "advanced";

/** An image addressable by CDN URL, local asset path, or both.
 * Renderer prefers `cdn`; falls back to `asset` when cdn is absent. */
export type ImageRef = { cdn?: string; asset?: string };

export type SourceName = "Woodsense" | "Kreg" | "AnaWhite";

export type Source = {
  name: SourceName;
  /** Canonical source page. Present on Kreg; absent on Woodsense. */
  url?: string;
  /** Byline. Present on Kreg; absent on Woodsense. */
  author?: string;
};

export type Tool = {
  name: string;
  /** "Kreg" for Kreg-branded tools; omitted for generic "Other" tools. */
  vendor?: string;
  /** Shop link from Kreg; omitted otherwise. */
  url?: string;
};

export type MaterialEntry = {
  item: string;
  quantity: string;
};

export type Materials = {
  wood: MaterialEntry[];
  hardware: MaterialEntry[];
};

export type CutEntry = {
  item: string;
  quantity: string;
};

export type BuildStep = {
  number: number;
  title?: string;
  instruction: string;
  image?: ImageRef;
};

export type EstimatedTime = {
  min_hours: number;
  max_hours: number;
};

export type Project = {
  id: string;                // "woodsense:P1030" | "kreg:<slug>"
  source: Source;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: string;          // primary tag (free-form)
  tags?: string[];           // secondary tags (Kreg space/type facets)
  highlights?: string[];     // ex-Woodsense key_point[]
  estimated_time?: EstimatedTime;
  hero_image: ImageRef;
  tools: Tool[];
  materials: Materials;
  cut_list?: CutEntry[];
  cut_diagram_image?: ImageRef;
  steps: BuildStep[];
  plan_pdf_url?: string;     // remote-only; never downloaded
};

export type ProjectsPayload = {
  projects: Project[];
};

export const DIFFICULTIES: readonly Difficulty[] = [
  "easy",
  "moderate",
  "advanced",
] as const;

export const DIFF_ORDER: Record<Difficulty, number> = {
  easy: 0,
  moderate: 1,
  advanced: 2,
};

/** Render-time resolution: CDN first, local asset as fallback. */
export function resolveImg(ref: ImageRef | string | undefined): string {
  if (!ref) return "";
  if (typeof ref === "string") return ref;
  return ref.cdn || ref.asset || "";
}
