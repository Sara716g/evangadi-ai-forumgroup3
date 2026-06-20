import PdfUploadDropzone from './PdfUploadDropzone';
import styles from './DocumentSidebar.module.css';

const STATUS_LABELS = {
  ready: 'READY',
  processing: 'PROCESSING',
};

function DocumentSidebar({ documents, isLoading, error, selectedId, onSelect, onUploadComplete }) {
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
          {documents.map((doc) => (
            <li key={doc.id}>
              <button
                type="button"
                className={`${styles.docCard} ${
                  doc.id === selectedId ? styles.docCardSelected : ''
                }`}
                onClick={() => onSelect(doc)}
              >
                <span className={styles.docName}>{doc.name}</span>
                <span
                  className={`${styles.badge} ${
                    styles[`badge--${doc.status}`]
                  }`}
                >
                  {STATUS_LABELS[doc.status] || doc.status}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

export default DocumentSidebar;