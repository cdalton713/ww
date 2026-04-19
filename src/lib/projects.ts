import { useQuery } from "@tanstack/react-query";
import { fetchProjects, projectsQueryKey } from "@/lib/query";
import {
  DIFF_ORDER,
  DIFFICULTIES,
  resolveImg,
  type Difficulty,
  type Project,
} from "@/types/project";

/** Hook: loads the full project bundle via TanStack Query. */
export function useProjects() {
  return useQuery({
    queryKey: projectsQueryKey,
    queryFn: fetchProjects,
  });
}

/** Hook: single project by id. Returns undefined while loading or if missing. */
export function useProject(id: string | undefined) {
  const query = useProjects();
  const project = query.data?.find((p) => p.id === id);
  return { ...query, project };
}

export function avgHours(p: Project): number {
  const t = p.estimated_time;
  if (!t) return 0;
  return ((t.min_hours ?? 0) + (t.max_hours ?? 0)) / 2;
}

export function timeLabel(p: Project): string {
  const t = p.estimated_time;
  if (!t) return "";
  if (t.min_hours === t.max_hours) return `${t.min_hours}h`;
  return `${t.min_hours}–${t.max_hours}h`;
}

/** Collect category values for the dropdown, sorted A→Z. */
export function collectCategories(projects: Project[]): string[] {
  const s = new Set<string>();
  projects.forEach((p) => s.add(p.category || "Other"));
  return Array.from(s).sort();
}

export type SortKey =
  | "title-asc"
  | "title-desc"
  | "time-asc"
  | "time-desc"
  | "diff-asc"
  | "diff-desc"
  | "steps-asc"
  | "steps-desc";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "title-asc", label: "Title A–Z" },
  { value: "title-desc", label: "Title Z–A" },
  { value: "time-asc", label: "Shortest first" },
  { value: "time-desc", label: "Longest first" },
  { value: "diff-asc", label: "Easiest first" },
  { value: "diff-desc", label: "Hardest first" },
  { value: "steps-asc", label: "Fewest steps" },
  { value: "steps-desc", label: "Most steps" },
];

export type FilterState = {
  search: string;
  category: string;
  difficulty: Difficulty[];
  sort: SortKey;
};

export const EMPTY_FILTERS: FilterState = {
  search: "",
  category: "",
  difficulty: [],
  sort: "title-asc",
};

/** Apply search/category/difficulty filters + sort. Pure function. */
export function filterAndSort(
  projects: Project[],
  f: FilterState,
): Project[] {
  const q = f.search.trim().toLowerCase();
  const diffSet = new Set(f.difficulty);

  let out = projects.filter((p) => {
    if (f.category && (p.category || "Other") !== f.category) return false;
    if (diffSet.size > 0 && !diffSet.has(p.difficulty)) return false;
    if (q) {
      const hay = [
        p.title,
        p.description,
        p.category,
        p.difficulty,
        p.source.name,
        p.source.author ?? "",
        ...(p.tags ?? []),
        ...p.tools.map((t) => t.name),
        ...(p.highlights ?? []),
        ...p.materials.wood.map((m) => m.item),
        ...p.materials.hardware.map((m) => m.item),
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const [key, dir] = f.sort.split("-") as [string, "asc" | "desc"];
  const mul = dir === "asc" ? 1 : -1;
  out = out.slice().sort((a, b) => {
    if (key === "title") return mul * a.title.localeCompare(b.title);
    if (key === "time") return mul * (avgHours(a) - avgHours(b));
    if (key === "diff") {
      return (
        mul *
        ((DIFF_ORDER[a.difficulty] ?? 99) -
          (DIFF_ORDER[b.difficulty] ?? 99))
      );
    }
    if (key === "steps") {
      return mul * ((a.steps?.length ?? 0) - (b.steps?.length ?? 0));
    }
    return 0;
  });
  return out;
}

/** Every renderable asset URL — used by "Save offline". */
export function collectAssetUrls(projects: Project[]): string[] {
  const set = new Set<string>();
  const push = (u: string) => {
    if (u) set.add(u);
  };
  projects.forEach((p) => {
    push(resolveImg(p.hero_image));
    if (p.cut_diagram_image) push(resolveImg(p.cut_diagram_image));
    if (p.plan_pdf_url) push(p.plan_pdf_url);
    p.steps?.forEach((s) => {
      if (s.image) push(resolveImg(s.image));
    });
  });
  return Array.from(set);
}

export { DIFFICULTIES };
