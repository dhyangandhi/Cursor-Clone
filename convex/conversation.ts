import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";

/* =========================
   CREATE CONVERSATION
========================= */

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    const conversationId = await ctx.db.insert("conversations", {
      projectId: args.projectId,
      title: args.title,
      updatedAt: Date.now(),
    });

    return conversationId;
  },
});

/* =========================
   GET CONVERSATION BY ID
========================= */

export const getById = query({
  args: {
    id: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const conversation = await ctx.db.get(args.id);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const project = await ctx.db.get(conversation.projectId);
    if (!project || project.ownerId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    return conversation;
  },
});

/* =========================
   GET CONVERSATIONS BY PROJECT
========================= */

export const getByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("conversations")
      // ✅ FIXED: matches schema index name exactly
      .withIndex("byProject", (q) =>
        q.eq("projectId", args.projectId)
      )
      .order("desc")
      .collect();
  },
});

/* =========================
   GET MESSAGES
========================= */

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const project = await ctx.db.get(conversation.projectId);
    if (!project || project.ownerId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("messages")
      // ✅ FIXED: matches schema index name exactly
      .withIndex("byConversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .collect();
  },
});