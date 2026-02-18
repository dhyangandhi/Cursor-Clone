import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { verifyAuth } from "./auth";
import { Id, Doc } from "./_generated/dataModel";

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
   Get File Path
======================= */

export const getfilePath = query({
  args: { id: v.id("files") },

  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const file = await ctx.db.get("files", args.id); 

    if (!file) {
      throw new Error("File not found");
    }
      const path: {_id: string; name: string } [] = [];
      let currentId: Id<"files"> | undefined = args.id;

      while (currentId) {
        const file = (await ctx.db.get("files", currentId)) as 
          | Doc<"files">
          | undefined
        if (!file) break;

        path.unshift({_id: file._id, name: file.name })
        currentId = file.parentId;
      }
      return path;
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
   Get File Path (FIXED)
======================= */
export const getFilePath = query({
  args: { id: v.id("files") },

  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const file = await ctx.db.get(args.id);
    if (!file) throw new Error("File not found");

    const project = await ctx.db.get(file.projectId);
    if (!project) throw new Error("Project not found");

    if (project.ownerId !== identity.subject)
      throw new Error("Unauthorized");

    const path: { _id: Id<"files">; name: string }[] = [];

    let currentId: Id<"files"> | undefined = args.id;

    while (currentId) {
      const current = await ctx.db.get(currentId) as
        | (typeof file)
        | null;

      if (!current) break;

      path.unshift({
        _id: current._id,
        name: current.name,
      });

      currentId = current.parentId ?? undefined;
    }

    return path;
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
  },
});

/* =======================
   Update File Content
======================= */
export const updateFile = mutation({
  args: {
    id: v.id("files"),
    content: v.string(),
  },

  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const file = await ctx.db.get(args.id);
    if (!file) throw new Error("File not found");

    if (file.type !== "file")
      throw new Error("Cannot update folder content");

    const project = await ctx.db.get(file.projectId);
    if (!project) throw new Error("Project not found");

    if (project.ownerId !== identity.subject)
      throw new Error("Unauthorized");

    await ctx.db.patch(args.id, {
      content: args.content,
      updateAt: Date.now(),
    });

    return args.id;
  },
});

/* =======================
   Delete File / Folder (FIXED)
======================= */
export const deleteFile = mutation({
  args: { id: v.id("files") },

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

      await ctx.db.delete(fileId); // 🔥 THIS WAS MISSING
    };

    await deleteRecursive(args.id);

    return args.id;
  },
});

/* =======================
   Rename File / Folder
======================= */
export const renameFile = mutation({
  args: {
    id: v.id("files"),
    name: v.string(),
  },

  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const file = await ctx.db.get(args.id);
    if (!file) throw new Error("File not found");

    const project = await ctx.db.get(file.projectId);
    if (!project) throw new Error("Project not found");

    if (project.ownerId !== identity.subject)
      throw new Error("Unauthorized");

      // Check if a file/folder with the same name already exists in the same parent
    const siblings = await ctx.db
      .query("files")
      .withIndex("byProjectParent", (q) =>
        q.eq("projectId", file.projectId)
         .eq("parentId", file.parentId)
      )
      .collect();

    if (siblings.some(f => f.name === args.name && f._id !== args.id)) {
      throw new Error("A file or folder with this name already exists");
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      updateAt: Date.now(),
    });

    return args.id;
  },
});