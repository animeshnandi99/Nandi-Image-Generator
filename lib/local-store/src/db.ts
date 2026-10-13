import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface LocalImage {
  id: string;
  prompt: string;
  b64_json: string;
  mime_type?: string;
  size: string;
  style: string | null;
  createdAt: string;
}

export interface LocalChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface NandiDb extends DBSchema {
  images: {
    key: string;
    value: LocalImage;
    indexes: { by_createdAt: string };
  };
  chat_messages: {
    key: string;
    value: LocalChatMessage;
    indexes: { by_createdAt: string };
  };
}

let dbPromise: Promise<IDBPDatabase<NandiDb>> | null = null;

export function getDb(): Promise<IDBPDatabase<NandiDb>> {
  if (!dbPromise) {
    dbPromise = openDB<NandiDb>("nandi-ai", 1, {
      upgrade(db) {
        const imageStore = db.createObjectStore("images", { keyPath: "id" });
        imageStore.createIndex("by_createdAt", "createdAt");

        const chatStore = db.createObjectStore("chat_messages", { keyPath: "id" });
        chatStore.createIndex("by_createdAt", "createdAt");
      },
    });
  }
  return dbPromise;
}
