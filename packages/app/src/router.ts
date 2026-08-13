import { createRouter, createWebHistory } from "vue-router";
import AppLayout from "@/views/AppLayout.vue";
import ConversationView from "@/views/ConversationView.vue";
import DocumentView from "@/views/DocumentView.vue";
import HomeView from "@/views/HomeView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: AppLayout,
      children: [
        { path: "", redirect: { name: "document", params: { documentId: "onboarding" } } },
        {
          path: "documents/:documentId",
          name: "document",
          component: DocumentView,
          props: true,
        },
        {
          path: "conversations/:channelId",
          name: "conversation",
          component: ConversationView,
          props: true,
        },
      ],
    },
    { path: "/home", name: "home", component: HomeView },
  ],
});
