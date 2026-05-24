import { Router } from "express";
import { db, imagesTable } from "@workspace/db";
import { desc, eq, sql, count } from "drizzle-orm";
import {
  GenerateImageBody,
  GetImageHistoryQueryParams,
  GetImageParams,
  DeleteImageParams,
} from "@workspace/api-zod";

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

    const [inserted] = await db
      .insert(imagesTable)
      .values({ prompt, b64_json, size, style: style ?? null })
      .returning();

    res.json({
      id: inserted.id,
      prompt: inserted.prompt,
      b64_json: inserted.b64_json,
      size: inserted.size,
      style: inserted.style ?? null,
      createdAt: inserted.createdAt.toISOString(),
    });
  } catch (err: unknown) {
    req.log.error({ err }, "Image generation failed");
    const message =
      err instanceof Error ? err.message : "Image generation failed";
    res.status(500).json({ error: message });
  }
});

// GET /images/history
router.get("/images/history", async (req, res) => {
  const parsed = GetImageHistoryQueryParams.safeParse({
    limit: req.query.limit ? Number(req.query.limit) : 20,
    offset: req.query.offset ? Number(req.query.offset) : 0,
  });

  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const offset = parsed.success ? (parsed.data.offset ?? 0) : 0;

  const rows = await db
    .select()
    .from(imagesTable)
    .orderBy(desc(imagesTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(
    rows.map((row) => ({
      id: row.id,
      prompt: row.prompt,
      b64_json: row.b64_json,
      size: row.size,
      style: row.style ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
  );
});

// GET /images/stats
router.get("/images/stats", async (req, res) => {
  const [totalRow] = await db.select({ total: count() }).from(imagesTable);

  const [todayRow] = await db
    .select({ today: count() })
    .from(imagesTable)
    .where(sql`DATE(created_at) = CURRENT_DATE`);

  const styleRows = await db
    .select({
      style: imagesTable.style,
      cnt: count(),
    })
    .from(imagesTable)
    .where(sql`style IS NOT NULL`)
    .groupBy(imagesTable.style)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  res.json({
    totalGenerated: totalRow?.total ?? 0,
    todayGenerated: todayRow?.today ?? 0,
    popularStyles: styleRows.map((r) => ({
      style: r.style ?? "",
      count: r.cnt,
    })),
  });
});

// GET /images/:id
router.get("/images/:id", async (req, res) => {
  const parsed = GetImageParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [row] = await db
    .select()
    .from(imagesTable)
    .where(eq(imagesTable.id, parsed.data.id));

  if (!row) {
    res.status(404).json({ error: "Image not found" });
    return;
  }

  res.json({
    id: row.id,
    prompt: row.prompt,
    b64_json: row.b64_json,
    size: row.size,
    style: row.style ?? null,
    createdAt: row.createdAt.toISOString(),
  });
});

// DELETE /images/:id
router.delete("/images/:id", async (req, res) => {
  const parsed = DeleteImageParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  await db.delete(imagesTable).where(eq(imagesTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
