import { z } from "zod";
import { createTool } from "@inngest/agent-kit";
import { convex } from "@/lib/convex-client";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

interface ListFilesToolOptions {
  project: Id<"projects">;
  internalKey: string;
}

export const createListFilesTool = ({
  project,
  internalKey,
}: ListFilesToolOptions) => {
  return createTool({
    name: "list-files",
    description:
      "List all files and folders in the project. Returns fileId, name, type, and parentId.",
    parameters: z.object({}),
    handler: async (_, { step: toolStep }) => {
      try {
        return await toolStep?.run("list-files", async () => {
          const files = await convex.query(
            api.system.getProjectFiles,
            {
              internalKey,
              projectId: project,
            }
          );

          const sorted = files.sort((a, b) => {
            if (a.type !== b.type) {
              return a.type === "folder" ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
          });

          const fileList = sorted.map((f) => ({
            fileId: f._id,
            name: f.name,
            type: f.type,
            parentId: f.parentId ?? null,
          }));

          return JSON.stringify(fileList);
        });
      } catch (error) {
        return `Error listing files: ${
          error instanceof Error ? error.message : String(error)
        }`;
      }
    },
  });
};