import type { JSONContent } from "./types";

/** Story/demo document covering every standard mark and block. */
export const featureTourDoc: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Onboarding notes" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Select any sentence for the format menu. Type " },
        { type: "text", marks: [{ type: "code" }], text: "/" },
        { type: "text", text: " for blocks, or " },
        { type: "text", marks: [{ type: "code" }], text: "@" },
        { type: "text", text: " to mention " },
        { type: "mention", attrs: { id: "u-ava", label: "Ava Chen" } },
        { type: "text", text: "." },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Inline marks" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", marks: [{ type: "bold" }], text: "Bold" },
        { type: "text", text: ", " },
        { type: "text", marks: [{ type: "italic" }], text: "italic" },
        { type: "text", text: ", " },
        { type: "text", marks: [{ type: "strike" }], text: "strike" },
        { type: "text", text: ", " },
        { type: "text", marks: [{ type: "code" }], text: "inline code" },
        { type: "text", text: ", and a " },
        {
          type: "text",
          marks: [{ type: "link", attrs: { href: "https://example.com" } }],
          text: "link",
        },
        { type: "text", text: "." },
        { type: "hardBreak" },
        { type: "text", text: "Shift+Enter starts a new line in the same paragraph." },
      ],
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Lists and tasks" }],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Bullet item" }] },
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    { type: "paragraph", content: [{ type: "text", text: "Nested bullet" }] },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Second bullet" }] }],
        },
      ],
    },
    {
      type: "orderedList",
      content: [
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Numbered step" }] }],
        },
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Next step" }] }],
        },
      ],
    },
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Done — toggle in edit or preview" }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [{ type: "paragraph", content: [{ type: "text", text: "Still open" }] }],
        },
      ],
    },
    {
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Quoted aside. Nested quotes are allowed." }],
        },
        {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "A quieter nested quote." }],
            },
          ],
        },
      ],
    },
    { type: "horizontalRule" },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Code and media" }],
    },
    {
      type: "codeBlock",
      attrs: { language: "ts" },
      content: [
        {
          type: "text",
          text: "const ready = true;\nfunction greet(name: string) {\n  return `hi ${name}`;\n}\n",
        },
      ],
    },
    {
      type: "image",
      attrs: {
        src: "https://placehold.co/640x240/e4e4e7/71717a?text=Image",
        alt: "Placeholder image",
      },
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Ping " },
        { type: "mention", attrs: { id: "u-jon", label: "Jon Park" } },
        { type: "text", text: " when the page is ready." },
      ],
    },
  ],
};
