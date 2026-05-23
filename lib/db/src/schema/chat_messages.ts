import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const chatMessagesTable = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ChatMessage = typeof chatMessagesTable.$inferSelect;
