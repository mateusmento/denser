<script setup lang="ts">
import {
  Button,
  ContentEditable,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  SidebarMenuButton,
  SidebarMenuItem,
  cn,
} from "@denser/design-system";
import { CheckIcon, FileTextIcon, MessageCircleIcon, XIcon } from "@lucide/vue";
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { resolveSpaceIcon } from "@/modules/spaces";
import { artifactDisplayTitle } from "@/features/document/lib/document-content";
import type { WorkspaceNavArtifactAction, WorkspaceNavLink, WorkspaceNavSpaceAction } from "../types";

const props = defineProps<{
  link: WorkspaceNavLink;
  isRenaming?: boolean;
}>();

const emit = defineEmits<{
  spaceAction: [action: WorkspaceNavSpaceAction, link: WorkspaceNavLink];
  artifactAction: [action: WorkspaceNavArtifactAction, link: WorkspaceNavLink];
  renameSubmit: [link: WorkspaceNavLink, title: string];
  renameCancel: [link: WorkspaceNavLink];
}>();

const isSpace = computed(() => props.link.to.name === "space");
const isArtifact = computed(() => !isSpace.value);

const renameDraft = ref(props.link.label);
const renameEditable = ref(false);

watch(
  () => props.isRenaming,
  (isRenaming) => {
    renameEditable.value = isRenaming ?? false;
    if (isRenaming) renameDraft.value = props.link.label;
  },
  { immediate: true },
);

watch(
  () => props.link.label,
  (label) => {
    if (!props.isRenaming) renameDraft.value = label;
  },
);

const displayLabel = computed(() =>
  isArtifact.value ? artifactDisplayTitle(props.link.label) : props.link.label,
);

const displayIcon = computed(() => {
  if (isSpace.value) return resolveSpaceIcon(props.link.icon);
  return props.link.artifactKind === "conversation" ? MessageCircleIcon : FileTextIcon;
});

const renamePlaceholder = computed(() =>
  isSpace.value ? "Space name" : props.link.artifactKind === "conversation" ? "Conversation name" : "Document name",
);

const renameButtonClass = cn(
  "gap-2 ring-2 ring-ring ring-offset-2 ring-offset-sidebar",
);

function onSpaceAction(action: WorkspaceNavSpaceAction) {
  emit("spaceAction", action, props.link);
}

function onArtifactAction(action: WorkspaceNavArtifactAction) {
  emit("artifactAction", action, props.link);
}

function onRenameSubmit(title: string) {
  emit("renameSubmit", props.link, title);
}

function confirmRename() {
  const trimmed = renameDraft.value.trim();
  if (isSpace.value && !trimmed) return;
  onRenameSubmit(trimmed);
}

function onRenameCancel() {
  renameDraft.value = props.link.label;
  emit("renameCancel", props.link);
}

function cancelRename() {
  renameEditable.value = false;
  onRenameCancel();
}
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <SidebarMenuItem>
        <SidebarMenuButton
          v-if="isRenaming"
          as="div"
          size="sm"
          :is-active="link.isActive"
          :class="renameButtonClass"
          data-active="true"
        >
          <component :is="displayIcon" class="size-4 shrink-0" />
          <div class="flex min-w-0 flex-1 items-center gap-1">
            <ContentEditable
              v-model="renameDraft"
              v-model:editable="renameEditable"
              as="div"
              :placeholder="renamePlaceholder"
              :class="cn('min-w-0 flex-1 truncate text-sm leading-5')"
              @submit="onRenameSubmit"
              @cancel="cancelRename"
            />
            <div class="flex shrink-0 items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                title="Save"
                aria-label="Save rename"
                @click.stop="confirmRename"
              >
                <CheckIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                title="Cancel"
                aria-label="Cancel rename"
                @click.stop="cancelRename"
              >
                <XIcon />
              </Button>
            </div>
          </div>
        </SidebarMenuButton>

        <SidebarMenuButton v-else as-child :is-active="link.isActive" :tooltip="displayLabel" size="sm">
          <RouterLink :to="link.to">
            <component :is="displayIcon" />
            <span>{{ displayLabel }}</span>
          </RouterLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </ContextMenuTrigger>

    <ContextMenuContent>
      <template v-if="isSpace">
        <ContextMenuItem @select="onSpaceAction('open')">Open</ContextMenuItem>
        <ContextMenuItem @select="onSpaceAction('rename')">Rename</ContextMenuItem>
        <ContextMenuItem @select="onSpaceAction('openSettings')">Space settings</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" @select="onSpaceAction('delete')">
          Delete
        </ContextMenuItem>
      </template>

      <template v-else>
        <ContextMenuItem @select="onArtifactAction('open')">Open</ContextMenuItem>
        <ContextMenuItem @select="onArtifactAction('rename')">Rename</ContextMenuItem>
        <ContextMenuItem
          v-if="link.artifactKind === 'document'"
          @select="onArtifactAction('duplicate')"
        >
          Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" @select="onArtifactAction('delete')">
          Delete
        </ContextMenuItem>
      </template>
    </ContextMenuContent>
  </ContextMenu>
</template>
