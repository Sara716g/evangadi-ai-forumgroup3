import { useState } from 'react';
import DocumentSidebar from '../../components/rag-documents/DocumentSidebar';
import styles from './RagDocuments.module.css';

// TEMPORARY fake data — will be replaced by a real backend call later.
const FAKE_DOCUMENTS = [
  { id: 1, name: 'React Routing Notes.pdf', status: 'ready' },
  { id: 2, name: 'Backend Architecture.pdf', status: 'processing' },
];

function RagDocuments() {
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);

  // TEMPORARY: hardcoded for now. Real loading/error will come from an API call later.
  const isLoading = false;
  const error = null;
  const documents = FAKE_DOCUMENTS;

  return (
    <div className={styles.page}>
      <section className={styles.intro}>
        <p className={styles.eyebrow}>KNOWLEDGE BASE</p>
        <h1 className={styles.title}>Private PDF library</h1>
        <p className={styles.description}>
          Upload study or reference PDFs to your own workspace. Each file is
          indexed for semantic search and optional AI answers that cite
          passages from that document only. File size limits apply on the
          server; other users never see your uploads.
        </p>
      </section>

      <div className={styles.columns}>
        <DocumentSidebar
          documents={documents}
          isLoading={isLoading}
          error={error}
          selectedId={selectedDocumentId}
          onSelect={setSelectedDocumentId}
        />

        <section className={styles.readerPlaceholder}>
          <p>
            Choose a document from the library to open the reader, run
            semantic search over its text, and ask questions with
            AI-assisted answers grounded in that file.
          </p>
        </section>
      </div>
    </div>
  );
}

export default RagDocuments;
