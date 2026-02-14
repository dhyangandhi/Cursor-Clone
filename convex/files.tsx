import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { verifyAuth } from "./auth";
import { Id } from "./_generated/dataModel";

/* =======================
   Get All Files in Project
======================= */
export const getFiles = query({
  args: { projectId: v.id("projects") },

  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    if (project.ownerId !== identity.subject)
      throw new Error("Unauthorized");

    return await ctx.db
      .query("files")
      .withIndex("byProject", (q) =>
        q.eq("projectId", args.projectId)
      )
      .collect();

    },
});

/* =======================
   Get Single File
======================= */
export const getFile = query({
  args: { id: v.id("files") },

  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const file = await ctx.db.get(args.id);
    if (!file) throw new Error("File not found");

    const project = await ctx.db.get(file.projectId);
    if (!project) throw new Error("Project not found");

    if (project.ownerId !== identity.subject)
      throw new Error("Unauthorized");

    return file;
  },
});

/* =======================
   Get Folder Contents
======================= */
export const getFolderContents = query({
  args: {
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
  },

  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    if (project.ownerId !== identity.subject)
      throw new Error("Unauthorized");

    const files = await ctx.db
      .query("files")
      .withIndex("byProjectParent", (q) =>
        q.eq("projectId", args.projectId)
         .eq("parentId", args.parentId)
      )
      .collect();

    return files.sort((a, b) => {
      if (a.type === "folder" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "folder") return 1;
      return a.name.localeCompare(b.name);
    });
  },
});

/* =======================
   Create File
======================= */
export const createFile = mutation({
  args: {
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    name: v.string(),
    content: v.string(),
  },

  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    if (project.ownerId !== identity.subject)
      throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("files")
      .withIndex("byProjectParent", (q) =>
        q.eq("projectId", args.projectId)
         .eq("parentId", args.parentId)
      )
      .collect();

    if (existing.some(f => f.name === args.name)) {
      throw new Error("File with the same name already exists");
    }

    return await ctx.db.insert("files", {
      projectId: args.projectId,
      parentId: args.parentId,
      name: args.name,
      content: args.content,
      type: "file",
      updateAt: Date.now(),
    });
  },
});

/* =======================
   Create Folder
======================= */
export const createFolder = mutation({
  args: {
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    name: v.string(),
  },

  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    if (project.ownerId !== identity.subject)
      throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("files")
      .withIndex("byProjectParent", (q) =>
        q.eq("projectId", args.projectId)
         .eq("parentId", args.parentId)
      )
      .collect();

    if (existing.some(f => f.name === args.name)) {
      throw new Error("Folder with the same name already exists");
    }

    return await ctx.db.insert("files", {
      projectId: args.projectId,
      parentId: args.parentId,  
      name: args.name,
      type: "folder",
      updateAt: Date.now(),
    });
    await ctx.db.patch("projects", args.projectId,{
        updateAt: Date.now(),
    });
      
  },
});

/* =======================
   Rename File / Folder
======================= */
export const renameFile = mutation({
  args: {
    id: v.id("files"),
    newName: v.string(),
  },

  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const file = await ctx.db.get(args.id);
    if (!file) throw new Error("File not found");

    const project = await ctx.db.get(file.projectId);
    if (!project) throw new Error("Project not found");

    if (project.ownerId !== identity.subject)
      throw new Error("Unauthorized");

    const siblings = await ctx.db
      .query("files")
      .withIndex("byProjectParent", (q) =>
        q.eq("projectId", file.projectId)
         .eq("parentId", file.parentId)
      )
      .collect();

    if (siblings.some(f => f.name === args.newName && f._id !== file._id)) {
      throw new Error("A file or folder with this name already exists");
    }

    await ctx.db.patch(args.id, {
      name: args.newName,
      updateAt: Date.now(),
    });

    await ctx.db.patch("projects", file.projectId,{
        updateAt: Date.now(),
    });
      
    return args.id;
  },
});

/* =======================
   Delete File / Folder (Recursive + Storage Cleanup)
======================= */
export const deleteFile = mutation({
  args: {
    id: v.id("files"),
  },

  handler: async (ctx, args) => {
        const identity = await verifyAuth(ctx);

        const file = await ctx.db.get(args.id);
        if (!file) throw new Error("File not found");

        const project = await ctx.db.get(file.projectId);
        if (!project) throw new Error("Project not found");

        if (project.ownerId !== identity.subject)
        throw new Error("Unauthorized");

        const deleteRecursive = async (fileId: Id<"files">) => {
            const item = await ctx.db.get(fileId);
            if (!item) return;

            if (item.type === "folder") {
                const children = await ctx.db
                .query("files")
                .withIndex("byProjectParent", (q) =>
                    q.eq("projectId", item.projectId)
                    .eq("parentId", fileId)
                )
                .collect();

                for (const child of children) {
                await deleteRecursive(child._id);
                }
            }

            if (item.storageId) {
                await ctx.storage.delete(item.storageId);
            }

        };
            await deleteRecursive(args.id);
                 await ctx.db.patch("projects", file.projectId,{
            updateAt: Date.now(),
        });
      
            return args.id;
  },
});

export const updateFile = mutation({
    args: {
    id: v.id("files"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

        const file = await ctx.db.get(args.id);
        if (!file) throw new Error("File not found");

        const project = await ctx.db.get(file.projectId);
        if (!project) throw new Error("Project not found");

        if (project.ownerId !== identity.subject)
        throw new Error("Unauthorized");
        
        const now = Date.now();

        await ctx.db.patch("files", args.id, {
            content: args.content,
            updateAt: now,
        });

        await ctx.db.patch("projects", file.projectId,{
            updateAt: Date.now(),
        });
        
    },
});