import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";

/* =========================
   CREATE CONVERSATION (USER)
========================= */

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (project.ownerId !== identity.subject)
      throw new Error("Unauthorized");

    return ctx.db.insert("conversations", {
      projectId: args.projectId,
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

/* =========================
   GET CONVERSATION BY ID (USER)
========================= */

export const getById = query({
  args: {
    id: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const conversation = await ctx.db.get(args.id);
    if (!conversation) throw new Error("Conversation not found");

    const project = await ctx.db.get(conversation.projectId);
    if (!project || project.ownerId !== identity.subject)
      throw new Error("Unauthorized");

    return conversation;
  },
});

/* =========================
   INTERNAL: GET CONVERSATION (FOR INNGEST)
========================= */

export const getByIdInternal = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    return conversation;
  },
});

/* =========================
   GET CONVERSATIONS BY PROJECT (USER)
========================= */

export const getByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (project.ownerId !== identity.subject)
      throw new Error("Unauthorized");

    return ctx.db
      .query("conversations")
      .withIndex("byProject", (q) =>
        q.eq("projectId", args.projectId)
      )
      .order("desc")
      .collect();
  },
});

/* =========================
   GET MESSAGES (USER)
========================= */

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const project = await ctx.db.get(conversation.projectId);
    if (!project || project.ownerId !== identity.subject)
      throw new Error("Unauthorized");

    return ctx.db
      .query("messages")
      .withIndex("byConversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .collect();
  },
});

/* =========================
   INTERNAL: GET MESSAGES (FOR INNGEST)
========================= */

export const getMessagesInternal = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("messages")
      .withIndex("byConversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .collect();
  },
});