import apiClient from "./client";

export const getDirections = (fromLat, fromLng, toLat, toLng, profile = "foot") =>
  apiClient
    .get("/api/directions", { params: { from_lat: fromLat, from_lng: fromLng, to_lat: toLat, to_lng: toLng, profile } })
    .then((r) => r.data);
