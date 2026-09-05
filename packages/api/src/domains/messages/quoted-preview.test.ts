import assert from "node:assert/strict";
import { test } from "node:test";
import type { MessageId, UserId } from "@denser/contracts";
import {
  buildQuotedPreview,
  stripImages,
  textContent,
} from "./quoted-preview.js";

const MSG = "00000000-0000-4000-8000-000000000001" as MessageId;
const AUTHOR = "00000000-0000-4000-8000-00000000000a" as UserId;

function doc(...nodes: unknown[]): unknown {
  return { type: "doc", content: nodes };
}

function paragraph(text: string): unknown {
  return { type: "paragraph", content: [{ type: "text", text }] };
}

function image(src: string): unknown {
  return { type: "image", attrs: { src } };
}

test("stripImages removes image nodes and preserves text", () => {
  const body = doc(paragraph("hello"), image("https://example.com/a.png"), paragraph("world"));
  const stripped = stripImages(body) as { content: unknown[] };
  assert.equal(stripped.content.length, 2);
  assert.equal(textContent(stripped), "helloworld");
});

test("buildQuotedPreview strips images from body", () => {
  const preview = buildQuotedPreview({
    id: MSG,
    authorId: AUTHOR,
    authorName: "Alice",
    body: doc(paragraph("see this"), image("https://example.com/x.png")),
  });
  const body = preview.body as { content: unknown[] };
  assert.equal(body.content.length, 1);
  assert.equal(preview.displayContent, "see this");
  assert.equal(preview.sizeCapped, undefined);
});

test("buildQuotedPreview caps text at 1000 chars and sets sizeCapped", () => {
  const longText = "x".repeat(1_500);
  const preview = buildQuotedPreview({
    id: MSG,
    authorId: AUTHOR,
    authorName: "Alice",
    body: doc(paragraph(longText)),
  });
  assert.equal(textContent(preview.body).length, 1_000);
  assert.equal(preview.sizeCapped, true);
});

test("buildQuotedPreview caps displayContent at 160 chars", () => {
  const text = "y".repeat(200);
  const preview = buildQuotedPreview({
    id: MSG,
    authorId: AUTHOR,
    authorName: "Alice",
    body: doc(paragraph(text)),
  });
  assert.equal(preview.displayContent.length, 160);
  assert.equal(preview.displayContent, "y".repeat(160));
});

test("buildQuotedPreview sets sizeCapped when JSON exceeds 8 KiB", () => {
  const heavyAttrs = "z".repeat(9_000);
  const preview = buildQuotedPreview({
    id: MSG,
    authorId: AUTHOR,
    authorName: "Alice",
    body: {
      type: "doc",
      content: [
        {
          type: "custom",
          attrs: { blob: heavyAttrs },
          content: [{ type: "text", text: "short" }],
        },
      ],
    },
  });
  assert.equal(preview.sizeCapped, true);
});

test("buildQuotedPreview includes hasAttachment when flagged", () => {
  const preview = buildQuotedPreview({
    id: MSG,
    authorId: AUTHOR,
    authorName: "Alice",
    body: doc(paragraph("files")),
    hasAttachment: true,
  });
  assert.equal(preview.hasAttachment, true);
});

test("buildQuotedPreview includes author avatar when provided", () => {
  const preview = buildQuotedPreview({
    id: MSG,
    authorId: AUTHOR,
    authorName: "Alice",
    authorAvatarUrl: "https://example.com/avatar.png",
    body: doc(paragraph("hi")),
  });
  assert.equal(preview.author.avatarUrl, "https://example.com/avatar.png");
});
