import { inngest } from "./client";
import { firecrawl } from "@/lib/firecrawl";
import { generateText } from "ai";
import { ollama } from "ollama-ai-provider-v2";

const URL_REGEX = /https?:\/\/[^\s]+/g;

export const demoGenerate = inngest.createFunction(
  { id: "demo-generate" },
  { event: "demo/generate" },
  async ({ event, step }) => {
    const { prompt } = event.data as { prompt: string };

    const urls = await step.run("extract-urls", async () => {
      return prompt.match(URL_REGEX) ?? [];
    }) as string[];

    const scrapedContent = await step.run("scrape-urls", async () => {
      if (!firecrawl) {
        throw new Error("Firecrawl is not configured.");
      }

      const results = await Promise.all(
        urls.map(async (url) => {
          const result = await firecrawl!.scrape(url, {
            formats: ["markdown"],
          });
          return result.markdown ?? null;
        })
      );

      return results.filter(Boolean).join("\n\n");
    });

    const finalPrompt = scrapedContent
      ? `Context:\n${scrapedContent}\n\nQuestion:\n${prompt}`
      : prompt;

    const response = await step.run("generate-text", async () => {
      return await generateText({
        model: ollama("qwen2.5-coder:7b"),
        prompt: finalPrompt,
      });
    });

    return response;
  }
);

export const demoError = inngest.createFunction(
  { id: "demo-error" },
  { event: "demo/error" },
  async ({ step }) => {
    await step.run("fail", async () => {
      throw new Error("Inngest error: Something went wrong on the server!");
    });
  }
);