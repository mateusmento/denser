import { z } from "zod";

export function brandedId<Brand extends string>(brand: Brand) {
  return z.uuid().brand(brand);
}

export const UserId = brandedId("UserId");
export type UserId = z.infer<typeof UserId>;

export const SpaceId = brandedId("SpaceId");
export type SpaceId = z.infer<typeof SpaceId>;

export const ArtifactId = brandedId("ArtifactId");
export type ArtifactId = z.infer<typeof ArtifactId>;
