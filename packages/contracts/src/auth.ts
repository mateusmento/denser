import { z } from "zod";
import { UserId } from "./ids.js";

export const SignInInput = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
export type SignInInput = z.infer<typeof SignInInput>;

export const User = z.object({
  id: UserId,
  username: z.string().min(1),
  displayName: z.string().min(1),
  createdAt: z.string().datetime(),
});
export type User = z.infer<typeof User>;

export const SessionUser = z.object({
  id: z.string().min(1),
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
});
export type SessionUser = z.infer<typeof SessionUser>;

export const Session = z.object({
  user: SessionUser.nullable().optional(),
});
export type Session = z.infer<typeof Session>;

export const HealthResponse = z.object({
  ok: z.literal(true),
});
export type HealthResponse = z.infer<typeof HealthResponse>;

export const MeResponse = z.object({
  user: SessionUser,
});
export type MeResponse = z.infer<typeof MeResponse>;
