import {
  Container,
  SimpleGrid,
  Stack,
  Text,
  Alert,
  Loader,
  Center,
} from "@mantine/core";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo } from "react";

import { useProjects, filterAndSort, collectCategories, EMPTY_FILTERS, type FilterState } from "@/lib/projects";
import { ProjectCard } from "@/components/ProjectCard";
import { FilterBar } from "@/components/FilterBar";

export function IndexPage() {
  const { data: projects, isLoading, error } = useProjects();
  const navigate = useNavigate();
  const search = useSearch({ from: "/" });

  const filters: FilterState = useMemo(
    () => ({
      search: search.q ?? "",
      category: search.category ?? "",
      difficulty: search.difficulty ?? [],
      sort: search.sort ?? "title-asc",
    }),
    [search],
  );

  const updateSearch = (next: FilterState) => {
    navigate({
      to: "/",
      search: {
        q: next.search || undefined,
        category: next.category || undefined,
        difficulty: next.difficulty.length ? next.difficulty : undefined,
        sort: next.sort === "title-asc" ? undefined : next.sort,
      },
      replace: true,
    });
  };

  const resetSearch = () => {
    navigate({ to: "/", search: {}, replace: true });
  };

  const categories = useMemo(
    () => (projects ? collectCategories(projects) : []),
    [projects],
  );

  const filtered = useMemo(
    () => (projects ? filterAndSort(projects, filters) : []),
    [projects, filters],
  );

  if (isLoading) {
    return (
      <Center mih={300}>
        <Loader />
      </Center>
    );
  }
  if (error) {
    return (
      <Container py="xl">
        <Alert color="red" title="Failed to load projects">
          {error instanceof Error ? error.message : String(error)}
        </Alert>
      </Container>
    );
  }
  if (!projects) return null;

  return (
    <Stack gap="sm">
      <FilterBar
        value={filters}
        categories={categories}
        onChange={(next) => updateSearch(next)}
        onReset={() => {
          updateSearch(EMPTY_FILTERS);
          resetSearch();
        }}
      />
      <Container size="xl" py="md" w="100%" px="md">
        <Text size="sm" c="dimmed" mb="md">
          {filtered.length === projects.length
            ? `${projects.length} projects`
            : `${filtered.length} of ${projects.length} projects`}
        </Text>
        {filtered.length === 0 ? (
          <Center py={80}>
            <Stack align="center" gap={4}>
              <Text fw={600} size="lg">
                No projects match your filters
              </Text>
              <Text c="dimmed" size="sm">
                Try clearing the search or changing filters.
              </Text>
            </Stack>
          </Center>
        ) : (
          <SimpleGrid
            cols={{ base: 1, xs: 2, sm: 3, md: 4, lg: 5 }}
            spacing="md"
            verticalSpacing="md"
          >
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </SimpleGrid>
        )}
      </Container>
    </Stack>
  );
}
