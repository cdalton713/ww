import {
  Alert,
  Badge,
  Card,
  Center,
  Group,
  Stack,
  Table,
  Tabs,
  Text,
} from "@mantine/core";
import { useMemo } from "react";

import type {
  Hardware,
  Results,
  Settings,
  Stock,
} from "@/lib/cutlist/types";
import { fmt, fmtLong, type Unit } from "@/lib/cutlist/units";
import { stockLabelFor as algoStockLabel } from "@/lib/cutlist/optimizer";

import { SheetSvg, PIECE_COLORS } from "./SheetSvg";

type Props = {
  results: Results;
  stock: Stock[];
  hardware: Hardware[];
  settings: Settings;
  unit: Unit;
};

export function ResultsView({
  results,
  stock,
  hardware,
  settings,
  unit,
}: Props) {
  const distinctLabels = useMemo(() => {
    const seen: string[] = [];
    for (const sh of results.sheets) {
      for (const pc of sh.pieces) {
        if (!seen.includes(pc.label)) seen.push(pc.label);
      }
    }
    return seen;
  }, [results]);

  return (
    <Tabs defaultValue="shopping" keepMounted={false}>
      <Tabs.List>
        <Tabs.Tab value="shopping">Shopping list</Tabs.Tab>
        <Tabs.Tab value="visual">Visual</Tabs.Tab>
        <Tabs.Tab value="cutlist">Cut list</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="shopping" pt="md">
        <ShoppingList
          results={results}
          stock={stock}
          hardware={hardware}
          currency={settings.currency}
          unit={unit}
        />
      </Tabs.Panel>
      <Tabs.Panel value="visual" pt="md">
        <VisualPanel
          results={results}
          distinctLabels={distinctLabels}
          unit={unit}
        />
      </Tabs.Panel>
      <Tabs.Panel value="cutlist" pt="md">
        <CutListPanel results={results} unit={unit} />
      </Tabs.Panel>
    </Tabs>
  );
}

type RollRow = {
  stockId: number;
  label: string;
  count: number;
  material: string;
  length: number;
  width: number;
  thickness: number;
  price: number;
  used: number;
  waste: number;
  area: number;
  fromStock: number;
  toBuy: number;
};

function ShoppingList({
  results,
  stock,
  hardware,
  currency,
  unit,
}: {
  results: Results;
  stock: Stock[];
  hardware: Hardware[];
  currency: string;
  unit: Unit;
}) {
  const rolls = useMemo<RollRow[]>(() => {
    const map = new Map<string, RollRow>();
    for (const sh of results.sheets) {
      const key = `${sh.stockId}|${sh.label}`;
      const row: RollRow = map.get(key) ?? {
        stockId: sh.stockId,
        label: sh.label,
        count: 0,
        material: sh.material,
        length: sh.length,
        width: sh.width,
        thickness: sh.thickness,
        price: sh.price || 0,
        used: 0,
        waste: 0,
        area: 0,
        fromStock: 0,
        toBuy: 0,
      };
      row.count += 1;
      row.area += sh.length * sh.width;
      const used = sh.pieces.reduce((s, p) => s + p.w * p.h, 0);
      row.used += used;
      row.waste += sh.length * sh.width - used;
      map.set(key, row);
    }
    for (const row of map.values()) {
      const src = stock.find((s) => s.id === row.stockId);
      const onHand = Math.max(0, src && src.have ? src.have | 0 : 0);
      row.fromStock = Math.min(onHand, row.count);
      row.toBuy = row.count - row.fromStock;
    }
    return Array.from(map.values()).sort(
      (a, b) => b.toBuy - a.toBuy || b.count - a.count,
    );
  }, [results, stock]);

  const buyCount = rolls.reduce((s, v) => s + v.toBuy, 0);
  const useStockCount = rolls.reduce((s, v) => s + v.fromStock, 0);
  const lumberCost = rolls.reduce((s, v) => s + v.toBuy * v.price, 0);
  const hwCost = hardware.reduce((s, h) => s + (h.qty || 0) * (h.price || 0), 0);
  const grand = lumberCost + hwCost;

  return (
    <Stack gap="md">
      <Card padding="sm" radius="md" withBorder>
        <Stack gap={6}>
          <Group justify="space-between" wrap="wrap">
            <Text fw={600}>Lumber / sheet goods</Text>
            <Text size="sm" c="dimmed">
              {[
                buyCount > 0 ? `${buyCount} to buy` : null,
                useStockCount > 0 ? `${useStockCount} from on-hand` : null,
                lumberCost > 0 ? `${currency}${lumberCost.toFixed(2)}` : null,
              ]
                .filter(Boolean)
                .join(" · ") || "0 pieces"}
            </Text>
          </Group>
          {rolls.length === 0 ? (
            <Text c="dimmed" size="sm">
              Nothing to buy yet. Add pieces and buying options, then optimize.
            </Text>
          ) : (
            <Stack gap={4}>
              {rolls.map((row) => {
                const waste =
                  row.area > 0 ? (1 - row.used / row.area) * 100 : 0;
                const qty = row.toBuy > 0 ? row.toBuy : row.fromStock;
                const qtyLabel = row.toBuy > 0 ? "Buy" : "Have";
                const subBits = [
                  row.material || "",
                  `${fmtLong(row.length, unit)} × ${fmtLong(row.width, unit)} × ${fmt(row.thickness, unit)}`,
                  `${waste.toFixed(0)}% waste`,
                ].filter(Boolean);
                if (row.fromStock > 0 && row.toBuy > 0)
                  subBits.push(`${row.fromStock} from on-hand`);
                const lineCost = row.toBuy * row.price;
                return (
                  <Group
                    key={row.stockId + row.label}
                    justify="space-between"
                    wrap="nowrap"
                    gap="sm"
                    py={6}
                    style={{
                      borderBottom: "1px dashed var(--ws-border-soft)",
                    }}
                  >
                    <Group gap="sm" wrap="nowrap">
                      <Stack gap={0} align="center" style={{ minWidth: 52 }}>
                        <Text fw={700} size="lg">
                          {qty}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {qtyLabel}
                        </Text>
                      </Stack>
                      <Stack gap={2}>
                        <Text fw={500} size="sm">
                          {row.label || algoStockLabel(row, unit)}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {subBits.join(" · ")}
                        </Text>
                      </Stack>
                    </Group>
                    {row.price > 0 && row.toBuy > 0 && (
                      <Text size="xs" c="dimmed">
                        {currency}
                        {row.price.toFixed(2)} ea = {currency}
                        {lineCost.toFixed(2)}
                      </Text>
                    )}
                  </Group>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Card>

      <Card padding="sm" radius="md" withBorder>
        <Stack gap={6}>
          <Group justify="space-between" wrap="wrap">
            <Text fw={600}>Hardware & supplies</Text>
            <Text size="sm" c="dimmed">
              {hardware.length} line{hardware.length === 1 ? "" : "s"}
              {hwCost > 0 ? ` · ${currency}${hwCost.toFixed(2)}` : ""}
            </Text>
          </Group>
          {hardware.length === 0 ? (
            <Text c="dimmed" size="sm">
              No hardware added.
            </Text>
          ) : (
            <Stack gap={4}>
              {hardware.map((h) => {
                const lineCost = (h.qty || 0) * (h.price || 0);
                return (
                  <Group
                    key={h.id}
                    justify="space-between"
                    wrap="nowrap"
                    py={6}
                    style={{
                      borderBottom: "1px dashed var(--ws-border-soft)",
                    }}
                  >
                    <Group gap="sm" wrap="nowrap">
                      <Text fw={700} size="lg" style={{ minWidth: 52, textAlign: "center" }}>
                        {h.qty || 0}
                      </Text>
                      <Stack gap={2}>
                        <Text fw={500} size="sm">
                          {h.item || "(unnamed)"}
                        </Text>
                        {h.unit && (
                          <Text size="xs" c="dimmed">
                            per {h.unit}
                          </Text>
                        )}
                      </Stack>
                    </Group>
                    {h.price > 0 && (
                      <Text size="xs" c="dimmed">
                        {currency}
                        {h.price.toFixed(2)} ea = {currency}
                        {lineCost.toFixed(2)}
                      </Text>
                    )}
                  </Group>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Card>

      {grand > 0 && (
        <Card padding="sm" radius="md" withBorder>
          <Group justify="space-between">
            <Text fw={600}>Estimated cost to buy</Text>
            <Text fw={700}>
              {currency}
              {grand.toFixed(2)}
            </Text>
          </Group>
        </Card>
      )}

      {results.unplaced.length > 0 && (
        <Alert color="red" title={`${results.unplaced.length} piece(s) did not fit any stock`}>
          Add larger stock sizes or reduce piece dimensions. See the Cut list tab for details.
        </Alert>
      )}
    </Stack>
  );
}

function VisualPanel({
  results,
  distinctLabels,
  unit,
}: {
  results: Results;
  distinctLabels: string[];
  unit: Unit;
}) {
  if (results.sheets.length === 0) {
    return (
      <Center py={60}>
        <Stack align="center" gap={4}>
          <Text fw={600}>Nothing was placed</Text>
          <Text c="dimmed" size="sm">
            Check that your stock is large enough for the pieces you entered.
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Group gap="md" wrap="wrap" px="xs">
        <Text fw={600} size="sm">
          Parts:
        </Text>
        {distinctLabels.map((lbl, i) => (
          <Group key={lbl} gap={6} wrap="nowrap">
            <span
              style={{
                display: "inline-block",
                width: 14,
                height: 14,
                borderRadius: 3,
                background: PIECE_COLORS[i % PIECE_COLORS.length],
              }}
            />
            <Text size="sm">{lbl}</Text>
          </Group>
        ))}
      </Group>

      {results.sheets.map((sh, i) => {
        const used = sh.pieces.reduce((s, p) => s + p.w * p.h, 0);
        const area = sh.length * sh.width;
        const waste = area > 0 ? (1 - used / area) * 100 : 0;
        return (
          <Card key={i} padding="sm" radius="md" withBorder>
            <Group justify="space-between" wrap="wrap" mb="xs" gap="xs">
              <Text fw={600}>
                Sheet {i + 1} — {sh.label}
              </Text>
              <Group gap="xs">
                <Badge variant="light" color="gray">
                  {sh.pieces.length} cut{sh.pieces.length === 1 ? "" : "s"}
                </Badge>
                <Badge variant="light" color="gray">
                  {fmtLong(sh.length, unit)} × {fmtLong(sh.width, unit)}
                </Badge>
                <Badge
                  variant="light"
                  color={waste < 15 ? "green" : waste < 35 ? "yellow" : "red"}
                >
                  {waste.toFixed(1)}% waste
                </Badge>
              </Group>
            </Group>
            <div style={{ overflowX: "auto" }}>
              <SheetSvg
                sheet={sh}
                distinctLabels={distinctLabels}
                unit={unit}
              />
            </div>
          </Card>
        );
      })}
    </Stack>
  );
}

function CutListPanel({ results, unit }: { results: Results; unit: Unit }) {
  if (results.sheets.length === 0) {
    return (
      <Center py={60}>
        <Stack align="center" gap={4}>
          <Text fw={600}>No cuts to list</Text>
          <Text c="dimmed" size="sm">
            Optimize first with some pieces and stock defined.
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      {results.sheets.map((sh, i) => {
        const used = sh.pieces.reduce((s, p) => s + p.w * p.h, 0);
        const area = sh.length * sh.width;
        const waste = area > 0 ? (1 - used / area) * 100 : 0;
        const ordered = sh.pieces
          .slice()
          .sort((a, b) => a.y - b.y || a.x - b.x);
        return (
          <Card key={i} padding="sm" radius="md" withBorder>
            <Text fw={600} mb="xs">
              Sheet {i + 1} — {sh.label} · {waste.toFixed(1)}% waste
            </Text>
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 40 }}>#</Table.Th>
                  <Table.Th>Label</Table.Th>
                  <Table.Th>Length</Table.Th>
                  <Table.Th>Width</Table.Th>
                  <Table.Th>Rotated</Table.Th>
                  <Table.Th>Position (x, y)</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {ordered.map((pc, j) => (
                  <Table.Tr key={j}>
                    <Table.Td>{j + 1}</Table.Td>
                    <Table.Td>
                      {pc.label}
                      {pc.ofQty > 1 ? ` #${pc.instance}/${pc.ofQty}` : ""}
                    </Table.Td>
                    <Table.Td>{fmtLong(pc.w, unit)}</Table.Td>
                    <Table.Td>{fmtLong(pc.h, unit)}</Table.Td>
                    <Table.Td>{pc.rotated ? "yes" : "—"}</Table.Td>
                    <Table.Td>
                      {fmtLong(pc.x, unit)}, {fmtLong(pc.y, unit)}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        );
      })}
      {results.unplaced.length > 0 && (
        <Card padding="sm" radius="md" withBorder>
          <Text fw={600} c="red" mb="xs">
            Unplaced ({results.unplaced.length})
          </Text>
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 40 }}>#</Table.Th>
                <Table.Th>Label</Table.Th>
                <Table.Th>Length</Table.Th>
                <Table.Th>Width</Table.Th>
                <Table.Th>Thickness</Table.Th>
                <Table.Th>Material</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {results.unplaced.map((pc, i) => (
                <Table.Tr key={i}>
                  <Table.Td>{i + 1}</Table.Td>
                  <Table.Td>
                    {pc.label}
                    {pc.ofQty > 1 ? ` #${pc.instance}/${pc.ofQty}` : ""}
                  </Table.Td>
                  <Table.Td>{fmtLong(pc.length, unit)}</Table.Td>
                  <Table.Td>
                    {pc.width != null ? fmtLong(pc.width, unit) : "—"}
                  </Table.Td>
                  <Table.Td>{fmt(pc.thickness, unit)}</Table.Td>
                  <Table.Td>{pc.material || "—"}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}
    </Stack>
  );
}
