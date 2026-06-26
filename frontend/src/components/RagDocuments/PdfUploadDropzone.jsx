import { useState } from 'react';
import { ragService } from '../../services/rag/rag.service.js';
import styles from './PdfUploadDropzone.module.css';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function PdfUploadDropzone({ onUploadComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  function handleFileChange(event) {
    const file = event.target.files[0] || null;
    if (file && file.size > MAX_FILE_SIZE) {
      setUploadError(`File is too large. Maximum size is 10 MB. Your file is ${formatFileSize(file.size)}.`);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setUploadError(null);
  }

  async function handleUploadClick() {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadedDoc = await ragService.uploadPdf(selectedFile);
      setSelectedFile(null);
      if (onUploadComplete) {
        onUploadComplete(uploadedDoc);
      }
    } catch (err) {
      setUploadError('Could not upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  function formatFileSize(bytes) {
    const megabytes = bytes / (1024 * 1024);
    return `${megabytes.toFixed(2)} MB`;
  }

  return (
    <div className={styles.dropzone}>
      <p className={styles.hint}>
        Accepted format: PDF. Maximum file size is enforced by the server.
      </p>

      <div className={styles.buttonRow}>
        <label className={styles.chooseFileButton}>
          Choose file
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className={styles.hiddenInput}
            disabled={isUploading}
          />
        </label>

        <button
          type="button"
          className={styles.uploadButton}
          onClick={handleUploadClick}
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {selectedFile ? (
        <div className={styles.fileInfo}>
          <span className={styles.fileName}>{selectedFile.name}</span>
          <span className={styles.fileSize}>{formatFileSize(selectedFile.size)}</span>
        </div>
      ) : (
        <p className={styles.noFileText}>No file selected.</p>
      )}

      {uploadError && <p className={styles.errorText}>{uploadError}</p>}
    </div>
  );
}

export default PdfUploadDropzone;