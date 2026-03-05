import { Id } from "./_generated/dataModel";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Validates internal key for protected operations
 */
const validateInternalKey = (key: string) => {
  const internalKey = process.env.CONVEX_INTERNAL_KEY;

  if (!internalKey) {
    throw new Error("CONVEX_INTERNAL_KEY is not defined");
  }

  if (key !== internalKey) {
    throw new Error("Invalid internal key");
  }
};

/**
 * Get conversation by ID
 */
export const getConversationById = query({
  args: {
    conversationId: v.optional(v.id("conversations")),
    internalKey: v.string(),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);

    if (!args.conversationId) return null;

    return ctx.db.get(args.conversationId);
  },
});
/**
 * Create new message
 */
export const createMessage = mutation({
  args: {
    internalKey: v.string(),
    conversationId: v.id("conversations"),
    projectId: v.id("projects"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("in-progress"),
        v.literal("completed"),
        v.literal("cancelled")
      )
    ),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      projectId: args.projectId,
      role: args.role,
      content: args.content,
      status: args.status ?? "pending",
      updatedAt: Date.now(),
    });

    await ctx.db.patch(args.conversationId, {
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

/**
 * Update message content
 */
export const updateMessageContent = mutation({
  args: {
    internalKey: v.string(),
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);

    await ctx.db.patch(args.messageId, {
      content: args.content,
      status: "completed",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get processing messages for a project
 */
export const getProcessingMessages = query({
  args: {
    internalKey: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);

    return await ctx.db
      .query("messages")
      .withIndex("by_Project_Status", (q) =>
        q.eq("projectId", args.projectId).eq("status", "in-progress")
      )
      .collect();
  },
});

/**
 * Update message status
 */
export const updateMessageStatus = mutation({
  args: {
    internalKey: v.string(),
    messageId: v.id("messages"),
    status: v.union(
      v.literal("pending"),
      v.literal("in-progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);

    await ctx.db.patch(args.messageId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get recent messages in a conversation
 */
export const getRecentMessages = query({
  args: {
    internalKey: v.string(),
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);

    return await ctx.db
      .query("messages")
      .withIndex("byConversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .take(args.limit ?? 10);
  },
});

/**
 * Update conversation title
 */
export const updateConversationTitle = mutation({
  args: {
    internalKey: v.string(),
    conversationId: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);

    await ctx.db.patch(args.conversationId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get files for a project
 */
export const getProjectFiles = query({
  args: {
    internalKey: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);

    return await ctx.db
      .query("files")
      .withIndex("byProject", (q) =>
        q.eq("projectId", args.projectId)
      )
      .collect();
  },
});

export const getFilesByParentId = query({
  args: {
    internalKey: v.string(),
    fileId: v.id("files"),
  },
  handler(ctx, args_0) {
    validateInternalKey(args_0.internalKey);
    
    return ctx.db.get(args_0.fileId);
  },
});

export const updateFiles = mutation({
  args: {
    internalKey: v.string(),
    fileId: v.id("files"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);

    const files = await ctx.db.get(args.fileId);
    if (!files) {
      throw new Error("File not found");
    }

    await ctx.db.patch(args.fileId, {
      content: args.content,
      updatedAt: Date.now(),
    });
    return args.fileId;
  },
});

export const createFile = mutation({
  args: {
    internalKey: v.string(),
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    files: v.array(
      v.object({
        name: v.string(),
        content: v.string(),
      })
    ),
  },

  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);

    const results: { name: string; fileId?: Id<"files">; error?: string }[] = [];

    for (const file of args.files) {

      const existing = await ctx.db
        .query("files")
        .withIndex("byProjectParent", (q) =>
          q.eq("projectId", args.projectId)
           .eq("parentId", args.parentId ?? undefined)
        )
        .filter((q) => q.eq(q.field("name"), file.name))
        .first();

      if (existing) {
        results.push({
          name: file.name,
          fileId: existing._id,
          error: "File already exists in this folder",
        });
        continue;
      }

      const fileId = await ctx.db.insert("files", {
        projectId: args.projectId,
        parentId: args.parentId ?? undefined,
        name: file.name,
        type: "file",
        content: file.content,
        updatedAt: Date.now(),
      });

      results.push({
        name: file.name,
        fileId,
      });
    }

    return results;
  },
});
export const createFolder = mutation({
  args: {
    internalKey: v.string(),
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);

    const existing = await ctx.db
      .query("files")
      .withIndex("byProjectParent", (q) =>
        q.eq("projectId", args.projectId).eq("parentId", args.parentId)
      )
      .collect();

    const duplicate = existing.find((f) => f.name === args.name && f.type === "folder");
    if (duplicate) {
      throw new Error("Folder with this name already exists in this location");
    }

    const folderId = await ctx.db.insert("files", {
      projectId: args.projectId,
      name: args.name,
      type: "folder",
      parentId: args.parentId,
      updatedAt: Date.now(),
    });

    return folderId;
  },
});

export const renameFile = mutation({
  args: {
    internalKey: v.string(),
    fileId: v.id("files"),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);

    const file = await ctx.db.get(args.fileId);

    if (!file) {
      throw new Error("File not found");
    }

    const siblings = await ctx.db
    .query("files")
    .withIndex("byProjectParent", (q) =>
      q.eq("projectId", file.projectId).eq("parentId", file.parentId)
    )
    .collect();
    const existing = siblings.find(
      (siblings) => 
        siblings.name === args.newName &&
        siblings.type === file.type &&
        siblings._id !== args.fileId
    );

    if (existing) {
      throw new Error(`A ${file.type} with this name already exists in this folder`);
    }

    await ctx.db.patch(args.fileId, {
      name: args.newName,
      updatedAt: Date.now(),
    });
  },
})

export const deleteFile = mutation({
    args: {
      internalKey: v.string(),
      fileId: v.id("files"),
    },
    handler: async (ctx, args) => {
      validateInternalKey(args.internalKey);

      const file = await ctx.db.get(args.fileId);

      if (!file) {
        throw new Error("File not found");
      }
      
      const deleteRecursive = async (fileId: typeof args.fileId) => {
      const item = await ctx.db.get(fileId);

        if (!item) {
          return;
        }
      
      if (item.type === "folder") {
        const children = await ctx.db
          .query("files")
          .withIndex("byProjectParent", (q) =>
            q.eq("projectId", item.projectId).eq("parentId", fileId)
          )
        .collect();

        for (const child of children) {
          await deleteRecursive(child._id);
        }
      }
      if (item.storageId) {
        await ctx.storage.delete(item.storageId);
      }
      await ctx.db.delete(fileId);
    };
    await deleteRecursive(args.fileId);

    return args.fileId;
  }
});

export const getFilesByPaths = query({
  args: {
    internalKey: v.string(),
    projectId: v.id("projects"),
    paths: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);

    const results: { path: string; fileId: Id<"files">; name: string; type: string; content: string | null }[] = [];

    for (const fullPath of args.paths) {
      const parts = fullPath.split("/").filter(Boolean);

      let currentParentId: Id<"files"> | undefined = undefined;
      let foundFile: { _id: Id<"files">; name: string; type: string; content?: string } | null = null;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        const file = await ctx.db
          .query("files")
          .withIndex("byProjectParent", (q) =>
            q.eq("projectId", args.projectId)
             .eq("parentId", currentParentId)
          )
          .filter((q) => q.eq(q.field("name"), part))
          .first();

        if (!file) {
          foundFile = null;
          break;
        }

        // If it's last part → this is the file we want
        if (i === parts.length - 1) {
          foundFile = file;
        } else {
          // Continue deeper (must be folder)
          if (file.type !== "folder") {
            foundFile = null;
            break;
          }
          currentParentId = file._id;
        }
      }

      if (foundFile) {
        results.push({
          path: fullPath,
          fileId: foundFile._id,
          name: foundFile.name,
          type: foundFile.type,
          content: foundFile.content ?? null,
        });
      }
    }

    return results;
  },
});