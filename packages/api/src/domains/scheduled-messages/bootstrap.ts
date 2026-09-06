import { defaultMessageService } from "../messages/routes.js";
import { registerScheduledMessageHandler } from "./service.js";

let bootstrapped = false;

export function bootstrapScheduledMessages(): void {
  if (bootstrapped) return;
  registerScheduledMessageHandler(defaultMessageService);
  bootstrapped = true;
}
