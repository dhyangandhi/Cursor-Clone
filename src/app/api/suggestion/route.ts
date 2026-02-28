import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import http from "http";

interface OllamaMessage {
  content: string;
}

interface OllamaResponse {
  message?: OllamaMessage;
}

function callOllama(prompt: string): Promise<OllamaResponse> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: "qwen2.5-coder:3b",
      messages: [
        {
          role: "system",
          content:
            "You are a strict senior TypeScript engineer. Return ONLY raw code. No markdown. No explanation.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: false,
      options: {
        num_predict: 300,
        temperature: 0.2, // lower = more stable output
      },
    });

    const options = {
      hostname: "localhost",
      port: 11434,
      path: "/api/chat",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        if (!body) {
          return reject(new Error("Empty response from Ollama"));
        }

        if (res.statusCode !== 200) {
          return reject(
            new Error(`Ollama error: ${res.statusCode} - ${body}`)
          );
        }

        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch {
          reject(new Error("Invalid JSON from Ollama"));
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Valid code string is required" },
        { status: 400 }
      );
    }

    const prompt = `
Improve the following TypeScript code.

Rules:
- Keep functionality the same.
- Improve readability and structure.
- Fix obvious bugs if any.
- Return ONLY raw code.

Code:
${code}
`;

    const data = await callOllama(prompt);

    const suggestion = data.message?.content?.trim();

    if (!suggestion) {
      return NextResponse.json(
        { error: "No suggestion returned from model" },
        { status: 500 }
      );
    }

    return NextResponse.json({ suggestion });

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("FULL ERROR:", error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Unknown server error" },
      { status: 500 }
    );
  }
}