import { Router } from "express";
import { EnhancePromptBody } from "@workspace/api-zod";
import OpenAI from "openai";

const router = Router();

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const GROK_MODEL = "x-ai/grok-4.3";

// POST /chat/enhance-prompt
router.post("/chat/enhance-prompt", async (req, res) => {
  const parsed = EnhancePromptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { prompt } = parsed.data;

  try {
    const response = await openrouter.chat.completions.create({
      model: GROK_MODEL,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `You are an expert AI image prompt engineer. Your job is to take a simple image prompt and enhance it into a vivid, detailed, professional-quality prompt for an AI image generator.
Rules:
- Keep the core subject and intent intact
- Add specific details about lighting, mood, style, composition, and atmosphere
- Make it rich and descriptive but concise (2-3 sentences max)
- Do NOT add quotation marks or any prefix like "Enhanced prompt:"
- Return ONLY the enhanced prompt text, nothing else`,
        },
        { role: "user", content: prompt },
      ],
    });

    const enhancedPrompt = response.choices[0]?.message?.content?.trim() ?? prompt;
    res.json({ enhancedPrompt, original: prompt });
  } catch (err: unknown) {
    req.log.error({ err }, "Prompt enhancement failed");
    const message = err instanceof Error ? err.message : "Enhancement failed";
    res.status(500).json({ error: message });
  }
});

// POST /chat/message — SSE streaming chat (stateless, history sent from client)
router.post("/chat/message", async (req, res) => {
  const { message, history } = req.body as {
    message?: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const chatMessages: Array<{ role: "user" | "assistant"; content: string }> = [
      ...(history ?? []),
      { role: "user", content: message.trim() },
    ];

    const stream = await openrouter.chat.completions.create({
      model: GROK_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `You are NandiAi Assistant — a creative, helpful AI built into NandiAi, a text-to-image art generation platform. You help users with creative ideas, image prompt suggestions, artistic styles, and general questions. Be warm, enthusiastic about creativity, and concise.`,
        },
        ...chatMessages,
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: unknown) {
    req.log.error({ err }, "Chat streaming failed");
    const message = err instanceof Error ? err.message : "Chat failed";
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
});

export default router;
