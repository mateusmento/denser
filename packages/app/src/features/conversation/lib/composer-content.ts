import { emptyDoc, type JSONContent } from "@/modules/rich-text";

export function isEmptyComposerBody(body: JSONContent): boolean {
  return JSON.stringify(body) === JSON.stringify(emptyDoc());
}
