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
import { CheckIcon, FileTextIcon, XIcon } from "@lucide/vue";
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { resolveSpaceIcon } from "@/modules/spaces";
import { documentDisplayTitle } from "@/features/document/lib/document-content";
import type { WorkspaceNavDocumentAction, WorkspaceNavLink, WorkspaceNavSpaceAction } from "../types";

const props = defineProps<{
  link: WorkspaceNavLink;
  kind: "space" | "document";
  isRenaming?: boolean;
}>();

const emit = defineEmits<{
  spaceAction: [action: WorkspaceNavSpaceAction, link: WorkspaceNavLink];
  documentAction: [action: WorkspaceNavDocumentAction, link: WorkspaceNavLink];
  renameSubmit: [link: WorkspaceNavLink, title: string];
  renameCancel: [link: WorkspaceNavLink];
}>();

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
  props.kind === "document" ? documentDisplayTitle(props.link.label) : props.link.label,
);

const displayIcon = computed(() =>
  props.kind === "space" ? resolveSpaceIcon(props.link.icon) : FileTextIcon,
);

const renamePlaceholder = computed(() =>
  props.kind === "space" ? "Space name" : "Document name",
);

const renameButtonClass = cn(
  "gap-2 ring-2 ring-ring ring-offset-2 ring-offset-sidebar bg-",
);

function onSpaceAction(action: WorkspaceNavSpaceAction) {
  emit("spaceAction", action, props.link);
}

function onDocumentAction(action: WorkspaceNavDocumentAction) {
  emit("documentAction", action, props.link);
}

function onRenameSubmit(title: string) {
  emit("renameSubmit", props.link, title);
}

function confirmRename() {
  const trimmed = renameDraft.value.trim();
  if (props.kind === "space" && !trimmed) return;
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

        <SidebarMenuButton v-else as-child :is-active="link.isActive" :tooltip="displayLabel">
          <RouterLink :to="link.to">
            <component :is="displayIcon" />
            <span>{{ displayLabel }}</span>
          </RouterLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </ContextMenuTrigger>

    <ContextMenuContent>
      <template v-if="kind === 'space'">
        <ContextMenuItem @select="onSpaceAction('open')">Open</ContextMenuItem>
        <ContextMenuItem @select="onSpaceAction('rename')">Rename</ContextMenuItem>
        <ContextMenuItem @select="onSpaceAction('openSettings')">Space settings</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" @select="onSpaceAction('delete')">
          Delete
        </ContextMenuItem>
      </template>

      <template v-else>
        <ContextMenuItem @select="onDocumentAction('open')">Open</ContextMenuItem>
        <ContextMenuItem @select="onDocumentAction('rename')">Rename</ContextMenuItem>
        <ContextMenuItem @select="onDocumentAction('duplicate')">Duplicate</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" @select="onDocumentAction('delete')">
          Delete
        </ContextMenuItem>
      </template>
    </ContextMenuContent>
  </ContextMenu>
</template>
