import apiClient from "./client";

export const register = (data) => apiClient.post("/api/auth/register", data).then((r) => r.data);

export const login = (email, password) =>
  apiClient.post("/api/auth/login-json", { email, password }).then((r) => r.data);

export const getMe = () => apiClient.get("/api/auth/me").then((r) => r.data);

export const updateMe = (data) => apiClient.patch("/api/auth/me", data).then((r) => r.data);
