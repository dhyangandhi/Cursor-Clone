"use client";

import { ChevronRightIcon, FileIcon, FolderIcon } from "lucide-react";
import { useState } from "react";

export const CreateInput = ({
  type,
  level,
  onSubmit,
  onCancel,
}: {
  type: "file" | "folder";
  level: number;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) => {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();

    if (!trimmed) {
      onCancel();
      return;
    }

    onSubmit(trimmed);
  };

  return (
    <div
      className="w-full flex items-center gap-1 h-[22px] bg-accent/30"
      style={{ paddingLeft: `${level * 16}px` }}
    >
      {/* Expand icon placeholder for alignment */}
      {type === "folder" ? (
        <ChevronRightIcon className="size-4 text-muted-foreground" />
      ) : (
        <div className="size-4" />
      )}

      {type === "folder" ? (
        <FolderIcon className="size-4 text-muted-foreground" />
      ) : (
        <FileIcon className="size-4 text-muted-foreground" />
      )}

      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") onCancel();
        }}
        className="bg-transparent outline-none text-sm w-full"
        placeholder={type === "folder" ? "New folder" : "New file"}
      />
    </div>
  );
};
