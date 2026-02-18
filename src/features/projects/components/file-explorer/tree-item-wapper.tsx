"use client";

import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuShortcut,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { getItemPadding } from "./constants";
import { Doc } from "@convex/_generated/dataModel";
import React from "react";

export const TreeItemWrapper = ({
  item,
  children,
  level,
  isActive,
  onClick,
  onDoubleClick,
  onRename,
  onDelete,
  onCreateFile,
  onCreateFolder,
}: {
  item: Doc<"files">;
  children: React.ReactNode;
  level: number;
  isActive?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onCreateFile?: () => void;
  onCreateFolder?: () => void;
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Button
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onRename?.();
            }

            if ((e.metaKey || e.ctrlKey) && e.key === "Backspace") {
              e.preventDefault();
              onDelete?.();
            }
          }}
          className={cn(
            "group flex items-center gap-1 w-full h-[22px] justify-start hover:bg-accent/30 outline-none focus:ring-1 focus:ring-inset focus:ring-ring",
            isActive && "bg-accent/30"
          )}
          style={{
            paddingLeft: getItemPadding(level, item.type === "file"),
          }}
        >
          {children}
        </Button>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-52">
        {/* Folder-only options */}
        {item.type === "folder" && (
          <>
            <ContextMenuItem onClick={onCreateFile}>
              New File…
            </ContextMenuItem>

            <ContextMenuItem onClick={onCreateFolder}>
              New Folder…
            </ContextMenuItem>

            <ContextMenuSeparator />
          </>
        )}

        {/* Rename */}
        <ContextMenuItem onClick={onRename}>
          Rename…
          <ContextMenuShortcut>Enter</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Delete */}
        <ContextMenuItem
          onClick={onDelete}
          className="text-red-500 focus:text-red-500"
        >
          Delete Permanently
          <ContextMenuShortcut>Shit + K</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
   