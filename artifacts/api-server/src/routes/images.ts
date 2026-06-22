import { Router } from "express";
import { GenerateImageBody } from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router = Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";

function sizeToDimensions(size: string): { width: number; height: number } {
  switch (size) {
    case "1536x1024":
      return { width: 1536, height: 1024 };
    case "1024x1536":
      return { width: 1024, height: 1536 };
    default:
      return { width: 1024, height: 1024 };
  }
}

// POST /images/generate
router.post("/images/generate", async (req, res) => {
  const parsed = GenerateImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { prompt, size = "1024x1024", style } = parsed.data;

  try {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const { width, height } = sizeToDimensions(size);
    const fullPrompt = style
      ? `${prompt} in ${style} style, highly detailed, professional quality, masterpiece, best quality, crisp, sharp focus`
      : `${prompt}, highly detailed, professional quality, masterpiece, best quality, crisp, sharp focus`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: fullPrompt }],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      throw new Error(`Gemini API returned ${geminiRes.status}: ${errBody}`);
    }

    const geminiData = (await geminiRes.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ inlineData?: { data: string }; text?: string }>;
        };
      }>;
    };

    const parts = geminiData.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData?.data);
    const b64_json = imagePart?.inlineData?.data;

    if (!b64_json) {
      throw new Error("Gemini returned no image data");
    }

    res.json({
      id: randomUUID(),
      prompt,
      b64_json,
      size,
      style: style ?? null,
      createdAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    req.log.error({ err }, "Image generation failed");
    const message =
      err instanceof Error ? err.message : "Image generation failed";
    res.status(500).json({ error: message });
  }
});

export default router;
