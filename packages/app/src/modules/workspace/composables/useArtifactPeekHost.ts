import type { ArtifactKind, SpaceId } from "@denser/contracts";
import { ref } from "vue";
import type { ArtifactPeekState } from "../types";

const peekState = ref<ArtifactPeekState>({ open: false });

export function useArtifactPeekHost() {
  function openPeek(
    kind: ArtifactKind,
    spaceId?: SpaceId | null,
    options?: { navigateOnCreate?: boolean },
  ) {
    peekState.value = {
      open: true,
      kind,
      spaceId: spaceId ?? null,
      navigateOnCreate: options?.navigateOnCreate ?? false,
    };
  }

  function closePeek() {
    peekState.value = { open: false };
  }

  return {
    peekState,
    openPeek,
    closePeek,
  };
}
