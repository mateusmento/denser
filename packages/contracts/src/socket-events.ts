import { z } from "zod";

export const ReadyEvent = z.object({
  ok: z.literal(true),
  room: z.string(),
});
export type ReadyEvent = z.infer<typeof ReadyEvent>;

export type ServerToClientEvents = {
  ready: (payload: ReadyEvent) => void;
};

export type ClientToServerEvents = Record<string, never>;

export type ServerEventPayload<E extends keyof ServerToClientEvents> = Parameters<
  ServerToClientEvents[E]
>[0];
