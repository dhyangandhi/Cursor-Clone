"use client";

import { Poppins } from "next/font/google";
import { Button } from "@/components/ui/button";
import { SparkleIcon } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { ProjectsList } from "./Projects-list";
import { useCreateProject } from "../hooks/use-projects";
import { adjectives, animals, colors, uniqueNamesGenerator } from "unique-names-generator";
import { useEffect, useState } from "react";
import { ProjectsCommandDilog } from "./projects-command-dialog";
const font = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const ProjectsView = () => {
  const createProject = useCreateProject();
  const [commandDialogopen, setCommandDilogOpen] = useState(false);
  useEffect(() => {
    const handlekeyDown = (e: KeyboardEvent) => {
      if (e.metaKey|| e.ctrlKey) {
        if (e.key === "k") {
          e.preventDefault();
          setCommandDilogOpen(true);
        }

      }
    }
    document.addEventListener("keydown", handlekeyDown);
    return () => document.removeEventListener("keydown", handlekeyDown);
  }, []);

  return (
    <>
      <ProjectsCommandDilog 
        open={commandDialogopen}
        onOpenChange={setCommandDilogOpen}
      />
      <div
        className={cn(
          "min-h-screen bg-sidebar flex flex-col items-center justify-center p-6 md:p-16",
          font.className
        )}
      >
        <div className="w-full max-w-sm mx-auto flex flex-col gap-4 items-center">
          <div className="flex justify-center gap-4 w-full items-center">
            <div className="flex items-center gap-3">
              {/* SMALLER LOGO */}
              <img
                src="/logoipsum-419.svg"
                alt="Cloud AI"
                className="w-5 h-7 md:w-7 md:h-9"
              />

              <h1 className="text-4xl md:text-3xl font-className">
                Cloud AI
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline"
                onClick={() => {
                  const projectName = uniqueNamesGenerator({
                    dictionaries: [adjectives, animals, colors],
                    separator: "-",
                    length: 3,
                  })
                  createProject({
                    name: projectName,
                  });
                }}
                className="h-full items-start justify-start p-4 bg-background border flex flex-col gap-6 rounded-none"
              >
                <div className="flex items-center justify-between w-full">
                  <SparkleIcon className="size-4" />
                  <Kbd className="bg-accent border">
                    Shift+C
                  </Kbd>
                </div>
                <div>
                  <span className="text-sm">
                    New
                  </span>
                </div>
              </Button><Button variant="outline" 
                onClick={() => {}}
                className="h-full items-start justify-start p-4 bg-background border flex flex-col gap-6 rounded-none"
              >
                <div className="flex items-center justify-between w-full">
                  <FaGithub className="size-4" />
                  <Kbd className="bg-accent border">
                    Shift+I
                  </Kbd>
                </div>
                <div>
                  <span className="text-sm">
                    Import 
                  </span>  
                </div>
              </Button>
            </div>
          </div>
          <ProjectsList onViewAll={() => setCommandDilogOpen
          (true)} />

        </div>
      </div>
    </>
  );
};

export default ProjectsView;
