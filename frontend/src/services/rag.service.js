import { apiClient } from "./core/api.client.js";

const BASE_PATH = "/api/rag/documents";

export async function uploadDocument(file) {
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

// Not an apiClient call — builds a direct URL for <iframe>/<embed> PDF preview.
export function getDocumentFileUrl(documentId) {
  const baseURL = apiClient.defaults.baseURL;
  return `${baseURL}${BASE_PATH}/${documentId}/file`;
}

export async function deleteDocument(documentId) {
  const res = await apiClient.delete(`${BASE_PATH}/${documentId}`);
  return res.data;
}

export async function searchDocument(documentId, query) {
  const res = await apiClient.get(`${BASE_PATH}/${documentId}/search`, {
    params: { query },
  });
  return res.data;
}

export async function askDocument(documentId, question) {
  const res = await apiClient.post(`${BASE_PATH}/${documentId}/query`, {
    question,
  });
  return res.data;
}

export default {
  uploadDocument,
  listDocuments,
  getDocument,
  getDocumentFileUrl,
  deleteDocument,
  searchDocument,
  askDocument,
};