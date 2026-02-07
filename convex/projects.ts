import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addProject = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if(!identity) {
        throw new Error("Unauthenticated");
      }

    await ctx.db.insert("projects", {
      name: args.name,
      ownerId: identity?.subject ?? null, // TEMP: replace with auth later
    });
  },
});

export const getProjects = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthenticated");
    }

    return await ctx.db.query("projects")
    .withIndex("byOwner", (q) => q.eq("ownerId", identity.subject))
    .collect();
  },
});
