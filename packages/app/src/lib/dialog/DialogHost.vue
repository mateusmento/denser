<script setup lang="ts">
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@denser/design-system";
import { computed, ref, watch } from "vue";
import { activeDialog, settleDialog } from "./store";

const open = computed({
  get: () => activeDialog.value != null,
  set: (nextOpen) => {
    if (!nextOpen) dismiss();
  },
});

const inputValue = ref("");

watch(
  activeDialog,
  (dialog) => {
    if (dialog?.kind === "prompt") {
      inputValue.value = dialog.options.defaultValue ?? "";
    }
  },
  { immediate: true },
);

function dismiss(): void {
  const dialog = activeDialog.value;
  if (!dialog) return;
  settleDialog(dialog.kind === "prompt" ? null : false);
}

function onPromptSubmit(): void {
  if (activeDialog.value?.kind !== "prompt") return;
  settleDialog(inputValue.value);
}

function onConfirmSubmit(): void {
  if (activeDialog.value?.kind !== "confirm") return;
  settleDialog(true);
}

function onPromptKeydown(event: KeyboardEvent): void {
  if (event.key === "Enter") {
    event.preventDefault();
    onPromptSubmit();
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent v-if="activeDialog" :show-close-button="false">
      <template v-if="activeDialog.kind === 'prompt'">
        <DialogHeader>
          <DialogTitle>{{ activeDialog.options.title }}</DialogTitle>
          <DialogDescription v-if="activeDialog.options.description">
            {{ activeDialog.options.description }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-2">
          <Label v-if="activeDialog.options.label" for="dialog-prompt-input">
            {{ activeDialog.options.label }}
          </Label>
          <Input
            id="dialog-prompt-input"
            v-model="inputValue"
            autofocus
            :placeholder="activeDialog.options.placeholder"
            @keydown="onPromptKeydown"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" @click="dismiss">
            {{ activeDialog.options.cancelLabel ?? "Cancel" }}
          </Button>
          <Button @click="onPromptSubmit">
            {{ activeDialog.options.confirmLabel ?? "OK" }}
          </Button>
        </DialogFooter>
      </template>

      <template v-else>
        <DialogHeader>
          <DialogTitle>{{ activeDialog.options.title }}</DialogTitle>
          <DialogDescription v-if="activeDialog.options.description">
            {{ activeDialog.options.description }}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" @click="dismiss">
            {{ activeDialog.options.cancelLabel ?? "Cancel" }}
          </Button>
          <Button
            :variant="activeDialog.options.destructive ? 'destructive' : 'default'"
            @click="onConfirmSubmit"
          >
            {{ activeDialog.options.confirmLabel ?? "Confirm" }}
          </Button>
        </DialogFooter>
      </template>
    </DialogContent>
  </Dialog>
</template>
