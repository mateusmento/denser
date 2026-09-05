import type { AttachmentReferences } from "@denser/contracts";

export class NoopAttachmentReferences implements AttachmentReferences {
  async commit(): Promise<void> {
    return;
  }

  async load(): Promise<never> {
    throw new Error("AttachmentReferences.load: not implemented (ticket 07)");
  }

  async listDeliveredForConversation(): Promise<never> {
    throw new Error(
      "AttachmentReferences.listDeliveredForConversation: not implemented (ticket 07)",
    );
  }
}

export const attachmentReferences = new NoopAttachmentReferences();
