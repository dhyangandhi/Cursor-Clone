import {
  EditorState,
  StateEffect,
  StateField,
} from "@codemirror/state";

import {
  Tooltip,
  showTooltip,
  keymap,
  EditorView,
} from "@codemirror/view";

import { fetcher } from "./fetcher";

export const showQuickEditEffect =
  StateEffect.define<boolean>();

let editorView: EditorView | null = null;
let currentAbortController: AbortController | null = null;

/* -------------------------------------------------- */
/*                     STATE FIELD                    */
/* -------------------------------------------------- */

export const quickEditState = StateField.define<boolean>({
  create() {
    return false;
  },

  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(showQuickEditEffect)) {
        return effect.value;
      }
    }

    if (transaction.selection) {
      const selection = transaction.selection.main;
      if (selection.empty) {
        return false;
      }
    }

    return value;
  },
});

/* -------------------------------------------------- */
/*                TOOLTIP CREATION                    */
/* -------------------------------------------------- */

const createQuickEditTooltip = (
  state: EditorState
): readonly Tooltip[] => {
  const selection = state.selection.main;

  if (selection.empty) return [];

  const isActive = state.field(quickEditState);
  if (!isActive) return [];

  return [
    {
      pos: selection.to,
      above: false,
      strictSide: false,

      create() {
        const dom = document.createElement("div");
        dom.className =
          "bg-popover text-popover-foreground z-50 rounded-sm border border-input p-3 shadow-md flex flex-col gap-3 text-sm min-w-[260px]";

        const form = document.createElement("form");
        form.className = "flex flex-col gap-3";

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Edit selected code";
        input.className =
          "bg-transparent border border-input rounded-sm px-2 py-2 font-sans w-full outline-none";

        const buttonRow = document.createElement("div");
        buttonRow.className =
          "flex justify-between items-center";

        const cancelButton =
          document.createElement("button");
        cancelButton.type = "button";
        cancelButton.textContent = "Cancel";
        cancelButton.className =
          "font-sans p-1 px-2 text-muted-foreground hover:bg-foreground/10 rounded-sm";

        const submitButton =
          document.createElement("button");
        submitButton.type = "submit";
        submitButton.textContent = "Submit";
        submitButton.className =
          "font-sans p-1 px-3 text-primary hover:bg-foreground/10 rounded-sm";

        /* ---------------- Attach Structure Immediately ---------------- */

        buttonRow.appendChild(cancelButton);
        buttonRow.appendChild(submitButton);

        form.appendChild(input);
        form.appendChild(buttonRow);

        dom.appendChild(form);

        setTimeout(() => input.focus(), 0);

        /* ---------------- Cancel Logic ---------------- */

        cancelButton.onclick = () => {
          if (currentAbortController) {
            currentAbortController.abort();
            currentAbortController = null;
          }

          if (editorView) {
            editorView.dispatch({
              effects: showQuickEditEffect.of(false),
            });
          }
        };

        /* ---------------- Submit Logic ---------------- */

        form.onsubmit = async (e) => {
          e.preventDefault();
          if (!editorView) return;

          const instruction = input.value.trim();
          if (!instruction) return;

          const selection =
            editorView.state.selection.main;

          const selectedCode =
            editorView.state.doc
              .slice(selection.from, selection.to)
              .toString();

          const fullCode =
            editorView.state.doc.toString();

          submitButton.disabled = true;
          submitButton.textContent = "Loading...";

          currentAbortController =
            new AbortController();

          try {
            const editedCode = await fetcher(
              {
                selectedCode,
                fullCode,
                instruction,
              },
              currentAbortController.signal
            );

            if (editedCode) {
              editorView.dispatch({
                changes: {
                  from: selection.from,
                  to: selection.to,
                  insert: editedCode,
                },
                selection: {
                  anchor:
                    selection.from +
                    editedCode.length,
                },
                effects:
                  showQuickEditEffect.of(false),
              });
            } else {
              submitButton.disabled = false;
              submitButton.textContent = "Submit";
            }
          } catch {
            submitButton.disabled = false;
            submitButton.textContent = "Submit";
          }

          currentAbortController = null;
        };

        return { dom };
      },
    },
  ];
};

/* -------------------------------------------------- */
/*                  TOOLTIP FIELD                     */
/* -------------------------------------------------- */

const quickEditTooltipField =
  StateField.define<readonly Tooltip[]>({
    create(state) {
      return createQuickEditTooltip(state);
    },

    update(tooltips, transaction) {
      if (transaction.selection) {
        return createQuickEditTooltip(
          transaction.state
        );
      }

      for (const effect of transaction.effects) {
        if (effect.is(showQuickEditEffect)) {
          return createQuickEditTooltip(
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
/*                     KEYMAP                         */
/* -------------------------------------------------- */

const quickEditKeymap = keymap.of([
  {
    key: "Mod-k",
    run: (view) => {
      const selection =
        view.state.selection.main;

      if (selection.empty) return false;

      view.dispatch({
        effects: showQuickEditEffect.of(true),
      });

      return true;
    },
  },
]);

/* -------------------------------------------------- */
/*               CAPTURE EDITOR VIEW                  */
/* -------------------------------------------------- */

const captureViewExtension =
  EditorView.updateListener.of((update) => {
    editorView = update.view;
  });

/* -------------------------------------------------- */
/*                EXPORT EXTENSION                    */
/* -------------------------------------------------- */

export const quickEdit = () => [
  quickEditState,
  quickEditTooltipField,
  quickEditKeymap,
  captureViewExtension,
];