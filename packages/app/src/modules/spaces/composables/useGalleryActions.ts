import type {
  SpaceGalleryArtifact,
  SpaceGalleryArtifactAction,
  SpaceGallerySpace,
  SpaceGallerySpaceAction,
} from "../types";
import { confirm } from "@/lib/dialog";
import { useWorkspaceCommandPrompts } from "./useWorkspaceCommandPrompts";

type GalleryCommands = {
  openSpace: (spaceId: string) => Promise<unknown>;
  openArtifact: (artifact: Pick<SpaceGalleryArtifact, "id" | "kind">) => Promise<unknown>;
  renameSpace: (
    space: Pick<SpaceGallerySpace, "id" | "title" | "parentSpaceId">,
    title: string,
  ) => Promise<void>;
  deleteSpace: (space: Pick<SpaceGallerySpace, "id" | "title" | "parentSpaceId">) => Promise<void>;
  renameArtifact: (
    artifact: Pick<SpaceGalleryArtifact, "id" | "title" | "version" | "spaceId">,
    title: string,
  ) => Promise<void>;
  deleteArtifact: (
    artifact: Pick<SpaceGalleryArtifact, "id" | "title" | "spaceId">,
  ) => Promise<void>;
  duplicateArtifact: (artifact: Pick<SpaceGalleryArtifact, "id" | "kind">) => Promise<void>;
};

type GallerySettings = {
  openSettings: (space: Pick<SpaceGallerySpace, "id" | "title">) => void;
};

type GalleryPinCommands = {
  showPinToggle: () => boolean;
  pinSpace: (space: SpaceGallerySpace) => Promise<void>;
  unpinSpace: (space: SpaceGallerySpace) => Promise<void>;
};

export function useGalleryActions(
  commands: GalleryCommands,
  settings: GallerySettings,
  pinCommands?: GalleryPinCommands,
) {
  const prompts = useWorkspaceCommandPrompts();

  async function onSpaceAction(action: SpaceGallerySpaceAction, space: SpaceGallerySpace) {
    if (action === "openSettings") {
      settings.openSettings(space);
      return;
    }
    if (action === "pin") {
      if (pinCommands?.showPinToggle()) {
        await pinCommands.pinSpace(space);
      }
      return;
    }
    if (action === "unpin") {
      if (!pinCommands?.showPinToggle()) return;
      if (
        !(await confirm({
          title: "Unpin from sidebar?",
          description: `${space.title} will be removed from your sidebar pins.`,
        }))
      ) {
        return;
      }
      await pinCommands.unpinSpace(space);
      return;
    }
    if (action === "open") {
      await commands.openSpace(space.id);
      return;
    }
    if (action === "rename") {
      const title = await prompts.promptSpaceRename(space);
      if (title) await commands.renameSpace(space, title);
      return;
    }
    if (action === "delete") {
      if (await prompts.confirmSpaceDelete(space)) {
        await commands.deleteSpace(space);
      }
    }
  }

  async function onArtifactAction(
    action: SpaceGalleryArtifactAction,
    artifact: SpaceGalleryArtifact,
  ) {
    if (action === "open") {
      await commands.openArtifact(artifact);
      return;
    }
    if (action === "rename") {
      const title = await prompts.promptArtifactRename(artifact);
      if (title) await commands.renameArtifact(artifact, title);
      return;
    }
    if (action === "duplicate") {
      if (artifact.kind === "conversation") return;
      await commands.duplicateArtifact(artifact);
      return;
    }
    if (action === "delete") {
      if (await prompts.confirmArtifactDelete(artifact)) {
        await commands.deleteArtifact(artifact);
      }
    }
  }

  return { onSpaceAction, onArtifactAction };
}
