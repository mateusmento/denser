import type { ArtifactSummary, DocumentView, MessageDto, SpaceSummary } from "@denser/contracts";
import { createCollection, localOnlyCollectionOptions, type Collection } from "@tanstack/vue-db";

export const spacesCollection = createCollection(
  localOnlyCollectionOptions<SpaceSummary, SpaceSummary["id"]>({
    id: "spaces",
    getKey: (space) => space.id,
  }),
);

export const artifactsCollection = createCollection(
  localOnlyCollectionOptions<ArtifactSummary, ArtifactSummary["id"]>({
    id: "artifacts",
    getKey: (artifact) => artifact.id,
  }),
);

export const documentsCollection = createCollection(
  localOnlyCollectionOptions<DocumentView, DocumentView["id"]>({
    id: "documents",
    getKey: (document) => document.id,
  }),
);

export const messagesCollection = createCollection(
  localOnlyCollectionOptions<MessageDto, MessageDto["id"]>({
    id: "messages",
    getKey: (message) => message.id,
  }),
);

export function upsertInCollection<T extends { id: string }>(
  collection: Collection<T, T["id"]>,
  item: T,
): void {
  if (collection.has(item.id)) {
    collection.update(item.id, (draft) => {
      Object.assign(draft, item);
    });
    return;
  }
  collection.insert(item);
}

export function upsertMany<T extends { id: string }>(
  collection: Collection<T, T["id"]>,
  items: readonly T[],
): void {
  for (const item of items) {
    upsertInCollection(collection, item);
  }
}

export function removeFromCollection<T extends { id: string }>(
  collection: Collection<T, T["id"]>,
  id: T["id"],
): void {
  if (collection.has(id)) {
    collection.delete(id);
  }
}
