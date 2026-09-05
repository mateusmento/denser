import type { TipTapDoc } from "@denser/contracts";

export function seedParagraph(text: string): TipTapDoc {
  return {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  };
}
