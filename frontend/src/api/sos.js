import apiClient from "./client";

export const triggerSOS = (data) => apiClient.post("/api/sos/trigger", data).then((r) => r.data);

export const getSOSHistory = () => apiClient.get("/api/sos/history").then((r) => r.data);

export const resolveSOS = (id) => apiClient.post(`/api/sos/${id}/resolve`).then((r) => r.data);
