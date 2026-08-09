import apiClient from "./client";

export const updateLocation = (latitude, longitude) =>
  apiClient.post("/api/location/update", { latitude, longitude }).then((r) => r.data);

export const startShare = (hours = 4) =>
  apiClient.post("/api/location/share/start", null, { params: { hours } }).then((r) => r.data);

export const stopShare = () => apiClient.post("/api/location/share/stop");

export const getSharedLocation = (token) =>
  apiClient.get(`/api/location/share/${token}`).then((r) => r.data);
