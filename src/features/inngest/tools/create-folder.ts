import { z } from "zod";
import { createTool } from "@inngest/agent-kit";
import { convex } from "@/lib/convex-client";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

interface CreateFolderToolOptions {
  project: Id<"projects">;
  internalKey: string;
}

const paramsSchema = z.object({
    name: z.string().min(1, "Folder name cannot be empty"),
    parentId: z.string(),
});

export const createFolderTool = ({
  project,
  internalKey,
}: CreateFolderToolOptions) => {
  return createTool({
    name: "createFolder",
    description:
      "Create one or more files in the project.",

    parameters: z.object({
        name: z.string().min(1, "Folder name cannot be empty"),
        parentId: z
            .string()
            .describe("Optional parent folder ID. If not provided, folder will be created at root level."
        ),
    }),
    handler: async (params, { step: toolStep }) => {
      const { name, parentId} = params;

      try {
        return await toolStep?.run("create-folder", async () => {
          let resolvedParentId: Id<"files"> | undefined = undefined;

          if (parentId) {
            const parentFolder = await convex.query(
              api.system.getFilesByParentId,
              {
                internalKey,
                fileId: parentId as Id<"files">,
              }
            );

            if (!parentFolder) {
              throw new Error("Parent folder not found");
            }

            if (parentFolder.type !== "folder") {
              throw new Error("Provided parentId is not a folder");
            }

            resolvedParentId = parentId as Id<"files">;
          }

          const folderId = await convex.mutation(api.system.createFolder, {
            internalKey,
            projectId: project,
            parentId: resolvedParentId,
            name,
          });
          return `Created folder: ${name}`;
        });
      } catch (error) {
        return `Error creating files: ${
          error instanceof Error ? error.message : String(error)
        }`;
      }
    },
  });
};
