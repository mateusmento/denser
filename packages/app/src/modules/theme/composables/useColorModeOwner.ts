import { createGlobalState, useColorMode } from "@vueuse/core";

export const COLOR_MODE_STORAGE_KEY = "denser-color-mode";

export type ColorMode = "light" | "dark" | "auto";

/** UI-local owner for `html.dark`. Persistence is device-local; not a server SoT. */
export const useColorModeOwner = createGlobalState(() => {
  const mode = useColorMode({
    selector: "html",
    attribute: "class",
    storageKey: COLOR_MODE_STORAGE_KEY,
    emitAuto: true,
  });

  return { mode };
});
