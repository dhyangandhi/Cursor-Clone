"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

import "@xterm/xterm/css/xterm.css";

interface PreviewTerminalProps {
    output: string;
}

export const PerviewTerminal = ({ output }: PreviewTerminalProps) => {  
    const containerRef = useRef<HTMLDivElement>(null);
    const termalRef = useRef<Terminal>(null);
    const fitAddonRef = useRef<FitAddon>(null);
    const lastLengthRef = useRef(0);

    useEffect(() => {
        if (!containerRef.current || termalRef.current) return;
        const terminal = new Terminal({
            convertEol: true,
            disableStdin: true,
            fontSize: 12,
            fontFamily: "monospace",
            theme: { background: "#1f2228" },
        });

        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        terminal.open(containerRef.current);

        termalRef.current = terminal;
        fitAddonRef.current = fitAddon;

        if (output) {
            terminal.write(output);
            lastLengthRef.current = output.length;
        }

        requestAnimationFrame(() => fitAddon.fit());
        const reszeObserver = new ResizeObserver(() => fitAddon.fit())
        reszeObserver.observe(containerRef.current);

        return () => {
            reszeObserver.disconnect();
            terminal.dispose();
            termalRef.current = null;
            fitAddonRef.current = null;
        };
    }, []);
    useEffect(() => {
        if (!termalRef.current) return;

        if (output.length < lastLengthRef.current) {
            termalRef.current.write(output);
            lastLengthRef.current = 0;
        }

        const newData = output.slice(lastLengthRef.current);
        if (newData) {
            termalRef.current.write(newData);
            lastLengthRef.current = output.length;
        }
    }, [output]);

    return (
        <div 
            ref={containerRef}
            className="flex-1 min-h-0 p-3 [&_.xterm]:h-full! [&_.xterm-viewport]:h-full! [&_.xterm-srcreen]:h-full! bg-sidebar"
        />
    )
}