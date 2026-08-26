import type { SpaceId } from "@denser/contracts";
import { prompt } from "@/lib/dialog";
import { useArtifactPeekHost } from "./useArtifactPeekHost";

type CreateSpace = (title: string, spaceId?: SpaceId | null) => Promise<unknown>;

export function useWorkspaceCreateActions(createSpace: CreateSpace) {
  const { openPeek } = useArtifactPeekHost();

  async function onCreate(
    action: "space" | "document" | "conversation",
    spaceId?: SpaceId | null,
  ) {
    if (action === "space") {
      const title = await prompt({
        title: "New space",
        label: "Space name",
        placeholder: "Acme",
        confirmLabel: "Create",
      });
      if (!title?.trim()) return;
      await createSpace(title.trim(), spaceId);
      return;
    }

    if (action === "document") {
      openPeek("document", spaceId);
      return;
    }

    openPeek("conversation", spaceId);
  }

  return { onCreate };
}

export { useArtifactPeekHost } from "./useArtifactPeekHost.js";
