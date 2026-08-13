/** Semantic CSS custom properties editable in Theme Lab (no leading `--`). */
export const THEME_TOKEN_KEYS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
] as const;

export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number];

export type ThemeMode = "light" | "dark";

export type ThemeOverride = Partial<Record<ThemeTokenKey, string>>;

export type ThemeOverrideBundle = {
  light: ThemeOverride;
  dark: ThemeOverride;
};

export type ThemeTokenGroupId = "surfaces" | "brand" | "muted" | "chrome" | "sidebar";

export type ThemeTokenMeta = {
  key: ThemeTokenKey;
  label: string;
  group: ThemeTokenGroupId;
};

export const THEME_TOKEN_GROUPS: { id: ThemeTokenGroupId; label: string }[] = [
  { id: "surfaces", label: "Surfaces" },
  { id: "brand", label: "Brand" },
  { id: "muted", label: "Muted / secondary" },
  { id: "chrome", label: "Chrome" },
  { id: "sidebar", label: "Sidebar" },
];

export const THEME_TOKEN_META: ThemeTokenMeta[] = [
  { key: "background", label: "Background", group: "surfaces" },
  { key: "foreground", label: "Foreground", group: "surfaces" },
  { key: "card", label: "Card", group: "surfaces" },
  { key: "card-foreground", label: "Card foreground", group: "surfaces" },
  { key: "popover", label: "Popover", group: "surfaces" },
  { key: "popover-foreground", label: "Popover foreground", group: "surfaces" },
  { key: "primary", label: "Primary", group: "brand" },
  { key: "primary-foreground", label: "Primary foreground", group: "brand" },
  { key: "ring", label: "Ring", group: "brand" },
  { key: "accent", label: "Accent", group: "brand" },
  { key: "accent-foreground", label: "Accent foreground", group: "brand" },
  { key: "secondary", label: "Secondary", group: "muted" },
  { key: "secondary-foreground", label: "Secondary foreground", group: "muted" },
  { key: "muted", label: "Muted", group: "muted" },
  { key: "muted-foreground", label: "Muted foreground", group: "muted" },
  { key: "border", label: "Border", group: "chrome" },
  { key: "input", label: "Input", group: "chrome" },
  { key: "destructive", label: "Destructive", group: "chrome" },
  { key: "sidebar", label: "Sidebar", group: "sidebar" },
  { key: "sidebar-foreground", label: "Sidebar foreground", group: "sidebar" },
  { key: "sidebar-primary", label: "Sidebar primary", group: "sidebar" },
  { key: "sidebar-primary-foreground", label: "Sidebar primary fg", group: "sidebar" },
  { key: "sidebar-accent", label: "Sidebar accent", group: "sidebar" },
  { key: "sidebar-accent-foreground", label: "Sidebar accent fg", group: "sidebar" },
  { key: "sidebar-border", label: "Sidebar border", group: "sidebar" },
  { key: "sidebar-ring", label: "Sidebar ring", group: "sidebar" },
];

/** Defaults matching `styles.css` — used for pickers before computed styles resolve. */
export const DEFAULT_THEME_TOKENS: ThemeOverrideBundle = {
  light: {
    background: "#fafafa",
    foreground: "#0a0a0a",
    card: "#ffffff",
    "card-foreground": "#0a0a0a",
    popover: "#ffffff",
    "popover-foreground": "#0a0a0a",
    primary: "#5e6ad2",
    "primary-foreground": "#ffffff",
    secondary: "#e4e4e7",
    "secondary-foreground": "#18181b",
    muted: "#f4f4f5",
    "muted-foreground": "#71717a",
    accent: "#eef0fb",
    "accent-foreground": "#0a0a0a",
    destructive: "#ef4444",
    border: "#e4e4e7",
    input: "#e4e4e7",
    ring: "#5e6ad2",
    sidebar: "#ffffff",
    "sidebar-foreground": "#0a0a0a",
    "sidebar-primary": "#5e6ad2",
    "sidebar-primary-foreground": "#ffffff",
    "sidebar-accent": "#eef0fb",
    "sidebar-accent-foreground": "#0a0a0a",
    "sidebar-border": "#e4e4e7",
    "sidebar-ring": "#5e6ad2",
  },
  dark: {
    background: "#010102",
    foreground: "#f7f8f8",
    card: "#0f1011",
    "card-foreground": "#f7f8f8",
    popover: "#141516",
    "popover-foreground": "#f7f8f8",
    primary: "#5e6ad2",
    "primary-foreground": "#ffffff",
    secondary: "#18191a",
    "secondary-foreground": "#d0d6e0",
    muted: "#141516",
    "muted-foreground": "#8a8f98",
    accent: "#191a1b",
    "accent-foreground": "#f7f8f8",
    destructive: "#ef4444",
    border: "#23252a",
    input: "#23252a",
    ring: "#5e6ad2",
    sidebar: "#0f1011",
    "sidebar-foreground": "#f7f8f8",
    "sidebar-primary": "#5e6ad2",
    "sidebar-primary-foreground": "#ffffff",
    "sidebar-accent": "#191a1b",
    "sidebar-accent-foreground": "#f7f8f8",
    "sidebar-border": "#23252a",
    "sidebar-ring": "#828fff",
  },
};

export function emptyThemeOverrideBundle(): ThemeOverrideBundle {
  return { light: {}, dark: {} };
}

export function isThemeTokenKey(value: string): value is ThemeTokenKey {
  return (THEME_TOKEN_KEYS as readonly string[]).includes(value);
}
