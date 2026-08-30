import type { SpaceId, SpacePreset } from "@denser/contracts";
import { prompt } from "@/lib/dialog";
import type { WorkspaceCreateAction } from "../types";
import { useArtifactPeekHost } from "./useArtifactPeekHost";

type CreateSpace = (
  title: string,
  spaceId?: SpaceId | null,
  preset?: SpacePreset,
) => Promise<unknown>;

const SPACE_PROMPTS: Record<
  Extract<WorkspaceCreateAction, "folder" | "project" | "scrum">,
  { title: string; label: string; placeholder: string }
> = {
  folder: { title: "New folder", label: "Folder name", placeholder: "Notes" },
  project: { title: "New project", label: "Project name", placeholder: "Launch" },
  scrum: { title: "New Scrum project", label: "Project name", placeholder: "Launch" },
};

const PRESET_BY_ACTION: Record<"folder" | "project" | "scrum", SpacePreset> = {
  folder: "folder",
  project: "project",
  scrum: "scrum",
};

export function useWorkspaceCreateActions(createSpace: CreateSpace) {
  const { openPeek } = useArtifactPeekHost();

  async function onCreate(
    action: WorkspaceCreateAction,
    spaceId?: SpaceId | null,
  ) {
    if (action === "folder" || action === "project" || action === "scrum") {
      const copy = SPACE_PROMPTS[action];
      const title = await prompt({
        title: copy.title,
        label: copy.label,
        placeholder: copy.placeholder,
        confirmLabel: "Create",
      });
      if (!title?.trim()) return;
      await createSpace(title.trim(), spaceId, PRESET_BY_ACTION[action]);
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
