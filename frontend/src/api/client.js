import axios from "axios";
import { Capacitor } from "@capacitor/core";

// On a real device/emulator "localhost" refers to the device itself, not the dev
// machine — the Android emulator's documented alias for the host's localhost is
// 10.0.2.2. Set VITE_API_BASE_URL explicitly for a physical device or a real
// backend URL; this default only helps the common emulator-during-dev case.
const nativeDefault = Capacitor.isNativePlatform() ? "http://10.0.2.2:8000" : "http://localhost:8000";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || nativeDefault;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("safestep_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("safestep_token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
