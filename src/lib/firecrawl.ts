import Firecrawl from "@mendable/firecrawl-js";

const apiKey = process.env.FIRECRAWL_API_KEY;

export const firecrawl = apiKey
  ? new Firecrawl({ apiKey })
  : null