import { Id } from "@convex/_generated/dataModel";
import { inngest } from "@/inngest/client";
import { NonRetriableError } from "inngest";
import { convex } from "@/lib/convex-client";
import { api } from "@convex/_generated/api";
import { CODING_AGENT_SYSTEM_PROMPT } from "./constants";

import { createNetwork, createAgent, openai } from "@inngest/agent-kit";

import { createListFilesTool } from "./tools/list-files";
import { createReadFilesTool } from "./tools/read-files";
import { createUpdateFilesTool } from "./tools/update-files";
import { createFilesTool } from "./tools/create-files";
import { createFolderTool } from "./tools/create-folder";

interface MessageEvent {
  messageId: Id<"messages">;
  conversationId: Id<"conversations">;
  projectId: Id<"projects">;
  message: string;
}

export const processMessages = inngest.createFunction(
  { id: "process-messages" },
  { event: "message/sent" },

  async ({ event, step }) => {
    const { messageId, conversationId, message, projectId } =
      event.data as MessageEvent;

    const internalKey = process.env.CONVEX_INTERNAL_KEY;

    if (!internalKey) {
      throw new NonRetriableError("CONVEX_INTERNAL_KEY is not set");
    }

    /* wait for DB sync */
    await step.sleep("wait-for-db-sync", "1s");

    /* get conversation */
    const conversation = await step.run("get-conversation", async () => {
      return await convex.query(api.system.getConversationById, {
        internalKey,
        conversationId,
      });
    });

    if (!conversation) {
      throw new NonRetriableError("Conversation not found");
    }

    /* get recent messages */
    const recentMessages = await step.run("get-recent-messages", async () => {
      return await convex.query(api.system.getRecentMessages, {
        internalKey,
        conversationId,
        limit: 10,
      });
    });

    const contextMessages = recentMessages
      .filter((m) => m._id !== messageId && m.content.trim() !== "")
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    /* set status */
    await step.run("set-processing-status", async () => {
      await convex.mutation(api.system.updateMessageContent, {
        internalKey,
        messageId,
        content: "AI processing...",
      });
    });

    /* create agent */
    const codingAgent = createAgent({
      name: "coding-agent",
      description: "AI coding assistant",
      system: CODING_AGENT_SYSTEM_PROMPT,

      model: openai({
        model: "qwen2.5-coder:7b",
        baseUrl: "https://ollama.tailc7ee10.ts.net/v1",
        apiKey: "ollama",
      }),

      tools: [
        createListFilesTool({ internalKey, project: projectId }),
        createReadFilesTool({ internalKey }),
        createUpdateFilesTool({ project: projectId, internalKey }),
        createFilesTool({ project: projectId, internalKey }),
        createFolderTool({ project: projectId, internalKey }),
      ],
    });

    /* network */
    const network = createNetwork({
      name: "Coding AI Network",
      agents: [codingAgent],
      maxIter: 25,

      router: ({ network }) => {
        const last = network.state.results.at(-1);

        const hasText = last?.output?.some(
          (m) => m.type === "text" && m.role === "assistant"
        );

        const hasTool = last?.output?.some((m) => m.type === "tool_call");

        if (hasText && !hasTool) return undefined;

        return codingAgent;
      },
    });

    /* run agent */
    const result = await network.run(`
Conversation history:
${contextMessages}

User request:
${message}
`);

    const lastResult = result.state.results.at(-1);

    const textMessage = lastResult?.output?.find(
      (m) => m.type === "text" && m.role === "assistant"
    );

    let assistantResponse =
      "I processed your request but couldn't generate a response.";

    if (textMessage?.type === "text") {
      const content =
        typeof textMessage.content === "string"
          ? textMessage.content
          : textMessage.content.join("\n");

      try {
        const parsed = JSON.parse(content);

        if (parsed?.name && parsed?.arguments) {
          console.log("Detected tool call:", parsed.name);

          if (parsed.name === "createFiles") {
            await convex.mutation(api.system.createFile, {
              internalKey,
              projectId,
              ...parsed.arguments,
            });

            assistantResponse = "Files created successfully.";
          }

          else if (parsed.name === "createFolder") {
            await convex.mutation(api.system.createFile, {
              internalKey,
              projectId,
              files: [
                {
                  name: parsed.arguments.name,
                  content: "",
                },
              ],
            });

            assistantResponse = "Folder created successfully.";
          }

          else {
            assistantResponse = "Tool call detected but not implemented.";
          }

        } else {
          assistantResponse = content;
        }

      } catch {
        assistantResponse = content;
      }
    }

    /* save final response */
    await step.run("update-final-message", async () => {
      await convex.mutation(api.system.updateMessageContent, {
        internalKey,
        messageId,
        content: assistantResponse,
      });
    });

    return {
      success: true,
      messageId,
      conversationId,
    };
  }
);
