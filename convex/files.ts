import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { defineSchema, defineTable } from "convex/server"; // Note: You don't actually need this line in this file, but I kept it as requested!

// Mutation to create a new file or folder
export const createFile = mutation({
  // The arguments must match what you want to pass from the frontend
  args: {
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    name: v.string(),
    type: v.union(v.literal("file"), v.literal("folder")),
    content: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    // Insert the new file into the database
    const newFileId = await ctx.db.insert("files", {
      projectId: args.projectId,
      parentId: args.parentId,
      name: args.name,
      type: args.type,
      content: args.content,
      storageId: args.storageId,
      // --- THE FIX IS HERE ---
      // Ensure it is spelled 'updatedAt', NOT 'updateAt'
      updatedAt: Date.now(), 
    });

    return newFileId;
  },
});

// Mutation to update an existing file
export const updateFile = mutation({
  args: {
    fileId: v.id("files"),
    name: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { fileId, ...updates } = args;

    // Patch the file with the new data
    await ctx.db.patch(fileId, {
      ...updates,
      // --- THE FIX IS HERE ---
      // Again, ensure it is exactly 'updatedAt' when patching
      updatedAt: Date.now(),
    });
  },
});