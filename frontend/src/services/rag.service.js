import { apiClient } from "./core/api.client.js";

const BASE_PATH = "/api/rag/documents";

export async function uploadPdf(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiClient.post(BASE_PATH, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function listDocuments() {
  const res = await apiClient.get(BASE_PATH);
  return res.data;
}

export async function getDocument(documentId) {
  const res = await apiClient.get(`${BASE_PATH}/${documentId}`);
  return res.data;
}

export async function deleteDocument(documentId) {
  const res = await apiClient.delete(`${BASE_PATH}/${documentId}`);
  return res.data;
}

export async function searchInDocument(documentId, query) {
  const res = await apiClient.get(`${BASE_PATH}/${documentId}/search`, {
    params: { query },
  });
  return res.data;
}

export async function queryDocument(documentId, query) {
  const res = await apiClient.post(`${BASE_PATH}/${documentId}/query`, {
    query,
  });
  return res.data;
}

export async function fetchPdfObjectUrl(documentId) {
  const res = await apiClient.get(`${BASE_PATH}/${documentId}/file`, {
    responseType: "blob",
  });
  return URL.createObjectURL(res.data);
}

export const ragService = {
  uploadPdf,
  listDocuments,
  getDocument,
  deleteDocument,
  searchInDocument,
  queryDocument,
  fetchPdfObjectUrl,
};

export default ragService;