<script setup lang="ts">
import type { PropertyType } from "./types";
import {
  CalendarIcon,
  HashIcon,
  LinkIcon,
  ListFilterIcon,
  TagsIcon,
  TypeIcon,
  UserIcon,
} from "@lucide/vue";
import type { Component } from "vue";
import { computed } from "vue";

const props = defineProps<{
  type: PropertyType;
  class?: string;
}>();

const iconMap: Record<PropertyType, Component> = {
  text: TypeIcon,
  number: HashIcon,
  select: ListFilterIcon,
  multi_select: TagsIcon,
  date: CalendarIcon,
  person: UserIcon,
  relation: LinkIcon,
};

const iconComponent = computed(() => iconMap[props.type] ?? TypeIcon);
</script>

<template>
  <component :is="iconComponent" :class="props.class ?? 'size-4 shrink-0 text-muted-foreground'" />
</template>
