import type { MessageId } from "@denser/contracts";

/** Opaque cursor encoding the stable sort key `(created_at, id)`. */
export type MessageCursor = {
  createdAt: Date;
  id: MessageId;
};

export function encodeCursor(cursor: MessageCursor): string {
  return JSON.stringify([cursor.createdAt.toISOString(), cursor.id]);
}

export function decodeCursor(raw: string): MessageCursor | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length !== 2) return null;
    const [iso, id] = parsed as [string, unknown];
    if (typeof iso !== "string" || typeof id !== "string") return null;
    const createdAt = new Date(iso);
    if (Number.isNaN(createdAt.getTime())) return null;
    return { createdAt, id: id as MessageId };
  } catch {
    return null;
  }
}