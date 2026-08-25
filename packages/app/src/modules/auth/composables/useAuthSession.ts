import type { SessionUser } from "@denser/contracts";
import { computed, inject, provide, type ComputedRef, type InjectionKey } from "vue";

export type AuthSessionPort = {
  user: ComputedRef<SessionUser | null>;
  isAuthenticated: ComputedRef<boolean>;
  isLoading: ComputedRef<boolean>;
};

const AUTH_SESSION_KEY = Symbol("auth-session") as InjectionKey<AuthSessionPort>;

const storybookPort: AuthSessionPort = {
  user: computed(() => ({
    id: "storybook-user",
    name: "Storybook User",
    email: "storybook@local.dev",
  })),
  isAuthenticated: computed(() => true),
  isLoading: computed(() => false),
};

export function provideAuthSession(port: AuthSessionPort): void {
  provide(AUTH_SESSION_KEY, port);
}

export function useAuthSession(): AuthSessionPort {
  const port = inject<AuthSessionPort>(AUTH_SESSION_KEY);
  return port ?? storybookPort;
}
