import { QueryClient } from "@tanstack/react-query";
import type { Project, ProjectsPayload } from "@/types/project";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Project data is static and bundled as a JSON asset — cache forever.
      staleTime: Infinity,
      gcTime: Infinity,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const projectsQueryKey = ["projects"] as const;

export async function fetchProjects(): Promise<Project[]> {
  // BASE_URL handles sub-directory hosting (e.g. GitHub Pages).
  const base = import.meta.env.BASE_URL ?? "/";
  const url = `${base}projects.json`.replace(/\/+/g, "/");
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load projects.json (${res.status})`);
  }
  const data = (await res.json()) as ProjectsPayload;
  return data.projects;
}
