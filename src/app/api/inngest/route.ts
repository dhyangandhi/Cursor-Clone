import { serve } from "inngest/next";

import { inngest } from "@/innngest/client";
import { demoGenerate } from "@/innngest/functions";
// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    demoGenerate,
  ],
});