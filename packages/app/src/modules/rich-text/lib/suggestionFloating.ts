import { shift, size } from "@floating-ui/dom";
import type { SuggestionOptions } from "@tiptap/suggestion";

const EDGE_PADDING = 8;

/** Shared Floating UI extras for slash / mention suggestion menus. */
export const suggestionFloating: Pick<
  SuggestionOptions,
  "placement" | "offset" | "flip" | "floatingUi"
> = {
  placement: "bottom-start",
  offset: { mainAxis: 8, crossAxis: 0 },
  flip: true,
  floatingUi: {
    middleware: [
      shift({ padding: EDGE_PADDING }),
      size({
        padding: EDGE_PADDING,
        apply({ availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${Math.max(120, availableHeight)}px`,
            overflowY: "auto",
          });
        },
      }),
    ],
  },
};
