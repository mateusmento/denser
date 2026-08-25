import { shallowRef } from "vue";
import type { ConfirmOptions, DialogRequest, PromptOptions } from "./types";

export const activeDialog = shallowRef<DialogRequest | null>(null);

const queue: DialogRequest[] = [];

function showNext(): void {
  if (activeDialog.value || queue.length === 0) return;
  activeDialog.value = queue.shift() ?? null;
}

export function settleDialog<T extends string | null | boolean>(result: T): void {
  const current = activeDialog.value;
  if (!current) return;

  if (current.kind === "prompt") {
    current.resolve(result as string | null);
  } else {
    current.resolve(result as boolean);
  }

  activeDialog.value = null;
  showNext();
}

function enqueue(request: DialogRequest): void {
  queue.push(request);
  showNext();
}

export function prompt(message: string, defaultValue?: string): Promise<string | null>;
export function prompt(options: PromptOptions): Promise<string | null>;
export function prompt(
  messageOrOptions: string | PromptOptions,
  defaultValue?: string,
): Promise<string | null> {
  const options: PromptOptions =
    typeof messageOrOptions === "string"
      ? { title: messageOrOptions, defaultValue }
      : messageOrOptions;

  return new Promise((resolve) => {
    enqueue({ kind: "prompt", options, resolve });
  });
}

export function confirm(message: string, description?: string): Promise<boolean>;
export function confirm(options: ConfirmOptions): Promise<boolean>;
export function confirm(
  messageOrOptions: string | ConfirmOptions,
  description?: string,
): Promise<boolean> {
  const options: ConfirmOptions =
    typeof messageOrOptions === "string"
      ? { title: messageOrOptions, description }
      : messageOrOptions;

  return new Promise((resolve) => {
    enqueue({ kind: "confirm", options, resolve });
  });
}
