/**
 * DocumentSidebar — lists uploaded RAG documents with status badges (READY/PROCESSING/FAILED)
 * and a delete button. Embeds PdfUploadDropzone at the top for adding new documents.
 */
import { Trash2 } from 'lucide-react';
import PdfUploadDropzone from './PdfUploadDropzone';
import styles from './DocumentSidebar.module.css';

const STATUS_LABELS = {
  ready: 'READY',
  processing: 'PROCESSING',
  failed: 'FAILED',
};

function DocumentSidebar({ documents, isLoading, error, selectedId, onSelect, onUploadComplete, onDelete }) {
  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.heading}>Library</h2>
      <p className={styles.subheading}>
        Add PDFs here. Processing runs once per upload.
      </p>

      <PdfUploadDropzone onUploadComplete={onUploadComplete} />

      {isLoading && (
        <p className={styles.statusMessage}>Loading your library...</p>
      )}

      {!isLoading && error && (
        <p className={styles.errorMessage}>Could not load documents.</p>
      )}

      {!isLoading && !error && documents.length === 0 && (
        <p className={styles.statusMessage}>
          Your library is empty. Upload a PDF to index it for search and
          Q&amp;A.
        </p>
      )}

      {!isLoading && !error && documents.length > 0 && (
        <ul className={styles.list}>
          {documents.map((doc, index) => (
            <li key={doc.id || `doc-${index}`}>
              <button
                type="button"
                className={`${styles.docCard} ${
                  doc.id === selectedId ? styles.docCardSelected : ''
                }`}
                onClick={() => onSelect(doc)}
              >
                <div className={styles.docCardBody}>
                  <span className={styles.docName}>{doc.name}</span>
                  <span
                    className={`${styles.badge} ${
                      styles[`badge--${doc.status}`]
                    }`}
                  >
                    {STATUS_LABELS[doc.status] || doc.status}
                  </span>
                </div>
                {onDelete && (
                  <span
                    className={styles.deleteBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(doc.id);
                    }}
                    title="Delete document"
                  >
                    <Trash2 size={14} />
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

export default DocumentSidebar;