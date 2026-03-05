import { z } from "zod";
import { createTool } from "@inngest/agent-kit";
import { convex } from "@/lib/convex-client";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

interface CreateFilesToolOptions {
  project: Id<"projects">;
  internalKey: string;
}

export const createFilesTool = ({
  project,
  internalKey,
}: CreateFilesToolOptions) => {
  return createTool({
    name: "createFiles",
    description:
      "Create one or more files in the project. Provide an array of objects with name and content.",

    parameters: z.object({
      parentId: z
        .string()
        .optional()
        .describe("Optional parent folder ID"),
      files: z.array(
        z.object({
          name: z.string().min(1),
          content: z.string(),
        })
      ),
    }),

    handler: async (params, { step: toolStep }) => {
      const { parentId, files } = params;

      try {
        return await toolStep?.run("create-files", async () => {
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

          const results = await convex.mutation(api.system.createFile, {
            internalKey,
            projectId: project,
            parentId: resolvedParentId,
            files,
          });

          const created = results.filter((r) => !r.error);
          const failed = results.filter((r) => r.error);

          let response = `Created ${created.length} file(s).`;

          if (failed.length > 0) {
            response += ` Failed: ${failed
              .map((r) => r.name)
              .join(", ")}`;
          }

          return response;
        });
      } catch (error) {
        return `Error creating files: ${
          error instanceof Error ? error.message : String(error)
        }`;
      }
    },
  });
};
