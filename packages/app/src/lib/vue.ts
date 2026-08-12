import { toRef, type Ref } from "vue";

/** Readable reactive cell — the composable must not assign `.value`. */
export type ReadonlyRef<T> = Readonly<Ref<T>>;

/** Parameter the composable only reads: readonly ref or getter. */
export type ReadonlyRefOrGetter<T> = ReadonlyRef<T> | (() => T);

/** Normalize a readonly param to a `ReadonlyRef` for the rest of the composable. */
export function toReadonlyRef<T>(value: ReadonlyRefOrGetter<T>): ReadonlyRef<T> {
  return toRef(value);
}
