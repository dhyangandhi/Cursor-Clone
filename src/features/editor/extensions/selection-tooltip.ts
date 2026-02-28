import {
  Tooltip,
  showTooltip,
  EditorView,
} from "@codemirror/view";

import {
  StateField,
  EditorState,
} from "@codemirror/state";

import {
  showQuickEditEffect,
  quickEditState,
} from "./quick-edit";

let editorView: EditorView | null = null;

/* -------------------------------------------------- */
/*                TOOLTIP CREATION                    */
/* -------------------------------------------------- */

const createTooltipForSelection = (
  state: EditorState
): readonly Tooltip[] => {
  const selection = state.selection.main;

  // No selection → no tooltip
  if (selection.empty) return [];

  // If quick edit is already active → hide this tooltip
  const isQuickEditActive = state.field(quickEditState);
  if (isQuickEditActive) return [];

  return [
    {
      pos: selection.to,
      above: false,
      strictSide: false,

      create() {
        const dom = document.createElement("div");
        dom.className =
          "bg-popover text-popover-foreground z-50 rounded-sm border border-input p-2 shadow-md flex items-center gap-2 text-sm";

        /* ---------------- Add To Chat Button ---------------- */

        const addToChatButton =
          document.createElement("button");
        addToChatButton.textContent = "Add To Chat";
        addToChatButton.className =
          "font-sans px-2 py-1 rounded-sm hover:bg-foreground/10";

        /* ---------------- Quick Edit Button ---------------- */

        const quickEditButton =
          document.createElement("button");
        quickEditButton.className =
          "font-sans px-2 py-1 rounded-sm hover:bg-foreground/10 flex items-center gap-1";

        const quickEditText =
          document.createElement("span");
        quickEditText.textContent = "Quick Edit";

        const shortcutText =
          document.createElement("span");
        shortcutText.textContent = "Ctrl + Enter";
        shortcutText.className =
          "text-xs opacity-60";

        quickEditButton.appendChild(quickEditText);
        quickEditButton.appendChild(shortcutText);

        /* ---------------- Click Logic ---------------- */

        quickEditButton.onclick = () => {
          if (editorView) {
            editorView.dispatch({
              effects: showQuickEditEffect.of(true),
            });
          }
        };

        /* ---------------- Mount Elements ---------------- */

        dom.appendChild(addToChatButton);
        dom.appendChild(quickEditButton);

        return { dom };
      },
    },
  ];
};

/* -------------------------------------------------- */
/*                  STATE FIELD                       */
/* -------------------------------------------------- */

const selectionTooltipField =
  StateField.define<readonly Tooltip[]>({
    create(state) {
      return createTooltipForSelection(state);
    },

    update(tooltips, transaction) {
      if (transaction.docChanged || transaction.selection) {
        return createTooltipForSelection(
          transaction.state
        );
      }

      for (const effect of transaction.effects) {
        if (effect.is(showQuickEditEffect)) {
          return createTooltipForSelection(
            transaction.state
          );
        }
      }

      return tooltips;
    },

    provide: (field) =>
      showTooltip.computeN(
        [field],
        (state) => state.field(field)
      ),
  });

/* -------------------------------------------------- */
/*             CAPTURE EDITOR INSTANCE                */
/* -------------------------------------------------- */

const captureViewExtension =
  EditorView.updateListener.of((update) => {
    editorView = update.view;
  });

/* -------------------------------------------------- */
/*                 EXPORT EXTENSION                   */
/* -------------------------------------------------- */

export const selectionTooltip = () => [
  selectionTooltipField,
  captureViewExtension,
];