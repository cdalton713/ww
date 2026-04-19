import { Card, Image, Group, Text, AspectRatio, Box } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { resolveImg, type Project } from "@/types/project";
import { timeLabel } from "@/lib/projects";

export function ProjectCard({ project }: { project: Project }) {
  const steps = project.steps?.length ?? 0;
  const t = timeLabel(project);
  return (
    <Link
      to="/project/$projectId"
      params={{ projectId: project.id }}
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "block",
        height: "100%",
      }}
    >
      <Card
        padding={0}
        radius="md"
        withBorder
        shadow="sm"
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          background: "var(--ws-bg-elev)",
        }}
      >
        <Box pos="relative">
          <AspectRatio ratio={4 / 3}>
            <Image
              src={resolveImg(project.hero_image)}
              alt={project.title}
              fit="cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </AspectRatio>
          <Box pos="absolute" top={8} left={8}>
            <span className={`badge ${project.difficulty}`}>
              {project.difficulty}
            </span>
          </Box>
        </Box>
        <Box p="sm" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <Text fw={600} size="sm" lineClamp={2} lh={1.35}>
            {project.title}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={3} lh={1.45}>
            {project.description}
          </Text>
          <Group
            justify="space-between"
            pt="xs"
            mt="auto"
            wrap="nowrap"
            gap={4}
            style={{ borderTop: "1px solid var(--ws-border-soft)" }}
          >
            <Text size="xs" c="dimmed" lineClamp={1}>
              {project.category || "Other"}
            </Text>
            <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
              {t ? `${t} · ${steps} steps` : `${steps} steps`}
            </Text>
          </Group>
        </Box>
      </Card>
    </Link>
  );
}
