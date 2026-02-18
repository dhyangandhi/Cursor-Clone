import { ChevronRightIcon } from "lucide-react";
import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";
import { cn } from "@/lib/utils";

import {
  useCreateFile,
  useCreateFolder,
  useFolderContents,
  useDeleteFile,
  useRenameFile,
} from "@/features/projects/components/hooks/use-files";

import { useState } from "react";
import { LoadingRow } from "./Loading-Row";
import { CreateInput } from "./create-input";
import { Doc, Id } from "@convex/_generated/dataModel";
import { TreeItemWrapper } from "./tree-item-wapper";
import { useEditor } from "@/features/editor/hooks/use-editor";

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
  const { openFile, closeTab, activeTab } = useEditor(projectId);
  const folderContents = useFolderContents({
    projectId,
    parentId: item._id,
    enabled: item.type === "folder" && isOpen,
  });

  /* ============================
     FILE NODE
  ============================ */
  if (item.type === "file") {
    const fileName = item.name;
    const isActive = activeTab === item._id;
    return (
      <TreeItemWrapper
        item={item}
        level={level}
        isActive={isActive}
        onClick={() => openFile( item._id, {pinned: false })}
        onDoubleClick={() => openFile(item._id, {pinned: true })}
        onRename={() => setIsRenaming(true)}
        onDelete={() => deleteFile({ id: item._id })}
      >
        {isRenaming ? (
          <CreateInput
            type="file"
            level={level}
            onSubmit={(name) => {
              renameFile({ id: item._id, name });
              setIsRenaming(false);
            }}
            onCancel={() => setIsRenaming(false)}
          />
        ) : (
          <>
            <FileIcon
              fileName={item.name}
              autoAssign
              className="size-4"
            />
            <span className="truncate text-sm">{item.name}</span>
          </>
        )}
      </TreeItemWrapper>
    );
  }

  /* ============================
     FOLDER NODE
  ============================ */
  return (
    <div>
      <TreeItemWrapper
        item={item}
        level={level}
        isActive={false}
        onClick={() => setIsOpen((prev) => !prev)}
        onDoubleClick={() => setIsOpen(true)}
        onRename={() => setIsRenaming(true)}
        onDelete={() => deleteFile({ id: item._id })}
        onCreateFile={() => {
          closeTab(item._id);
          setIsOpen(true);
          setCreating("file");
        }}
        onCreateFolder={() => {
          setIsOpen(true);
          setCreating("folder");
        }}
      >
        <ChevronRightIcon
          className={cn(
            "size-4 transition-transform",
            isOpen && "rotate-90"
          )}
        />

        <FolderIcon
          folderName={item.name}
          autoReverse
          className="size-4"
        />

        {isRenaming ? (
          <CreateInput
            type="folder"
            level={level}
            onSubmit={(name) => {
              renameFile({ id: item._id, name });
              setIsRenaming(false);
            }}
            onCancel={() => setIsRenaming(false)}
          />
        ) : (
          <span className="truncate text-sm">{item.name}</span>
        )}
      </TreeItemWrapper>

      {isOpen && (
        <div>
          {/* CREATE INPUT */}
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

          {/* LOADING */}
          {folderContents === undefined && (
            <LoadingRow level={level + 1} />
          )}

          {/* CHILDREN */}
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
