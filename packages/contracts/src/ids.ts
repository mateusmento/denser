import { z } from "zod";

export function brandedId<Brand extends string>(brand: Brand) {
  return z.uuid().brand(brand);
}

export const UserId = brandedId("UserId");
export type UserId = z.infer<typeof UserId>;
