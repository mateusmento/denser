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
    background: "#ffffff",
    foreground: "#090b0c",
    card: "#ffffff",
    "card-foreground": "#090b0c",
    popover: "#ffffff",
    "popover-foreground": "#090b0c",
    primary: "#5e6ad2",
    "primary-foreground": "#ffffff",
    secondary: "#f4f4f5",
    "secondary-foreground": "#18181b",
    muted: "#f1f3f3",
    "muted-foreground": "#67787c",
    accent: "#eef0fb",
    "accent-foreground": "#161b1d",
    destructive: "#e7000b",
    border: "#e3e7e8",
    input: "#e3e7e8",
    ring: "#5e6ad2",
    sidebar: "#f9fbfb",
    "sidebar-foreground": "#090b0c",
    "sidebar-primary": "#5e6ad2",
    "sidebar-primary-foreground": "#ffffff",
    "sidebar-accent": "#eef0fb",
    "sidebar-accent-foreground": "#161b1d",
    "sidebar-border": "#e3e7e8",
    "sidebar-ring": "#5e6ad2",
  },
  dark: {
    background: "#090b0c",
    foreground: "#f9fbfb",
    card: "#161b1d",
    "card-foreground": "#f9fbfb",
    popover: "#161b1d",
    "popover-foreground": "#f9fbfb",
    primary: "#5e6ad2",
    "primary-foreground": "#ffffff",
    secondary: "#27272a",
    "secondary-foreground": "#fafafa",
    muted: "#22292b",
    "muted-foreground": "#9ca8ab",
    accent: "#22292b",
    "accent-foreground": "#f9fbfb",
    destructive: "#ff6467",
    border: "#ffffff1a",
    input: "#ffffff26",
    ring: "#828fff",
    sidebar: "#161b1d",
    "sidebar-foreground": "#f9fbfb",
    "sidebar-primary": "#5e6ad2",
    "sidebar-primary-foreground": "#ffffff",
    "sidebar-accent": "#22292b",
    "sidebar-accent-foreground": "#f9fbfb",
    "sidebar-border": "#ffffff1a",
    "sidebar-ring": "#828fff",
  },
};

export function emptyThemeOverrideBundle(): ThemeOverrideBundle {
  return { light: {}, dark: {} };
}

export function isThemeTokenKey(value: string): value is ThemeTokenKey {
  return (THEME_TOKEN_KEYS as readonly string[]).includes(value);
}
