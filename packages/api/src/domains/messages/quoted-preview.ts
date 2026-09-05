import type {
  MessageId,
  QuotedPreviewDto,
  UserId,
} from "@denser/contracts";

/**
 * Quoted-preview builder (join-on-read DTO).
 *
 * Produces a `QuotedPreviewDto` from a quoted message's raw row: strips image
 * nodes from the TipTap body, caps text and JSON size, and derives a plain-text
 * `displayContent`. Pure module — no persistence or HTTP here.
 *
 * Caps (see docs/CONVERSATIONS.md "QuotedPreview"): images stripped first, then
 * ≤1000 text-node characters and ≤8 KiB UTF-8 JSON, then `displayContent` ≤160.
 */

const TEXT_CAP = 1_000;
const JSON_CAP = 8 * 1024;
const DISPLAY_CAP = 160;

type TipTapNode = {
  type?: string;
  text?: string;
  content?: TipTapNode[];
  attrs?: Record<string, unknown>;
};

export type QuotedPreviewInput = {
  id: MessageId;
  authorId: UserId;
  authorName: string;
  authorAvatarUrl?: string | null;
  body: unknown;
  hasAttachment?: boolean;
};

export function buildQuotedPreview(input: QuotedPreviewInput): QuotedPreviewDto {
  const stripped = stripImages(input.body);
  const fullText = textContent(stripped);

  const capped = capBody(stripped, TEXT_CAP);
  const textReduced = capped.used < fullText.length;
  const body = textReduced ? capped.node : stripped;
  let sizeCapped = textReduced;

  if (Buffer.byteLength(JSON.stringify(body), "utf8") > JSON_CAP) {
    sizeCapped = true;
  }

  const displayContent = textContent(body).slice(0, DISPLAY_CAP);

  const dto: QuotedPreviewDto = {
    id: input.id,
    author: {
      id: input.authorId,
      name: input.authorName,
      ...(input.authorAvatarUrl != null ? { avatarUrl: input.authorAvatarUrl } : {}),
    },
    body,
    displayContent,
  };
  if (sizeCapped) dto.sizeCapped = true;
  if (input.hasAttachment) dto.hasAttachment = true;
  return dto;
}

/** Deep-copy the TipTap tree with `image` nodes removed. */
export function stripImages(body: unknown): unknown {
  if (Array.isArray(body)) {
    const nodes: unknown[] = [];
    for (const node of body) {
      const result = stripImages(node);
      if (result !== undefined) nodes.push(result);
    }
    return nodes;
  }
  if (typeof body !== "object" || body === null) return body;
  const record = body as TipTapNode;
  if (record.type === "image") return undefined;
  if (record.type === "text") return record;
  const copied: TipTapNode = { ...record };
  if (Array.isArray(record.content)) {
    const children: TipTapNode[] = [];
    for (const child of record.content) {
      const stripped = stripImages(child);
      if (stripped !== undefined) children.push(stripped as TipTapNode);
    }
    copied.content = children;
  }
  return copied;
}

/** Concatenated text of all text nodes, depth-first. */
export function textContent(body: unknown): string {
  if (typeof body !== "object" || body === null) return "";
  const record = body as TipTapNode;
  if (record.type === "text" && typeof record.text === "string") return record.text;
  if (!Array.isArray(record.content)) return "";
  return record.content.map((child) => textContent(child)).join("");
}

function capBody(body: unknown, budget: number): { node: unknown; used: number } {
  if (budget <= 0) return { node: undefined, used: 0 };
  if (typeof body !== "object" || body === null) return { node: body, used: 0 };
  const record = body as TipTapNode;

  if (record.type === "text") {
    const text = typeof record.text === "string" ? record.text : "";
    const kept = text.slice(0, budget);
    return { node: { ...record, text: kept }, used: kept.length };
  }

  if (Array.isArray(record.content)) {
    const children: TipTapNode[] = [];
    let remaining = budget;
    for (const child of record.content) {
      if (remaining <= 0) break;
      const { node, used } = capBody(child, remaining);
      if (node !== undefined) children.push(node as TipTapNode);
      remaining -= used;
    }
    return { node: { ...record, content: children }, used: budget - remaining };
  }

  return { node: record, used: 0 };
}
