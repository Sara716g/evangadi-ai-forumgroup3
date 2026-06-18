import { useState } from 'react';
import { uploadDocument } from '../../services/rag.service.js';
import styles from './PdfUploadDropzone.module.css';

function PdfUploadDropzone({ onUploadComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  function handleFileChange(event) {
    const file = event.target.files[0] || null;
    setSelectedFile(file);
    setUploadError(null);
  }

  async function handleUploadClick() {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadedDoc = await uploadDocument(selectedFile);
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