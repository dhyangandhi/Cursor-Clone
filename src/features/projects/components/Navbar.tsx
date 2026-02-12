"use client";
import Image from "next/image";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Id, Doc } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Poppins } from "next/font/google";
import { UserButton } from "@clerk/nextjs";
import { useProject, useRenameProject } from "./hooks/use-projects";
import React from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { CloudCheckIcon, LoaderIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { unknown } from "zod/v4";
const font = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const Navbar = ({
  projectId,
}: {
  projectId: Id<"projects">;
}) => {
  const project: Doc<"projects"> | undefined = useProject(projectId);
  const renameProject = useRenameProject();
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [name, setName] = React.useState("");

  const handleSubmit = () => {
    if (!project) return;

    const trimmedName = name.trim();
    setIsRenaming(false);

    if (!trimmedName || trimmedName === project.name) return;

    renameProject({ id: projectId, name: trimmedName });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      setIsRenaming(false);
    }
  };

  const handleStartRename = () => {
    if (!project) return;
    setName(project.name);
    setIsRenaming(true);
  };
  return (
    <nav className="flex justify-between items-center gap-x-2 p-2 bg-sidebar border-b">
      <div className="flex items-center gap-x-2">
        <Breadcrumb>
          <BreadcrumbList className="gap-0!">
            <BreadcrumbItem className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                className="w-fit! p-1.5! h-7!"
                asChild
              >
                <Link href="/">
                  <Image
                    src="/logoipsum-419.svg"
                    alt="Logo"
                    width={20}
                    height={20}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      font.className
                    )}
                  >
                    Clone AI
                  </span>
                </Link>
              </Button>
            </BreadcrumbItem>

            <BreadcrumbSeparator className="ml-0! mr-1" />

            <BreadcrumbItem>
              {isRenaming ? (
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  onBlur={handleSubmit}
                  onKeyDown={handleKeyDown}
                  className="text-sm bg-transparent text-foreground outline-none 
                  focus:ring-1 focus:ring-inset focus:ring-ring font-medium 
                  max-w-40 truncate"
                />
              ) : (
                <BreadcrumbPage
                  onClick={handleStartRename}
                  className="text-sm cursor-pointer hover:text-primary 
                  font-medium max-w-40 truncate"
                >
                  {project?.name ?? "Loading..."}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {project?.importStatus === "importing" ? (
            <Tooltip>
                <TooltipTrigger asChild>
                    <LoaderIcon className="size-4 text-muted-foreground animate-spin" />
                </TooltipTrigger>
                <TooltipContent>Importing...</TooltipContent>
            </Tooltip>
        ) : (   
            
                <Tooltip>
                    <TooltipTrigger asChild>
                        <CloudCheckIcon className="size-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                        Save{" "}
                        {project?.updateAt ? formatDistanceToNow(
                            project.updateAt,
                            { addSuffix: true, }
                        ) : "unknown"}
                    </TooltipContent>
                </Tooltip>  
            
        )}

      </div>

      <div className="flex items-center gap-2">
        <UserButton />
      </div>
    </nav>
  );
};
