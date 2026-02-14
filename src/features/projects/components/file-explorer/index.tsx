"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronRightIcon,
  CopyMinusIcon,
  FilePlusIcon,
  FolderPlusIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Id } from "@convex/_generated/dataModel";
import { useProject } from "../hooks/use-projects";
import { Button } from "@/components/ui/button";
import {
  useCreateFile,
  useCreateFolder,
  useFolderContents,
} from "../hooks/use-files";
import { CreateInput } from "./create-input";
import { LoadingRow } from "./Loading-Row";
import { Tree } from "./Tree";

export const FileExplore = ({
  projectId,
}: {
  projectId: Id<"projects">;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [creating, setCreating] = useState<"file" | "folder" | null>(null);

  const project = useProject(projectId);
  const createFile = useCreateFile();
  const createFolder = useCreateFolder();

  const rootFiles = useFolderContents({
    projectId,
    parentId: undefined,
    enabled: isOpen,
  });

  const handleCreate = (name: string) => {
    if (!name.trim()) return;

    if (creating === "file") {
      createFile({
        projectId,
        name,
        content: "",
        parentId: undefined,
      });
    }

    if (creating === "folder") {
      createFolder({
        projectId,
        name,
        parentId: undefined,
      });
    }

    setCreating(null);
  };

  return (
    <div className="h-full bg-sidebar">
      <ScrollArea className="h-full">
        {/* Root Header */}
        <div
          role="button"
          onClick={() => setIsOpen((v) => !v)}
          className="group flex items-center w-full h-6 px-2 bg-accent font-semibold cursor-pointer"
        >
          <ChevronRightIcon
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              isOpen && "rotate-90"
            )}
          />

          <p className="text-xs uppercase line-clamp-1 ml-1 flex-1">
            {project?.name ?? "Loading..."}
          </p>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(true);
                setCreating("folder");
              }}
            >
              <FolderPlusIcon className="size-3.5" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(true);
                setCreating("file");
              }}
            >
              <FilePlusIcon className="size-3.5" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                console.log("Delete Project");
              }}
            >
              <CopyMinusIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Folder Content */}
        {isOpen && (
          <div className="pl-6 py-2 text-sm">
            {creating && (
              <CreateInput
                type={creating}
                level={0}
                onSubmit={handleCreate}
                onCancel={() => setCreating(null)}
              />
            )}

            {rootFiles === undefined && <LoadingRow level={0} />}

            {rootFiles?.map((item) => (
              <Tree
                key={item._id}
                item={item}
                level={0}
                projectId={projectId}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
