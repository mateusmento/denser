/**
 * Toward later items in date order (append toward live edge).
 * Items stay in the parent list — this slice is pagination chrome only.
 */
export type NextPageState = {
  hasNext: boolean;
  loadingNext: boolean;
};

export function toNextPageState(input: NextPageState): NextPageState {
  return {
    hasNext: input.hasNext,
    loadingNext: input.loadingNext,
  };
}

export const emptyNextPageState = (): NextPageState => ({
  hasNext: false,
  loadingNext: false,
});
