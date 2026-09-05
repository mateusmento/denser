export const queryKeys = {
  session: () => ["session"] as const,
  home: () => ["home"] as const,
  space: (spaceId: string) => ["space", spaceId] as const,
  document: (artifactId: string) => ["document", "v2", artifactId] as const,
  conversation: (artifactId: string) => ["conversation", artifactId] as const,
  conversationMessages: (conversationId: string) =>
    ["conversation", conversationId, "messages"] as const,
  directMessages: (rootSpaceId: string) => ["directMessages", rootSpaceId] as const,
};
