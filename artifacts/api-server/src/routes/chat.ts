import { Router } from "express";
import { EnhancePromptBody } from "@workspace/api-zod";
import OpenAI from "openai";

const router = Router();

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const GROK_MODEL = "x-ai/grok-4.3";
const DEEPSEEK_MODEL = "deepseek/deepseek-v4-pro";
const MAX_MESSAGE_LENGTH = 4_000;
const MAX_HISTORY_MESSAGES = 20;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// POST /chat/enhance-prompt — uses Grok
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

// POST /chat/message — SSE streaming chat using DeepSeek (separate from prompt enhancer)
router.post("/chat/message", async (req, res) => {
  const body: unknown = req.body;
  if (!isRecord(body)) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { message, history = [] } = body;
  if (
    typeof message !== "string" ||
    !message.trim() ||
    message.length > MAX_MESSAGE_LENGTH
  ) {
    res.status(400).json({
      error: `Message must be non-empty and no longer than ${MAX_MESSAGE_LENGTH} characters`,
    });
    return;
  }

  if (
    !Array.isArray(history) ||
    history.length > MAX_HISTORY_MESSAGES ||
    history.some(
      (item) =>
        !isRecord(item) ||
        (item.role !== "user" && item.role !== "assistant") ||
        typeof item.content !== "string" ||
        item.content.length > MAX_MESSAGE_LENGTH,
    )
  ) {
    res.status(400).json({
      error: `History must contain up to ${MAX_HISTORY_MESSAGES} valid messages`,
    });
    return;
  }

  const chatHistory = history as Array<{
    role: "user" | "assistant";
    content: string;
  }>;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const chatMessages: Array<{ role: "user" | "assistant"; content: string }> = [
      ...chatHistory,
      { role: "user", content: message.trim() },
    ];

    const stream = await openrouter.chat.completions.create({
      model: DEEPSEEK_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `You are NandiAi Assistant — a creative, helpful AI companion built into NandiAi. You help users with creative ideas, image prompt suggestions, artistic styles, and general questions. Be warm, enthusiastic about creativity, and concise. You are powered by DeepSeek.`,
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
