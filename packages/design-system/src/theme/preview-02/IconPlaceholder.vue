<script lang="ts" setup>
import type { Component } from "vue";
import {
  ActivityIcon,
  AlertCircleIcon,
  ArrowLeftRightIcon,
  ArrowRightIcon,
  AudioLinesIcon,
  BellIcon,
  CalendarIcon,
  CameraIcon,
  CarIcon,
  ChevronRightIcon,
  CircleHelpIcon,
  CirclePlusIcon,
  CloudIcon,
  CoffeeIcon,
  CreditCardIcon,
  FileBarChartIcon,
  FileTextIcon,
  GaugeIcon,
  GlobeIcon,
  ImageIcon,
  LayoutDashboardIcon,
  LockIcon,
  LockKeyholeIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PlusIcon,
  RefreshCwIcon,
  RepeatIcon,
  SearchIcon,
  ShieldIcon,
  ShoppingCartIcon,
  SunIcon,
  TargetIcon,
  ThermometerIcon,
  TimerIcon,
  TrendingUpIcon,
  TvIcon,
  UserIcon,
  Volume2Icon,
  WalletIcon,
  XIcon,
} from "@lucide/vue";
import { computed } from "vue";

const props = defineProps<{
  lucide?: string;
  tabler?: string;
  hugeicons?: string;
  phosphor?: string;
  remixicon?: string;
}>();

const ICONS: Record<string, Component> = {
  ActivityIcon,
  AlertCircleIcon,
  ArrowLeftRightIcon,
  ArrowRightIcon,
  AudioLinesIcon,
  BellIcon,
  CalendarIcon,
  CameraIcon,
  CarIcon,
  ChevronRightIcon,
  CircleHelpIcon,
  CirclePlusIcon,
  CloudIcon,
  CoffeeIcon,
  CreditCardIcon,
  FileBarChartIcon,
  FileTextIcon,
  GaugeIcon,
  GlobeIcon,
  ImageIcon,
  LayoutDashboardIcon,
  LockIcon,
  LockKeyholeIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PlusIcon,
  RefreshCwIcon,
  RepeatIcon,
  SearchIcon,
  ShieldIcon,
  ShoppingCartIcon,
  SunIcon,
  TargetIcon,
  ThermometerIcon,
  TimerIcon,
  TrendingUpIcon,
  TvIcon,
  UserIcon,
  Volume2Icon,
  WalletIcon,
  XIcon,
};

const icon = computed(() => (props.lucide ? (ICONS[props.lucide] ?? null) : null));
</script>

<template>
  <component :is="icon" v-if="icon" v-bind="$attrs" />
  <span v-else class="inline-block size-4 shrink-0 rounded-sm bg-muted" aria-hidden="true" />
</template>
