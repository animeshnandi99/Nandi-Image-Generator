import { Router } from "express";
import { db, imagesTable } from "@workspace/db";
import { desc, eq, sql, count } from "drizzle-orm";
import { GenerateImageBody, GetImageHistoryQueryParams, GetImageParams, DeleteImageParams } from "@workspace/api-zod";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /images/generate
router.post("/images/generate", async (req, res) => {
  const parsed = GenerateImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { prompt, size = "1024x1024", style } = parsed.data;

  try {
    const validSize = (
      size === "1024x1024" || size === "1536x1024" || size === "1024x1536"
        ? size
        : "1024x1024"
    ) as "1024x1024" | "1536x1024" | "1024x1536";

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: style ? `${prompt}. Style: ${style}` : prompt,
      size: validSize,
      quality: "standard",
    });

    const b64_json = response.data?.[0]?.b64_json;
    if (!b64_json) {
      res.status(500).json({ error: "No image returned from OpenAI" });
      return;
    }

    const [inserted] = await db
      .insert(imagesTable)
      .values({ prompt, b64_json, size: validSize, style: style ?? null })
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
    const message = err instanceof Error ? err.message : "Image generation failed";
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
    }))
  );
});

// GET /images/stats
router.get("/images/stats", async (req, res) => {
  const [totalRow] = await db
    .select({ total: count() })
    .from(imagesTable);

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
