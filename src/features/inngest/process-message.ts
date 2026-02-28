import { Id } from "@convex/_generated/dataModel";
import { inngest } from "@/inngest/client";
import { NonRetriableError } from "inngest";
import { convex } from "@/lib/convex-client";
import { api } from "@convex/_generated/api";

interface MessageEvent {
  messageId: Id<"messages">;
}

export const processMessages = inngest.createFunction(
  {
    id: "process-messages",
    cancelOn: [
      {
        event: "messages/cancel",
        // IMPORTANT: Use == not === (CEL syntax, not JS)
        if: "event.data.messageId == async.data.messageId",
      },
    ],
    onFailure: async ({ event, step }) => {
      const { messageId } = event.data.event.data as MessageEvent;
      const internalKey = process.env.CONVEX_INTERNAL_KEY;

      if (internalKey) {
        await step.run("update-assistant-message", async () => {
          await convex.mutation(api.system.updateMessageContent, {
            internalKey,
            messageId,
            content: "Error processing message",
          });
        });
      }
    }
  },
  {
    event: "message/sent",
  },
  async ({ event, step }) => {
    const { messageId } = event.data as MessageEvent;

    const internalKey = process.env.CONVEX_INTERNAL_KEY;
    if (!internalKey) {
      throw new NonRetriableError("CONVEX_INTERNAL_KEY is not set");
    }

    // Simulate AI processing delay
    await step.sleep("wait-for-ai-processing", "5s");
    // Update assistant message
    await step.run("update-assistant-message", async () => {
      await convex.mutation(api.system.updateMessageContent, {
        internalKey,
        messageId,
        content: "AI processing...",
      });
    });
  }
);