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

async function generateWithGemini(
  prompt: string,
  aspectRatio: "1:1" | "3:2" | "2:3",
  style: string | null
): Promise<{ b64_json: string; mime_type: string }> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

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
          imageConfig: { aspectRatio },
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
        parts?: Array<{
          inlineData?: { data: string; mimeType?: string };
          text?: string;
        }>;
      };
    }>;
  };

  const parts = geminiData.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData?.data);
  const b64_json = imagePart?.inlineData?.data;
  const mime_type = imagePart?.inlineData?.mimeType ?? "image/png";

  if (!b64_json) {
    throw new Error("Gemini returned no image data");
  }

  if (!mime_type.startsWith("image/")) {
    throw new Error("Gemini returned an unsupported image format");
  }

  return { b64_json, mime_type };
}

async function generateWithPollinations(
  prompt: string,
  width: number,
  height: number,
  style: string | null
): Promise<{ b64_json: string; mime_type: string }> {
  const fullPrompt = style
    ? `${prompt}, ${style} style, highly detailed, professional quality, masterpiece, best quality, crisp, sharp focus`
    : `${prompt}, highly detailed, professional quality, masterpiece, best quality, crisp, sharp focus`;

  const encodedPrompt = encodeURIComponent(fullPrompt);
  const seed = Math.floor(Math.random() * 1_000_000);
  const encodedNegative = encodeURIComponent("blurry, low quality, watermark, text, deformed, ugly, duplicate, watermark, signature");

  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true&model=flux&turbo=false&negative_prompt=${encodedNegative}`;

  const imageResponse = await fetch(imageUrl, {
    signal: AbortSignal.timeout(120_000),
  });
  if (!imageResponse.ok) {
    throw new Error(`Pollinations API returned ${imageResponse.status}`);
  }

  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  if (imageBuffer.length === 0) {
    throw new Error("Pollinations returned an empty image");
  }
  const b64_json = imageBuffer.toString("base64");
  const responseMimeType = imageResponse.headers
    .get("content-type")
    ?.split(";")[0]
    .trim();
  const mime_type =
    responseMimeType?.startsWith("image/") ? responseMimeType : "image/jpeg";

  return { b64_json, mime_type };
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
    const { width, height } = sizeToDimensions(size);
    const aspectRatio =
      width > height ? "3:2" : width < height ? "2:3" : "1:1";

    let generated: { b64_json: string; mime_type: string };
    try {
      // Try Gemini first (Nano Banana)
      generated = await generateWithGemini(
        prompt,
        aspectRatio,
        style ?? null
      );
      req.log.info("Image generated with Gemini Nano Banana");
    } catch (geminiErr) {
      req.log.warn({ err: geminiErr }, "Gemini failed, falling back to Pollinations.ai");
      // Fallback to Pollinations.ai (free, no API key)
      generated = await generateWithPollinations(
        prompt,
        width,
        height,
        style ?? null
      );
      req.log.info("Image generated with Pollinations.ai (fallback)");
    }

    res.json({
      id: randomUUID(),
      prompt,
      b64_json: generated.b64_json,
      mime_type: generated.mime_type,
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
