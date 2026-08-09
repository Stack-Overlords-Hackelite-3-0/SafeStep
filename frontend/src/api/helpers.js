import apiClient from "./client";

export const getNearbyHelpers = (lat, lng, radiusKm = 5) =>
  apiClient
    .get("/api/helpers/nearby", { params: { lat, lng, radius_km: radiusKm } })
    .then((r) => r.data);
