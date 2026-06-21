import { useState, useEffect, useRef } from "react";
import {
  Search,
  Sparkles,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Maximize,
  Trash2,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ragService } from "../../services/rag/rag.service.js";
import RagAnswerBody from "../../components/RagAnswerBody/RagAnswerBody.jsx";
import DocumentSidebar from "../../components/rag-documents/DocumentSidebar.jsx";
import styles from "./RagDocuments.module.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function ReaderPanel({ activeDocument, onDelete }) {
  const [activeTab, setActiveTab] = useState("preview");
  const [aiQuery, setAiQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(0.67);
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef(null);

  async function loadPdfPreview(docId) {
    try {
      setPdfLoading(true);
      setPdfError(false);
      const url = await ragService.fetchPdfObjectUrl(docId);
      setPdfUrl(url);
    } catch (err) {
      console.error("Failed to load PDF:", err);
      setPdfUrl(null);
      setPdfError(true);
    } finally {
      setPdfLoading(false);
    }
  }

  useEffect(() => {
    if (activeDocument?.status === "ready") {
      loadPdfPreview(activeDocument.id);
    }
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [activeDocument?.id]);

  function onDocumentLoadSuccess({ numPages: total }) {
    setNumPages(total);
    setCurrentPage(1);
  }

  function goToPrevPage() {
    setCurrentPage((p) => Math.max(p - 1, 1));
  }

  function goToNextPage() {
    setCurrentPage((p) => Math.min(p + 1, numPages || 1));
  }

  function zoomIn() {
    setScale((s) => Math.min(s + 0.15, 3));
  }

  function zoomOut() {
    setScale((s) => Math.max(s - 0.15, 0.3));
  }

  function rotateRight() {
    setRotation((r) => (r + 90) % 360);
  }

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  }

  function downloadPdf() {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = activeDocument?.title || "document.pdf";
    a.click();
  }

  async function handleAskAI() {
    if (!activeDocument || !aiQuery.trim()) return;
    try {
      setAiLoading(true);
      setAiError(null);
      setAiAnswer("");
      const data = await ragService.queryDocument(activeDocument.id, aiQuery.trim());
      const answerData = data.data || data;
      setAiAnswer(answerData.answer || answerData.response || "");
    } catch (err) {
      console.error(err);
      setAiError("Could not get an answer.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSearch() {
    if (!activeDocument || !searchQuery.trim()) return;
    try {
      setSearchLoading(true);
      setSearchError(null);
      setSearchResults([]);
      const data = await ragService.searchInDocument(activeDocument.id, searchQuery.trim());
      const searchData = data.data || data;
      setSearchResults(searchData.results || searchData.chunks || []);
    } catch (err) {
      console.error(err);
      setSearchError("Search failed.");
    } finally {
      setSearchLoading(false);
    }
  }

  return (
    <div className={styles.readerPanel}>
      {/* Document header */}
      <div className={styles.docHeader}>
        <h2 className={styles.docTitle}>{activeDocument?.title || activeDocument?.name || "Document"}</h2>
        <button
          className={styles.deleteBtn}
          onClick={() => onDelete(activeDocument.id)}
          title="Delete document"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>

      {/* Tab navigation */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === "preview" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("preview")}
        >
          Preview
        </button>
        <button
          className={`${styles.tab} ${activeTab === "search" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("search")}
        >
          Search
        </button>
        <button
          className={`${styles.tab} ${activeTab === "ask" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("ask")}
        >
          Ask AI
        </button>
      </div>

      {/* Tab content */}
      <div className={styles.tabContent}>
        {activeTab === "preview" && (
          <div className={styles.pdfViewerWrap} ref={containerRef}>
            <div className={styles.pdfToolbar}>
              <span className={styles.pdfFileName}>
                {activeDocument?.title || activeDocument?.name || "document.pdf"}
              </span>
              <div className={styles.pdfToolbarCenter}>
                <button className={styles.toolbarBtn} onClick={goToPrevPage} disabled={currentPage <= 1}>
                  <ChevronLeft size={16} />
                </button>
                <span className={styles.pageInfo}>{currentPage} / {numPages || "–"}</span>
                <button className={styles.toolbarBtn} onClick={goToNextPage} disabled={currentPage >= (numPages || 1)}>
                  <ChevronRight size={16} />
                </button>
                <div className={styles.toolbarDivider} />
                <button className={styles.toolbarBtn} onClick={zoomOut}>
                  <ZoomOut size={16} />
                </button>
                <span className={styles.zoomInfo}>{Math.round(scale * 100)}%</span>
                <button className={styles.toolbarBtn} onClick={zoomIn}>
                  <ZoomIn size={16} />
                </button>
              </div>
              <div className={styles.pdfToolbarRight}>
                <button className={styles.toolbarBtn} onClick={rotateRight}><RotateCw size={16} /></button>
                <button className={styles.toolbarBtn} onClick={toggleFullscreen}><Maximize size={16} /></button>
                <button className={styles.toolbarBtn} onClick={downloadPdf}><Download size={16} /></button>
              </div>
            </div>

            <div className={styles.pdfContent}>
              {pdfLoading ? (
                <div className={styles.previewLoading}>
                  <Loader2 size={20} className={styles.spinIcon} />
                  <span>Loading document preview…</span>
                </div>
              ) : pdfError ? (
                <div className={styles.previewError}>
                  <AlertCircle size={20} />
                  <span>Failed to load PDF preview.</span>
                </div>
              ) : pdfUrl ? (
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={<div className={styles.previewLoading}><Loader2 size={20} className={styles.spinIcon} /><span>Loading PDF…</span></div>}
                  error={<div className={styles.previewError}><AlertCircle size={20} /><span>Failed to load PDF.</span></div>}
                >
                  <Page
                    pageNumber={currentPage}
                    scale={scale}
                    rotation={rotation}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </Document>
              ) : (
                <div className={styles.previewLoading}>
                  <Loader2 size={20} className={styles.spinIcon} />
                  <span>Loading…</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "search" && (
          <div className={styles.tabSection}>
            <h3 className={styles.sectionTitle}>Semantic search</h3>
            <p className={styles.sectionSubtitle}>
              Finds passages by meaning (embeddings), not only exact keywords.
            </p>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Search query</label>
              <input
                type="text"
                className={styles.textInput}
                placeholder="Describe the topic or phrase you are looking for"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
              <button
                className={styles.searchBtn}
                onClick={handleSearch}
                disabled={searchLoading || !searchQuery.trim()}
              >
                {searchLoading ? (
                  <Loader2 size={16} className={styles.spinIcon} />
                ) : (
                  <Search size={16} />
                )}
                Search
              </button>
            </div>
            {searchError && (
              <div className={styles.errorBanner}>{searchError}</div>
            )}
            {searchResults.length > 0 && (
              <div className={styles.resultsContainer}>
                <h4 className={styles.resultsTitle}>
                  Results ({searchResults.length})
                </h4>
                {searchResults.map((result, index) => (
                  <div key={index} className={styles.resultCard}>
                    <div className={styles.resultHeader}>
                      <span className={styles.resultIndex}>
                        Chunk {index + 1}
                      </span>
                      {result.score !== undefined && (
                        <span className={styles.similarityBadge}>
                          {(result.score * 100).toFixed(1)}% match
                        </span>
                      )}
                    </div>
                    <p className={styles.resultContent}>
                      {result.excerpt || result.content || result.text || result.chunk}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "ask" && (
          <div className={styles.tabSection}>
            <h3 className={styles.sectionTitle}>Ask with AI</h3>
            <p className={styles.sectionSubtitle}>
              Answers use only retrieved excerpts from this PDF, with citations
              where possible.
            </p>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Question</label>
              <textarea
                className={styles.textarea}
                placeholder="Ask a clear question in plain language. If the document does not cover it, the model should say so."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                rows={3}
              />
              <button
                className={styles.askBtn}
                onClick={handleAskAI}
                disabled={aiLoading || !aiQuery.trim()}
              >
                {aiLoading ? (
                  <Loader2 size={16} className={styles.spinIcon} />
                ) : (
                  <Sparkles size={16} />
                )}
                Ask
              </button>
            </div>
            {aiError && (
              <div className={styles.errorBanner}>{aiError}</div>
            )}
            {aiAnswer && (
              <div className={styles.answerContainer}>
                <RagAnswerBody answer={aiAnswer} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RagDocuments() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [activeDocument, setActiveDocument] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (!activeDocument || activeDocument.status === "ready") return;

    const pollInterval = setInterval(async () => {
      try {
        const data = await ragService.getDocument(activeDocument.id);
        const doc = data.data || data;
        const updatedStatus = doc.status;

        if (updatedStatus === "ready" || updatedStatus === "failed") {
          clearInterval(pollInterval);
          const updatedDoc = {
            id: doc.document_id || doc.id,
            name: doc.title || doc.name,
            title: doc.title || doc.name,
            status: updatedStatus,
          };
          setActiveDocument(updatedDoc);
          setDocuments((prev) =>
            prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
          );
        }
      } catch (err) {
        console.error("Polling failed:", err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [activeDocument?.id, activeDocument?.status]);

  async function loadDocuments() {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await ragService.listDocuments();
      const docs = (data.data || data || []).map((doc) => ({
        id: doc.document_id || doc.id,
        name: doc.title || doc.name,
        title: doc.title || doc.name,
        status: doc.status,
      }));
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to load documents:", err);
      setLoadError("Could not load documents.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectDocument(doc) {
    setActiveDocument(doc);
  }

  function handleUploadComplete(uploadedDoc) {
    const doc = {
      id: uploadedDoc.document_id || uploadedDoc.id,
      name: uploadedDoc.title || uploadedDoc.name,
      title: uploadedDoc.title || uploadedDoc.name,
      status: uploadedDoc.status,
    };
    setDocuments((prev) => [doc, ...prev]);
    setActiveDocument(doc);
  }

  async function handleDeleteDocument(documentId) {
    try {
      await ragService.deleteDocument(documentId);
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      if (activeDocument?.id === documentId) {
        setActiveDocument(null);
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <span className={styles.breadcrumb}>KNOWLEDGE BASE</span>
        <h1 className={styles.pageTitle}>Private PDF library</h1>
        <p className={styles.pageDescription}>
          Upload study or reference PDFs to your own workspace. Each file is
          indexed for semantic search and optional AI answers that cite passages
          from that document only.
        </p>
      </div>

      <div className={styles.columns}>
        <aside className={styles.leftColumn}>
          <DocumentSidebar
            documents={documents}
            isLoading={isLoading}
            error={loadError}
            selectedId={activeDocument?.id}
            onSelect={handleSelectDocument}
            onUploadComplete={handleUploadComplete}
          />
        </aside>

        <main className={styles.rightColumn}>
          {!activeDocument ? (
            <div className={styles.emptyState}>
              <p>
                Choose a document from the library to open the reader, run
                semantic search over its text, and ask questions with AI-assisted
                answers grounded in that file.
              </p>
            </div>
          ) : activeDocument.status !== "ready" ? (
            <div className={styles.processingState}>
              <Loader2 size={32} className={`${styles.spinIcon} ${styles.largeSpin}`} />
              <h3>Processing document…</h3>
              <p>
                Your document is being indexed. This may take a few moments.
                Please wait or check back later.
              </p>
            </div>
          ) : (
            <ReaderPanel
              key={activeDocument.id}
              activeDocument={activeDocument}
              onDelete={handleDeleteDocument}
            />
          )}
        </main>
      </div>
    </div>
  );
}
