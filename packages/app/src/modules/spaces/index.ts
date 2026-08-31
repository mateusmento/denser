export type {
  SpaceGeneralView,
  SpaceGalleryArtifact,
  SpaceGalleryArtifactAction,
  SpaceGallerySpace,
  SpaceGallerySpaceAction,
} from "./types.js";

export { sprintRoleLabel } from "./lib/sprint-role.js";
export { DEFAULT_SPACE_ICON, SPACE_ICON_OPTIONS, resolveSpaceIcon, resolveSpaceIconValue } from "./lib/space-icons.js";
export { useLiveSpace, useLiveSpacesInWindow, resolveSpacesInOrder } from "./lib/live-spaces.js";
export { applySpacePatch, invalidateSpaceProjections } from "./lib/sync-space-patch.js";

export { useArtifactCommands, invalidateArtifactProjections } from "./composables/useArtifactCommands.js";
export { useSpaceCommands } from "./composables/useSpaceCommands.js";
export { useGalleryActions } from "./composables/useGalleryActions.js";
export { useSpaceMoveTree } from "./composables/useSpaceMoveTree.js";
export { useSpaceSettingsHost } from "./composables/useSpaceSettingsHost.js";
export { useWorkspaceCommandPrompts } from "./composables/useWorkspaceCommandPrompts.js";

export { default as SpaceGallery } from "./presentationals/SpaceGallery.vue";
export { default as SpaceMoveMenu } from "./presentationals/SpaceMoveMenu.vue";
export type { SpaceMoveDestination, SpaceMoveNode } from "./lib/space-move-menu.js";
export { default as SpaceFolderTile } from "./presentationals/SpaceFolderTile.vue";
export { default as SpaceArtifactTile } from "./presentationals/SpaceArtifactTile.vue";
export { default as SpaceGeneralPanel } from "./presentationals/SpaceGeneralPanel.vue";
