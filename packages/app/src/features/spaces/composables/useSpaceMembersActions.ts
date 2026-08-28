import type { SpaceId, SpaceVisibility, UserId } from "@denser/contracts";
import type { ComputedRef } from "vue";
import { confirm, prompt } from "@/lib/dialog";
import type { SpaceContentView, SpaceMembersView } from "../types";

type SpaceMembersSync = {
  membersView: ComputedRef<SpaceMembersView | undefined>;
  content: ComputedRef<SpaceContentView | undefined>;
  reload: () => unknown;
  addMember: (username: string) => Promise<unknown>;
  removeMember: (memberUserId: UserId) => Promise<unknown>;
  updateVisibility: (visibility: SpaceVisibility) => Promise<unknown>;
};

export function useSpaceMembersActions(sync: SpaceMembersSync) {
  async function onAddMember() {
    const username = await prompt({
      title: "Add member",
      label: "Username",
      placeholder: "bob",
      confirmLabel: "Add",
    });
    if (!username?.trim()) return;
    await sync.addMember(username.trim());
  }

  async function onRemoveMember(userId: UserId) {
    const members = sync.membersView.value?.members ?? [];
    const member = members.find((row) => row.userId === userId);
    const label = member?.name ?? "this member";
    const ok = await confirm(`Remove ${label}?`, "They will lose access to this space.");
    if (!ok) return;
    await sync.removeMember(userId);
  }

  async function onUpdateVisibility(visibility: SpaceVisibility) {
    if (sync.content.value?.space.visibility === visibility) return;
    if (visibility === "public") return;
    if (visibility === "private") {
      const nested = sync.membersView.value?.isNested ?? false;
      const ok = await confirm(
        nested ? "Make this space private?" : "Turn this folder into a workspace?",
        nested
          ? "Root members will be copied in so nobody is locked out. This cannot be undone."
          : "You'll be the owner and can invite people. This cannot be undone.",
      );
      if (!ok) {
        await sync.reload();
        return;
      }
    }
    await sync.updateVisibility(visibility);
  }

  return {
    onAddMember,
    onRemoveMember,
    onUpdateVisibility,
  };
}
