import { apiClient } from "../core/api.client.js";

export const ragService = {
  listDocuments() {
    return apiClient.get("/api/rag/documents").then((r) => r.data);
  },

  uploadPdf(file) {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient
      .post("/api/rag/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  deleteDocument(documentId) {
    return apiClient
      .delete(`/api/rag/documents/${documentId}`)
      .then((r) => r.data);
  },

  searchInDocument(documentId, query) {
    return apiClient
      .get(`/api/rag/documents/${documentId}/search`, { params: { q: query } })
      .then((r) => r.data);
  },

  queryDocument(documentId, query) {
    return apiClient
      .post(`/api/rag/documents/${documentId}/query`, { query })
      .then((r) => r.data);
  },

  fetchPdfObjectUrl(documentId) {
    return apiClient
      .get(`/api/rag/documents/${documentId}/file`, { responseType: "blob" })
      .then((r) => {
        const blob = new Blob([r.data], { type: "application/pdf" });
        return URL.createObjectURL(blob);
      });
  },
};
