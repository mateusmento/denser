import type { SignInInput } from "@denser/contracts";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export function useAuthSync() {
  const queryClient = useQueryClient();
  const route = useRoute();
  const router = useRouter();

  const signInMutation = useMutation({
    mutationFn: (input: SignInInput) => apiClient.signIn(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.session() });
      const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/";
      await router.push(redirect);
    },
  });

  const signOutMutation = useMutation({
    mutationFn: () => apiClient.signOut(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.session() });
      await router.push({ name: "sign-in" });
    },
  });

  return {
    signIn: signInMutation.mutateAsync,
    signOut: signOutMutation.mutateAsync,
    isSigningIn: signInMutation.isPending,
    signInError: signInMutation.error,
  };
}
