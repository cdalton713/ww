import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Checkbox,
  Container,
  Group,
  Modal,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconChartBar,
  IconDownload,
  IconHammer,
  IconPlus,
  IconReload,
  IconRuler,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { LenInput } from "@/components/cutlist/LenInput";
import { ResultsView } from "@/components/cutlist/ResultsView";
import { importFromProject } from "@/lib/cutlist/import";
import { optimize } from "@/lib/cutlist/optimizer";
import { PRESETS, PRESET_OPTIONS, type PresetKey } from "@/lib/cutlist/presets";
import type {
  Hardware,
  Piece,
  Settings,
  Stock,
  Strategy,
} from "@/lib/cutlist/types";
import { fmtLong, type Unit } from "@/lib/cutlist/units";
import { useProjects } from "@/lib/projects";
import {
  nextHwId,
  nextPieceId,
  nextStockId,
  replaceState,
  resetAll,
  update,
  useCutListState,
} from "@/state/cutListStore";
import { resolveImg, type Project } from "@/types/project";

const STRATEGY_OPTIONS: { value: Strategy; label: string }[] = [
  { value: "best-area", label: "Best area (least leftover)" },
  { value: "best-short", label: "Best short side (snug fit)" },
  { value: "first-fit", label: "First fit (fastest)" },
];

export function CutListPage() {
  const state = useCutListState();
  const search = useSearch({ from: "/cut-list" });
  const navigate = useNavigate();
  const { data: projects } = useProjects();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  // Auto-import when ?importFrom= is set and state is empty.
  useEffect(() => {
    if (!search.importFrom || !projects) return;
    const proj = projects.find((p) => p.id === search.importFrom);
    if (!proj) return;
    // Only auto-import if pieces are empty — avoids clobbering a session.
    if (state.pieces.length === 0) {
      doImport(proj);
    }
    // Clear the search param so refresh doesn't keep re-importing.
    navigate({
      to: "/cut-list",
      search: { importFrom: undefined },
      replace: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.importFrom, projects]);

  const totalPieces = state.pieces
    .filter((p) => p.length != null && p.length > 0)
    .reduce((s, p) => s + (p.qty || 1), 0);
  const totalLen = state.pieces
    .filter((p) => p.length != null && p.length > 0)
    .reduce((s, p) => s + (p.length || 0) * (p.qty || 1), 0);

  const waste =
    state.results && state.results.totalArea > 0
      ? (1 - state.results.usedArea / state.results.totalArea) * 100
      : null;

  const doImport = (proj: Project) => {
    const hasStock = state.stock.length > 0;
    const result = importFromProject(proj, hasStock, state.idSeq);
    const maxPid =
      result.pieces.reduce((m, p) => Math.max(m, p.id), 0) + 1;
    const maxSid =
      result.stock.reduce((m, s) => Math.max(m, s.id), 0) + 1;
    const maxHid =
      result.hardware.reduce((m, h) => Math.max(m, h.id), 0) + 1;
    replaceState({
      pieces: result.pieces,
      hardware: result.hardware,
      stock: hasStock ? state.stock : result.stock,
      source: result.source,
      results: null,
      idSeq: {
        piece: Math.max(state.idSeq.piece, maxPid),
        stock: Math.max(state.idSeq.stock, maxSid),
        hw: Math.max(state.idSeq.hw, maxHid),
      },
    });
  };

  const addPiece = () => {
    const id = nextPieceId();
    update((draft) => {
      draft.pieces.push({
        id,
        label: `Part ${draft.pieces.length + 1}`,
        length: null,
        width: null,
        thickness: draft.settings.defaultThickness,
        qty: 1,
        material: draft.settings.defaultMaterial || "",
        grain: "any",
      });
    });
  };

  const addStock = () => {
    const id = nextStockId();
    update((draft) => {
      draft.stock.push({
        id,
        label: "",
        length: null,
        width: null,
        thickness: null,
        material: "",
        have: 0,
        price: 0,
      });
    });
  };

  const addHardware = () => {
    const id = nextHwId();
    update((draft) => {
      draft.hardware.push({
        id,
        item: "",
        qty: 1,
        unit: "ea",
        price: 0,
      });
    });
  };

  const loadPreset = (key: PresetKey) => {
    const defs = PRESETS[key];
    update((draft) => {
      for (const d of defs) {
        draft.stock.push({
          id: draft.idSeq.stock,
          ...d,
        });
        draft.idSeq.stock += 1;
      }
    });
  };

  const runOptimize = () => {
    const results = optimize(state.pieces, state.stock, state.settings, state.unit);
    update((draft) => {
      draft.results = results;
    });
  };

  const applyDefaults = () => {
    update((draft) => {
      const t = draft.settings.defaultThickness;
      const m = draft.settings.defaultMaterial || "";
      for (const p of draft.pieces) {
        if ((p.thickness == null || p.thickness <= 0) && t && t > 0) p.thickness = t;
        if (!p.material && m) p.material = m;
      }
    });
  };

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Group gap="xs" wrap="wrap">
            <Button
              component={Link}
              to="/"
              variant="default"
              leftSection={<IconArrowLeft size={16} />}
            >
              Projects
            </Button>
            <Title order={2} size="h3">
              Cut list optimizer
            </Title>
            <Badge variant="light" color="gray">
              {state.source}
            </Badge>
          </Group>
          <Group gap="xs" wrap="wrap">
            <UnitToggle unit={state.unit} />
            <Button
              variant="default"
              leftSection={<IconDownload size={16} />}
              onClick={() => setPickerOpen(true)}
            >
              Import from project
            </Button>
            <Button
              variant="light"
              color="red"
              leftSection={<IconReload size={16} />}
              onClick={() => setResetOpen(true)}
            >
              Reset
            </Button>
            <Button
              leftSection={<IconChartBar size={16} />}
              onClick={runOptimize}
              disabled={state.pieces.length === 0 || state.stock.length === 0}
            >
              Optimize
            </Button>
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
          <StatCard
            label="Pieces"
            value={totalPieces}
            icon={<IconRuler size={18} />}
          />
          <StatCard
            label="Total length"
            value={totalLen > 0 ? fmtLong(totalLen, state.unit) : "—"}
          />
          <StatCard
            label="Sheets used"
            value={state.results ? String(state.results.stats.usedStock) : "—"}
          />
          <StatCard
            label="Waste"
            value={waste == null ? "—" : `${waste.toFixed(1)}%`}
            tone={
              waste == null
                ? "neutral"
                : waste < 15
                  ? "good"
                  : waste < 35
                    ? "warn"
                    : "bad"
            }
          />
        </SimpleGrid>

        <Tabs defaultValue="pieces" keepMounted={false}>
          <Tabs.List>
            <Tabs.Tab value="pieces" leftSection={<IconRuler size={16} />}>
              Pieces{state.pieces.length ? ` (${state.pieces.length})` : ""}
            </Tabs.Tab>
            <Tabs.Tab value="stock" leftSection={<IconHammer size={16} />}>
              Stock{state.stock.length ? ` (${state.stock.length})` : ""}
            </Tabs.Tab>
            <Tabs.Tab value="hardware">
              Hardware{state.hardware.length ? ` (${state.hardware.length})` : ""}
            </Tabs.Tab>
            <Tabs.Tab value="settings">Settings</Tabs.Tab>
            {state.results && (
              <Tabs.Tab value="results" leftSection={<IconChartBar size={16} />}>
                Results
              </Tabs.Tab>
            )}
          </Tabs.List>

          <Tabs.Panel value="pieces" pt="md">
            <PiecesPanel
              pieces={state.pieces}
              unit={state.unit}
              onAdd={addPiece}
              onApplyDefaults={applyDefaults}
              defaultThickness={state.settings.defaultThickness}
              defaultMaterial={state.settings.defaultMaterial}
            />
          </Tabs.Panel>
          <Tabs.Panel value="stock" pt="md">
            <StockPanel
              stock={state.stock}
              unit={state.unit}
              onAdd={addStock}
              onLoadPreset={loadPreset}
            />
          </Tabs.Panel>
          <Tabs.Panel value="hardware" pt="md">
            <HardwarePanel
              hardware={state.hardware}
              currency={state.settings.currency}
              onAdd={addHardware}
            />
          </Tabs.Panel>
          <Tabs.Panel value="settings" pt="md">
            <SettingsPanel settings={state.settings} unit={state.unit} />
          </Tabs.Panel>
          {state.results && (
            <Tabs.Panel value="results" pt="md">
              <ResultsView
                results={state.results}
                stock={state.stock}
                hardware={state.hardware}
                settings={state.settings}
                unit={state.unit}
              />
            </Tabs.Panel>
          )}
        </Tabs>
      </Stack>

      <ProjectPicker
        opened={pickerOpen}
        onClose={() => setPickerOpen(false)}
        projects={projects ?? []}
        onPick={(p) => {
          doImport(p);
          setPickerOpen(false);
        }}
      />

      <Modal
        opened={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Clear all pieces, stock, and hardware?"
        centered
      >
        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={() => setResetOpen(false)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => {
              resetAll();
              setResetOpen(false);
            }}
          >
            Reset everything
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const color =
    tone === "good"
      ? "teal"
      : tone === "warn"
        ? "yellow"
        : tone === "bad"
          ? "red"
          : undefined;
  return (
    <Card padding="sm" radius="md" withBorder>
      <Group gap="xs" wrap="nowrap">
        {icon}
        <Stack gap={0}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.5}>
            {label}
          </Text>
          <Text fw={700} size="lg" c={color}>
            {value}
          </Text>
        </Stack>
      </Group>
    </Card>
  );
}

function UnitToggle({ unit }: { unit: Unit }) {
  return (
    <Button.Group>
      <Button
        size="sm"
        variant={unit === "in" ? "filled" : "default"}
        onClick={() => update((d) => void (d.unit = "in"))}
      >
        in
      </Button>
      <Button
        size="sm"
        variant={unit === "mm" ? "filled" : "default"}
        onClick={() => update((d) => void (d.unit = "mm"))}
      >
        mm
      </Button>
    </Button.Group>
  );
}

// ---- Pieces panel ---------------------------------------------------------

function PiecesPanel({
  pieces,
  unit,
  onAdd,
  onApplyDefaults,
  defaultThickness,
  defaultMaterial,
}: {
  pieces: Piece[];
  unit: Unit;
  onAdd: () => void;
  onApplyDefaults: () => void;
  defaultThickness: number | null;
  defaultMaterial: string;
}) {
  return (
    <Stack gap="sm">
      <Card padding="sm" radius="md" withBorder>
        <Group gap="sm" wrap="wrap" align="end">
          <Stack gap={2} style={{ flex: "1 1 180px" }}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.5}>
              Default thickness
            </Text>
            <LenInput
              value={defaultThickness}
              unit={unit}
              placeholder={`3/4"`}
              onChange={(next) =>
                update((d) => {
                  d.settings.defaultThickness = next;
                })
              }
            />
          </Stack>
          <Stack gap={2} style={{ flex: "1 1 180px" }}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.5}>
              Default material
            </Text>
            <TextInput
              size="xs"
              value={defaultMaterial}
              placeholder="e.g. Oak"
              onChange={(e) =>
                update((d) => {
                  d.settings.defaultMaterial = e.currentTarget.value;
                })
              }
            />
          </Stack>
          <Button variant="light" onClick={onApplyDefaults}>
            Apply defaults to pieces
          </Button>
        </Group>
      </Card>

      {pieces.length === 0 ? (
        <Center py={40}>
          <Stack align="center" gap={4}>
            <Text fw={600}>No pieces yet</Text>
            <Text c="dimmed" size="sm">
              Add a piece below or import from a project.
            </Text>
          </Stack>
        </Center>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <Table striped withTableBorder highlightOnHover miw={880}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Label</Table.Th>
                <Table.Th style={{ width: 110 }}>Length</Table.Th>
                <Table.Th style={{ width: 110 }}>Width</Table.Th>
                <Table.Th style={{ width: 100 }}>Thickness</Table.Th>
                <Table.Th style={{ width: 70 }}>Qty</Table.Th>
                <Table.Th style={{ width: 140 }}>Material</Table.Th>
                <Table.Th style={{ width: 110 }}>Grain</Table.Th>
                <Table.Th style={{ width: 40 }} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pieces.map((p, i) => (
                <PieceRow key={p.id} piece={p} index={i} unit={unit} />
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}
      <Group>
        <Button
          leftSection={<IconPlus size={16} />}
          variant="light"
          onClick={onAdd}
        >
          Add piece
        </Button>
        {pieces.length > 0 && (
          <Button
            variant="subtle"
            color="red"
            leftSection={<IconTrash size={16} />}
            onClick={() => update((d) => void (d.pieces = []))}
          >
            Clear all
          </Button>
        )}
      </Group>
    </Stack>
  );
}

function PieceRow({
  piece,
  index,
  unit,
}: {
  piece: Piece;
  index: number;
  unit: Unit;
}) {
  const updatePiece = (recipe: (p: Piece) => void) =>
    update((d) => {
      const target = d.pieces.find((x) => x.id === piece.id);
      if (target) recipe(target);
    });

  return (
    <Table.Tr>
      <Table.Td>
        <TextInput
          size="xs"
          value={piece.label}
          placeholder={`Part ${index + 1}`}
          onChange={(e) => updatePiece((p) => void (p.label = e.currentTarget.value))}
        />
      </Table.Td>
      <Table.Td>
        <LenInput
          value={piece.length}
          unit={unit}
          placeholder={`24"`}
          onChange={(next) => updatePiece((p) => void (p.length = next))}
        />
      </Table.Td>
      <Table.Td>
        <LenInput
          value={piece.width}
          unit={unit}
          placeholder="— (1D)"
          onChange={(next) => updatePiece((p) => void (p.width = next))}
        />
      </Table.Td>
      <Table.Td>
        <LenInput
          value={piece.thickness}
          unit={unit}
          placeholder={`3/4"`}
          onChange={(next) => updatePiece((p) => void (p.thickness = next))}
        />
      </Table.Td>
      <Table.Td>
        <NumberInput
          size="xs"
          min={1}
          value={piece.qty}
          onChange={(v) => {
            const n =
              typeof v === "number" ? v : parseInt(String(v), 10) || 1;
            updatePiece((p) => void (p.qty = Math.max(1, n)));
          }}
        />
      </Table.Td>
      <Table.Td>
        <TextInput
          size="xs"
          value={piece.material}
          placeholder="e.g. Oak"
          onChange={(e) =>
            updatePiece((p) => void (p.material = e.currentTarget.value))
          }
        />
      </Table.Td>
      <Table.Td>
        <Select
          size="xs"
          data={[
            { value: "any", label: "any" },
            { value: "length", label: "along L" },
            { value: "width", label: "along W" },
          ]}
          value={piece.grain}
          onChange={(v) =>
            updatePiece((p) => void (p.grain = (v as Piece["grain"]) ?? "any"))
          }
          allowDeselect={false}
        />
      </Table.Td>
      <Table.Td>
        <ActionIcon
          variant="subtle"
          color="red"
          aria-label="Remove piece"
          onClick={() =>
            update((d) => {
              d.pieces = d.pieces.filter((x) => x.id !== piece.id);
            })
          }
        >
          <IconX size={16} />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  );
}

// ---- Stock panel ----------------------------------------------------------

function StockPanel({
  stock,
  unit,
  onAdd,
  onLoadPreset,
}: {
  stock: Stock[];
  unit: Unit;
  onAdd: () => void;
  onLoadPreset: (key: PresetKey) => void;
}) {
  return (
    <Stack gap="sm">
      <Card padding="sm" radius="md" withBorder>
        <Group gap="sm" wrap="wrap" align="end">
          <Stack gap={2} style={{ flex: "1 1 260px" }}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.5}>
              Load a preset (adds rows to the table below)
            </Text>
            <Select
              size="sm"
              placeholder="Pick a preset…"
              data={PRESET_OPTIONS}
              value={null}
              onChange={(v) => {
                if (v) onLoadPreset(v as PresetKey);
              }}
              allowDeselect={false}
            />
          </Stack>
        </Group>
      </Card>

      {stock.length === 0 ? (
        <Center py={40}>
          <Stack align="center" gap={4}>
            <Text fw={600}>No stock defined</Text>
            <Text c="dimmed" size="sm">
              Load a preset above or add a row to tell the optimizer what
              sizes it can buy.
            </Text>
          </Stack>
        </Center>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <Table striped withTableBorder highlightOnHover miw={900}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Label</Table.Th>
                <Table.Th style={{ width: 110 }}>Length</Table.Th>
                <Table.Th style={{ width: 110 }}>Width</Table.Th>
                <Table.Th style={{ width: 100 }}>Thickness</Table.Th>
                <Table.Th style={{ width: 140 }}>Material</Table.Th>
                <Table.Th style={{ width: 70 }}>Have</Table.Th>
                <Table.Th style={{ width: 90 }}>Price ea</Table.Th>
                <Table.Th style={{ width: 40 }} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {stock.map((s) => (
                <StockRow key={s.id} stock={s} unit={unit} />
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}
      <Group>
        <Button
          leftSection={<IconPlus size={16} />}
          variant="light"
          onClick={onAdd}
        >
          Add stock
        </Button>
        {stock.length > 0 && (
          <Button
            variant="subtle"
            color="red"
            leftSection={<IconTrash size={16} />}
            onClick={() => update((d) => void (d.stock = []))}
          >
            Clear all
          </Button>
        )}
      </Group>
    </Stack>
  );
}

function StockRow({ stock, unit }: { stock: Stock; unit: Unit }) {
  const updateStock = (recipe: (s: Stock) => void) =>
    update((d) => {
      const t = d.stock.find((x) => x.id === stock.id);
      if (t) recipe(t);
    });

  return (
    <Table.Tr>
      <Table.Td>
        <TextInput
          size="xs"
          value={stock.label}
          placeholder="e.g. 2x4 — 8ft"
          onChange={(e) =>
            updateStock((s) => void (s.label = e.currentTarget.value))
          }
        />
      </Table.Td>
      <Table.Td>
        <LenInput
          value={stock.length}
          unit={unit}
          placeholder={`96"`}
          onChange={(next) => updateStock((s) => void (s.length = next))}
        />
      </Table.Td>
      <Table.Td>
        <LenInput
          value={stock.width}
          unit={unit}
          placeholder={`3.5"`}
          onChange={(next) => updateStock((s) => void (s.width = next))}
        />
      </Table.Td>
      <Table.Td>
        <LenInput
          value={stock.thickness}
          unit={unit}
          placeholder={`1.5"`}
          onChange={(next) => updateStock((s) => void (s.thickness = next))}
        />
      </Table.Td>
      <Table.Td>
        <TextInput
          size="xs"
          value={stock.material}
          onChange={(e) =>
            updateStock((s) => void (s.material = e.currentTarget.value))
          }
        />
      </Table.Td>
      <Table.Td>
        <NumberInput
          size="xs"
          min={0}
          value={stock.have}
          onChange={(v) => {
            const n = typeof v === "number" ? v : parseInt(String(v), 10) || 0;
            updateStock((s) => void (s.have = Math.max(0, n)));
          }}
        />
      </Table.Td>
      <Table.Td>
        <NumberInput
          size="xs"
          min={0}
          step={0.01}
          decimalScale={2}
          value={stock.price}
          onChange={(v) => {
            const n = typeof v === "number" ? v : parseFloat(String(v)) || 0;
            updateStock((s) => void (s.price = Math.max(0, n)));
          }}
        />
      </Table.Td>
      <Table.Td>
        <ActionIcon
          variant="subtle"
          color="red"
          aria-label="Remove stock"
          onClick={() =>
            update((d) => {
              d.stock = d.stock.filter((x) => x.id !== stock.id);
            })
          }
        >
          <IconX size={16} />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  );
}

// ---- Hardware panel -------------------------------------------------------

function HardwarePanel({
  hardware,
  currency,
  onAdd,
}: {
  hardware: Hardware[];
  currency: string;
  onAdd: () => void;
}) {
  return (
    <Stack gap="sm">
      {hardware.length === 0 ? (
        <Center py={40}>
          <Stack align="center" gap={4}>
            <Text fw={600}>No hardware added</Text>
            <Text c="dimmed" size="sm">
              Screws, hinges, glue, finish — all go here.
            </Text>
          </Stack>
        </Center>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <Table striped withTableBorder highlightOnHover miw={700}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Item</Table.Th>
                <Table.Th style={{ width: 80 }}>Qty</Table.Th>
                <Table.Th style={{ width: 110 }}>Unit</Table.Th>
                <Table.Th style={{ width: 110 }}>
                  Price ea ({currency})
                </Table.Th>
                <Table.Th style={{ width: 40 }} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {hardware.map((h) => (
                <HardwareRow key={h.id} hw={h} />
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}
      <Group>
        <Button
          leftSection={<IconPlus size={16} />}
          variant="light"
          onClick={onAdd}
        >
          Add hardware
        </Button>
        {hardware.length > 0 && (
          <Button
            variant="subtle"
            color="red"
            leftSection={<IconTrash size={16} />}
            onClick={() => update((d) => void (d.hardware = []))}
          >
            Clear all
          </Button>
        )}
      </Group>
    </Stack>
  );
}

function HardwareRow({ hw }: { hw: Hardware }) {
  const updateHw = (recipe: (h: Hardware) => void) =>
    update((d) => {
      const t = d.hardware.find((x) => x.id === hw.id);
      if (t) recipe(t);
    });

  return (
    <Table.Tr>
      <Table.Td>
        <TextInput
          size="xs"
          value={hw.item}
          placeholder={`e.g. 1 1/4" pocket screws`}
          onChange={(e) => updateHw((h) => void (h.item = e.currentTarget.value))}
        />
      </Table.Td>
      <Table.Td>
        <NumberInput
          size="xs"
          min={0}
          value={hw.qty}
          onChange={(v) => {
            const n = typeof v === "number" ? v : parseInt(String(v), 10) || 0;
            updateHw((h) => void (h.qty = Math.max(0, n)));
          }}
        />
      </Table.Td>
      <Table.Td>
        <TextInput
          size="xs"
          value={hw.unit}
          placeholder="ea / box / oz"
          onChange={(e) => updateHw((h) => void (h.unit = e.currentTarget.value))}
        />
      </Table.Td>
      <Table.Td>
        <NumberInput
          size="xs"
          min={0}
          step={0.01}
          decimalScale={2}
          value={hw.price}
          onChange={(v) => {
            const n = typeof v === "number" ? v : parseFloat(String(v)) || 0;
            updateHw((h) => void (h.price = Math.max(0, n)));
          }}
        />
      </Table.Td>
      <Table.Td>
        <ActionIcon
          variant="subtle"
          color="red"
          aria-label="Remove hardware"
          onClick={() =>
            update((d) => {
              d.hardware = d.hardware.filter((x) => x.id !== hw.id);
            })
          }
        >
          <IconX size={16} />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  );
}

// ---- Settings panel -------------------------------------------------------

function SettingsPanel({ settings, unit }: { settings: Settings; unit: Unit }) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
      <Card padding="sm" radius="md" withBorder>
        <Stack gap="sm">
          <Text fw={600}>Cut geometry</Text>
          <Group grow>
            <Stack gap={2}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.5}>
                Kerf (blade width)
              </Text>
              <LenInput
                value={settings.kerf}
                unit={unit}
                placeholder={`1/8"`}
                onChange={(next) =>
                  update(
                    (d) =>
                      void (d.settings.kerf = Math.max(0, next ?? 0)),
                  )
                }
              />
            </Stack>
            <Stack gap={2}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.5}>
                Trim per piece
              </Text>
              <LenInput
                value={settings.trim}
                unit={unit}
                placeholder="0"
                onChange={(next) =>
                  update(
                    (d) =>
                      void (d.settings.trim = Math.max(0, next ?? 0)),
                  )
                }
              />
            </Stack>
          </Group>
          <Checkbox
            label="Allow rotation (when piece has no grain preference)"
            checked={settings.allowRotate}
            onChange={(e) =>
              update(
                (d) =>
                  void (d.settings.allowRotate = e.currentTarget.checked),
              )
            }
          />
          <Stack gap={2}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.5}>
              Thickness tolerance
            </Text>
            <LenInput
              value={settings.thickTol}
              unit={unit}
              placeholder={`1/32"`}
              onChange={(next) =>
                update(
                  (d) =>
                    void (d.settings.thickTol = Math.max(0, next ?? 0)),
                )
              }
            />
          </Stack>
        </Stack>
      </Card>

      <Card padding="sm" radius="md" withBorder>
        <Stack gap="sm">
          <Text fw={600}>Algorithm & display</Text>
          <Stack gap={2}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.5}>
              Packing strategy
            </Text>
            <Select
              size="sm"
              data={STRATEGY_OPTIONS}
              value={settings.strategy}
              onChange={(v) =>
                update(
                  (d) =>
                    void (d.settings.strategy =
                      (v as Strategy) ?? "best-area"),
                )
              }
              allowDeselect={false}
            />
          </Stack>
          <Stack gap={2}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.5}>
              Currency symbol
            </Text>
            <TextInput
              size="sm"
              value={settings.currency}
              maxLength={3}
              onChange={(e) =>
                update(
                  (d) =>
                    void (d.settings.currency =
                      e.currentTarget.value.slice(0, 3) || "$"),
                )
              }
            />
          </Stack>
        </Stack>
      </Card>
    </SimpleGrid>
  );
}

// ---- Project picker modal -------------------------------------------------

function ProjectPicker({
  opened,
  onClose,
  projects,
  onPick,
}: {
  opened: boolean;
  onClose: () => void;
  projects: Project[];
  onPick: (p: Project) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const withWood = projects.filter(
      (p) => (p.materials?.wood?.length ?? 0) > 0,
    );
    if (!qq) return withWood.slice(0, 200);
    return withWood
      .filter((p) => {
        const hay = (
          (p.title || "") +
          " " +
          (p.category || "")
        ).toLowerCase();
        return hay.includes(qq);
      })
      .slice(0, 200);
  }, [projects, q]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Import pieces from a project"
      size="lg"
    >
      <Stack gap="sm">
        <TextInput
          autoFocus
          placeholder="Search projects…"
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
        />
        {filtered.length === 0 ? (
          <Alert color="gray">No projects match.</Alert>
        ) : (
          <Stack gap={4} mah={420} style={{ overflowY: "auto" }}>
            {filtered.map((p) => (
              <Group
                key={p.id}
                wrap="nowrap"
                gap="sm"
                p="xs"
                style={{
                  borderRadius: 6,
                  cursor: "pointer",
                  border: "1px solid var(--ws-border-soft)",
                }}
                onClick={() => onPick(p)}
              >
                <img
                  src={resolveImg(p.hero_image)}
                  alt=""
                  width={48}
                  height={36}
                  style={{
                    objectFit: "cover",
                    borderRadius: 4,
                    flexShrink: 0,
                  }}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                  <Text fw={500} size="sm" lineClamp={1}>
                    {p.title}
                  </Text>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {[
                      p.category || "",
                      p.difficulty,
                      `${p.materials?.wood?.length ?? 0} wood items`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </Stack>
              </Group>
            ))}
          </Stack>
        )}
      </Stack>
    </Modal>
  );
}
