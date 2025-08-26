"use client";

// Store original CSS variables for reverting
const originalColors: Record<string, string> = {};
let isOriginalStored = false;
let injectedStyleElement: HTMLStyleElement | null = null;

function createThemeCSS(colors: string[]): string {
  // Ensure we have exactly 11 colors for the complete system
  if (colors.length < 11) {
    console.warn("Incomplete color system received, using fallback mapping");
    return createLegacyThemeCSS(colors);
  }

  // Extract colors by their intended purpose
  const [
    primary,
    secondary,
    accent, // Main colors (0-2)
    lightBg,
    lightFg,
    lightMuted,
    lightBorder, // Light theme (3-6)
    darkBg,
    darkFg,
    darkMuted,
    darkBorder, // Dark theme (7-10)
  ] = colors;

  return `
    :root {
      --primary: ${primary};
      --secondary: ${secondary};
      --accent: ${accent};
      --background: ${lightBg};
      --foreground: ${lightFg};
      --muted: ${lightMuted};
      --muted-foreground: ${lightFg};
      --border: ${lightBorder};
      --card: ${lightBg};
      --card-foreground: ${lightFg};
      --popover: ${lightBg};
      --popover-foreground: ${lightFg};
      --chart-1: ${primary};
      --chart-2: ${secondary};
      --chart-3: ${accent};
      --chart-4: ${lightMuted};
      --chart-5: ${darkMuted};
      --sidebar-primary: ${primary};
      --sidebar-accent: ${accent};
    }

    .dark {
      --background: ${darkBg};
      --foreground: ${darkFg};
      --muted: ${darkMuted};
      --muted-foreground: ${darkFg};
      --border: ${darkBorder};
      --card: ${darkMuted};
      --card-foreground: ${darkFg};
      --popover: ${darkMuted};
      --popover-foreground: ${darkFg};
    }
  `;
}

function createLegacyThemeCSS(colors: string[]): string {
  const extendedColors = [...colors];
  while (extendedColors.length < 5) {
    extendedColors.push(...colors);
  }

  return `
    :root {
      --primary: ${extendedColors[0]};
      --secondary: ${extendedColors[1]};
      --accent: ${extendedColors[2]};
      --chart-1: ${extendedColors[0]};
      --chart-2: ${extendedColors[1]};
      --chart-3: ${extendedColors[2]};
      --chart-4: ${extendedColors[3] || extendedColors[0]};
      --chart-5: ${extendedColors[4] || extendedColors[1]};
      --sidebar-primary: ${extendedColors[0]};
      --sidebar-accent: ${extendedColors[2]};
    }
  `;
}

function storeOriginalColors() {
  if (isOriginalStored) return;

  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);

  const colorVars = [
    "--primary",
    "--secondary",
    "--accent",
    "--background",
    "--foreground",
    "--muted",
    "--muted-foreground",
    "--border",
    "--card",
    "--card-foreground",
    "--popover",
    "--popover-foreground",
    "--chart-1",
    "--chart-2",
    "--chart-3",
    "--chart-4",
    "--chart-5",
    "--sidebar-primary",
    "--sidebar-accent",
  ];

  colorVars.forEach((varName) => {
    originalColors[varName] = computedStyle.getPropertyValue(varName).trim();
  });

  isOriginalStored = true;
}

export function applyPaletteToTheme(colors: string[]) {
  storeOriginalColors();

  if (injectedStyleElement) {
    injectedStyleElement.remove();
  }

  injectedStyleElement = document.createElement("style");
  injectedStyleElement.id = "v0-palette-preview";
  injectedStyleElement.textContent = createThemeCSS(colors);
  document.head.appendChild(injectedStyleElement);
}

export function revertToOriginalTheme() {
  if (injectedStyleElement) {
    injectedStyleElement.remove();
    injectedStyleElement = null;
  }
}

export function isPreviewActive(): boolean {
  return (
    injectedStyleElement !== null &&
    document.head.contains(injectedStyleElement)
  );
}

export function toggleTheme() {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const isDark = root.classList.contains("dark");

  if (isDark) {
    root.classList.remove("dark");
    localStorage.setItem("theme", "light");
  } else {
    root.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }
}

export function initializeTheme() {
  if (typeof window === "undefined") return;

  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add("dark");
  }
}
