import apiClient from "./client";

export const listContacts = () => apiClient.get("/api/contacts").then((r) => r.data);

export const createContact = (data) => apiClient.post("/api/contacts", data).then((r) => r.data);

export const updateContact = (id, data) =>
  apiClient.patch(`/api/contacts/${id}`, data).then((r) => r.data);

export const deleteContact = (id) => apiClient.delete(`/api/contacts/${id}`);

export const listInvitations = () => apiClient.get("/api/contacts/invitations").then((r) => r.data);

export const acceptInvitation = (id) =>
  apiClient.post(`/api/contacts/invitations/${id}/accept`).then((r) => r.data);

export const declineInvitation = (id) =>
  apiClient.post(`/api/contacts/invitations/${id}/decline`).then((r) => r.data);
