import type { JSONContent } from "@/modules/rich-text";

const PREVIEW_CAP = 160;

type TipTapNode = {
  type?: string;
  text?: string;
  content?: TipTapNode[];
};

function collectText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const typed = node as TipTapNode;
  if (typed.type === "image") return "";
  if (typeof typed.text === "string") return typed.text;
  if (!Array.isArray(typed.content)) return "";
  return typed.content.map(collectText).join("");
}

export function extractBodyPreview(body: unknown, fallback = "Empty draft"): string {
  const text = collectText(body).replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.length > PREVIEW_CAP ? `${text.slice(0, PREVIEW_CAP)}…` : text;
}

export function contextSuffix(contextLabel: "channel" | "thread"): string {
  return contextLabel === "thread" ? "Thread" : "Channel";
}

export function formatOutboxDestinationLine(
  conversationLabel: string,
  contextLabel: "channel" | "thread",
): string {
  return `${conversationLabel} · ${contextSuffix(contextLabel)}`;
}

export function formatScheduledOutboxHeadline(input: {
  nextRunWallTimeLabel: string;
  conversationLabel: string;
  contextLabel: "channel" | "thread";
  recurrenceLabel?: string;
}): string {
  const parts = [
    input.nextRunWallTimeLabel,
    input.conversationLabel,
    contextSuffix(input.contextLabel),
  ];
  if (input.recurrenceLabel && input.recurrenceLabel !== "Once") {
    parts.push(input.recurrenceLabel);
  }
  return parts.join(" · ");
}
