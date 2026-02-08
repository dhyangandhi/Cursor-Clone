import { inngest } from "@/innngest/client";

export async function POST() {
  await inngest.send({
    name: "demo/generate",
    data: {},
  });
    return Response.json({ status: "started" });
};