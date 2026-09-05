import type { MessageId } from "@denser/contracts";

/** Stable dev message ids in the `0x501+` block (see contracts artifact ids ending at `0x036`). */
export function makeSeedMessageId(seq: number): MessageId {
  const hex = (0x500 + seq).toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${hex}` as MessageId;
}

/** #product-design timeline ids in the `0x601+` block. */
export function makeProductDesignSeedMessageId(seq: number): MessageId {
  const hex = (0x600 + seq).toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${hex}` as MessageId;
}

export const SEED_MSG_QUOTE_TARGET_FAR = makeSeedMessageId(5);
export const SEED_MSG_QUOTE_TARGET_NEAR = makeSeedMessageId(28);
export const SEED_MSG_EDITED = makeSeedMessageId(26);
export const SEED_MSG_DELETED = makeSeedMessageId(8);
export const SEED_MSG_THREAD_PARENT = makeSeedMessageId(35);
export const SEED_MSG_THREAD_REPLY_1 = makeSeedMessageId(36);
export const SEED_MSG_THREAD_REPLY_2 = makeSeedMessageId(37);
export const SEED_MSG_THREAD_REPLY_3 = makeSeedMessageId(38);
export const SEED_MSG_QUOTE_IN_WINDOW = makeSeedMessageId(42);
export const SEED_MSG_QUOTE_OUT_WINDOW = makeSeedMessageId(43);

export const SEED_PD_MSG_QUOTE_TARGET_FAR = makeProductDesignSeedMessageId(12);
export const SEED_PD_MSG_QUOTE_TARGET_NEAR = makeProductDesignSeedMessageId(160);
export const SEED_PD_MSG_EDITED = makeProductDesignSeedMessageId(130);
export const SEED_PD_MSG_DELETED = makeProductDesignSeedMessageId(40);
export const SEED_PD_MSG_THREAD_PARENT = makeProductDesignSeedMessageId(100);
export const SEED_PD_MSG_THREAD_REPLY_1 = makeProductDesignSeedMessageId(101);
export const SEED_PD_MSG_THREAD_REPLY_2 = makeProductDesignSeedMessageId(102);
export const SEED_PD_MSG_THREAD_REPLY_3 = makeProductDesignSeedMessageId(103);
export const SEED_PD_MSG_QUOTE_IN_WINDOW = makeProductDesignSeedMessageId(195);
export const SEED_PD_MSG_QUOTE_OUT_WINDOW = makeProductDesignSeedMessageId(196);
