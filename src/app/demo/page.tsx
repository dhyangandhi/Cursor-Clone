"use client";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@base-ui/react";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";

export default function DemoPage() {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);

  const handleBlocking = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/demo/blocking", { method: "POST" });
    } finally {
      setLoading(false);
    }
  };

  const handleBackground = async () => {
    if (loading2) return;
    setLoading2(true);
    try {
      await fetch("/api/demo/background", { method: "POST" });
    } finally {
      setLoading2(false);
    }
  };

  const handleClientError = () => {
    Sentry.logger.info(
      "Client error: Something went wrong in the browser!", { userId }
    )
    throw new Error("Client error: Something went wrong in the browser!");
  };

  const handleApiError = async () => {
    await fetch("/api/demo/error", { method: "POST" });
  };

  const handleInngestError = async () => {
    await fetch("/api/demo/inngest-error", { method: "POST" });
  };

  return (
    <div className="p-8 space-x-4">
      <Button disabled={loading} onClick={handleBlocking}>
        {loading ? "Loading..." : "Blocking"}
      </Button>

      <Button disabled={loading2} onClick={handleBackground}>
        {loading2 ? "Loading..." : "Background"}
      </Button>

      <Button
        className="bg-red-600 text-white hover:bg-red-700"
        onClick={handleClientError}
      >
        Client Error
      </Button>

      <Button
        className="bg-red-600 text-white hover:bg-red-700"
        onClick={handleApiError}
      >
        API Error
      </Button>

      <Button
        className="bg-red-600 text-white hover:bg-red-700"
        onClick={handleInngestError}
      >
        Inngest Error
      </Button>
    </div>
  );
}
  