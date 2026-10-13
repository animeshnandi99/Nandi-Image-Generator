export type { LocalImage, LocalChatMessage } from "./db";
export {
  getAllImages,
  saveImage,
  deleteImage,
  getImageStats,
  getImageMimeType,
} from "./images";
export { getAllChatMessages, saveChatMessage, clearChatMessages } from "./chat";

export const LOCAL_IMAGES_QUERY_KEY = ["local-images"] as const;
export const LOCAL_CHAT_QUERY_KEY = ["local-chat"] as const;
export const LOCAL_STATS_QUERY_KEY = ["local-stats"] as const;
