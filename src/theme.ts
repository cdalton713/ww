import { createTheme, type MantineColorsTuple } from "@mantine/core";

// Mantine wants a 10-step tuple. Hand-picked around the existing
// --accent color (#d97706) so the React app keeps the same warm
// "workshop" palette as the original HTML.
const workshop: MantineColorsTuple = [
  "#fff4e2",
  "#ffe6c4",
  "#ffcc8a",
  "#ffb04a",
  "#f6971b",
  "#d97706",
  "#b45309",
  "#8f4209",
  "#6b3008",
  "#4a1f03",
];

export const theme = createTheme({
  primaryColor: "workshop",
  primaryShade: { light: 5, dark: 4 },
  colors: { workshop },
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  defaultRadius: "md",
  white: "#ffffff",
  black: "#1f2430",
});
