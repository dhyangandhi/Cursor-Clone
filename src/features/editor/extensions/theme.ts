
import { EditorView } from "codemirror";

export const customTheme = EditorView.theme({
    "&": {
        outline: "none !important",
        height: "100%", 
    },

    ".cm-content": {
        fontFamily: "var(--font-plex-mono), monospcae",
        fontsize: "14px",
    },
    ".cm-sroller": {
        scrollbarWidth: "thin",
        scrollbarColor: "#3f3f46 transparent",  
    }
})