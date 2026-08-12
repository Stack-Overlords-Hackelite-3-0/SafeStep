import apiClient from "./client";

export const getNearbyPublicPlaces = (lat, lng, radiusKm = 5) =>
  apiClient
    .get("/api/public-places/nearby", { params: { lat, lng, radius_km: radiusKm } })
    .then((r) => r.data);
