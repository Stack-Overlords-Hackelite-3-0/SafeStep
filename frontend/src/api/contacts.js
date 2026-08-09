import apiClient from "./client";

export const listContacts = () => apiClient.get("/api/contacts").then((r) => r.data);

export const createContact = (data) => apiClient.post("/api/contacts", data).then((r) => r.data);

export const updateContact = (id, data) =>
  apiClient.patch(`/api/contacts/${id}`, data).then((r) => r.data);

export const deleteContact = (id) => apiClient.delete(`/api/contacts/${id}`);
