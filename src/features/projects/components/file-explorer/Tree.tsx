"use client";

import { ChevronRightIcon, FileIcon, FolderIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCreateFile,
  useCreateFolder,
  useFolderContents,
  useRenameFile,
  useDeleteFile,
} from "../hooks/use-files";
import { LoadingRow } from "./Loading-Row";
import { CreateInput } from "./create-input";
import { Doc, Id } from "@convex/_generated/dataModel";
import { useState } from "react";

export const Tree = ({
  item,
  level = 0,
  projectId,
}: {
  item: Doc<"files">;
  level: number;
  projectId: Id<"projects">;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [creating, setCreating] = useState<"file" | "folder" | null>(null);

  const renameFile = useRenameFile();
  const deleteFile = useDeleteFile();
  const createFile = useCreateFile();
  const createFolder = useCreateFolder();

  const folderContents = useFolderContents({
    projectId,
    parentId: item._id,
    enabled: item.type === "folder" && isOpen,
  });

  const paddingLeft = level * 16;

  /* =====================
     FILE NODE
  ====================== */
  if (item.type === "file") {
    return (
      <div
        className="flex items-center gap-1 h-6 cursor-pointer hover:bg-accent/40"
        style={{ paddingLeft }}
      >
        <div className="size-4" />
        <FileIcon className="size-4 text-muted-foreground" />
        <span className="text-sm">{item.name}</span>
      </div>
    );
  }

  /* =====================
     FOLDER NODE
  ====================== */
  return (
    <div>
      {/* Folder Row */}
      <div
        className="flex items-center gap-1 h-6 cursor-pointer hover:bg-accent/40"
        style={{ paddingLeft }}
        onClick={() => setIsOpen((v) => !v)}
      >
        <ChevronRightIcon
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            isOpen && "rotate-90"
          )}
        />
        <FolderIcon className="size-4 text-muted-foreground" />
        <span className="text-sm">{item.name}</span>
      </div>

      {/* Folder Children */}
      {isOpen && (
        <div>
          {creating && (
            <CreateInput
              type={creating}
              level={level + 1}
              onSubmit={(name) => {
                if (creating === "file") {
                  createFile({
                    projectId,
                    parentId: item._id,
                    name,
                    content: "",
                  });
                } else {
                  createFolder({
                    projectId,
                    parentId: item._id,
                    name,
                  });
                }
                setCreating(null);
              }}
              onCancel={() => setCreating(null)}
            />
          )}

          {folderContents === undefined && (
            <LoadingRow level={level + 1} />
          )}

          {folderContents?.map((child) => (
            <Tree
              key={child._id}
              item={child}
              level={level + 1}
              projectId={projectId}
            />
          ))}
        </div>
      )}
    </div>
  );
};
