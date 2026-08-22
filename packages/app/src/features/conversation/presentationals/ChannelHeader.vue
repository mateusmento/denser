<script setup lang="ts">
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@denser/design-system";
import { BellIcon, EllipsisIcon, SettingsIcon, UsersIcon } from "@lucide/vue";
import type { ConversationChannelHeaderView } from "../types";

defineProps<{
  channel: ConversationChannelHeaderView;
}>();

const emit = defineEmits<{
  notifications: [];
  members: [];
  settings: [];
}>();
</script>

<template>
  <header class="flex h-full w-full items-center gap-3 px-1 sm:px-2" data-slot="channel-header">
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <h1 class="truncate text-base font-semibold">
          {{ channel.title }}
        </h1>
        <span v-if="channel.presenceLabel" class="hidden text-xs text-muted-foreground sm:inline">{{
          channel.presenceLabel
        }}</span>
      </div>
      <p v-if="channel.description" class="truncate text-xs text-muted-foreground">
        {{ channel.description }}
      </p>
    </div>

    <AvatarGroup class="-space-x-1.5">
      <Avatar v-for="member in channel.members" :key="member.id" size="sm" :title="member.name">
        <AvatarImage v-if="member.avatarUrl" :src="member.avatarUrl" :alt="member.name" />
        <AvatarFallback class="size-8 border text-[10px] font-medium">
          {{ member.initials }}
        </AvatarFallback>
      </Avatar>
      <AvatarGroupCount
        v-if="channel.extraMemberCount"
        class="size-8 border text-[10px] font-medium"
      >
        +{{ channel.extraMemberCount }}
      </AvatarGroupCount>
    </AvatarGroup>

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" size="icon" class="text-muted-foreground" aria-label="Channel menu">
          <EllipsisIcon class="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="min-w-44">
        <DropdownMenuItem @select="emit('notifications')">
          <BellIcon class="size-3.5" />
          Notifications
        </DropdownMenuItem>
        <DropdownMenuItem @select="emit('members')">
          <UsersIcon class="size-3.5" />
          Members
        </DropdownMenuItem>
        <DropdownMenuItem @select="emit('settings')">
          <SettingsIcon class="size-3.5" />
          Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </header>
</template>
