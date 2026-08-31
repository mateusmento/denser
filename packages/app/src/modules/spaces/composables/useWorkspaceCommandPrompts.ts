import type { ArtifactSummary, SpaceSummary } from "@denser/contracts";
import { documentDisplayTitle } from "@/features/document/lib/document-content";
import { confirm, prompt } from "@/lib/dialog";

export function useWorkspaceCommandPrompts() {
  async function promptSpaceRename(space: Pick<SpaceSummary, "title">): Promise<string | null> {
    const title = await prompt({
      title: "Rename space",
      label: "Name",
      defaultValue: space.title,
      confirmLabel: "Save",
    });
    const trimmed = title?.trim();
    if (!trimmed || trimmed === space.title) return null;
    return trimmed;
  }

  async function promptArtifactRename(
    artifact: Pick<ArtifactSummary, "title">,
  ): Promise<string | null> {
    const title = await prompt({
      title: "Rename document",
      label: "Name",
      defaultValue: artifact.title,
      confirmLabel: "Save",
    });
    const trimmed = title?.trim();
    if (!trimmed || trimmed === artifact.title) return null;
    return trimmed;
  }

  async function confirmSpaceDelete(space: Pick<SpaceSummary, "title">): Promise<boolean> {
    return confirm({
      title: `Delete “${space.title}”?`,
      description: "This space and everything inside it will be permanently deleted.",
      confirmLabel: "Delete",
      destructive: true,
    });
  }

  async function confirmArtifactDelete(artifact: Pick<ArtifactSummary, "title">): Promise<boolean> {
    return confirm({
      title: `Delete “${documentDisplayTitle(artifact.title)}”?`,
      description: "This document will be permanently deleted.",
      confirmLabel: "Delete",
      destructive: true,
    });
  }

  async function promptDirectMessageUsername(): Promise<string | null> {
    const username = await prompt({
      title: "New direct message",
      label: "Username",
      confirmLabel: "Open",
    });
    const trimmed = username?.trim();
    return trimmed || null;
  }

  return {
    promptSpaceRename,
    promptArtifactRename,
    confirmSpaceDelete,
    confirmArtifactDelete,
    promptDirectMessageUsername,
  };
}
