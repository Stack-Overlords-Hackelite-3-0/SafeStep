import apiClient from "./client";

export const getChatHistory = () => apiClient.get("/api/chatbot/history").then((r) => r.data);

export const clearChatHistory = () => apiClient.delete("/api/chatbot/history");

export const sendChatMessage = (message, language) =>
  apiClient.post("/api/chatbot/message", { message, language }).then((r) => r.data);

export const transcribeAudio = (blob, language) => {
  const form = new FormData();
  form.append("audio", blob, "voice.webm");
  form.append("language", language);
  return apiClient
    .post("/api/chatbot/transcribe", form, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data);
};
