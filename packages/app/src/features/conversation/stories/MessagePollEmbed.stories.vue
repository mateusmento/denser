<script setup lang="ts">
import MessagePollEmbed from "../presentationals/MessagePollEmbed.vue";

const poll = {
  id: "poll-1",
  question: "Where should we eat?",
  totalVotes: 5,
  votedOptionId: "opt-1",
  options: [
    { id: "opt-1", label: "Pizza", voteCount: 3 },
    { id: "opt-2", label: "Sushi", voteCount: 2 },
  ],
};
</script>

<template>
  <Story title="Conversation/MessagePollEmbed">
    <Variant title="With votes">
      <MessagePollEmbed :poll="poll" />
    </Variant>
  </Story>
</template>
