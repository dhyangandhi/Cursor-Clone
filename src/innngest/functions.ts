import { google } from "@ai-sdk/google";
import { inngest } from "./client";
import { generateText } from "ai";
import { firecrawl } from "@/src/lib/firecrawl";
 
const URL_REGEX = /https?:\/\/[^\s]+/g;
export const demoGenerate = inngest.createFunction(
  { id: "demo-generate" },
  { event: "demo/generate" },
  async ({ event, step }) => {
        const { prompt } = event.data as { prompt: string };

        const urls = await step.run("extracting-urls", async () => {
            return prompt.match(URL_REGEX) ?? [];
        }) as string[];

        const scrapedContant = await step.run("scraping-content", async () => {
            const result = await Promise.all(
                urls.map(async (url) => {
                    const result = await firecrawl.scrape(url, { formats: ["markdown"] })
                    return result.markdown ?? null;
                })
            )
            return result.filter(Boolean).join("\n\n");
        });

        const finalPrompt = scrapedContant
            ? `context:\n${scrapedContant}\n\nQuestion: ${prompt}`
            : prompt;

        await step.run("Generating content...", async () => ({
            result: await generateText({
            model: google('gemini-2.5-flash'),
            prompt: finalPrompt,
        })
    })
        );
    }
);