import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { verifyAuth } from "./auth";

export const addProject = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    if(!identity) {
        throw new Error("Unauthenticated");
      }

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      ownerId: identity.subject,
      updateAt: Date.now(),
    });

    return projectId;
  },
});

export const getPartial = query({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    return await ctx.db.query("projects")
    .withIndex("byOwner", (q) => q.eq("ownerId", identity.subject))
    .order("desc")
    .take(args.limit);

  },
});

export const get = query({
  handler: async (ctx) => {
    const identity = await verifyAuth(ctx);

    return await ctx.db.
    query("projects")
    .withIndex("byOwner", (q) => q.eq("ownerId", identity.subject))
    .order("desc")
    .collect();

  },
});
