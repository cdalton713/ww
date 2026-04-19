import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import type { Difficulty } from "@/types/project";
import type { SortKey } from "@/lib/projects";

import { RootLayout } from "@/components/RootLayout";
import { IndexPage } from "@/pages/IndexPage";
import { ProjectPage } from "@/pages/ProjectPage";
import { BuildPage } from "@/pages/BuildPage";
import { CutListPage } from "@/pages/CutListPage";

// ------------------------------------------------------------------
// Search param validation
// ------------------------------------------------------------------
type IndexSearch = {
  q?: string;
  category?: string;
  difficulty?: Difficulty[];
  sort?: SortKey;
};

const SORT_VALUES: readonly SortKey[] = [
  "title-asc",
  "title-desc",
  "time-asc",
  "time-desc",
  "diff-asc",
  "diff-desc",
  "steps-asc",
  "steps-desc",
];

const DIFF_VALUES: readonly Difficulty[] = ["easy", "moderate", "advanced"];

function validateSort(value: unknown): SortKey | undefined {
  return typeof value === "string" && (SORT_VALUES as readonly string[]).includes(value)
    ? (value as SortKey)
    : undefined;
}

function validateDifficulty(value: unknown): Difficulty[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const filtered = value.filter(
    (v): v is Difficulty =>
      typeof v === "string" && (DIFF_VALUES as readonly string[]).includes(v),
  );
  return filtered.length > 0 ? filtered : undefined;
}

// ------------------------------------------------------------------
// Routes
// ------------------------------------------------------------------
const rootRoute = createRootRoute({
  component: () => (
    <RootLayout>
      <Outlet />
    </RootLayout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: (raw: Record<string, unknown>): IndexSearch => ({
    q: typeof raw.q === "string" ? raw.q : undefined,
    category: typeof raw.category === "string" ? raw.category : undefined,
    difficulty: validateDifficulty(raw.difficulty),
    sort: validateSort(raw.sort),
  }),
  component: IndexPage,
});

const projectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "project/$projectId",
  component: ProjectPage,
});

const buildRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "build/$projectId",
  validateSearch: (raw: Record<string, unknown>): { step?: number } => ({
    step:
      typeof raw.step === "number" && Number.isFinite(raw.step)
        ? raw.step
        : typeof raw.step === "string" && raw.step && !isNaN(Number(raw.step))
          ? Number(raw.step)
          : undefined,
  }),
  component: BuildPage,
});

const cutListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "cut-list",
  validateSearch: (raw: Record<string, unknown>): { importFrom?: string } => ({
    importFrom:
      typeof raw.importFrom === "string" ? raw.importFrom : undefined,
  }),
  component: CutListPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  projectRoute,
  buildRoute,
  cutListRoute,
]);

export const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Exported so pages can typecheck search params via useSearch({from: ...}).
export const routes = {
  root: rootRoute,
  index: indexRoute,
  project: projectRoute,
  build: buildRoute,
  cutList: cutListRoute,
};
