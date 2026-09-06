export type PatchWithVersionRetryInput<T> = {
  maxAttempts?: number;
  version: number;
  patch: (version: number) => Promise<T>;
  /** Return the server version to retry with, or null if this error is not a version conflict. */
  onConflict: (error: unknown) => number | null;
  onFailure?: (error: unknown) => void;
};

/**
 * Bounded retry for versioned PATCH commands (gallery rename/move, planning DnD).
 * Sync composables keep their own field-aware merge loops.
 */
export async function patchWithVersionRetry<T>({
  maxAttempts = 2,
  version: initialVersion,
  patch,
  onConflict,
  onFailure,
}: PatchWithVersionRetryInput<T>): Promise<T | null> {
  let version = initialVersion;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await patch(version);
    } catch (error) {
      const nextVersion = onConflict(error);
      if (nextVersion === null) {
        onFailure?.(error);
        return null;
      }
      version = nextVersion;
      if (attempt >= maxAttempts) {
        onFailure?.(error);
        return null;
      }
    }
  }

  return null;
}
