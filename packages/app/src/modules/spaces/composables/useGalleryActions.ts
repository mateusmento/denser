import type {
  SpaceGalleryArtifact,
  SpaceGalleryArtifactAction,
  SpaceGallerySpace,
  SpaceGallerySpaceAction,
} from "../types";
import { useWorkspaceCommandPrompts } from "./useWorkspaceCommandPrompts";

type GalleryCommands = {
  openSpace: (spaceId: string) => Promise<unknown>;
  openDocument: (artifactId: string) => Promise<unknown>;
  renameSpace: (
    space: Pick<SpaceGallerySpace, "id" | "title" | "parentSpaceId">,
    title: string,
  ) => Promise<void>;
  deleteSpace: (
    space: Pick<SpaceGallerySpace, "id" | "title" | "parentSpaceId">,
  ) => Promise<void>;
  renameArtifact: (
    artifact: Pick<SpaceGalleryArtifact, "id" | "title" | "version" | "spaceId">,
    title: string,
  ) => Promise<void>;
  deleteArtifact: (
    artifact: Pick<SpaceGalleryArtifact, "id" | "title" | "spaceId">,
  ) => Promise<void>;
  duplicateArtifact: (artifact: Pick<SpaceGalleryArtifact, "id">) => Promise<void>;
};

type GallerySettings = {
  openSettings: (space: Pick<SpaceGallerySpace, "id" | "title">) => void;
};

export function useGalleryActions(commands: GalleryCommands, settings: GallerySettings) {
  const prompts = useWorkspaceCommandPrompts();

  async function onSpaceAction(action: SpaceGallerySpaceAction, space: SpaceGallerySpace) {
    if (action === "openSettings") {
      settings.openSettings(space);
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
      await commands.openDocument(artifact.id);
      return;
    }
    if (action === "rename") {
      const title = await prompts.promptArtifactRename(artifact);
      if (title) await commands.renameArtifact(artifact, title);
      return;
    }
    if (action === "duplicate") {
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
