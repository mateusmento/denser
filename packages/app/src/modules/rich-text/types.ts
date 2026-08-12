import type { JSONContent } from "@tiptap/core";

export type { JSONContent };

export type MentionCandidate = {
  id: string;
  label: string;
};

export type SlashCommandItem = {
  id: string;
  label: string;
  aliases?: readonly string[];
  extra?: boolean;
};

export type SuggestionListItem =
  | { kind: "command"; id: string; label: string; aliases?: readonly string[] }
  | { kind: "mention"; id: string; label: string }
  | { kind: "separator"; id: string };

export function emptyDoc(): JSONContent {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

export function paragraphDoc(text: string): JSONContent {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: text ? [{ type: "text", text }] : undefined,
      },
    ],
  };
}
