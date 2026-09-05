<script setup lang="ts">
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label } from "@denser/design-system";
import { computed, ref, watch } from "vue";

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{
  submit: [payload: { question: string; options: string[] }];
}>();

const question = ref("");
const optionA = ref("");
const optionB = ref("");
const optionC = ref("");

watch(open, (value) => {
  if (!value) return;
  question.value = "";
  optionA.value = "";
  optionB.value = "";
  optionC.value = "";
});

const canSubmit = computed(() => {
  const q = question.value.trim();
  const options = [optionA.value, optionB.value, optionC.value].map((v) => v.trim()).filter(Boolean);
  return q.length > 0 && options.length >= 2;
});

function onSubmit() {
  if (!canSubmit.value) return;
  const options = [optionA.value, optionB.value, optionC.value].map((v) => v.trim()).filter(Boolean);
  emit("submit", { question: question.value.trim(), options });
  open.value = false;
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create poll</DialogTitle>
      </DialogHeader>
      <div class="flex flex-col gap-3 py-2">
        <div class="flex flex-col gap-1.5">
          <Label for="poll-question">Question</Label>
          <Input id="poll-question" v-model="question" placeholder="Ask something…" />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>Options</Label>
          <Input v-model="optionA" placeholder="Option 1" />
          <Input v-model="optionB" placeholder="Option 2" />
          <Input v-model="optionC" placeholder="Option 3 (optional)" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" @click="open = false">Cancel</Button>
        <Button :disabled="!canSubmit" @click="onSubmit">Add poll</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
