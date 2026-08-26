export const queryKeys = {
  session: () => ["session"] as const,
  home: () => ["home"] as const,
  space: (spaceId: string) => ["space", spaceId] as const,
  document: (artifactId: string) => ["document", artifactId] as const,
  conversation: (artifactId: string) => ["conversation", artifactId] as const,
};
