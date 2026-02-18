"use client";

import { useState } from "react";
import { ChevronRightIcon } from "lucide-react"; // ✅ FIXED IMPORT
import { getItemPadding } from "./constants";

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
  const isFolder = type === "folder";

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
      style={{ paddingLeft: getItemPadding(level, !isFolder) }}
    >
      {isFolder ? (
        <ChevronRightIcon className="size-4 text-muted-foreground" />
      ) : (
        <div className="size-4" />
      )}
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
        onBlur={() => {
          if (!value.trim()) onCancel();
        }}
        className="bg-transparent outline-none text-sm w-full"
        placeholder={isFolder ? "New folder" : "New file"}
      />
    </div>
  );
};
