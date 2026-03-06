import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { WebContainer } from "@webcontainer/api";

import { BuildFileTree, getFilePath } from "../utils/file-tree";

import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useFiles } from "@/features/projects/components/hooks/use-files";

let webContainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

const getWebContainer = async (): Promise<WebContainer> => {
    if (webContainerInstance) {
        return webContainerInstance;
    }

    if (!bootPromise) {
        bootPromise = WebContainer.boot({ coep: "credentialless" });
    }

    webContainerInstance = await bootPromise;
    return webContainerInstance;
};

const teardownWebContainer = async () => {
    if (webContainerInstance) {
        webContainerInstance.teardown();
        webContainerInstance = null;
    }
    bootPromise = null;
};

interface UseWebContainerProps {
    projectId: Id<"projects">
    enabled: boolean;
    settings?: {
        installCommand?: string;
        devCommand?: string;
    };
};

export const useWebcontainer = ({
    projectId,
    enabled,
    settings,
}: UseWebContainerProps) => {
    const [status, setStatus] = useState<
        "idle" | "booting" | "installing" | "running" | "error"
    >("idle");

    const [previewUrl, SetPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [restartKey, setRestartKey] = useState(0);
    const [terminalOuput, settermainlOuput] = useState<string>("");

    const containerRef = useRef<WebContainer | null>(null);
    const hasStartRef = useRef(false);

    const files = useFiles(projectId);
    useEffect(() => {
        if (!enabled || !files || files.length === 0 || hasStartRef.current) {
            return;
        }

        hasStartRef.current = true;
        const start = async () => {
            try {
                setStatus("booting");
                setError(null);
                settermainlOuput("");

                const appaendOutput = (data: string) => {
                    settermainlOuput((prev) => prev + data);
                };

                const container = await getWebContainer();
                containerRef.current = container;

                const filetree = BuildFileTree(files);
                await container.mount(filetree);
                container.on("server-ready", (_port, url) =>{
                SetPreviewUrl(url);
                setStatus("running");
                })

                setStatus("installing");
                const installCmd = settings?.installCommand || "npm install";
                const [installBin, ...installArgs] = installCmd.split(" ");
                appaendOutput(`$ ${installCmd}\n`)
                const installProcess = await container.spawn(installBin, installArgs,)
                installProcess.output.pipeTo(
                    new WritableStream({
                        write(data){ 
                            appaendOutput(data);
                        },
                    })
                )
                const installExitCode = await installProcess.exit;

                if (installExitCode !== 0) {
                    throw new Error(`${installCmd} failed with code ${installExitCode}`);
                }

                const devCmd = settings?.devCommand || "npm run dev";
                const [devBin, ...devArgs] = devCmd.split(" ");
                appaendOutput(`\n$ ${devCmd}\n`);
                const devProcess = await container.spawn(devBin, devArgs);
                devProcess.output.pipeTo(
                    new WritableStream({
                        write(data) {
                            appaendOutput(data);
                        },
                    })
                );
            } catch (error) {
                setError(error instanceof Error ? error.message : "Unknown error");
                setStatus("error");
            }
        }
        start();
    }, [
        enabled,
        files,
        restartKey,
        settings?.devCommand,
        settings?.installCommand,
    ]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !files || status !== "running") return;

        const filesMap = new Map(files.map((f) => [f._id, f]));

        for (const file of files) {
            if (file.type ! == "file" || file.storageId || !file.content) continue;

            const filePath = getFilePath(file, filesMap);
            container.fs.writeFile(filePath, file.content);
        }
    } ,[files, status]);

    useEffect(() => {
        if (!enabled) {
            hasStartRef.current = false;
            setStatus("idle")
            SetPreviewUrl(null);
            setError(null);
        }
    }, [enabled]);

    const restart = useCallback(() => {
        teardownWebContainer();
        containerRef.current = null;
        hasStartRef.current = false;
        setStatus("idle");
        SetPreviewUrl(null);
        setError(null);
        setRestartKey((prev) => prev + 1);
    }, []);

    return {
        status,
        previewUrl,
        error,
        terminalOuput,
        restart,
    };
};