import { useState } from "react";
import { apiClient } from "../../services/core/api.client.js";

// ── Service layer ─────────────────────────────────────────────────────────────
const questionService = {
  generateQuestionDraftCoach: async ({ title, content }) => {
    const res = await fetch("/api/questions/draft-coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Server error ${res.status}`);
    }
    return res.json();
  },

  createQuestion: async ({ title, content }) => {
    const response = await apiClient.post("/api/questions", {
      title,
      content,
    });
    return response.data;
  },
};

// ── Validation ────────────────────────────────────────────────────────────────
function validate(title, content) {
  const errors = {};
  if (!title || title.trim().length < 5)
    errors.title = "Question title must be at least 5 characters";
  if (!content || content.trim().length < 10)
    errors.content = "Question content must be at least 10 characters";
  return errors;
}

// ── Toolbar button ────────────────────────────────────────────────────────────
function ToolbarBtn({ label, children, onClick }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      style={{
        background: "none", border: "none", cursor: "pointer",
        padding: "4px 7px", borderRadius: 4, color: "#555",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f0")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
    >
      {children}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PostQuestion() {
  const [formData, setFormData]       = useState({ title: "", content: "" });
  const [errors, setErrors]           = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCoaching, setIsCoaching]   = useState(false);
  const [coachFeedback, setCoachFeedback] = useState(null);
  const [showCoach, setShowCoach]     = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [coachError, setCoachError]   = useState("");

  const charCount = formData.content.length;

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    if (submitError) setSubmitError("");
  };

  const applyFormat = (tag) => {
    const ta = document.getElementById("ev-content");
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const selected = formData.content.slice(start, end);
    let insertion = "";
    if (tag === "bold")   insertion = `**${selected || "bold text"}**`;
    else if (tag === "italic") insertion = `*${selected || "italic text"}*`;
    else if (tag === "code")   insertion = `\`\`\`\n${selected || "code here"}\n\`\`\``;
    else if (tag === "link")   insertion = `[${selected || "link text"}](url)`;
    const newContent =
      formData.content.slice(0, start) + insertion + formData.content.slice(end);
    setFormData((prev) => ({ ...prev, content: newContent }));
  };

  const handleAiCoach = async () => {
    const validationErrors = validate(formData.title, formData.content);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setIsCoaching(true);
    setCoachError("");
    setCoachFeedback(null);
    try {
      const result = await questionService.generateQuestionDraftCoach(formData);
      setCoachFeedback(result);
      setShowCoach(true);
    } catch {
      setCoachError("Could not reach AI service. Please try again.");
    } finally {
      setIsCoaching(false);
    }
  };

  const applyImprovedBody = () => {
    if (coachFeedback?.improvedBody) {
      setFormData((prev) => ({ ...prev, content: coachFeedback.improvedBody }));
      setShowCoach(false);
      setCoachFeedback(null);
    }
  };

  const handleSubmit = async () => {
    const validationErrors = validate(formData.title, formData.content);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setIsSubmitting(true);
    setSubmitError("");
    try {
      await questionService.createQuestion(formData);
      setSubmitSuccess(true);
    } catch (err) {
      setSubmitError(err.message || "Failed to post question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({ title: "", content: "" });
    setErrors({});
    setSubmitSuccess(false);
    setCoachFeedback(null);
    setShowCoach(false);
    setSubmitError("");
    setCoachError("");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .pq-wrap {
          font-family: 'DM Sans', sans-serif;
          padding: 36px 0 60px;
          max-width: 820px;
        }

        /* ── BREADCRUMB & HEADING ── */
        .pq-breadcrumb {
          font-size: 0.73rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #f97316;
          margin-bottom: 8px;
        }
        .pq-title {
          font-size: 1.85rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 10px;
        }
        .pq-subtitle {
          font-size: 0.9rem;
          color: #666;
          line-height: 1.55;
          margin-bottom: 28px;
          max-width: 560px;
        }

        /* ── GUIDE BOX ── */
        .pq-guide {
          border: 1px solid #f97316;
          border-radius: 10px;
          background: #fffaf6;
          padding: 22px 26px;
          margin-bottom: 28px;
        }
        .pq-guide h2 {
          font-size: 1rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 6px;
        }
        .pq-guide-intro {
          font-size: 0.84rem;
          color: #555;
          margin-bottom: 14px;
          line-height: 1.5;
        }
        .pq-guide h3 {
          font-size: 0.86rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 8px;
          margin-top: 14px;
        }
        .pq-guide ul {
          list-style: disc;
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .pq-guide li {
          font-size: 0.83rem;
          color: #444;
          line-height: 1.45;
        }
        .pq-guide li strong { color: #1a1a1a; }

        /* ── FORM CARD ── */
        .pq-card {
          background: #fff;
          border: 1px solid #e8e8e8;
          border-radius: 10px;
          padding: 28px 30px 30px;
        }

        /* ── ERROR BANNER ── */
        .pq-error-banner {
          background: #fff5f5;
          border: 1px solid #fca5a5;
          border-radius: 7px;
          padding: 11px 16px;
          font-size: 0.85rem;
          color: #dc2626;
          margin-bottom: 20px;
        }

        /* ── SUCCESS PANEL ── */
        .pq-success {
          text-align: center;
          padding: 48px 20px;
        }
        .pq-success-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #dcfce7;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
        .pq-success h2 {
          font-size: 1.3rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 10px;
        }
        .pq-success p {
          font-size: 0.88rem;
          color: #666;
          max-width: 400px;
          margin: 0 auto 28px;
          line-height: 1.55;
        }
        .pq-success-actions {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* ── FIELDS ── */
        .pq-field { margin-bottom: 22px; }
        .pq-label {
          font-size: 0.88rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 3px;
        }
        .pq-hint {
          font-size: 0.79rem;
          color: #888;
          margin-bottom: 8px;
        }
        .pq-field-error {
          font-size: 0.79rem;
          color: #dc2626;
          margin-top: 5px;
        }

        .pq-title-input {
          width: 100%;
          border: 1px solid #e0e0e0;
          border-radius: 7px;
          padding: 10px 13px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          color: #1a1a1a;
          outline: none;
          transition: border-color 0.15s;
        }
        .pq-title-input:focus { border-color: #f97316; }
        .pq-title-input::placeholder { color: #bbb; }
        .pq-title-input.error { border-color: #dc2626; }

        /* ── CONTENT EDITOR ── */
        .pq-editor {
          border: 1px solid #e0e0e0;
          border-radius: 7px;
          overflow: hidden;
          transition: border-color 0.15s;
        }
        .pq-editor:focus-within { border-color: #f97316; }
        .pq-editor.error { border-color: #dc2626; }

        .pq-toolbar {
          background: #fafafa;
          border-bottom: 1px solid #ececec;
          padding: 6px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .pq-toolbar-left { display: flex; gap: 2px; }
        .pq-toolbar-chars { font-size: 0.78rem; color: #aaa; }

        .pq-textarea {
          width: 100%;
          min-height: 180px;
          border: none;
          outline: none;
          resize: vertical;
          padding: 12px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          color: #1a1a1a;
          line-height: 1.6;
          background: #fff;
        }
        .pq-textarea::placeholder { color: #bbb; }

        /* ── AI ROW ── */
        .pq-ai-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 14px;
          margin-bottom: 24px;
        }
        .pq-ai-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 7px 13px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.83rem;
          font-weight: 500;
          color: #444;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .pq-ai-btn:hover:not(:disabled) { border-color: #f97316; color: #f97316; }
        .pq-ai-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .pq-ai-hint { font-size: 0.8rem; color: #aaa; }
        .pq-ai-error { font-size: 0.8rem; color: #dc2626; }

        /* ── AI COACH PANEL ── */
        .pq-coach {
          background: #fffaf6;
          border: 1px solid #fed7aa;
          border-radius: 8px;
          padding: 18px 20px;
          margin-bottom: 22px;
          animation: pq-slide-down 0.25s ease;
        }
        @keyframes pq-slide-down {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pq-coach-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .pq-coach-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #c2410c;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pq-coach-dismiss {
          background: none;
          border: none;
          cursor: pointer;
          color: #aaa;
          font-size: 1rem;
          line-height: 1;
          padding: 0;
        }
        .pq-coach-dismiss:hover { color: #555; }
        .pq-coach-overall {
          font-size: 0.84rem;
          color: #7c3c1a;
          margin-bottom: 10px;
          line-height: 1.5;
        }
        .pq-coach-tips {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
        }
        .pq-coach-tip {
          display: flex;
          gap: 8px;
          font-size: 0.83rem;
          color: #555;
          line-height: 1.45;
        }
        .pq-coach-tip::before { content: "→"; color: #f97316; flex-shrink: 0; }
        .pq-coach-apply {
          background: none;
          border: 1px solid #f97316;
          border-radius: 6px;
          padding: 6px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          color: #f97316;
          cursor: pointer;
          transition: all 0.15s;
        }
        .pq-coach-apply:hover { background: #f97316; color: #fff; }

        /* ── ACTION BUTTONS ── */
        .pq-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 12px;
        }
        .pq-btn-cancel {
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          color: #555;
          cursor: pointer;
          padding: 9px 16px;
          border-radius: 6px;
          transition: background 0.13s;
        }
        .pq-btn-cancel:hover { background: #f0f0f0; }
        .pq-btn-post {
          display: flex;
          align-items: center;
          gap: 7px;
          background: #f97316;
          border: none;
          border-radius: 6px;
          padding: 9px 20px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          transition: background 0.15s;
        }
        .pq-btn-post:hover:not(:disabled) { background: #ea6c0c; }
        .pq-btn-post:disabled { opacity: 0.5; cursor: not-allowed; }
        .pq-btn-outline {
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 9px 20px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 600;
          color: #555;
          cursor: pointer;
          transition: all 0.15s;
        }
        .pq-btn-outline:hover { border-color: #aaa; color: #222; }

        .pq-spinner {
          width: 14px; height: 14px;
          border: 2px solid #ffffff44;
          border-top-color: #fff;
          border-radius: 50%;
          animation: pq-spin 0.7s linear infinite;
        }
        .pq-spinner-orange {
          width: 12px; height: 12px;
          border: 2px solid #f9731633;
          border-top-color: #f97316;
          border-radius: 50%;
          animation: pq-spin 0.7s linear infinite;
        }
        @keyframes pq-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="pq-wrap">
        {/* ── HEADING ── */}
        <div className="pq-breadcrumb">Ask the Cohort</div>
        <h1 className="pq-title">Publish to the forum</h1>
        <p className="pq-subtitle">
          Public threads help the whole cohort. Write as if a classmate will debug your issue
          tomorrow. They only know what you put on the page.
        </p>

        {/* ── GUIDE BOX ── */}
        <div className="pq-guide">
          <h2>Write questions people can answer in one pass</h2>
          <p className="pq-guide-intro">
            Mentors volunteer their time. Give them runnable context, expected vs actual behavior,
            and a tight scope so they can reproduce the issue without guessing your setup.
          </p>
          <h3>Checklist before you post</h3>
          <ul>
            <li><strong>Title as a headline</strong> that states the symptom and tech stack (e.g., "React 19: state resets after navigation").</li>
            <li><strong>Repro steps</strong> numbered, with environment (OS, browser, Node version) when it matters.</li>
            <li><strong>Minimal code</strong> in fenced markdown blocks; trim unrelated lines so readers scan faster.</li>
            <li><strong>Exact errors</strong> copied verbatim, including stack trace snippets when debugging backend routes.</li>
          </ul>
          <h3>Validation rules (enforced by the form)</h3>
          <ul>
            <li><strong>Title length:</strong> Must be between 5 and 255 characters.</li>
            <li><strong>Body length:</strong> Must contain a minimum of 10 characters detailing your problem.</li>
            <li><strong>Single topic:</strong> Split unrelated bugs into separate threads so search and embeddings stay precise.</li>
          </ul>
        </div>

        {/* ── FORM CARD ── */}
        <div className="pq-card">
          {submitSuccess ? (
            /* ── SUCCESS STATE ── */
            <div className="pq-success">
              <div className="pq-success-icon">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h2>Thread published</h2>
              <p>
                Your post is indexed for keyword search and embedding-based similarity. Share the
                link in study groups, or stay on the thread to answer follow-up questions from peers.
              </p>
              <div className="pq-success-actions">
                <button className="pq-btn-cancel">Back to Dashboard</button>
                <button className="pq-btn-post">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  View Question
                </button>
                <button className="pq-btn-outline" onClick={handleReset}>Ask Another</button>
              </div>
            </div>
          ) : (
            <>
              {/* Error banner */}
              {submitError && (
                <div className="pq-error-banner">{submitError}</div>
              )}

              {/* AI Coach panel */}
              {showCoach && coachFeedback && (
                <div className="pq-coach">
                  <div className="pq-coach-header">
                    <span className="pq-coach-title">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      AI Draft Coach
                    </span>
                    <button className="pq-coach-dismiss" onClick={() => setShowCoach(false)}>✕</button>
                  </div>
                  {coachFeedback.overall && (
                    <p className="pq-coach-overall">{coachFeedback.overall}</p>
                  )}
                  {coachFeedback.tips?.length > 0 && (
                    <ul className="pq-coach-tips">
                      {coachFeedback.tips.map((tip, i) => (
                        <li key={i} className="pq-coach-tip">{tip}</li>
                      ))}
                    </ul>
                  )}
                  {coachFeedback.improvedBody && (
                    <button className="pq-coach-apply" onClick={applyImprovedBody}>
                      Apply improved description
                    </button>
                  )}
                </div>
              )}

              {/* Title */}
              <div className="pq-field">
                <div className="pq-label">Title</div>
                <div className="pq-hint">Be specific and imagine you're asking a question to another person.</div>
                <input
                  type="text"
                  className={`pq-title-input${errors.title ? " error" : ""}`}
                  placeholder="e.g. How do I handle state management using Context API in React?"
                  value={formData.title}
                  onChange={handleChange("title")}
                  maxLength={255}
                />
                {errors.title && <div className="pq-field-error">{errors.title}</div>}
              </div>

              {/* Body */}
              <div className="pq-field">
                <div className="pq-label">What are the details of your problem?</div>
                <div className="pq-hint">Introduce the problem and expand on what you put in the title. Minimum 10 characters.</div>
                <div className={`pq-editor${errors.content ? " error" : ""}`}>
                  <div className="pq-toolbar">
                    <div className="pq-toolbar-left">
                      <ToolbarBtn label="Bold" onClick={() => applyFormat("bold")}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
                          <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
                        </svg>
                      </ToolbarBtn>
                      <ToolbarBtn label="Italic" onClick={() => applyFormat("italic")}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="19" y1="4" x2="10" y2="4"/>
                          <line x1="14" y1="20" x2="5" y2="20"/>
                          <line x1="15" y1="4" x2="9" y2="20"/>
                        </svg>
                      </ToolbarBtn>
                      <ToolbarBtn label="Code block" onClick={() => applyFormat("code")}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="16 18 22 12 16 6"/>
                          <polyline points="8 6 2 12 8 18"/>
                        </svg>
                      </ToolbarBtn>
                      <ToolbarBtn label="Insert link" onClick={() => applyFormat("link")}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                        </svg>
                      </ToolbarBtn>
                    </div>
                    <span className="pq-toolbar-chars">{charCount} characters</span>
                  </div>
                  <textarea
                    id="ev-content"
                    className="pq-textarea"
                    placeholder="Include all the information someone would need to answer your question... You can use Markdown to format your code!"
                    value={formData.content}
                    onChange={handleChange("content")}
                    rows={8}
                  />
                </div>
                {errors.content && <div className="pq-field-error">{errors.content}</div>}
              </div>

              {/* AI suggestions row */}
              <div className="pq-ai-row">
                <button className="pq-ai-btn" onClick={handleAiCoach} disabled={isCoaching}>
                  {isCoaching ? (
                    <><span className="pq-spinner-orange" /> Analyzing…</>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      AI suggestions
                    </>
                  )}
                </button>
                {coachError
                  ? <span className="pq-ai-error">{coachError}</span>
                  : <span className="pq-ai-hint">Suggestions only. You still choose what to post.</span>
                }
              </div>

              {/* Actions */}
              <div className="pq-actions">
                <button className="pq-btn-cancel" onClick={handleReset}>Cancel</button>
                <button className="pq-btn-post" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><span className="pq-spinner" /> Posting…</>
                  ) : (
                    <>
                      Post Question
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
