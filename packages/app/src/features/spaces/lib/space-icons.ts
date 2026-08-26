import type { SpaceIcon } from "@denser/contracts";
import type { Component } from "vue";
import {
  BookIcon,
  BriefcaseIcon,
  CodeIcon,
  FolderIcon,
  HeartIcon,
  RocketIcon,
  StarIcon,
  UsersIcon,
} from "@lucide/vue";

export type SpaceIconOption = {
  id: SpaceIcon;
  label: string;
  icon: Component;
};

export const SPACE_ICON_OPTIONS: readonly SpaceIconOption[] = [
  { id: "folder", label: "Folder", icon: FolderIcon },
  { id: "briefcase", label: "Briefcase", icon: BriefcaseIcon },
  { id: "rocket", label: "Rocket", icon: RocketIcon },
  { id: "heart", label: "Heart", icon: HeartIcon },
  { id: "star", label: "Star", icon: StarIcon },
  { id: "code", label: "Code", icon: CodeIcon },
  { id: "users", label: "Team", icon: UsersIcon },
  { id: "book", label: "Book", icon: BookIcon },
];

export function resolveSpaceIcon(icon: SpaceIcon | null | undefined): Component {
  return SPACE_ICON_OPTIONS.find((option) => option.id === icon)?.icon ?? FolderIcon;
}
