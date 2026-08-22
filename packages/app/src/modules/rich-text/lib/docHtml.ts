import { generateHTML, type JSONContent } from "@tiptap/core";
import { createRichTextDocumentExtensions } from "./documentExtensions";

const documentExtensions = createRichTextDocumentExtensions();

/** TipTap/HTML serialization of a stored rich-text doc (paste-compatible). */
export function docHtml(doc: JSONContent): string {
  return generateHTML(doc, documentExtensions);
}
