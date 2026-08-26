import type { SpaceId, SpaceSummary } from "@denser/contracts";
import { ref } from "vue";

export function useSpaceSettingsHost() {
  const settingsOpen = ref(false);
  const settingsSpaceId = ref<SpaceId | null>(null);
  const settingsTitle = ref("");

  function openSettings(space: Pick<SpaceSummary, "id" | "title">) {
    settingsSpaceId.value = space.id;
    settingsTitle.value = space.title;
    settingsOpen.value = true;
  }

  return {
    settingsOpen,
    settingsSpaceId,
    settingsTitle,
    openSettings,
  };
}
