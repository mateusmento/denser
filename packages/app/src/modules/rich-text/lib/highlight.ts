import { common, createLowlight } from "lowlight";
import type { JSONContent } from "@tiptap/core";
import { nodeText } from "./nodeText";

export const lowlight = createLowlight(common);

export const CODE_LANGUAGES = ["plaintext", ...lowlight.listLanguages()] as const;

export type HastLike = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: { className?: string | string[] };
  children?: HastLike[];
};

const TOKEN_BY_HLJS: Record<string, string> = {
  keyword: "rt-code-token-keyword",
  built_in: "rt-code-token-keyword",
  type: "rt-code-token-keyword",
  literal: "rt-code-token-keyword",
  meta: "rt-code-token-keyword",
  tag: "rt-code-token-keyword",
  "selector-tag": "rt-code-token-keyword",
  string: "rt-code-token-string",
  regexp: "rt-code-token-string",
  quote: "rt-code-token-string",
  number: "rt-code-token-number",
  comment: "rt-code-token-comment",
  doctag: "rt-code-token-comment",
  title: "rt-code-token-name",
  function: "rt-code-token-name",
  params: "rt-code-token-name",
  attr: "rt-code-token-name",
  attribute: "rt-code-token-name",
  property: "rt-code-token-name",
  variable: "rt-code-token-name",
  name: "rt-code-token-name",
  "selector-class": "rt-code-token-name",
  "selector-id": "rt-code-token-name",
};

export function languageClassName(properties?: HastLike["properties"]): string {
  const name = properties?.className;
  if (Array.isArray(name)) return name.join(" ");
  if (typeof name === "string") return name;
  return "";
}

function hljsNames(properties?: HastLike["properties"]): string[] {
  const raw = properties?.className;
  const parts = Array.isArray(raw) ? raw : raw ? raw.split(/\s+/) : [];
  return parts.map((part) => part.replace(/^hljs-/, "").replace(/_+$/, "")).filter(Boolean);
}

function tokenClassName(properties?: HastLike["properties"]): string | undefined {
  const classes = new Set<string>();
  for (const name of hljsNames(properties)) {
    const mapped = TOKEN_BY_HLJS[name] ?? TOKEN_BY_HLJS[name.split(".")[0] ?? ""];
    if (mapped) classes.add(mapped);
  }
  if (classes.size === 0) return undefined;
  return [...classes].join(" ");
}

function mapTokenNode(node: HastLike): HastLike {
  if (node.type !== "element") return node;
  const className = tokenClassName(node.properties);
  return {
    ...node,
    properties: className ? { className } : undefined,
    children: node.children?.map(mapTokenNode),
  };
}

export function highlightCode(language: string | undefined, code: string): HastLike[] {
  if (!code) return [];
  const lang =
    language && language !== "plaintext" && lowlight.registered(language) ? language : undefined;
  if (!lang) return [{ type: "text", value: code }];
  const tree = lowlight.highlight(lang, code);
  return ((tree.children ?? []) as HastLike[]).map(mapTokenNode);
}

export function codeBlockSource(node: JSONContent): { language: string; code: string } {
  const language = typeof node.attrs?.language === "string" ? node.attrs.language : "plaintext";
  return { language, code: nodeText(node) };
}
