import assert from "node:assert/strict";
import { test } from "node:test";
import type { AttachmentId, MessageDto, UserId } from "@denser/contracts";
import { toConversationMessageView } from "./toConversationMessageView.js";

const AUTHOR = "00000000-0000-4000-8000-00000000000a" as UserId;
const ATTACHMENT = "00000000-0000-4000-8000-0000000000a1" as AttachmentId;

function messageDto(overrides: Partial<MessageDto> = {}): MessageDto {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    conversationId: "00000000-0000-4000-8000-000000000002",
    threadId: null,
    quotesId: null,
    authorId: AUTHOR,
    body: { type: "doc", content: [] },
    clientId: null,
    createdAt: "2026-09-05T12:00:00.000Z",
    editedAt: null,
    deletedAt: null,
    attachmentIds: [],
    ...overrides,
  };
}

test("toConversationMessageView maps non-inline file attachments", () => {
  const view = toConversationMessageView(
    messageDto({
      attachmentIds: [ATTACHMENT],
      attachments: [
        {
          id: ATTACHMENT,
          rootSpaceId: "00000000-0000-4000-8000-000000000003",
          uploadedBy: AUTHOR,
          mimeType: "application/pdf",
          originalFilename: "spec.pdf",
          byteSize: 42,
          url: "https://example.com/spec.pdf",
          createdAt: "2026-09-05T12:00:00.000Z",
        },
      ],
    }),
    null,
  );

  assert.deepEqual(view.attachments, [
    {
      id: ATTACHMENT,
      name: "spec.pdf",
      mimeType: "application/pdf",
      url: "https://example.com/spec.pdf",
      byteSize: 42,
      kind: "file",
    },
  ]);
});

test("toConversationMessageView omits inline image attachments from tiles", () => {
  const view = toConversationMessageView(
    messageDto({
      body: {
        type: "doc",
        content: [
          {
            type: "image",
            attrs: { src: "https://example.com/photo.png", attachmentId: ATTACHMENT },
          },
        ],
      },
      attachmentIds: [ATTACHMENT],
      attachments: [
        {
          id: ATTACHMENT,
          rootSpaceId: "00000000-0000-4000-8000-000000000003",
          uploadedBy: AUTHOR,
          mimeType: "image/png",
          originalFilename: "photo.png",
          byteSize: 42,
          url: "https://example.com/photo.png",
          createdAt: "2026-09-05T12:00:00.000Z",
        },
      ],
    }),
    null,
  );

  assert.deepEqual(view.attachments, []);
});

test("toConversationMessageView classifies image attachments as media", () => {
  const view = toConversationMessageView(
    messageDto({
      attachmentIds: [ATTACHMENT],
      attachments: [
        {
          id: ATTACHMENT,
          rootSpaceId: "00000000-0000-4000-8000-000000000003",
          uploadedBy: AUTHOR,
          mimeType: "image/webp",
          originalFilename: "screenshot.webp",
          byteSize: 2048,
          url: "https://example.com/screenshot.webp",
          createdAt: "2026-09-05T12:00:00.000Z",
        },
      ],
    }),
    null,
  );

  assert.equal(view.attachments?.[0]?.kind, "media");
});


test("toConversationMessageView maps reactions", () => {
  const view = toConversationMessageView(
    messageDto({
      reactions: [
        { emoji: "👍", count: 2, reactedByMe: true },
        { emoji: "🎉", count: 1, reactedByMe: false },
      ],
    }),
    null,
  );
  assert.deepEqual(view.reactions, [
    { emoji: "👍", count: 2, mine: true },
    { emoji: "🎉", count: 1, mine: false },
  ]);
});
