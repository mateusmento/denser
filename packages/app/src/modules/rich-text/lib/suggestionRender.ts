import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import { VueRenderer } from "@tiptap/vue-3";
import { watch } from "vue";
import RichTextSuggestionMenu from "../presentationals/RichTextSuggestionMenu.vue";

type SuggestionRow = {
  id: string;
  label: string;
};

export function createSuggestionRender(
  liveItems?: () => readonly SuggestionRow[] | undefined,
): NonNullable<SuggestionOptions["render"]> {
  return () => {
    let component: VueRenderer | undefined;
    let unmount: (() => void) | undefined;
    let stopWatch: (() => void) | undefined;
    let latest: SuggestionProps<SuggestionRow> | undefined;

    function apply(props: SuggestionProps<SuggestionRow>) {
      const items = liveItems ? [...(liveItems() ?? [])] : props.items;
      latest = { ...props, items };
      component?.updateProps(latest);
    }

    function teardown() {
      stopWatch?.();
      stopWatch = undefined;
      unmount?.();
      unmount = undefined;
      component?.destroy();
      component = undefined;
      latest = undefined;
    }

    return {
      onStart(props) {
        latest = liveItems ? { ...props, items: [...(liveItems() ?? [])] } : props;
        component = new VueRenderer(RichTextSuggestionMenu, {
          editor: props.editor,
          props: latest,
        });
        const el = component.element;
        if (el instanceof HTMLElement) unmount = props.mount(el);
        if (liveItems) {
          stopWatch = watch(liveItems, () => {
            if (latest) apply(latest);
          });
        }
      },
      onUpdate(props) {
        apply(props);
      },
      onKeyDown(props) {
        if (props.event.key === "Escape") {
          teardown();
          return true;
        }
        return Boolean(component?.ref?.onKeyDown?.(props));
      },
      onExit() {
        teardown();
      },
    };
  };
}
