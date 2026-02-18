import { useEffect, useMemo, useRef } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { basicSetup } from "codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { indentWithTab } from "@codemirror/commands";

import { customTheme } from "../extensions/theme";
import { customSetup } from "../extensions/custom-setup";
import { getLanguageExtension } from "../extensions/language-extension";
import { minimap } from "../extensions/minimap";
import { indentationMarkers } from "@replit/codemirror-indentation-markers";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  fileName: string;
}

export const CodeEditor = ({
  value,
  onChange,
  fileName,
}: CodeEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const languageExtension = useMemo(
    () => getLanguageExtension(fileName),
    [fileName]
  );

  useEffect(() => {
    if (!editorRef.current) return;

    // Destroy previous view if exists
    if (viewRef.current) {
      viewRef.current.destroy();
    }

    const state = EditorState.create({
      doc: value,
      extensions: [
        oneDark,
        customTheme,
        basicSetup,
        customSetup,
        languageExtension,
        minimap(),
        indentationMarkers(),
        keymap.of([indentWithTab]),
        EditorView.updateListener.of((update) => {
          if (update.state.doc.toString) {
            onChange(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({ 
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [fileName]); // 🔥 reinitialize when file changes

  // Sync external content updates
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const current = view.state.doc.toString();

    if (current !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: current.length,
          insert: value,
        },
      });
    }
  }, [value]);

  return (
    <div
      ref={editorRef}
      className="size-full bg-background"
    />
  );
};
