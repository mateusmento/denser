import {
  DEFAULT_THEME_TOKENS,
  THEME_TOKEN_KEYS,
  type ThemeMode,
  type ThemeOverride,
  type ThemeOverrideBundle,
  type ThemeTokenKey,
} from "./tokens";

export const THEME_OVERRIDE_STORAGE_KEY = "denser-theme-override-v1";
export const THEME_OVERRIDE_EVENT = "denser-theme-override";

export function cssVarName(key: ThemeTokenKey): string {
  return `--${key}`;
}

/** Remove inline token overrides so stylesheet defaults apply again. */
export function clearThemeOverride(el: HTMLElement = document.documentElement): void {
  for (const key of THEME_TOKEN_KEYS) {
    el.style.removeProperty(cssVarName(key));
  }
}

/** Apply one mode’s overrides as inline CSS variables on `el`. */
export function applyThemeOverride(
  bundle: ThemeOverrideBundle,
  mode: ThemeMode,
  el: HTMLElement = document.documentElement,
): void {
  clearThemeOverride(el);
  const overlay = bundle[mode];
  for (const key of THEME_TOKEN_KEYS) {
    const value = overlay[key];
    if (value) el.style.setProperty(cssVarName(key), value);
  }
}

export function readStoredThemeOverride(): ThemeOverrideBundle | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(THEME_OVERRIDE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ThemeOverrideBundle;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      light: sanitizeOverride(parsed.light),
      dark: sanitizeOverride(parsed.dark),
    };
  } catch {
    return null;
  }
}

export function writeStoredThemeOverride(bundle: ThemeOverrideBundle): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(THEME_OVERRIDE_STORAGE_KEY, JSON.stringify(bundle));
  dispatchThemeOverrideEvent(bundle);
}

export function clearStoredThemeOverride(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(THEME_OVERRIDE_STORAGE_KEY);
  dispatchThemeOverrideEvent(emptyBundle());
}

function emptyBundle(): ThemeOverrideBundle {
  return { light: {}, dark: {} };
}

function sanitizeOverride(value: unknown): ThemeOverride {
  if (!value || typeof value !== "object") return {};
  const out: ThemeOverride = {};
  for (const key of THEME_TOKEN_KEYS) {
    const raw = (value as ThemeOverride)[key];
    if (typeof raw === "string" && raw.trim()) out[key] = raw.trim();
  }
  return out;
}

function dispatchThemeOverrideEvent(bundle: ThemeOverrideBundle): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(THEME_OVERRIDE_EVENT, { detail: bundle }));
}

/** Effective values for pickers: override → default. */
export function resolveThemeTokens(
  bundle: ThemeOverrideBundle,
  mode: ThemeMode,
): Record<ThemeTokenKey, string> {
  const defaults = DEFAULT_THEME_TOKENS[mode];
  const overlay = bundle[mode];
  const out = { ...defaults } as Record<ThemeTokenKey, string>;
  for (const key of THEME_TOKEN_KEYS) {
    const value = overlay[key];
    if (value) out[key] = value;
  }
  return out;
}

/** Serialize both modes for paste into `styles.css` or `dev-override.css`. */
export function serializeThemeOverrideCss(bundle: ThemeOverrideBundle): string {
  const light = formatBlock(":root", bundle.light);
  const dark = formatBlock("html.dark,\n.dark", bundle.dark);
  return `/* denser Theme Lab export — paste into design-system styles or replace token blocks */\n${light}\n${dark}\n`;
}

function formatBlock(selector: string, overlay: ThemeOverride): string {
  const lines = THEME_TOKEN_KEYS.filter((key) => overlay[key]).map(
    (key) => `  ${cssVarName(key)}: ${overlay[key]};`,
  );
  if (lines.length === 0) {
    return `/* ${selector} — no overrides */\n`;
  }
  return `${selector} {\n${lines.join("\n")}\n}\n`;
}

export function detectDocumentThemeMode(): ThemeMode {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Re-apply storage (or clear) for the current document mode. */
export function syncThemeOverrideFromStorage(
  mode: ThemeMode = detectDocumentThemeMode(),
  el: HTMLElement = document.documentElement,
): ThemeOverrideBundle {
  const stored = readStoredThemeOverride();
  if (!stored) {
    clearThemeOverride(el);
    return emptyBundle();
  }
  applyThemeOverride(stored, mode, el);
  return stored;
}

export const LIVE_APP_THEME_OVERRIDE_URL = "http://localhost:5173/__denser_theme_override";

/** Push bundle to the Vite app dev middleware (CORS-enabled). */
export async function pushThemeOverrideToLiveApp(bundle: ThemeOverrideBundle): Promise<void> {
  const response = await fetch(LIVE_APP_THEME_OVERRIDE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bundle),
  });
  if (!response.ok) {
    throw new Error(`Live app returned ${response.status}`);
  }
}
