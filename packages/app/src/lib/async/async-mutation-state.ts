/** Command in flight (send message, upload, vote). */
export type AsyncMutationState = {
  busy: boolean;
  error?: string | null;
};

export function toAsyncMutationState(input: AsyncMutationState): AsyncMutationState {
  return {
    busy: input.busy,
    error: input.error ?? null,
  };
}

export const idleAsyncMutationState = (): AsyncMutationState => ({
  busy: false,
  error: null,
});
