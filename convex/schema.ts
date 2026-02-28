import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    name: v.string(),
    ownerId: v.string(),
    updatedAt: v.number(),
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
        v.literal("cancelled")
      )
    ),
    exportRepoUrl: v.optional(v.string()),
  }).index("byOwner", ["ownerId"]),

  files: defineTable({
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    name: v.string(),
    type: v.union(v.literal("file"), v.literal("folder")),
    content: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    updatedAt: v.number(),
  })
    .index("byProject", ["projectId"])
    .index("byParent", ["parentId"])
    .index("byProjectParent", ["projectId", "parentId"]),

  conversations: defineTable({
    projectId: v.id("projects"),
    title: v.string(),
    updatedAt: v.number(),
  }).index("byProject", ["projectId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    projectId: v.id("projects"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("in-progress"),
        v.literal("completed")
      )
    ),
    updatedAt: v.number(),
  })
    .index("byConversation", ["conversationId"])
    .index("byProjectStatus", ["projectId", "status"]),
});
