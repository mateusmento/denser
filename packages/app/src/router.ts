import { createRouter, createWebHistory } from "vue-router";
import { apiClient } from "@/lib/api";
import AppLayout from "@/views/AppLayout.vue";
import ConversationView from "@/views/ConversationView.vue";
import DocumentView from "@/views/DocumentView.vue";
import HomeView from "@/views/HomeView.vue";
import SignInView from "@/views/SignInView.vue";
import SpaceView from "@/views/SpaceView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/sign-in", name: "sign-in", component: SignInView },
    {
      path: "/",
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { path: "", name: "home", component: HomeView },
        {
          path: "documents/:documentId",
          name: "document",
          component: DocumentView,
          props: true,
        },
        {
          path: "spaces/:spaceId",
          name: "space",
          component: SpaceView,
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
  ],
});

router.beforeEach(async (to) => {
  if (to.meta.requiresAuth !== true) return true;

  try {
    const session = await apiClient.session();
    if (session.user?.id) return true;
  } catch {
    // fall through to sign-in
  }

  return {
    name: "sign-in",
    query: to.fullPath !== "/" ? { redirect: to.fullPath } : undefined,
  };
});

router.beforeEach(async (to) => {
  if (to.name !== "sign-in") return true;
  try {
    const session = await apiClient.session();
    if (session.user?.id) {
      const redirect = typeof to.query.redirect === "string" ? to.query.redirect : "/";
      return redirect;
    }
  } catch {
    return true;
  }
  return true;
});
