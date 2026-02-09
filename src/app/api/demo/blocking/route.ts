
import { generateText }from "ai";
import { google } from "@ai-sdk/google";

export async function POST() {
  const response = await generateText({
  model: google('gemini-2.5-flash'),
  prompt: 'What should I pass diploma without studing?',
  experimental_telemetry: {
    isEnabled: true,
    recordInputs: true,
    recordOutputs: true,
  },
});
    return Response.json({ response });
};