<script setup lang="ts">
import { Button, cn } from "@denser/design-system";
import { UserPlusIcon } from "@lucide/vue";
import type { ConversationIntroView } from "../types";
import type { HTMLAttributes } from "vue";

const props = defineProps<{
  intro: ConversationIntroView;
  class?: HTMLAttributes['class'];
}>();

const emit = defineEmits<{
  editDescription: [];
  addPeople: [];
}>();
</script>

<template>
  <section :class="cn('flex flex-col gap-4 px-2 pb-6 pt-6 sm:px-3', props.class)" data-slot="conversation-intro">
    <div class="flex flex-col gap-2">
      <h2 class="text-3xl font-semibold tracking-tight">#{{ intro.title }}</h2>
      <p class="max-w-prose text-sm text-muted-foreground">
        {{ intro.body }}
        <button
          v-if="intro.editDescriptionLabel"
          type="button"
          class="ms-1 text-primary hover:underline"
          @click="emit('editDescription')"
        >
          {{ intro.editDescriptionLabel }}
        </button>
      </p>
    </div>
    <div v-if="intro.addPeopleLabel">
      <Button variant="outline" size="sm" @click="emit('addPeople')">
        <UserPlusIcon class="size-3.5" />
        {{ intro.addPeopleLabel }}
      </Button>
    </div>
  </section>
</template>
