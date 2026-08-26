<script setup lang="ts">
import { cn } from "@/lib/utils";
import { computed, nextTick, onMounted, ref, watch } from "vue";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    as?: string;
    placeholder?: string;
    /** If true, newlines are stripped and Enter submits. */
    singleLine?: boolean;
    /** If true, stops propagation for key events so parent shortcuts don't hijack editing. */
    stopKeyPropagation?: boolean;
    /** Select all text when entering edit mode. */
    selectOnFocus?: boolean;
    class?: string;
  }>(),
  {
    as: "div",
    placeholder: "",
    singleLine: true,
    stopKeyPropagation: true,
    selectOnFocus: true,
  },
);

const modelValue = defineModel<string>({ default: "" });
const editable = defineModel<boolean>("editable", { default: false });

const emit = defineEmits<{
  submit: [value: string];
  cancel: [];
}>();

const el = ref<HTMLElement | null>(null);
const snapshot = ref<string>("");
const isDomReady = ref(true);

function syncDomFromModel() {
  if (!el.value) return;
  const text = modelValue.value ?? "";
  if (el.value.textContent !== text) el.value.textContent = text;
}

function selectAll() {
  if (!el.value) return;
  if (typeof document === "undefined" || typeof window === "undefined") return;
  try {
    const range = document.createRange();
    range.selectNodeContents(el.value);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  } catch {
    // ignore selection errors
  }
}

async function focusEditor() {
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  // Context menus restore focus on close — defer until after that handoff.
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  if (!el.value || !editable.value) return;
  el.value.focus({ preventScroll: true });
  if (props.selectOnFocus) selectAll();
}

async function enterEditMode() {
  snapshot.value = modelValue.value ?? "";
  isDomReady.value = false;
  await nextTick();
  syncDomFromModel();
  isDomReady.value = true;
  await focusEditor();
}

function exitEditMode() {
  syncDomFromModel();
  isDomReady.value = true;
}

watch(
  editable,
  (isEditing) => {
    if (isEditing) void enterEditMode();
    else exitEditMode();
  },
  { immediate: true },
);

watch(
  modelValue,
  () => {
    if (editable.value) return;
    syncDomFromModel();
  },
  { immediate: true },
);

onMounted(() => {
  if (!editable.value) syncDomFromModel();
});

function normalizeText(text: string) {
  if (!props.singleLine) return text;
  return text.replace(/\n/g, "");
}

function onInput(e: Event) {
  const target = e.target as HTMLElement | null;
  if (!target) return;
  modelValue.value = normalizeText(target.innerText ?? "");
}

function onKeydown(e: KeyboardEvent) {
  if (props.stopKeyPropagation) e.stopPropagation();

  if (props.singleLine && e.key === "Enter") {
    e.preventDefault();
    emit("submit", (modelValue.value ?? "").trim());
    editable.value = false;
    return;
  }

  if (e.key === "Escape") {
    e.preventDefault();
    modelValue.value = snapshot.value;
    emit("cancel");
    editable.value = false;
  }
}

function stop(e: KeyboardEvent) {
  if (props.stopKeyPropagation) e.stopPropagation();
}

defineExpose({ focus: enterEditMode });

const placeholderAttr = computed(() => props.placeholder ?? "");
</script>

<template>
  <component
    :is="as"
    ref="el"
    v-bind="$attrs"
    :contenteditable="editable"
    role="textbox"
    :aria-label="placeholderAttr || 'Editable text'"
    :data-placeholder="placeholderAttr"
    :class="
      cn(
        'inline-block bg-transparent outline-none whitespace-nowrap',
        editable && !isDomReady && 'invisible',
        editable &&
          'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none',
        props.class,
      )
    "
    @input="onInput"
    @keydown="onKeydown"
    @keyup="stop"
    @keypress="stop"
  />
</template>
