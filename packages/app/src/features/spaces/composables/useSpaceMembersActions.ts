import type { SpaceId, SpaceVisibility, UserId } from "@denser/contracts";
import { confirm, prompt } from "@/lib/dialog";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";
import { useSpaceSync } from "./useSpaceSync";

export function useSpaceMembersActions(spaceId: ReadonlyRefOrGetter<SpaceId | undefined>) {
  const id = toReadonlyRef(spaceId);

  const {
    membersView,
    content,
    reload,
    addMember,
    removeMember,
    updateVisibility,
  } = useSpaceSync(id);

  async function onAddMember() {
    const username = await prompt({
      title: "Add member",
      label: "Username",
      placeholder: "bob",
      confirmLabel: "Add",
    });
    if (!username?.trim()) return;
    await addMember(username.trim());
  }

  async function onRemoveMember(userId: UserId) {
    const members = membersView.value?.members ?? [];
    const member = members.find((row) => row.userId === userId);
    const label = member?.name ?? "this member";
    const ok = await confirm(`Remove ${label}?`, "They will lose access to this space.");
    if (!ok) return;
    await removeMember(userId);
  }

  async function onUpdateVisibility(visibility: SpaceVisibility) {
    if (content.value?.space.visibility === visibility) return;
    if (visibility === "private") {
      const ok = await confirm(
        "Make this space private?",
        "Root members will be copied in so nobody is locked out.",
      );
      if (!ok) {
        await reload();
        return;
      }
    }
    await updateVisibility(visibility);
  }

  return {
    membersView,
    onAddMember,
    onRemoveMember,
    onUpdateVisibility,
  };
}
