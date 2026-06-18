import { useEffect, useState } from "react";
import {
  Search,
  Sparkles,
  Loader2,
  AlertCircle,
  Eye,
} from "lucide-react";
import { ragService } from "../../services/rag/rag.service.js";
import RagAnswerBody from "../../components/RagAnswerBody/RagAnswerBody.jsx";
import styles from "./RagDocuments.module.css";

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: "ask",     label: "Ask AI",  Icon: Sparkles },
  { id: "search",  label: "Search",  Icon: Search   },
  { id: "preview", label: "Preview", Icon: Eye      },
];

export default function RagDocuments() {

  // activeDocument is set by the left-column library (friend's task).
  // Shape: { id, status: "ready" | "processing", name, ... }
  const [activeDocument, setActiveDocument] = useState(null);

  // ── My state: 3-tab reader ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("ask");

  const [aiQuery,   setAiQuery]   = useState("");
  const [aiAnswer,  setAiAnswer]  = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError,   setAiError]   = useState(null);

  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError,   setSearchError]   = useState(null);

  const [pdfUrl,     setPdfUrl]     = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError,   setPdfError]   = useState(false);

  // ─── Reset reader state when selected document changes ────────────────────
  useEffect(() => {
    setActiveTab("ask");
    setAiQuery("");
    setAiAnswer("");
    setAiError(null);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
    setPdfError(false);

    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }

    if (activeDocument?.status === "ready") {
      loadPdfPreview(activeDocument.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDocument?.id]);

  // ─── Revoke blob URL on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  }, [pdfUrl]);

  // ─── My service calls ─────────────────────────────────────────────────────

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

  async function handleAskAI() {
    if (!activeDocument || !aiQuery.trim()) return;
    try {
      setAiLoading(true);
      setAiError(null);
      setAiAnswer("");
      const data = await ragService.queryDocument(activeDocument.id, aiQuery.trim());
      setAiAnswer(data.answer || data.response || "");
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
      setSearchResults(data.results || data.chunks || data || []);
    } catch (err) {
      console.error(err);
      setSearchError("Search failed.");
    } finally {
      setSearchLoading(false);
    }
  }

  // ─── Right column: empty state / processing / tabs ───────────────────────

  function renderRightColumn() {
    if (!activeDocument) {
      return (
        <div className={styles.emptyStateOuter}>
          <div className={styles.emptyState}>
            <p>
              Choose a document from the library to open the reader, run
              semantic search over its text, and ask questions with AI-assisted
              answers grounded in that file.
            </p>
          </div>
        </div>
      );
    }

    if (activeDocument.status !== "ready") {
      return (
        <div className={styles.processingState}>
          <Loader2 size={32} className={`${styles.spinIcon} ${styles.largeSpin}`} />
          <h3>Processing document…</h3>
          <p>
            Your document is being indexed. This may take a few moments.
            Please wait or check back later.
          </p>
        </div>
      );
    }

    return (
      <div className={styles.readerContainer}>
        <div className={styles.tabBar}>
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`${styles.tabBtn} ${activeTab === id ? styles.tabBtnActive : ""}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
        <div className={styles.tabPanel}>
          {activeTab === "ask"     && renderAskAI()}
          {activeTab === "search"  && renderSearch()}
          {activeTab === "preview" && renderPreview()}
        </div>
      </div>
    );
  }

  function renderAskAI() {
    return (
      <div className={styles.tabContent}>
        <h3 className={styles.sectionTitle}>Ask with AI</h3>
        <p className={styles.sectionSubtitle}>
          Answers use only retrieved excerpts from this PDF, with citations
          where possible. When the document includes code, the reply may show
          it in formatted blocks you can copy.
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
            {aiLoading ? <Loader2 size={16} className={styles.spinIcon} /> : <Sparkles size={16} />}
            Ask
          </button>
        </div>
        {aiError && <div className={styles.errorBanner}>{aiError}</div>}
        {aiAnswer && (
          <div className={styles.answerContainer}>
            <RagAnswerBody answer={aiAnswer} />
          </div>
        )}
      </div>
    );
  }

  function renderSearch() {
    return (
      <div className={styles.tabContent}>
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
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
          />
          <button
            className={styles.searchBtn}
            onClick={handleSearch}
            disabled={searchLoading || !searchQuery.trim()}
          >
            {searchLoading ? <Loader2 size={16} className={styles.spinIcon} /> : <Search size={16} />}
            Search
          </button>
        </div>
        {searchError && <div className={styles.errorBanner}>{searchError}</div>}
        {searchResults.length > 0 && (
          <div className={styles.resultsContainer}>
            <h4 className={styles.resultsTitle}>Results ({searchResults.length})</h4>
            {searchResults.map((result, index) => (
              <div key={index} className={styles.resultCard}>
                <div className={styles.resultHeader}>
                  <span className={styles.resultIndex}>Chunk {index + 1}</span>
                  {result.score !== undefined && (
                    <span className={styles.similarityBadge}>
                      {(result.score * 100).toFixed(1)}% match
                    </span>
                  )}
                </div>
                <p className={styles.resultContent}>
                  {result.content || result.text || result.chunk}
                </p>
                {result.page && (
                  <span className={styles.resultPage}>Page {result.page}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderPreview() {
    return (
      <div className={styles.tabContent}>
        <h3 className={styles.sectionTitle}>Reader</h3>
        <p className={styles.sectionSubtitle}>Inline preview of the selected PDF.</p>
        <div className={styles.previewArea}>
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
            <iframe src={pdfUrl} className={styles.pdfIframe} title="PDF Preview" />
          ) : (
            <div className={styles.previewLoading}>
              <Loader2 size={20} className={styles.spinIcon} />
              <span>Loading…</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Page render ──────────────────────────────────────────────────────────
  return (
    <div className={styles.pageWrapper}>

      {/* Page header */}
      <div className={styles.pageHeader}>
        <span className={styles.breadcrumb}>KNOWLEDGE BASE</span>
        <h1 className={styles.pageTitle}>Private PDF library</h1>
        <p className={styles.pageDescription}>
          Upload study or reference PDFs to your own workspace. Each file is
          indexed for semantic search and optional AI answers that cite passages
          from that document only. File size limits apply on the server; other
          users never see your uploads.
        </p>
      </div>

      {/* Two-column layout */}
      <div className={styles.columns}>

        {/* Left column — friend's task: document list + upload dropzone */}
        <aside className={styles.leftColumn} />

        {/* Right column — my task: 3-tab active view */}
        <main className={styles.rightColumn}>
          {renderRightColumn()}
        </main>

      </div>
    </div>
  );
}
