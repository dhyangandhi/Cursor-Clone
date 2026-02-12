import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    name: v.string(),
    ownerId: v.string(),
    updateAt: v.number(),
    importStatus: v.optional(
      v.union(
        v.literal("importing"),
        v.literal("completed"),
        v.literal("failed")
      )
    ),
    exportStatus: v.optional(
      v.union(
        v.literal("exporting"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("cancelled"),
      ),
    ),
      exportRepoUrl: v.optional(v.string()),
  }).index("byOwner", ["ownerId"]),

  files: defineTable({
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    name: v.string(),
    type: v. union(v.literal("file"), v.literal("folder")),
    content: v.optional(v.string()),
    StorageId: v.optional(v.id("_storage")),
    updateAt: v.number(),
  })
    .index("byProject", ["projectId"])
    .index("byParent", ["parentId"])
    .index("by_project_parant", ["projectId", "parentId"])
});
