import {
  Alert,
  AspectRatio,
  Box,
  Button,
  Center,
  Checkbox,
  Container,
  Group,
  Image,
  Loader,
  Progress,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { IconCheck, IconX, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";

import { useProject } from "@/lib/projects";
import { resolveImg } from "@/types/project";
import {
  markStepDone,
  toggleStep,
  useCompletedSteps,
} from "@/state/buildProgress";

export function BuildPage() {
  const { projectId } = useParams({ from: "/build/$projectId" });
  const search = useSearch({ from: "/build/$projectId" });
  const navigate = useNavigate();
  const { project, isLoading, error } = useProject(projectId);
  const completed = useCompletedSteps(projectId);

  const steps = useMemo(
    () =>
      (project?.steps ?? [])
        .slice()
        .sort((a, b) => a.number - b.number),
    [project],
  );

  const requestedStep = Number.isFinite(search.step) ? (search.step as number) : 1;
  const idx = Math.max(0, Math.min(steps.length - 1, requestedStep - 1));

  const setStep = useCallback(
    (newIdx: number) => {
      const clamped = Math.max(0, Math.min(steps.length - 1, newIdx));
      navigate({
        to: "/build/$projectId",
        params: { projectId },
        search: { step: clamped + 1 },
        replace: true,
      });
    },
    [navigate, projectId, steps.length],
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
        <Alert color="red" title="Failed to load project">
          {error instanceof Error ? error.message : String(error)}
        </Alert>
      </Container>
    );
  }
  if (!project) {
    return (
      <Container py="xl">
        <Alert color="yellow" title="Project not found">
          No project matches id <code>{projectId}</code>.
        </Alert>
      </Container>
    );
  }
  if (steps.length === 0) {
    return (
      <Container py="xl">
        <Alert color="yellow" title="No build steps">
          This project has no step-by-step instructions.
        </Alert>
      </Container>
    );
  }

  const cur = steps[idx];
  const completedSet = new Set(completed);
  const doneCount = completed.length;
  const pct = Math.round((doneCount / steps.length) * 100);
  const isDone = completedSet.has(cur.number);
  const isFirst = idx === 0;
  const isLast = idx === steps.length - 1;

  const onNext = () => {
    markStepDone(projectId, cur.number);
    if (!isLast) setStep(idx + 1);
  };

  const closeBuild = () =>
    navigate({ to: "/project/$projectId", params: { projectId } });

  return (
    <Stack gap={0} mih="calc(100vh - 64px)">
      <Box
        px="md"
        py="sm"
        style={{
          borderBottom: "1px solid var(--ws-border-soft)",
          background: "var(--ws-bg-elev)",
          position: "sticky",
          top: 64,
          zIndex: 10,
        }}
      >
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <Group gap="xs" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
            <Button
              variant="default"
              size="sm"
              leftSection={<IconX size={16} />}
              onClick={closeBuild}
            >
              Close
            </Button>
            <Text fw={600} truncate>
              {project.title}
            </Text>
          </Group>
          <Stack gap={2} style={{ minWidth: 220 }}>
            <Progress value={pct} color="workshop" size="sm" radius="xl" />
            <Text size="xs" c="dimmed" ta="right">
              {doneCount} of {steps.length} complete · {pct}%
            </Text>
          </Stack>
        </Group>
      </Box>

      <Group
        align="stretch"
        gap={0}
        wrap="nowrap"
        style={{ flex: 1, minHeight: 0 }}
      >
        <Box
          p="sm"
          style={{
            width: 260,
            borderRight: "1px solid var(--ws-border-soft)",
            overflowY: "auto",
            flexShrink: 0,
          }}
          visibleFrom="sm"
        >
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.5} mb="xs">
            Steps
          </Text>
          <Stack gap={4}>
            {steps.map((s, i) => {
              const done = completedSet.has(s.number);
              const active = i === idx;
              return (
                <UnstyledButton
                  key={s.number}
                  onClick={() => setStep(i)}
                  px="xs"
                  py={6}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    borderRadius: 6,
                    background: active
                      ? "var(--ws-accent-soft, rgba(217,119,6,0.12))"
                      : undefined,
                    border: active
                      ? "1px solid var(--ws-accent)"
                      : "1px solid transparent",
                  }}
                >
                  <Box
                    style={{
                      flexShrink: 0,
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: done
                        ? "var(--ws-accent)"
                        : "var(--ws-bg-elev)",
                      border: "1px solid var(--ws-border-soft)",
                      color: done ? "white" : "inherit",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {done ? <IconCheck size={14} /> : s.number}
                  </Box>
                  <Text size="sm" lineClamp={2} style={{ flex: 1 }}>
                    {s.title || `Step ${s.number}`}
                  </Text>
                </UnstyledButton>
              );
            })}
          </Stack>
        </Box>

        <Box style={{ flex: 1, overflowY: "auto" }}>
          <Container size="md" py="lg">
            <Stack gap="md">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.5}>
                Step {cur.number} of {steps.length}
              </Text>
              <Title order={1} size="h2" lh={1.25}>
                {cur.title || `Step ${cur.number}`}
              </Title>
              {resolveImg(cur.image) && (
                <AspectRatio ratio={4 / 3} maw={720}>
                  <Image
                    src={resolveImg(cur.image)}
                    alt={cur.title || `Step ${cur.number}`}
                    fit="cover"
                    radius="md"
                    referrerPolicy="no-referrer"
                  />
                </AspectRatio>
              )}
              <Text size="md" lh={1.65}>
                {cur.instruction}
              </Text>
            </Stack>
          </Container>
        </Box>
      </Group>

      <Box
        px="md"
        py="sm"
        style={{
          borderTop: "1px solid var(--ws-border-soft)",
          background: "var(--ws-bg-elev)",
        }}
      >
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Button
            variant="default"
            size="md"
            disabled={isFirst}
            onClick={() => setStep(idx - 1)}
            leftSection={<IconChevronLeft size={16} />}
          >
            Previous
          </Button>
          <Checkbox
            size="md"
            checked={isDone}
            onChange={() => toggleStep(projectId, cur.number)}
            label={isDone ? "Step complete" : "Mark step complete"}
          />
          <Button
            size="md"
            onClick={onNext}
            rightSection={
              isLast ? <IconCheck size={16} /> : <IconChevronRight size={16} />
            }
          >
            {isLast ? "Finish" : "Next"}
          </Button>
        </Group>
      </Box>
    </Stack>
  );
}
