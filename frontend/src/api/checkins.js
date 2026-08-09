import apiClient from "./client";

export const listCheckIns = () => apiClient.get("/api/checkins").then((r) => r.data);

export const createCheckIn = (data) => apiClient.post("/api/checkins", data).then((r) => r.data);

export const confirmCheckIn = (id) =>
  apiClient.post(`/api/checkins/${id}/confirm`).then((r) => r.data);

export const deleteCheckIn = (id) => apiClient.delete(`/api/checkins/${id}`);
