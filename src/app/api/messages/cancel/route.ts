import { z } from "zod";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

const requestSchema = z.object({
  projectId: z.string(),
});

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { projectId } = requestSchema.parse(body);

  const internalKey = process.env.CONVEX_INTERNAL_KEY;

  if (!internalKey) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  const processingMessages = await convex.query(
    api.system.getProcessingMessages,
    {
      internalKey,
      projectId: projectId as Id<"projects">,
    }
  );

  if (processingMessages.length === 0) {
    return NextResponse.json({ success: true, cancelled: false });
  }

  const cancelledIds = await Promise.all(
    processingMessages.map(async (msg) => {
      // Cancel Inngest job
      await inngest.send({
        name: "messages/cancel",
        data: {
          messageId: msg._id, // FIXED (singular)
        },
      });

      // Update status in DB
      await convex.mutation(api.system.updateMessageContent, {
        internalKey,
        messageId: msg._id,
        content: msg.content,
      });

      return msg._id;
    })
  );

  return NextResponse.json({
    success: true,
    cancelled: cancelledIds.length > 0,
  });
}