import type { SchedulerTimezoneChangedEvent, UserId } from "@denser/contracts";
import { SCHEDULER_TIMEZONE_CHANGED_EVENT } from "@denser/contracts";
import type { DenserServer } from "./attach.js";
import { userRoom } from "./rooms.js";

let server: DenserServer | null = null;

export function bindUserNotificationsRealtime(io: DenserServer): void {
  server = io;
}

export function emitSchedulerTimezoneChanged(
  userId: UserId,
  payload: SchedulerTimezoneChangedEvent,
): void {
  if (!server) return;
  server.to(userRoom(userId)).emit(SCHEDULER_TIMEZONE_CHANGED_EVENT, payload);
}
