import { message } from "../../schema/message.js";
import type { db } from "../../client.js";
import type { SeedConversationMessagesModule } from "./types.js";

export async function seedConversationMessages(
  database: typeof db,
  modules: readonly SeedConversationMessagesModule[],
): Promise<number> {
  let count = 0;

  for (const mod of modules) {
    for (const row of mod.messages) {
      const createdAt = new Date(row.createdAt);
      const editedAt = row.editedAt ? new Date(row.editedAt) : null;
      const deletedAt = row.deletedAt ? new Date(row.deletedAt) : null;

      await database
        .insert(message)
        .values({
          id: row.id,
          rootSpaceId: row.rootSpaceId ?? null,
          conversationId: row.conversationId,
          threadId: row.threadId ?? null,
          quotesId: row.quotesId ?? null,
          authorId: row.authorId,
          body: row.body,
          clientId: null,
          createdAt,
          editedAt,
          deletedAt,
        })
        .onConflictDoUpdate({
          target: message.id,
          set: {
            rootSpaceId: row.rootSpaceId ?? null,
            conversationId: row.conversationId,
            threadId: row.threadId ?? null,
            quotesId: row.quotesId ?? null,
            authorId: row.authorId,
            body: row.body,
            createdAt,
            editedAt,
            deletedAt,
          },
        });

      count += 1;
    }
  }

  return count;
}
