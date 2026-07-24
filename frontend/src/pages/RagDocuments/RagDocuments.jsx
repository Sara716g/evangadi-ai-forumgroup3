/**
 * RagDocuments — RAG knowledge-base page. Left sidebar lists uploaded PDFs with
 * status badges; main area shows PDF viewer with zoom/rotate controls, semantic
 * search, AI Q&A panel, and document retry/delete actions.
 */
import { useState, useEffect, useRef } from "react";
import {
  Search,
  Sparkles,
  Loader2,
  AlertCircle,
  RotateCcw,
  RotateCw,
  Download,
  Menu,
  Printer,
  Undo2,
  Redo2,
  Pencil,
  MoreVertical,
  Square,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ragService } from "../../services/rag/rag.service.js";
import RagAnswerBody from "../../components/RagAnswerBody/RagAnswerBody.jsx";
import DocumentSidebar from "../../components/RagDocuments/DocumentSidebar.jsx";
import styles from "./RagDocuments.module.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function ReaderPanel({ activeDocument }) {
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fitToWidth, setFitToWidth] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const containerRef = useRef(null);
  const pdfContentRef = useRef(null);
  const thumbnailContainerRef = useRef(null);
  const moreMenuRef = useRef(null);
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const pdfPageWidth = 612;

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

  useEffect(() => {
    if (fitToWidth && pdfContentRef.current) {
      const containerWidth = pdfContentRef.current.clientWidth - 40;
      const newScale = containerWidth / pdfPageWidth;
      setScale(parseFloat(newScale.toFixed(2)));
    }
  }, [fitToWidth, numPages]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function pushToUndo() {
    setUndoStack((prev) => [...prev, { scale, rotation, currentPage }]);
    setRedoStack([]);
  }

  function handleUndo() {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, { scale, rotation, currentPage }]);
    setUndoStack((u) => u.slice(0, -1));
    setScale(prev.scale);
    setRotation(prev.rotation);
    setCurrentPage(prev.currentPage);
  }

  function handleRedo() {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, { scale, rotation, currentPage }]);
    setRedoStack((r) => r.slice(0, -1));
    setScale(next.scale);
    setRotation(next.rotation);
    setCurrentPage(next.currentPage);
  }

  function onDocumentLoadSuccess({ numPages: total }) {
    setNumPages(total);
    setCurrentPage(1);
  }

// eslint-disable-next-line no-unused-vars
  function goToPrevPage() {
    pushToUndo();
    setCurrentPage((p) => Math.max(p - 1, 1));
  }

  // eslint-disable-next-line no-unused-vars
  function goToNextPage() {
    pushToUndo();
    setCurrentPage((p) => Math.min(p + 1, numPages || 1));
  }

  function zoomIn() {
    pushToUndo();
    setScale((s) => Math.min(s + 0.15, 3));
    setFitToWidth(false);
  }

  function zoomOut() {
    pushToUndo();
    setScale((s) => Math.max(s - 0.15, 0.3));
    setFitToWidth(false);
  }

  function rotateLeft() {
    pushToUndo();
    setRotation((r) => (r - 90 + 360) % 360);
  }

  function toggleFitToWidth() {
    pushToUndo();
    setFitToWidth((f) => !f);
  }

  function toggleDrawing() {
    setIsDrawing((d) => !d);
  }

  function handleMoreActions(action) {
    setShowMoreMenu(false);
    if (action === "properties") {
      alert(`Document: ${activeDocument?.title}\nPages: ${numPages}\nStatus: ${activeDocument?.status}`);
    } else if (action === "share") {
      if (navigator.share) {
        navigator.share({ title: activeDocument?.title, url: window.location.href });
      }
    }
  }

  function downloadPdf() {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = activeDocument?.title || "document.pdf";
    a.click();
  }

  function printPdf() {
    if (!pdfUrl) return;
    window.open(pdfUrl, "_blank");
  }

  useEffect(() => {
    if (!isDrawing || !canvasRef.current || !pdfContentRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const container = pdfContentRef.current;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }

    function startDrawing(e) {
      isDrawingRef.current = true;
      lastPosRef.current = getPos(e);
    }

    function draw(e) {
      if (!isDrawingRef.current) return;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = "#ea580c";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      lastPosRef.current = pos;
    }

    function stopDrawing() {
      isDrawingRef.current = false;
    }

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseleave", stopDrawing);
    };
  }, [isDrawing]);

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
      <div className={styles.pdfViewerContainer} ref={containerRef}>
        <div className={styles.pdfToolbar}>
          <div className={styles.pdfToolbarLeft}>
            <button
              className={styles.toolbarBtn}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle sidebar"
            >
              <Menu size={18} />
            </button>
            <span className={styles.pdfFileName}>
              {activeDocument?.title || activeDocument?.name || "document.pdf"}
            </span>
          </div>
          <div className={styles.pdfToolbarCenter}>
            <button className={styles.toolbarBtn} onClick={zoomOut} title="Zoom out">
              <span className={styles.zoomSymbol}>-</span>
            </button>
            <span className={styles.zoomInfo}>{Math.round(scale * 100)}%</span>
            <button className={styles.toolbarBtn} onClick={zoomIn} title="Zoom in">
              <span className={styles.zoomSymbol}>+</span>
            </button>
            <div className={styles.toolbarDivider} />
            <button 
              className={`${styles.toolbarBtn} ${fitToWidth ? styles.toolbarBtnActive : ''}`} 
              onClick={toggleFitToWidth} 
              title="Fit to width"
            >
              <Square size={14} />
            </button>
            <button className={styles.toolbarBtn} onClick={rotateLeft} title="Rotate counter-clockwise">
              <RotateCcw size={16} />
            </button>
            <button 
              className={`${styles.toolbarBtn} ${isDrawing ? styles.toolbarBtnActive : ''}`} 
              onClick={toggleDrawing} 
              title="Toggle drawing mode"
            >
              <Pencil size={16} />
            </button>
            <button 
              className={styles.toolbarBtn} 
              onClick={handleUndo} 
              title="Undo"
              disabled={undoStack.length === 0}
            >
              <Undo2 size={16} />
            </button>
            <button 
              className={styles.toolbarBtn} 
              onClick={handleRedo} 
              title="Redo"
              disabled={redoStack.length === 0}
            >
              <Redo2 size={16} />
            </button>
          </div>
          <div className={styles.pdfToolbarRight}>
            <button className={styles.toolbarBtn} onClick={downloadPdf} title="Download">
              <Download size={16} />
            </button>
            <button className={styles.toolbarBtn} onClick={printPdf} title="Print">
              <Printer size={16} />
            </button>
            <div className={styles.moreMenuContainer} ref={moreMenuRef}>
              <button 
                className={styles.toolbarBtn} 
                onClick={() => setShowMoreMenu(!showMoreMenu)} 
                title="More actions"
              >
                <MoreVertical size={16} />
              </button>
              {showMoreMenu && (
                <div className={styles.moreMenu}>
                  <button className={styles.moreMenuItem} onClick={() => handleMoreActions("properties")}>
                    Properties
                  </button>
                  <button className={styles.moreMenuItem} onClick={() => handleMoreActions("share")}>
                    Share Link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.pdfBody}>
          {sidebarOpen && (
            <div className={styles.thumbnailSidebar} ref={thumbnailContainerRef}>
              {pdfUrl && numPages && Array.from({ length: Math.min(numPages, 20) }, (_, i) => i + 1).map((pageNum) => (
                <div
                  key={pageNum}
                  className={`${styles.thumbnailItem} ${
                    pageNum === currentPage ? styles.thumbnailActive : ""
                  }`}
                  onClick={() => { pushToUndo(); setCurrentPage(pageNum); }}
                >
                  <div className={styles.thumbnailPreview}>
                    <Document file={pdfUrl}>
                      <Page
                        pageNumber={pageNum}
                        scale={0.2}
                        rotation={rotation}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </Document>
                  </div>
                  <span className={styles.thumbnailNumber}>{pageNum}</span>
                </div>
              ))}
            </div>
          )}

          <div 
            className={`${styles.pdfContent} ${isDrawing ? styles.drawingMode : ''}`} 
            ref={pdfContentRef}
          >
            {isDrawing && (
              <canvas ref={canvasRef} className={styles.drawingCanvas} />
            )}
            {pdfLoading ? (
              <div className={styles.previewLoading}>
                <Loader2 size={20} className={styles.spinIcon} />
                <span>Loading document preview...</span>
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
                loading={<div className={styles.previewLoading}><Loader2 size={20} className={styles.spinIcon} /><span>Loading PDF...</span></div>}
                error={<div className={styles.previewError}><AlertCircle size={20} /><span>Failed to load PDF.</span></div>}
                className={styles.pdfDocument}
              >
                {numPages && Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                  <div key={pageNum} className={styles.pdfPageWrapper}>
                    <Page
                      pageNumber={pageNum}
                      scale={scale}
                      rotation={rotation}
                      renderTextLayer={!isDrawing}
                      renderAnnotationLayer={true}
                      className={styles.pdfPage}
                    />
                  </div>
                ))}
              </Document>
            ) : (
              <div className={styles.previewLoading}>
                <Loader2 size={20} className={styles.spinIcon} />
                <span>Loading...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.sectionCard}>
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

      <div className={styles.sectionCard}>
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
    </div>
  );
}

export default function RagDocuments() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [activeDocument, setActiveDocument] = useState(null);

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
        errorMessage: doc.error_message || null,
      }));
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to load documents:", err);
      setLoadError("Could not load documents.");
    } finally {
      setIsLoading(false);
    }
  }

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
            errorMessage: doc.error_message || null,
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

  function handleSelectDocument(doc) {
    setActiveDocument(doc);
  }

  function handleUploadComplete(uploadedDoc) {
    const doc = {
      id: uploadedDoc.document_id || uploadedDoc.id,
      name: uploadedDoc.title || uploadedDoc.name,
      title: uploadedDoc.title || uploadedDoc.name,
      status: uploadedDoc.status || "processing",
      errorMessage: uploadedDoc.error_message || null,
    };
    setDocuments((prev) => [doc, ...prev]);
    setActiveDocument(doc);
  }

  async function handleRetryDocument(documentId) {
    try {
      const doc = await ragService.retryDocument(documentId);
      const updatedDoc = {
        id: doc.document_id || doc.id,
        name: doc.title || doc.name,
        title: doc.title || doc.name,
        status: doc.status || "processing",
        errorMessage: null,
      };
      setDocuments((prev) =>
        prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
      );
      setActiveDocument(updatedDoc);
    } catch (err) {
      console.error("Failed to retry document:", err);
    }
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
          from that document only. File size limits apply on the server;
          other users never see your uploads.
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
            onDelete={handleDeleteDocument}
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
          ) : activeDocument.status === "failed" ? (
            <div className={styles.failedState}>
              <AlertCircle size={32} />
              <h3>Processing failed</h3>
              <p>
                There was an error processing this document. It may contain no
                extractable text or the embedding service may be temporarily
                unavailable.
              </p>
              <button
                className={styles.retryBtn}
                onClick={() => handleRetryDocument(activeDocument.id)}
              >
                <RotateCw size={16} />
                Retry Processing
              </button>
            </div>
          ) : activeDocument.status !== "ready" ? (
            <div className={styles.processingState}>
              <h3>This document is not ready for preview or AI tools.</h3>
              <p>
                Current status: <strong>{activeDocument.status}</strong>
              </p>
            </div>
          ) : (
            <ReaderPanel
              key={activeDocument.id}
              activeDocument={activeDocument}
            />
          )}
        </main>
      </div>
    </div>
  );
}
