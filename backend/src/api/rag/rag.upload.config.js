import fs from "fs";
import path from "path";

// This function returns the absolute path to the root of the uploads directory.
// It is used to construct absolute paths to files stored in the uploads directory.
export function uploadRoot() {
  const raw = process.env.RAG_UPLOAD_DIR || path.join("uploads", "rag");
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}
