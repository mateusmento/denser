<script setup lang="ts">
import { Tabs, TabsList, TabsTrigger } from "@denser/design-system";
import type { ConversationPane } from "../types";

const pane = defineModel<ConversationPane>({ required: true });
</script>

<template>
  <Tabs v-model="pane" class="w-full px-1 sm:px-2" data-slot="conversation-pane-tabs">
    <TabsList variant="line" class="h-9 w-full justify-start bg-transparent p-0">
      <TabsTrigger value="messages" class="px-3">Messages</TabsTrigger>
      <TabsTrigger value="schedules" class="px-3">Scheduled</TabsTrigger>
    </TabsList>
  </Tabs>
</template>
