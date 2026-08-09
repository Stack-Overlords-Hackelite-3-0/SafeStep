import apiClient from "./client";

export const getChatHistory = () => apiClient.get("/api/chatbot/history").then((r) => r.data);

export const sendChatMessage = (message, language) =>
  apiClient.post("/api/chatbot/message", { message, language }).then((r) => r.data);
