import { getDb, type LocalChatMessage } from "./db";

export async function getAllChatMessages(): Promise<LocalChatMessage[]> {
  const db = await getDb();
  const all = await db.getAllFromIndex("chat_messages", "by_createdAt");
  return all;
}

export async function saveChatMessage(message: LocalChatMessage): Promise<void> {
  const db = await getDb();
  await db.put("chat_messages", message);
}

export async function clearChatMessages(): Promise<void> {
  const db = await getDb();
  await db.clear("chat_messages");
}
