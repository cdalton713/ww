import {
  TextInput,
  Select,
  Button,
  Group,
  Chip,
  ScrollArea,
  Text,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import type { Difficulty } from "@/types/project";
import {
  DIFFICULTIES,
  SORT_OPTIONS,
  type FilterState,
} from "@/lib/projects";
import { produce } from "immer";

type Props = {
  value: FilterState;
  categories: string[];
  onChange: (next: FilterState) => void;
  onReset: () => void;
};

/** Search + category + sort + reset, plus a row of difficulty chips. */
export function FilterBar({ value, categories, onChange, onReset }: Props) {
  const update = (recipe: (draft: FilterState) => void) => {
    onChange(produce(value, recipe));
  };

  return (
    <Group gap="sm" px="md" py="sm" wrap="wrap" align="flex-start">
      <TextInput
        leftSection={<IconSearch size={16} />}
        placeholder="Search by title, description, tool, or material…"
        value={value.search}
        onChange={(e) =>
          update((d) => {
            d.search = e.currentTarget.value;
          })
        }
        style={{ flex: "1 1 280px", minWidth: 220 }}
      />
      <Select
        placeholder="All categories"
        data={[{ value: "", label: "All categories" }, ...categories.map((c) => ({ value: c, label: c }))]}
        value={value.category || ""}
        onChange={(v) =>
          update((d) => {
            d.category = v ?? "";
          })
        }
        allowDeselect={false}
        w={{ base: "100%", sm: 200 }}
      />
      <Select
        data={SORT_OPTIONS}
        value={value.sort}
        onChange={(v) =>
          update((d) => {
            if (v) d.sort = v as FilterState["sort"];
          })
        }
        allowDeselect={false}
        w={{ base: "100%", sm: 180 }}
      />
      <Button variant="default" onClick={onReset}>
        Reset
      </Button>
      <ScrollArea w="100%" type="never">
        <Group gap="xs" wrap="nowrap">
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            Difficulty:
          </Text>
          <Chip.Group
            multiple
            value={value.difficulty}
            onChange={(vals) =>
              update((d) => {
                d.difficulty = vals as Difficulty[];
              })
            }
          >
            {DIFFICULTIES.map((diff) => (
              <Chip key={diff} value={diff} variant="outline" radius="xl">
                <Group gap={6} wrap="nowrap" align="center">
                  <span className={`diff-dot ${diff}`} />
                  {diff[0].toUpperCase() + diff.slice(1)}
                </Group>
              </Chip>
            ))}
          </Chip.Group>
        </Group>
      </ScrollArea>
    </Group>
  );
}
