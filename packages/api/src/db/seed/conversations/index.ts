import { engineeringChannelMessages } from "./engineering-channel.js";
import { productDesignChannelMessages } from "./product-design-channel.js";
import { seedConversationMessages } from "./seed-messages.js";
import type { SeedConversationMessagesModule } from "./types.js";

export const conversationMessageSeedModules: readonly SeedConversationMessagesModule[] = [
  engineeringChannelMessages,
  productDesignChannelMessages,
];

export { seedConversationMessages };
export type { SeedConversationMessage, SeedConversationMessagesModule } from "./types.js";
export {
  SEED_MSG_QUOTE_IN_WINDOW,
  SEED_MSG_QUOTE_OUT_WINDOW,
  SEED_MSG_QUOTE_TARGET_FAR,
  SEED_MSG_QUOTE_TARGET_NEAR,
  SEED_MSG_THREAD_PARENT,
} from "./engineering-channel.js";
