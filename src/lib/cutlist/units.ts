// Unit helpers for the cut list optimizer.
// Internal representation is always inches (decimal). Conversion happens at
// the UI boundary.

export const MM_PER_IN = 25.4;
export type Unit = "in" | "mm";

/** Parse a user-typed length string. Accepts inches, mm, cm, m, feet, fractions. */
export function parseLen(str: string | number | null | undefined): number {
  if (str == null) return NaN;
  let s = String(str).trim().toLowerCase();
  if (!s) return NaN;

  if (/\bmm\b/.test(s) || s.endsWith("mm")) {
    const n = parseFloat(s.replace(/mm/g, "").trim());
    return isNaN(n) ? NaN : n / MM_PER_IN;
  }
  if (s.endsWith("cm")) {
    const n = parseFloat(s.slice(0, -2).trim());
    return isNaN(n) ? NaN : (n * 10) / MM_PER_IN;
  }
  if (/^\s*\d+(\.\d+)?\s*m\s*$/.test(s)) {
    const n = parseFloat(s.replace("m", "").trim());
    return isNaN(n) ? NaN : (n * 1000) / MM_PER_IN;
  }

  // Inch units, fractions, and feet.
  s = s
    .replace(/["\u201D]/g, "")
    .replace(/\bin(ches|ch)?\b/g, "")
    .trim();

  let feet = 0;
  const ftMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:ft\b|feet\b|foot\b|'|\u2019)/);
  if (ftMatch) {
    feet = parseFloat(ftMatch[1]);
    s = s.replace(ftMatch[0], "").trim();
  }

  s = s.replace(/-/g, " ").trim();
  let inches = 0;
  if (s) {
    for (const p of s.split(/\s+/).filter(Boolean)) {
      if (p.includes("/")) {
        const [num, den] = p.split("/").map((x) => parseFloat(x));
        if (den && !isNaN(num) && !isNaN(den)) inches += num / den;
        else return NaN;
      } else {
        const n = parseFloat(p);
        if (isNaN(n)) return NaN;
        inches += n;
      }
    }
  }
  const total = feet * 12 + inches;
  return isFinite(total) ? total : NaN;
}

/** Format a length as inches with nearest-1/32 fraction. */
export function fmtInFrac(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return "—";
  if (n === 0) return '0"';
  const neg = n < 0;
  n = Math.abs(n);
  const thirtyseconds = Math.round(n * 32);
  const whole = Math.floor(thirtyseconds / 32);
  let num = thirtyseconds - whole * 32;
  let den = 32;
  if (num > 0) {
    while (num % 2 === 0 && den > 1) {
      num /= 2;
      den /= 2;
    }
  }
  let out: string;
  if (num === 0) out = whole + '"';
  else if (whole === 0) out = num + "/" + den + '"';
  else out = whole + " " + num + "/" + den + '"';
  return (neg ? "-" : "") + out;
}

export function fmtMm(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return "—";
  const mm = n * MM_PER_IN;
  const dp = Math.abs(mm) < 10 ? 2 : 1;
  return (Math.round(mm * 10) / 10).toFixed(dp).replace(/\.0+$/, "") + " mm";
}

export function fmt(n: number | null | undefined, unit: Unit): string {
  return unit === "mm" ? fmtMm(n) : fmtInFrac(n);
}

/** Like fmt but uses feet shorthand for long distances in inches mode. */
export function fmtLong(n: number | null | undefined, unit: Unit): string {
  if (n == null || !isFinite(n)) return "—";
  if (unit === "mm") return fmtMm(n);
  if (n >= 12) {
    const ft = Math.floor(n / 12);
    const rem = n - ft * 12;
    if (rem < 1 / 32) return ft + "'";
    return ft + "' " + fmtInFrac(rem);
  }
  return fmtInFrac(n);
}

/** Format a length as user-editable text, preferring fractions for inches. */
export function formatLenInput(
  n: number | null | undefined,
  unit: Unit,
): string {
  if (n == null || !isFinite(n)) return "";
  if (unit === "mm") {
    return (n * MM_PER_IN).toFixed(1).replace(/\.0$/, "");
  }
  return n ? fmtInFrac(n) : "";
}
