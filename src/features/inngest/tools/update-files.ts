import { z } from "zod";
import { createTool } from "@inngest/agent-kit";
import { convex } from "@/lib/convex-client";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

interface ListFilesToolOptions {
  project: Id<"projects">;
  internalKey: string;
}

export const createUpdateFilesTool = ({
  project,
  internalKey,
}: ListFilesToolOptions) => {
  return createTool({
    name: "list-files",
    description:
      "List all files and folders in the project. Returns fileId, name, type, and parentId.",

    parameters: z.object({}),

    handler: async (_, { step }) => {
      try {
        const files = await step?.run("list-files", async () => {
          return await convex.query(api.system.getProjectFiles, {
            internalKey,
            projectId: project,
          });
        }) ?? [];

        const sorted = [...files].sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === "folder" ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });

        return sorted.map((f) => ({
          fileId: f._id.toString(),
          name: f.name,
          type: f.type,
          parentId: f.parentId ? f.parentId.toString() : null,
        }));
      } catch (error) {
        throw new Error(
          `Error listing files: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    },
  });
};