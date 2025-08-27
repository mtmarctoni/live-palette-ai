// Utility to export palette files in various formats
type ExportFormat = "css" | "scss" | "adobe" | "json" | "tailwind" | "figma";

interface ExportPaletteOptions {
  format: ExportFormat;
  colors: string[];
  keyword: string;
  hexToRgb?: (hex: string) => any;
  hexToHsl?: (hex: string) => any;
}

export function exportPaletteFile({
  format,
  colors,
  keyword,
  hexToRgb,
  hexToHsl,
}: ExportPaletteOptions) {
  let content = "";
  let filename = `${keyword.replace(/\s+/g, "-")}-palette`;

  switch (format) {
    case "css":
      content = `:root {\n${colors
        .map((color, i) => `  --color-${i + 1}: ${color};`)
        .join("\n")}\n}`;
      filename += ".css";
      break;
    case "scss":
      content = colors
        .map((color, i) => `$color-${i + 1}: ${color};`)
        .join("\n");
      filename += ".scss";
      break;
    case "adobe":
      content = colors.join("\n");
      filename += ".txt";
      break;
    case "json":
      content = JSON.stringify(
        {
          name: keyword,
          colors: colors.map((color, i) => ({
            name: `Color ${i + 1}`,
            hex: color,
            rgb: hexToRgb ? hexToRgb(color) : undefined,
            hsl: hexToHsl ? hexToHsl(color) : undefined,
          })),
        },
        null,
        2
      );
      filename += ".json";
      break;
    case "tailwind":
      content = `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n${colors
        .map((color, i) => `        'palette-${i + 1}': '${color}',`)
        .join("\n")}\n      }\n    }\n  }\n}`;
      filename += ".js";
      break;
    case "figma":
      content = colors
        .map((color, i) => `${color.replace("#", "")},Color ${i + 1}`)
        .join("\n");
      filename += ".txt";
      break;
  }

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
