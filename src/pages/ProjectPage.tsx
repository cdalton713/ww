import {
  Alert,
  AspectRatio,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Container,
  Group,
  Image,
  Loader,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconDownload,
  IconExternalLink,
  IconFileDescription,
  IconHammer,
  IconListDetails,
  IconPackage,
  IconPlayerPlay,
  IconRuler,
  IconTool,
} from "@tabler/icons-react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";

import { timeLabel, useProject } from "@/lib/projects";
import { resolveImg, type MaterialEntry, type Project } from "@/types/project";

export function ProjectPage() {
  const { projectId } = useParams({ from: "/project/$projectId" });
  const navigate = useNavigate();
  const { project, isLoading, error } = useProject(projectId);

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

  const toolCount = project.tools?.length ?? 0;
  const woodCount = project.materials?.wood?.length ?? 0;
  const hardwareCount = project.materials?.hardware?.length ?? 0;
  const materialCount = woodCount + hardwareCount;
  const cutCount = project.cut_list?.length ?? 0;
  const stepCount = project.steps?.length ?? 0;

  const startBuild = () =>
    navigate({ to: "/build/$projectId", params: { projectId: project.id } });

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Button
            component={Link}
            to="/"
            variant="default"
            leftSection={<IconArrowLeft size={16} />}
          >
            All projects
          </Button>
          <Group gap="xs" wrap="wrap">
            {project.source.url && (
              <Button
                component="a"
                href={project.source.url}
                target="_blank"
                rel="noopener"
                variant="default"
                leftSection={<IconExternalLink size={16} />}
              >
                Source ({project.source.name})
              </Button>
            )}
            {project.plan_pdf_url && (
              <Button
                component="a"
                href={project.plan_pdf_url}
                target="_blank"
                rel="noopener"
                variant="default"
                leftSection={<IconDownload size={16} />}
              >
                Plans PDF
              </Button>
            )}
            {woodCount > 0 && (
              <Button
                onClick={() =>
                  navigate({
                    to: "/cut-list",
                    search: { importFrom: project.id },
                  })
                }
                variant="default"
                leftSection={<IconRuler size={16} />}
              >
                Cut list optimizer
              </Button>
            )}
            <Button
              onClick={startBuild}
              leftSection={<IconPlayerPlay size={16} />}
              disabled={stepCount === 0}
            >
              Build
            </Button>
          </Group>
        </Group>

        <Card padding="md" radius="md" withBorder>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <AspectRatio ratio={4 / 3}>
              <Image
                src={resolveImg(project.hero_image)}
                alt={project.title}
                fit="cover"
                radius="md"
                referrerPolicy="no-referrer"
              />
            </AspectRatio>
            <Stack gap="sm">
              <Title order={2} size="h3" lh={1.25}>
                {project.title}
              </Title>
              {project.source.author && (
                <Text size="sm" c="dimmed">
                  By {project.source.author}
                </Text>
              )}
              <Text c="dimmed" lh={1.55}>
                {project.description}
              </Text>
              {project.highlights && project.highlights.length > 0 && (
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.5}>
                    Key points
                  </Text>
                  <Box component="ul" m={0} pl="md" style={{ lineHeight: 1.6 }}>
                    {project.highlights.map((k, i) => (
                      <li key={i}>
                        <Text size="sm">{k}</Text>
                      </li>
                    ))}
                  </Box>
                </Stack>
              )}
              <Group gap="xs" mt="auto">
                <span className={`badge ${project.difficulty}`}>
                  {project.difficulty}
                </span>
                <Badge variant="light" color="gray">
                  {project.category || "Other"}
                </Badge>
                {timeLabel(project) && (
                  <Badge variant="light" color="gray">
                    {timeLabel(project)}
                  </Badge>
                )}
                <Badge variant="light" color="gray">
                  {stepCount} steps
                </Badge>
                <Badge variant="light" color="gray">
                  {toolCount} tools
                </Badge>
              </Group>
            </Stack>
          </SimpleGrid>
        </Card>

        <Tabs defaultValue="overview" keepMounted={false}>
          <Tabs.List>
            <Tabs.Tab
              value="overview"
              leftSection={<IconFileDescription size={16} />}
            >
              Overview
            </Tabs.Tab>
            <Tabs.Tab value="tools" leftSection={<IconTool size={16} />}>
              Tools{toolCount ? ` (${toolCount})` : ""}
            </Tabs.Tab>
            <Tabs.Tab value="materials" leftSection={<IconPackage size={16} />}>
              Materials{materialCount ? ` (${materialCount})` : ""}
            </Tabs.Tab>
            <Tabs.Tab value="cuts" leftSection={<IconRuler size={16} />}>
              Cut list{cutCount ? ` (${cutCount})` : ""}
            </Tabs.Tab>
            <Tabs.Tab
              value="steps"
              leftSection={<IconListDetails size={16} />}
            >
              Build steps{stepCount ? ` (${stepCount})` : ""}
            </Tabs.Tab>
            <Tabs.Tab value="plans" leftSection={<IconHammer size={16} />}>
              Plans
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt="md">
            <OverviewPanel project={project} />
          </Tabs.Panel>
          <Tabs.Panel value="tools" pt="md">
            <ToolsPanel project={project} />
          </Tabs.Panel>
          <Tabs.Panel value="materials" pt="md">
            <MaterialsPanel project={project} />
          </Tabs.Panel>
          <Tabs.Panel value="cuts" pt="md">
            <CutsPanel project={project} />
          </Tabs.Panel>
          <Tabs.Panel value="steps" pt="md">
            <StepsPanel project={project} />
          </Tabs.Panel>
          <Tabs.Panel value="plans" pt="md">
            <PlansPanel project={project} />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}

function OverviewPanel({ project }: { project: Project }) {
  const stats: [string, string | number][] = [
    ["Difficulty", project.difficulty],
    ["Category", project.category || "Other"],
    ["Estimated time", timeLabel(project) || "Unknown"],
    ["Tools required", project.tools?.length ?? 0],
    ["Cut parts", project.cut_list?.length ?? 0],
    ["Build steps", project.steps?.length ?? 0],
  ];

  return (
    <Stack gap="md">
      <Stack gap={4}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.5}>
          Summary
        </Text>
        <Text lh={1.6}>{project.description || "No description."}</Text>
      </Stack>

      {project.tags && project.tags.length > 0 && (
        <Stack gap={4}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.5}>
            Tags
          </Text>
          <Group gap="xs" wrap="wrap">
            {project.tags.map((t) => (
              <Badge key={t} variant="light" color="gray">
                {t}
              </Badge>
            ))}
          </Group>
        </Stack>
      )}

      <Stack gap={4}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.5}>
          At a glance
        </Text>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="sm">
          {stats.map(([k, v]) => (
            <Card key={k} padding="sm" radius="md" withBorder>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.5}>
                {k}
              </Text>
              <Text fw={600} tt="capitalize" mt={2}>
                {v}
              </Text>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </Stack>
  );
}

function ToolsPanel({ project }: { project: Project }) {
  const tools = project.tools ?? [];
  if (tools.length === 0) {
    return <Text c="dimmed">No tools listed.</Text>;
  }
  const kreg = tools.filter((t) => t.vendor === "Kreg");
  const other = tools.filter((t) => t.vendor !== "Kreg");

  const renderGroup = (label: string, items: typeof tools) =>
    items.length === 0 ? null : (
      <Stack gap="xs" key={label}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.5}>
          {label}
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xs">
          {items.map((t, i) => {
            const content = (
              <Card padding="xs" radius="md" withBorder>
                <Group gap="xs" wrap="nowrap">
                  <Text size="sm" fw={500} lineClamp={2} style={{ flex: 1 }}>
                    {t.name}
                  </Text>
                  {t.url && <IconExternalLink size={14} />}
                </Group>
              </Card>
            );
            return t.url ? (
              <a
                key={`${t.name}-${i}`}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                {content}
              </a>
            ) : (
              <Box key={`${t.name}-${i}`}>{content}</Box>
            );
          })}
        </SimpleGrid>
      </Stack>
    );

  return (
    <Stack gap="md">
      {renderGroup("Kreg tools", kreg)}
      {renderGroup(kreg.length ? "Other tools" : "Tools", other)}
    </Stack>
  );
}

function MaterialsTable({
  title,
  entries,
}: {
  title: string;
  entries: MaterialEntry[];
}) {
  return (
    <Stack gap={6}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.5}>
        {title}
      </Text>
      <Table striped withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Item</Table.Th>
            <Table.Th style={{ width: 110 }}>Qty</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {entries.map((v, i) => (
            <Table.Tr key={`${v.item}-${i}`}>
              <Table.Td>{v.item}</Table.Td>
              <Table.Td>
                <Badge variant="light" color="gray">
                  {v.quantity}
                </Badge>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}

function MaterialsPanel({ project }: { project: Project }) {
  const navigate = useNavigate();
  const wood = project.materials?.wood ?? [];
  const hardware = project.materials?.hardware ?? [];

  if (wood.length === 0 && hardware.length === 0) {
    return <Text c="dimmed">No materials listed.</Text>;
  }

  return (
    <Stack gap="md">
      {wood.length > 0 && (
        <Card padding="sm" radius="md" withBorder>
          <Group align="center" wrap="wrap" gap="sm" mb="sm">
            <Button
              onClick={() =>
                navigate({
                  to: "/cut-list",
                  search: { importFrom: project.id },
                })
              }
              size="sm"
              leftSection={<IconRuler size={16} />}
            >
              Open in cut list optimizer
            </Button>
            <Text size="xs" c="dimmed" style={{ flex: 1, minWidth: 200 }}>
              Auto-loads these wood dimensions as pieces and the hardware below
              as a shopping list.
            </Text>
          </Group>
          <MaterialsTable title="Wood" entries={wood} />
        </Card>
      )}
      {hardware.length > 0 && (
        <MaterialsTable title="Hardware & supplies" entries={hardware} />
      )}
    </Stack>
  );
}

function CutsPanel({ project }: { project: Project }) {
  const parts = project.cut_list ?? [];
  const diagram = resolveImg(project.cut_diagram_image);
  return (
    <Stack gap="md">
      {diagram && (
        <Image
          src={diagram}
          alt="Cut diagram"
          radius="md"
          fit="contain"
          style={{ background: "white" }}
        />
      )}
      {parts.length === 0 ? (
        <Text c="dimmed">No cut list.</Text>
      ) : (
        <Table striped withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Part</Table.Th>
              <Table.Th style={{ width: 90 }}>Qty</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {parts.map((c, i) => (
              <Table.Tr key={i}>
                <Table.Td>{c.item}</Table.Td>
                <Table.Td>
                  <Badge variant="light" color="gray">
                    {c.quantity}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}

function StepsPanel({ project }: { project: Project }) {
  const steps = (project.steps ?? [])
    .slice()
    .sort((a, b) => a.number - b.number);

  if (steps.length === 0) {
    return <Text c="dimmed">No steps available.</Text>;
  }

  return (
    <Stack gap="sm">
      {steps.map((s) => {
        const img = resolveImg(s.image);
        return (
          <Card key={s.number} padding="sm" radius="md" withBorder>
            <SimpleGrid cols={{ base: 1, sm: img ? 2 : 1 }} spacing="md">
              {img && (
                <AspectRatio ratio={4 / 3}>
                  <Image
                    src={img}
                    alt={s.title || `Step ${s.number}`}
                    fit="cover"
                    radius="sm"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </AspectRatio>
              )}
              <Stack gap={4}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.5}>
                  Step {s.number}
                </Text>
                {s.title && <Text fw={600}>{s.title}</Text>}
                <Text size="sm" lh={1.55} c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                  {s.instruction}
                </Text>
              </Stack>
            </SimpleGrid>
          </Card>
        );
      })}
    </Stack>
  );
}

function PlansPanel({ project }: { project: Project }) {
  const pdf = project.plan_pdf_url;
  if (!pdf) {
    return <Text c="dimmed">No plans available.</Text>;
  }
  return (
    <Stack gap="md">
      <Group>
        <Button
          component="a"
          href={pdf}
          target="_blank"
          rel="noopener"
          leftSection={<IconDownload size={16} />}
        >
          Download plans PDF
        </Button>
      </Group>
    </Stack>
  );
}
