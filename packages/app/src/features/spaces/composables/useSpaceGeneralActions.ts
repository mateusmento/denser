import type { SpaceIcon, SpaceId } from "@denser/contracts";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";
import { useSpaceSync } from "./useSpaceSync";

export function useSpaceGeneralActions(spaceId: ReadonlyRefOrGetter<SpaceId | undefined>) {
  const id = toReadonlyRef(spaceId);

  const { generalView, updateGeneral } = useSpaceSync(id);

  async function onSave(input: { title: string; icon: SpaceIcon | null }) {
    await updateGeneral(input);
  }

  return {
    generalView,
    onSave,
  };
}
