/** Single fetch with no pages (detail panes, one-shot reads). */
export type AsyncDataView<T> = {
  data: T | null;
  loading: boolean;
  error?: string | null;
};

export function toAsyncDataView<T>(input: AsyncDataView<T>): AsyncDataView<T> {
  return {
    data: input.data ?? null,
    loading: input.loading,
    error: input.error ?? null,
  };
}

export const emptyAsyncDataView = <T>(): AsyncDataView<T> => ({
  data: null,
  loading: false,
  error: null,
});
