/** Forward-only paginated list (search, scroll-down load-more). */
export type PaginatedListView<T> = {
  items: readonly T[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error?: string | null;
};

export function toPaginatedListView<T>(input: PaginatedListView<T>): PaginatedListView<T> {
  return {
    items: input.items,
    loading: input.loading,
    loadingMore: input.loadingMore,
    hasMore: input.hasMore,
    error: input.error ?? null,
  };
}

export const emptyPaginatedListView = <T>(): PaginatedListView<T> => ({
  items: [],
  loading: false,
  loadingMore: false,
  hasMore: false,
  error: null,
});
