import { getDb, type LocalImage } from "./db";

export async function getAllImages(): Promise<LocalImage[]> {
  const db = await getDb();
  const all = await db.getAllFromIndex("images", "by_createdAt");
  return all.reverse();
}

export async function saveImage(image: LocalImage): Promise<void> {
  const db = await getDb();
  await db.put("images", image);
}

export async function deleteImage(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("images", id);
}

export async function getImageStats(): Promise<{
  totalGenerated: number;
  todayGenerated: number;
  popularStyles: Array<{ style: string; count: number }>;
}> {
  const db = await getDb();
  const all = await db.getAll("images");

  const today = new Date().toDateString();
  const todayCount = all.filter((img) => new Date(img.createdAt).toDateString() === today).length;

  const styleCounts = new Map<string, number>();
  for (const img of all) {
    if (img.style) {
      styleCounts.set(img.style, (styleCounts.get(img.style) ?? 0) + 1);
    }
  }

  const popularStyles = Array.from(styleCounts.entries())
    .map(([style, count]) => ({ style, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalGenerated: all.length,
    todayGenerated: todayCount,
    popularStyles,
  };
}
