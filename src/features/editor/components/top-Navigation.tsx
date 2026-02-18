import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Id } from "@convex/_generated/dataModel";
import { useEditor } from "../hooks/use-editor";
import { useFile } from "@/features/projects/components/hooks/use-files";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Tab = ({
  fileId,
  isFirst,
  projectId,
}: {
  fileId: Id<"files">;
  isFirst: boolean;
  projectId: Id<"projects">;
}) => {
  const file = useFile(fileId);

  const {
    activeTab,
    previewTabId,
    setActiveTab,
    openFile,
    closeTab,
  } = useEditor(projectId);

  const isActive = activeTab === fileId;
  const isPreview = previewTabId === fileId;
  const fileName = file?.name ?? "Loading...";

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 h-full border-r text-sm cursor-pointer select-none",
        isActive
          ? "bg-background text-foreground"
          : "bg-sidebar hover:bg-accent",
        isPreview && "italic"
      )}
      onClick={() => openFile(fileId, { pinned: false })}
      onDoubleClick={() => openFile(fileId, { pinned: true })}
    >
      <span className="truncate max-w-[150px]">
        {fileName}
      </span>

      <X
        className="size-3 opacity-60 hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          closeTab(fileId);
        }}
      />
    </div>
  );
};

export const TopNavigation = ({
  projectId,
}: {
  projectId: Id<"projects">;
}) => {
  const { openTabs } = useEditor(projectId);

  return (
    <ScrollArea className="flex-1">
      <nav className="bg-sidebar flex items-center h-8.5 border-b whitespace-nowrap">
        {openTabs.map((fileId, index) => (
          <Tab
            key={fileId}
            fileId={fileId}
            isFirst={index === 0}
            projectId={projectId}
          />
        ))}
      </nav>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
