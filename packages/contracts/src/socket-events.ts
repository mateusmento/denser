import { z } from "zod";
import {
  MESSAGE_CREATED_EVENT,
  MESSAGE_DELETED_EVENT,
  MESSAGE_UPDATED_EVENT,
  MessageDto,
} from "./message.js";

export const ReadyEvent = z.object({
  ok: z.literal(true),
  room: z.string(),
});
export type ReadyEvent = z.infer<typeof ReadyEvent>;

export type ServerToClientEvents = {
  ready: (payload: ReadyEvent) => void;
  [MESSAGE_CREATED_EVENT]: (payload: MessageDto) => void;
  [MESSAGE_UPDATED_EVENT]: (payload: MessageDto) => void;
  [MESSAGE_DELETED_EVENT]: (payload: MessageDto) => void;
};

export type ClientToServerEvents = Record<string, never>;

export type ServerEventPayload<E extends keyof ServerToClientEvents> = Parameters<
  ServerToClientEvents[E]
>[0];
