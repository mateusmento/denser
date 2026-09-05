/**
 * Toward earlier items in date order (prepend history).
 * Items stay in the parent list — this slice is pagination chrome only.
 */
export type PreviousPageState = {
  hasPrevious: boolean;
  loadingPrevious: boolean;
};

export function toPreviousPageState(input: PreviousPageState): PreviousPageState {
  return {
    hasPrevious: input.hasPrevious,
    loadingPrevious: input.loadingPrevious,
  };
}

export const emptyPreviousPageState = (): PreviousPageState => ({
  hasPrevious: false,
  loadingPrevious: false,
});
