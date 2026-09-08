export const queryKeys = {
  session: () => ["session"] as const,
  home: () => ["home"] as const,
  space: (spaceId: string) => ["space", spaceId] as const,
  document: (artifactId: string) => ["document", "v2", artifactId] as const,
  conversation: (artifactId: string) => ["conversation", artifactId] as const,
  messageDraft: (conversationId: string, threadId: string | null) =>
    ["messageDraft", conversationId, threadId ?? "main"] as const,
  conversationMessages: (conversationId: string) =>
    ["conversation", conversationId, "messages"] as const,
  conversationUnread: (conversationId: string) =>
    ["conversation", conversationId, "unread"] as const,
  threadMessages: (conversationId: string, threadId: string) =>
    ["conversation", conversationId, "thread", threadId, "messages"] as const,
  conversationScheduledMessages: (conversationId: string) =>
    ["conversation", conversationId, "scheduled-messages"] as const,
  directMessages: (rootSpaceId: string) => ["directMessages", rootSpaceId] as const,
  unreadSummary: (rootSpaceId: string) => ["unreadSummary", rootSpaceId] as const,
  workspaceDrafts: (rootSpaceId: string) => ["workspaceDrafts", rootSpaceId] as const,
  workspaceDraftCount: (rootSpaceId: string) => ["workspaceDraftCount", rootSpaceId] as const,
  workspaceScheduledMessages: (rootSpaceId: string) =>
    ["workspaceScheduledMessages", rootSpaceId] as const,
  workspaceScheduledCount: (rootSpaceId: string) =>
    ["workspaceScheduledCount", rootSpaceId] as const,
  sidebarPins: (rootSpaceId: string) => ["sidebarPins", rootSpaceId] as const,
  sidebarSectionPreferences: (rootSpaceId: string) =>
    ["sidebarSectionPreferences", rootSpaceId] as const,
  conversationFiles: (conversationId: string) =>
    ["conversation", conversationId, "files"] as const,
};
