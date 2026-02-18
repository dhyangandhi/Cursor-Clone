import { Id } from "@convex/_generated/dataModel";
import { TopNavigation } from "./top-Navigation";
import { useEditor } from "../hooks/use-editor";
import { FileBreadcrumbs } from "./FileBreadcrumbs";
import {
  useFile,
  useUpdateFile,
} from "@/features/projects/components/hooks/use-files";
import Image from "next/image";
import { CodeEditor } from "./code-Editor";
import { useRef, useEffect } from "react";

const DEBOUNCE_MS = 500;

export const EditorView = ({
  projectId,
}: {
  projectId: Id<"projects">;
}) => {
  const { activeTab } = useEditor(projectId);
  const updateFile = useUpdateFile();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeFile = useFile(activeTab);

  const isBinary = !!activeFile?.storageId;
  const isText = !!activeFile && !activeFile.storageId;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleChange = (newContent: string) => {
    if (!activeFile) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      updateFile({
        id: activeFile._id,
        content: newContent,
      });
    }, DEBOUNCE_MS);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center">
        <TopNavigation projectId={projectId} />
      </div>

      {activeTab && (
        <FileBreadcrumbs projectId={projectId} />
      )}

      <div className="flex-1 min-h-0 bg-background">
        {!activeFile && (
          <div className="size-full flex items-center justify-center">
            <Image
              src="/logoipsum-419.svg"
              alt="Cloud AI"
              width={50}
              height={50}
              className="opacity-50"
            />
          </div>
        )}

        {isText && (
          <CodeEditor
            key={activeFile._id}
            value={activeFile.content ?? ""}
            fileName={activeFile.name}
            onChange={handleChange}
          />
        )}

        {isBinary && (
          <div className="size-full flex items-center justify-center">
            <p className="text-muted-foreground">
              Binary file preview not supported.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
  