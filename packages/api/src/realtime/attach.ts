import type { Server as HttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@denser/contracts";
import { app } from "../app.js";
import { isMemberOfSpace, requireArtifactAccess } from "../domains/tenancy/access.js";
import { bindRealtimeServer } from "./emit.js";
import { bindScheduledMessageRealtime } from "./scheduled-message-events.js";
import { createPresenceRuntime, registerPresenceHandlers } from "./handlers.js";
import { userRoom } from "./rooms.js";

export type DenserServer = SocketServer<ClientToServerEvents, ServerToClientEvents>;
export type DenserSocket = import("socket.io").Socket<
  ClientToServerEvents,
  ServerToClientEvents
> & {
  data: { userId: string };
};

type SessionPayload = {
  user?: {
    id?: string;
  } | null;
} | null;

export function attachRealtime(httpServer: HttpServer, appOrigin: string): DenserServer {
  const io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: appOrigin,
      credentials: true,
    },
  });
  bindRealtimeServer(io);
  bindScheduledMessageRealtime(io);

  const presenceRuntime = createPresenceRuntime();

  io.use(async (socket, next) => {
    try {
      const userId = await authenticateSocket(socket as DenserSocket);
      (socket as DenserSocket).data.userId = userId;
      next();
    } catch (error) {
      next(error instanceof Error ? error : new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const denserSocket = socket as DenserSocket;
    registerPresenceHandlers(io, denserSocket, {
      canAccessConversation: async (userId, conversationId) => {
        const artifact = await requireArtifactAccess(userId, conversationId);
        return artifact !== null && artifact.kind === "conversation";
      },
      canAccessWorkspace: async (userId, rootSpaceId) => isMemberOfSpace(userId, rootSpaceId),
    }, presenceRuntime);

    void (async () => {
      const userId = denserSocket.data.userId;
      const room = userRoom(userId);
      await socket.join(room);
      socket.emit("ready", { ok: true, room });
    })();
  });

  return io;
}

function cookieFromHandshake(socket: DenserSocket): string | undefined {
  const header = socket.request.headers.cookie ?? socket.handshake.headers.cookie;
  if (typeof header === "string" && header.length > 0) {
    return header;
  }
  const authCookie = socket.handshake.auth?.cookie;
  if (typeof authCookie === "string" && authCookie.length > 0) {
    return authCookie;
  }
  return undefined;
}

async function authenticateSocket(socket: DenserSocket): Promise<string> {
  const header = cookieFromHandshake(socket);
  if (!header) {
    throw new Error("unauthorized: missing cookie");
  }

  const res = await app.request("http://localhost/api/auth/get-session", {
    headers: {
      cookie: header,
      host: socket.request.headers.host ?? "127.0.0.1",
    },
  });

  const body = (await res.json()) as SessionPayload;
  const userId = body?.user?.id;
  if (!res.ok || !userId) {
    throw new Error(`unauthorized: session status=${res.status} body=${JSON.stringify(body)}`);
  }
  return userId;
}
