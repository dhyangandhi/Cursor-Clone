import { inngest } from "@/inngest/client";

export async function POST() {
  try {
    await inngest.send({
      name: "demo/generate",
      data: {},
    });

    return Response.json({ status: "started" }, { status: 202 });
  } catch (error) {
    console.error("Failed to send Inngest event:", error);
    return Response.json({ error: "failed to start job" }, { status: 500 });
  }
}
