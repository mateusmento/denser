import { unrefElement } from "@vueuse/core";
import type { ComponentPublicInstance, MaybeRefOrGetter } from "vue";

export function hostElement(
  el: MaybeRefOrGetter<ComponentPublicInstance | HTMLElement | null | undefined>,
): HTMLElement | undefined {
  const node = unrefElement(el);
  return node instanceof HTMLElement ? node : undefined;
}
