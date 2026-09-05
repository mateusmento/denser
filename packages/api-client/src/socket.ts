import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  MessageDto,
  ReadyEvent,
  ServerEventPayload,
  ServerToClientEvents,
} from "@denser/contracts";
import {
  MESSAGE_CREATED_EVENT,
  MESSAGE_DELETED_EVENT,
  MESSAGE_UPDATED_EVENT,
  MessageDto as MessageDtoSchema,
  ReadyEvent as ReadyEventSchema,
} from "@denser/contracts";

export type DenserSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export type SocketClientOptions = {
  baseUrl: string;
  cookieHeader?: string;
};

export function createSocketClient(options: SocketClientOptions): DenserSocket {
  const opts: Parameters<typeof io>[1] = {
    withCredentials: true,
    autoConnect: false,
    transports: ["polling", "websocket"],
  };
  if (options.cookieHeader) {
    opts.extraHeaders = { Cookie: options.cookieHeader };
    opts.auth = { cookie: options.cookieHeader };
  }
  return io(options.baseUrl, opts) as DenserSocket;
}

export async function connectSocket(options: SocketClientOptions): Promise<DenserSocket> {
  const socket = createSocketClient(options);
  await new Promise<void>((resolve, reject) => {
    const onConnect = () => {
      cleanup();
      resolve();
    };
    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onError);
    };
    socket.on("connect", onConnect);
    socket.on("connect_error", onError);
    socket.connect();
  });
  return socket;
}

const eventParsers = {
  ready: (payload: unknown): ReadyEvent => ReadyEventSchema.parse(payload),
  [MESSAGE_CREATED_EVENT]: (payload: unknown): MessageDto => MessageDtoSchema.parse(payload),
  [MESSAGE_UPDATED_EVENT]: (payload: unknown): MessageDto => MessageDtoSchema.parse(payload),
  [MESSAGE_DELETED_EVENT]: (payload: unknown): MessageDto => MessageDtoSchema.parse(payload),
} satisfies {
  [E in keyof ServerToClientEvents]: (payload: unknown) => ServerEventPayload<E>;
};

export function waitForServerEvent<E extends keyof ServerToClientEvents>(
  socket: DenserSocket,
  event: E,
  timeoutMs = 5_000,
): Promise<ServerEventPayload<E>> {
  return new Promise((resolve, reject) => {
    const handler = (payload: ServerEventPayload<E>) => {
      clearTimeout(timer);
      try {
        resolve(eventParsers[event](payload));
      } catch (error) {
        reject(error);
      }
    };
    const timer = setTimeout(() => {
      socket.off(event, handler as never);
      reject(new Error(`timeout waiting for ${String(event)}`));
    }, timeoutMs);
    socket.on(event, handler as never);
  });
}
