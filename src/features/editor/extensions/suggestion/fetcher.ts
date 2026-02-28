import ky from "ky";
import { toast } from "sonner";
import { z } from "zod";
const suggestionRequestSchema = z.object({
  fileName: z.string(),
  previousLines: z.string(),
  currentLine: z.string(),
  lineNumber: z.number(),
  textBeforeCursor: z.string(),
  textAfterCursor: z.string(),
  nextLines: z.string(),
  code: z.string(),
});

const suggestionResponeSchema = z.object({
  suggestion: z.string(),
});

type SuggestionRequest = z.infer<typeof suggestionRequestSchema>;
type SuggestionResponse = z.infer<typeof suggestionResponeSchema>;

export const fetcher = async (
  payload: SuggestionRequest,
  signal: AbortSignal,
): Promise<string | null> => {
  try {
    const validatedPayload = suggestionRequestSchema.parse(payload);
    const response = await ky
      .post("/api/suggestion", {
        json: validatedPayload,
        signal,
        timeout: 10_000,
        retry: 0,
      })
      .json<SuggestionResponse>()
    const validatedResponse = suggestionResponeSchema.parse(response);
    return validatedResponse.suggestion || null;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return null;
    }
    toast.error("Failed to generate suggestion");
    return null;
  }
}