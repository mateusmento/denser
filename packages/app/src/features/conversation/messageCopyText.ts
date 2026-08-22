import type { JSONContent } from "@tiptap/core";
import { docHtml, docPlainText } from "@/modules/rich-text";
import type { ConversationMessageView } from "./types";

export type MessageClipboardPayload = {
  plain: string;
  html: string;
};

/** Prefer an in-message selection; otherwise the full message body (plain + HTML). */
export function resolveMessageClipboardPayload(
  message: ConversationMessageView,
): MessageClipboardPayload {
  const selection = window.getSelection();
  if (selection && !selection.isCollapsed) {
    const selected = selection.toString();
    if (selected && selectionIntersectsMessage(selection, message.id)) {
      const html = selectionHtml(selection);
      if (html) {
        return { plain: selected, html };
      }
    }
  }
  return messageBodyClipboard(message.body);
}

export async function writeRichClipboard(payload: MessageClipboardPayload): Promise<void> {
  if (!payload.plain && !payload.html) return;

  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    const items: Record<string, Blob> = {
      "text/plain": new Blob([payload.plain], { type: "text/plain" }),
      "text/html": new Blob([payload.html], { type: "text/html" }),
    };
    await navigator.clipboard.write([new ClipboardItem(items)]);
    return;
  }

  await navigator.clipboard.writeText(payload.plain);
}

function messageBodyClipboard(body: JSONContent): MessageClipboardPayload {
  return {
    plain: docPlainText(body),
    html: docHtml(body),
  };
}

function selectionHtml(selection: Selection): string | null {
  if (selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  const fragment = range.cloneContents();
  const container = document.createElement("div");
  container.appendChild(fragment);
  normalizePreviewMarkup(container);
  const html = container.innerHTML.trim();
  return html.length > 0 ? html : null;
}

/** Map RichTextPreview class markup onto tags TipTap’s schema parses. */
function normalizePreviewMarkup(root: ParentNode): void {
  for (const el of [...root.querySelectorAll(".rt-code-block")]) {
    const body = el.querySelector(".rt-code-block-body pre code") ?? el.querySelector("code");
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = body?.textContent ?? el.textContent ?? "";
    pre.appendChild(code);
    el.replaceWith(pre);
  }

  replaceClassWithTag(root, "rt-bold", "strong");
  replaceClassWithTag(root, "rt-italic", "em");
  replaceClassWithTag(root, "rt-strike", "s");
  replaceClassWithTag(root, "rt-inline-code", "code");

  for (const mention of [...root.querySelectorAll(".rt-mention")]) {
    if (!(mention instanceof HTMLElement)) continue;
    const label = mention.textContent?.trim() ?? "";
    mention.setAttribute("data-type", "mention");
    mention.setAttribute("data-label", label.replace(/^@/, ""));
  }
}

function replaceClassWithTag(root: ParentNode, className: string, tagName: string): void {
  for (const el of [...root.querySelectorAll(`.${className}`)]) {
    if (!(el instanceof HTMLElement)) continue;
    const next = document.createElement(tagName);
    next.append(...el.childNodes);
    el.replaceWith(next);
  }
}

function selectionIntersectsMessage(selection: Selection, messageId: string): boolean {
  const root = messageRoot(messageId);
  if (!root) return false;
  const { anchorNode, focusNode } = selection;
  return Boolean(
    (anchorNode && root.contains(anchorNode)) || (focusNode && root.contains(focusNode)),
  );
}

function messageRoot(messageId: string): Element | null {
  return document.querySelector(`[data-message-id="${CSS.escape(messageId)}"]`);
}
