import { z } from "zod";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { convex } from "@/lib/convex-client";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { inngest } from "@/inngest/client";

const requestSchema = z.object({
  conversationId: z.string(),
  message: z.string(),
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const internalKey = process.env.CONVEX_INTERNAL_KEY;  

    if (!internalKey) {
      return new NextResponse("Internal Server Error", { status: 500 });
    }

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { conversationId, message } = requestSchema.parse(body);

    const conversation = await convex.query(
      api.system.getConversationById,
      {
        internalKey,
        conversationId: conversationId as Id<"conversations">,
      }
    );

    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 });
    }

    const projectId = conversation.projectId;

    await convex.mutation(api.system.createMessage, {
      internalKey,
      conversationId: conversationId as Id<"conversations">,
      projectId,
      role: "user",
      content: message,
    });

    const assistantMessageId = await convex.mutation(
      api.system.createMessage,
      {
        internalKey,
        conversationId: conversationId as Id<"conversations">,
        projectId,
        role: "assistant",
        content: "Generating response...",
        status: "in-progress",
      }
    );

    const event = await inngest.send({
      name: "message/sent",
      data: {
        messageId: assistantMessageId,
      },
    })
    return NextResponse.json({
      success: true,
      eventId: event.ids[0],
      messageId: assistantMessageId,
    });

  } catch (error) {
    console.error("API ERROR:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}