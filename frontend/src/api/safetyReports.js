import apiClient from "./client";

export const listSafetyReports = (bbox) =>
  apiClient.get("/api/safety-reports", { params: bbox }).then((r) => r.data);

export const createSafetyReport = (data) =>
  apiClient.post("/api/safety-reports", data).then((r) => r.data);
