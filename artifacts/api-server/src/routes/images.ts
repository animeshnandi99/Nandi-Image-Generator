import { Router } from "express";
import { GenerateImageBody } from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router = Router();

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
    const { width, height } = sizeToDimensions(size);
    const fullPrompt = style
      ? `${prompt}, ${style} style, highly detailed, professional quality, masterpiece, best quality, crisp, sharp focus`
      : `${prompt}, highly detailed, professional quality, masterpiece, best quality, crisp, sharp focus`;
    const encodedPrompt = encodeURIComponent(fullPrompt);
    const seed = Math.floor(Math.random() * 1_000_000);
    const encodedNegative = encodeURIComponent("blurry, low quality, watermark, text, deformed, ugly, duplicate, watermark, signature");

    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true&model=flux&turbo=false&negative_prompt=${encodedNegative}`;

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Pollinations API returned ${imageResponse.status}`);
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const b64_json = imageBuffer.toString("base64");

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
