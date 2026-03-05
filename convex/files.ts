import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

/* ===========================
   GET SINGLE FILE
=========================== */

export const getFile = query({
  args: { fileId: v.id("files") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.fileId);
  },
});

/* ===========================
   GET FOLDER CONTENTS
=========================== */

export const getFolderContents = query({
  args: {
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("files")
      .withIndex("byProjectParent", (q) =>
        q.eq("projectId", args.projectId)
         .eq("parentId", args.parentId ?? undefined)
      )
      .collect();
  },
});

/* ===========================
   CREATE FILE
=========================== */

export const createFile = mutation({
  args: {
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    name: v.string(),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("files")
      .withIndex("byProjectParent", (q) =>
        q.eq("projectId", args.projectId)
         .eq("parentId", args.parentId ?? undefined)
      )
      .collect();

    if (existing.some((f) => f.name === args.name)) {
      throw new Error("File already exists in this folder");
    }

    const fileId = await ctx.db.insert("files", {
      projectId: args.projectId,
      parentId: args.parentId ?? undefined,
      name: args.name,
      type: "file",
      content: args.content ?? "",
      updatedAt: Date.now(),
    });

    return fileId;
  },
});

/* ===========================
   CREATE FOLDER
=========================== */

export const createFolder = mutation({
  args: {
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("files")
      .withIndex("byProjectParent", (q) =>
        q.eq("projectId", args.projectId)
         .eq("parentId", args.parentId ?? undefined)
      )
      .collect();

    if (existing.some((f) => f.name === args.name)) {
      throw new Error("Folder already exists in this location");
    }

    const folderId = await ctx.db.insert("files", {
      projectId: args.projectId,
      parentId: args.parentId ?? undefined,
      name: args.name,
      type: "folder",
      updatedAt: Date.now(),
    });

    return folderId;
  },
});

/* ===========================
   UPDATE FILE
=========================== */

export const updateFile = mutation({
  args: {
    fileId: v.id("files"),
    content: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { fileId, ...updates } = args;

    await ctx.db.patch(fileId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

/* ===========================
   RENAME FILE
=========================== */

export const renameFile = mutation({
  args: {
    fileId: v.id("files"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.fileId, {
      name: args.name,
      updatedAt: Date.now(),
    });
  },
});

/* ===========================
   DELETE FILE
=========================== */

export const deleteFile = mutation({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.fileId);
  },
});

/* ===========================
   GET FILE PATH
=========================== */

export const getFilePath = query({
  args: { fileId: v.id("files") },
  handler: async (ctx, args) => {
    const path: Doc<"files">[] = [];
    let current = await ctx.db.get(args.fileId);

    while (current) {
      path.unshift(current);
      if (!current.parentId) break;
      current = await ctx.db.get(current.parentId);
    }

    return path;
  },
});