import { z } from "zod";
import { createTool } from "@inngest/agent-kit";
import { convex } from "@/lib/convex-client";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

interface ReadFilesToolOptions {
  internalKey: string;
}

const paramSchema = z.object({
  fileIds: z
    .array(z.string().min(1, "File ID cannot be empty"))
    .min(1, "At least one file ID must be provided"),
});

export const createReadFilesTool = ({ internalKey }: ReadFilesToolOptions) => {
  return createTool({
    name: "read-files",
    description: "Read the content of one or more files by their IDs.",

    parameters: paramSchema,

    handler: async (params, opts) => {
      const { fileIds } = paramSchema.parse(params);

      try {
        const results = await opts?.step?.run("fetch-files", async () => {
          const files: { id: string; name: string; content: string }[] = [];

          for (const fileId of fileIds) {
            const file = await convex.query(api.system.getFilesByPaths, {
              internalKey,
              projectId: "" as Id<"projects">,
              paths: [fileId],
            });

            if (file && file.length > 0) {
              file.forEach((f) => {
                if (f.content) {
                  files.push({
                    id: f.fileId,
                    name: f.name,
                    content: f.content,
                  });
                }
              });
            }
          }

          return files;
        });

        if (!results || results.length === 0) {
          return [];
        }

        return results;
      } catch (error) {
        throw new Error(
          `Error fetching files: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    },
  });
};