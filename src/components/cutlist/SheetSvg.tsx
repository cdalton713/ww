import type { Sheet } from "@/lib/cutlist/types";
import { fmtLong, type Unit } from "@/lib/cutlist/units";

const COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#a855f7",
  "#ef4444",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

type Props = {
  sheet: Sheet;
  distinctLabels: string[];
  unit: Unit;
};

/** SVG diagram for a single sheet's placements. */
export function SheetSvg({ sheet, distinctLabels, unit }: Props) {
  const maxW = 1100;
  const maxH = 500;
  const sL = sheet.length;
  const sW = sheet.width;
  const scale = Math.min(maxW / sL, maxH / sW);
  const vbW = Math.round(sL * scale);
  const vbH = Math.round(sW * scale);
  const pad = 22;

  const colorFor = (label: string) => {
    const idx = distinctLabels.indexOf(label);
    return COLORS[(idx < 0 ? 0 : idx) % COLORS.length];
  };

  return (
    <svg
      className="clo-sheet-svg"
      viewBox={`0 0 ${vbW + pad * 2} ${vbH + pad * 2}`}
      width={vbW + pad * 2}
      height={vbH + pad * 2}
      preserveAspectRatio="xMidYMid meet"
    >
      <rect
        x={pad}
        y={pad}
        width={vbW}
        height={vbH}
        fill="#fafaf7"
        stroke="#d0cfc9"
        strokeWidth={1}
      />
      <text
        x={pad + vbW / 2}
        y={pad - 6}
        textAnchor="middle"
        fontSize={11}
        fill="#706b5e"
      >
        {fmtLong(sL, unit)}
      </text>
      <text
        x={pad - 6}
        y={pad + vbH / 2}
        textAnchor="middle"
        fontSize={11}
        fill="#706b5e"
        transform={`rotate(-90 ${pad - 6} ${pad + vbH / 2})`}
      >
        {fmtLong(sW, unit)}
      </text>

      {sheet.pieces.map((pc, i) => {
        const x = pad + pc.x * scale;
        const y = pad + pc.y * scale;
        const w = pc.w * scale;
        const h = pc.h * scale;
        const fill = colorFor(pc.label);
        const lbl = `${pc.label}${pc.ofQty > 1 ? ` #${pc.instance}` : ""}${
          pc.rotated ? " ↻" : ""
        }`;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={fill}
              fillOpacity={0.75}
              stroke="#fff"
              strokeWidth={1}
              rx={2}
            />
            {w > 40 && h > 18 ? (
              <>
                <text
                  x={x + w / 2}
                  y={y + h / 2 - 3}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="#1a1a1a"
                >
                  {lbl}
                </text>
                <text
                  x={x + w / 2}
                  y={y + h / 2 + 10}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#333"
                >
                  {fmtLong(pc.w, unit)} × {fmtLong(pc.h, unit)}
                </text>
              </>
            ) : w > 26 ? (
              <text
                x={x + w / 2}
                y={y + h / 2 + 3}
                textAnchor="middle"
                fontSize={10}
                fontWeight={600}
                fill="#1a1a1a"
              >
                {lbl}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export { COLORS as PIECE_COLORS };
