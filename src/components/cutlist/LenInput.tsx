import { TextInput } from "@mantine/core";
import { useEffect, useState } from "react";

import {
  formatLenInput,
  parseLen,
  type Unit,
} from "@/lib/cutlist/units";

type Props = {
  value: number | null;
  unit: Unit;
  onChange: (next: number | null) => void;
  placeholder?: string;
  w?: number | string;
};

/**
 * Text input that parses fractional / decimal / mm values on blur and
 * re-formats the display whenever the underlying value or unit changes.
 */
export function LenInput({ value, unit, onChange, placeholder, w }: Props) {
  const [text, setText] = useState(() => formatLenInput(value, unit));

  // Reset the text whenever value / unit shifts from outside.
  useEffect(() => {
    setText(formatLenInput(value, unit));
  }, [value, unit]);

  const commit = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      onChange(null);
      return;
    }
    const parsed = parseLen(trimmed);
    if (isNaN(parsed)) {
      // revert display to last valid value
      setText(formatLenInput(value, unit));
      return;
    }
    onChange(parsed);
  };

  return (
    <TextInput
      size="xs"
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.currentTarget.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      w={w}
    />
  );
}
