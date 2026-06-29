import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Square, Volume2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getSingleQuestion, getSimilarQuestions } from "../../services/";
import { postAnswer, assessAnswerFit } from "../../services/answer/answer.service.js";
import { toggleAnswerVote } from "../../services/answer/answerVote.service.js";
import { getAnswerComments, postAnswerComment } from "../../services/answer/answerComment.service.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { apiClient } from "../../services/core/api.client.js";

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
}

function Avatar({ name = "", size = 36 }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#6baed6",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        fontSize: size * 0.38,
        flexShrink: 0,
      }}
    >
      {initials || "?"}
    </div>
  );
}

function getReadableAnswerText(content = "") {
  return content
    .replace(/```[\s\S]*?```/g, " code block. ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── AI fit panel ─────────────────────────────────────────────────────────────

const FIT_META = {
  strong:  { label: "Strong Fit",  bg: "#edfbea", border: "#52c41a", text: "#389e0d" },
  partial: { label: "Partial Fit", bg: "#fffbe6", border: "#faad14", text: "#d46b08" },
  weak:    { label: "Weak Fit",    bg: "#fff1f0", border: "#ff4d4f", text: "#cf1322" },
};

function FitPanel({ level, note }) {
  const meta = FIT_META[level] || FIT_META.partial;
  return (
    <div
      style={{
        marginTop: 12,
        padding: "12px 16px",
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        borderRadius: 8,
        color: meta.text,
        fontSize: 14,
      }}
    >
      <strong>{meta.label}</strong>
      {note && <p style={{ margin: "6px 0 0", color: "#333", fontWeight: 400 }}>{note}</p>}
    </div>
  );
}

// ── comment section ──────────────────────────────────────────────────────────

function CommentSection({ answerId, isOpen, onCommentAdded }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    if (isOpen && comments.length === 0) {
      setIsLoading(true);
      getAnswerComments(answerId)
        .then((res) => setComments(res.data ?? []))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  async function handlePostComment() {
    if (!commentText.trim()) return;
    setIsPosting(true);
    try {
      const res = await postAnswerComment(answerId, commentText.trim());
      setComments((prev) => [...prev, res.data]);
      setCommentText("");
      if (onCommentAdded) onCommentAdded();
    } catch {
      // silently fail
    } finally {
      setIsPosting(false);
    }
  }

  function formatTime(dateStr) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo`;
    return `${Math.floor(months / 12)}y`;
  }

  if (!isOpen) return null;

  return (
    <div style={{ padding: "0", background: "#fafafa" }}>
      {isLoading ? (
        <div style={{ fontSize: 13, color: "#aaa", padding: "12px 16px" }}>Loading comments...</div>
      ) : (
        <>
          {/* header */}
          <div style={{ padding: "12px 16px 8px" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>Comments</span>
          </div>

          {/* comment input */}
          {user && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 16px 12px" }}>
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handlePostComment(); }}
                placeholder="Add a comment..."
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "1px solid #d9d9d9",
                  borderRadius: 20,
                  fontSize: 13,
                  outline: "none",
                  background: "#fff",
                }}
              />
              <button
                onClick={handlePostComment}
                disabled={isPosting || !commentText.trim()}
                style={{
                  background: commentText.trim() ? "#e67e22" : "#ccc",
                  color: "#fff",
                  border: "none",
                  borderRadius: 20,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: commentText.trim() ? "pointer" : "not-allowed",
                  flexShrink: 0,
                }}
              >
                {isPosting ? "..." : "Post"}
              </button>
            </div>
          )}

          {/* comments list */}
          {comments.length > 0 && (
            <div>
              {comments.map((c) => {
                const cName = c.author?.firstName
                  ? `${c.author.firstName} ${c.author.lastName || ""}`.trim()
                  : "User";
                return (
                  <div key={c.id} style={{ padding: "12px 16px", borderTop: "1px solid #f0f0f0" }}>
                    <div style={{ fontSize: 14, color: "#282828", lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 700, color: "#1a1a1a" }}>{cName}</span>
                      <span style={{ color: "#999", fontSize: 12 }}> · {formatTime(c.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: 14, color: "#282828", lineHeight: 1.5, marginTop: 4 }}>
                      {c.content}
                    </div>
                  </div>
                );
              })}

              <div style={{ padding: "10px 16px", borderTop: "1px solid #f0f0f0", textAlign: "center" }}>
                <button
                  style={{
                    background: "none",
                    border: "1px solid #d9d9d9",
                    borderRadius: 20,
                    padding: "8px 20px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#555",
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  View more comments ▾
                </button>
              </div>
            </div>
          )}

          {comments.length === 0 && !isLoading && (
            <div style={{ padding: "20px 16px", textAlign: "center", fontSize: 13, color: "#aaa" }}>
              No comments yet. Be the first to comment!
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AttachmentChip({ attachment }) {
  const [objectUrl, setObjectUrl] = useState(null);
  const [error, setError] = useState(false);
  const isImage = attachment.type === "image";

  useEffect(() => {
    let createdUrl = null;
    let cancelled = false;

    async function loadFile() {
      try {
        const res = await apiClient.get(attachment.url, { responseType: "blob" });
        if (cancelled) return;
        createdUrl = URL.createObjectURL(res.data);
        setObjectUrl(createdUrl);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    loadFile();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [attachment.url]);

  if (error) {
    return <span style={{ fontSize: 12, color: "#e74c3c" }}>Failed to load attachment</span>;
  }

  if (!objectUrl) {
    return <span style={{ fontSize: 12, color: "#aaa" }}>Loading attachment…</span>;
  }

  if (isImage) {
    return (
      <a href={objectUrl} target="_blank" rel="noopener noreferrer">
        <img
          src={objectUrl}
          alt={attachment.originalName}
          style={{ maxWidth: 220, maxHeight: 220, borderRadius: 8, border: "1px solid #e8e8e8", display: "block" }}
        />
      </a>
    );
  }

  return (
    <a
      href={objectUrl}
      target="_blank"
      rel="noopener noreferrer"
      download={attachment.originalName}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        border: "1px solid #e8e8e8",
        borderRadius: 6,
        padding: "6px 10px",
        fontSize: 12,
        background: "#fafafa",
        textDecoration: "none",
        color: "#333",
      }}
    >
      <span>📄</span>
      <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {attachment.originalName}
      </span>
    </a>
  );
}

// ── answer card ──────────────────────────────────────────────────────────────

function AnswerCard({ answer, onVote, isVoting, isSpeaking, onToggleRead }) {
  const name = `${answer.author?.firstName || ''} ${answer.author?.lastName || ''}`.trim() || answer.author?.username || answer.author?.name || "New User";
  const voteCount = answer.voteCount ?? 0;
  const userHasVoted = answer.userHasVoted ?? false;
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(answer.commentCount ?? 0);
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8e8e8",
        borderRadius: 8,
        marginBottom: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <Avatar name={name} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
            <div style={{ fontSize: 12, color: "#888" }}>{formatDate(answer.createdAt)}</div>
          </div>
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.7, color: "#222", flex: 1 }}>
          <ReactMarkdown>{answer.content}</ReactMarkdown>
        </div>
        <button
          type="button"
          onClick={() => onToggleRead(answer)}
          aria-pressed={isSpeaking}
          title={isSpeaking ? "Stop reading answer" : "Read answer aloud"}
          style={{
            ...ghostBtn,
            flexShrink: 0,
            padding: "6px 10px",
            color: isSpeaking ? "#e67e22" : "#555",
            borderColor: isSpeaking ? "#e67e22" : "#d9d9d9",
          }}
        >
          {isSpeaking ? <Square size={14} /> : <Volume2 size={15} />}
          {isSpeaking ? "Stop" : "Read aloud"}
        </button>
      </div>

      {/* ── vote + comment bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "8px 16px",
          background: "#f8f8f8",
          borderTop: "1px solid #f0f0f0",
        }}
      >
        <button
          onClick={() => onVote(answer.id, "up")}
          disabled={isVoting}
          style={{
            background: "none",
            border: "none",
            cursor: isVoting ? "not-allowed" : "pointer",
            padding: "4px 6px",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 14,
            color: userHasVoted ? "#e67e22" : "#888",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => { if (!isVoting) e.currentTarget.style.color = "#e67e22"; }}
          onMouseLeave={(e) => { if (!userHasVoted) e.currentTarget.style.color = "#888"; }}
          title={userHasVoted ? "Remove upvote" : "Upvote"}
        >
          <span style={{ fontSize: 16 }}>▲</span>
          <span style={{ fontWeight: 600 }}>Upvote · {voteCount}</span>
        </button>

        <span style={{ color: "#ccc", fontSize: 10 }}>●</span>

        <button
          onClick={() => setShowComments((prev) => !prev)}
          style={{
            background: "none",
            border: "none",
            padding: "4px 6px",
            fontSize: 14,
            fontWeight: 600,
            color: showComments ? "#e67e22" : "#888",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#e67e22"; }}
          onMouseLeave={(e) => { if (!showComments) e.currentTarget.style.color = "#888"; }}
        >
          <span style={{ fontSize: 16 }}>💬</span>
          {commentCount}
        </button>
      </div>

      {/* ── comments panel (below the bar) ── */}
      <CommentSection answerId={answer.id} isOpen={showComments} onCommentAdded={() => setCommentCount((c) => c + 1)} />

      {answer.attachments?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {answer.attachments.map((att) => (
            <AttachmentChip key={att.id} attachment={att} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── markdown toolbar ─────────────────────────────────────────────────────────

function MarkdownToolbar({ onInsert }) {
  const actions = [
    { label: <b>B</b>,                                       wrap: ["**", "**"]     },
    { label: <i>I</i>,                                       wrap: ["*", "*"]       },
    { label: <code style={{ fontSize: 13 }}>{`</>`}</code>,  wrap: ["`", "`"]       },
    { label: "🔗",                                            wrap: ["[", "](url)"]  },
  ];
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: "6px 10px",
        borderBottom: "1px solid #e8e8e8",
        background: "#fafafa",
        borderRadius: "8px 8px 0 0",
      }}
    >
      {actions.map((a, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onInsert(a.wrap)}
          style={{
            background: "none",
            border: "1px solid #d9d9d9",
            borderRadius: 4,
            padding: "2px 8px",
            cursor: "pointer",
            fontSize: 13,
            color: "#555",
          }}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}

// ── shared ghost button style ────────────────────────────────────────────────

const ghostBtn = {
  background: "none",
  border: "1px solid #d9d9d9",
  borderRadius: 6,
  padding: "7px 14px",
  fontSize: 13,
  color: "#555",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
};

// ── attachment config ────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"];
const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ── page ─────────────────────────────────────────────────────────────────────

export default function QuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [question,   setQuestion]  = useState(null);
  const [answers,    setAnswers]   = useState([]);
  const [similarQuestions, setSimilarQuestions] = useState([]);
  const [isLoading,  setIsLoading] = useState(true);
  const [loadError,  setLoadError] = useState(false);

  const [answerText, setAnswerText] = useState("");
  const [charCount,  setCharCount]  = useState(0);

  const [isPosting,  setIsPosting]  = useState(false);
  const [postError,  setPostError]  = useState("");

  const [isChecking, setIsChecking] = useState(false);
  const [fitResult,  setFitResult]  = useState(null); // { level, note }
  const [speakingAnswerId, setSpeakingAnswerId] = useState(null);
  const [speechMessage, setSpeechMessage] = useState("");

  // attachments for the answer being composed
  const [answerFiles, setAnswerFiles] = useState([]);
  const [attachmentError, setAttachmentError] = useState("");

  const [votingAnswerId, setVotingAnswerId] = useState(null);

  // fetch on mount
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setLoadError(false);
      try {
        const res = await getSingleQuestion(id);
        // Backend shape: { success, message, question, answers, answersMeta }
        setQuestion(res.question);
        setAnswers(res.answers ?? []);

        // Fetch similar questions in the background (non-blocking)
        getSimilarQuestions(id)
          .then((res) => setSimilarQuestions(res.data ?? []))
          .catch(() => setSimilarQuestions([]));
      } catch {
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  function handleTextChange(e) {
    setAnswerText(e.target.value);
    setCharCount(e.target.value.length);
    setPostError("");
    setFitResult(null);
  }

  function handleFilesSelected(e) {
    const picked = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-selecting the same file later

    const accepted = [];
    const rejected = [];

    for (const file of picked) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        rejected.push(`${file.name} (unsupported type)`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name} (over 10MB)`);
        continue;
      }
      accepted.push(file);
    }

    setAnswerFiles((prev) => [...prev, ...accepted].slice(0, MAX_FILES));
    setAttachmentError(rejected.length > 0 ? `Skipped: ${rejected.join(", ")}` : "");
  }

  function handleRemoveFile(index) {
    setAnswerFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleInsert([before, after]) {
    const ta = document.getElementById("answer-textarea");
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const next =
      answerText.slice(0, s) + before + answerText.slice(s, e) + after + answerText.slice(e);
    setAnswerText(next);
    setCharCount(next.length);
  }

  async function handleCheckFit() {
    if (answerText.trim().length < 20) return;
    setIsChecking(true);
    setFitResult(null);
    try {
      const result = await assessAnswerFit(id, answerText);
      setFitResult(result);
    } catch (err) {
      const errorMsg = err?.response?.data?.msg || "Could not evaluate fit. Please try again.";
      setFitResult({ level: "weak", note: errorMsg });
    } finally {
      setIsChecking(false);
    }
  }

  async function handlePostAnswer() {
    if (answerText.trim().length < 20) {
      setPostError("Your answer must be at least 20 characters.");
      return;
    }
    setIsPosting(true);
    setPostError("");
    try {
      const newAnswer = await postAnswer(question.id, answerText, answerFiles);
      setAnswers((prev) => [...prev, newAnswer]);
      setAnswerText("");
      setCharCount(0);
      setFitResult(null);
      setAnswerFiles([]);
      setAttachmentError("");
    } catch {
      setPostError("Failed to post answer. Please try again.");
    } finally {
      setIsPosting(false);
    }
  }

  async function handleVote(answerId, direction) {
    if (!user) {
      navigate("/auth");
      return;
    }

    setVotingAnswerId(answerId);
    try {
      const result = await toggleAnswerVote(answerId);
      setAnswers((prev) =>
        prev.map((a) =>
          a.id === answerId
            ? { ...a, voteCount: result.data.voteCount, userHasVoted: result.data.voted }
            : a
        )
      );
    } catch {
      // Silently fail - vote will revert on next page load
    } finally {
      setVotingAnswerId(null);
    }
  }

  function handleToggleReadAnswer(answer) {
    if (!("speechSynthesis" in window)) {
      setSpeechMessage("Read aloud is not supported in this browser.");
      return;
    }

    if (speakingAnswerId === answer.id) {
      window.speechSynthesis.cancel();
      setSpeakingAnswerId(null);
      setSpeechMessage("");
      return;
    }

    const text = getReadableAnswerText(answer.content);
    if (!text) {
      setSpeechMessage("This answer has no readable text.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => {
      setSpeakingAnswerId((currentId) =>
        currentId === answer.id ? null : currentId,
      );
    };
    utterance.onerror = () => {
      setSpeakingAnswerId(null);
      setSpeechMessage("Could not read this answer aloud.");
    };

    setSpeechMessage("");
    setSpeakingAnswerId(answer.id);
    window.speechSynthesis.speak(utterance);
  }

  // ── loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#555", fontSize: 15 }}>
        Loading question details...
      </div>
    );
  }

  // ── error ─────────────────────────────────────────────────────────────────
  if (loadError || !question) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <p style={{ color: "#e74c3c", fontWeight: 600, fontSize: 16, marginBottom: 16 }}>
          Failed to load question details.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            background: "#e67e22",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "10px 22px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const authorName = `${question.author?.firstName || ''} ${question.author?.lastName || ''}`.trim() || question.author?.username || question.author?.name || "New User";
  const isOwnQuestion = user?.id === question.author?.id;

  return (
    <div style={{ display: "flex", gap: 28, maxWidth: 1160, margin: "0 auto", padding: "24px 20px", alignItems: "flex-start" }}>

      {/* ── main column ── */}
      <div style={{ flex: 1, minWidth: 0 }}>

      {/* back link */}
      <Link
        to="/dashboard"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "#555",
          textDecoration: "none",
          fontSize: 14,
          marginBottom: 20,
        }}
      >
        ← Back to feed
      </Link>

      {/* ── question card ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e8e8e8",
          borderRadius: 10,
          padding: "24px 28px",
          marginBottom: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <Avatar name={authorName} size={42} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{authorName}</div>
            <div style={{ fontSize: 12, color: "#888" }}>Posted {formatDate(question.createdAt)}</div>
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", margin: "0 0 14px" }}>
          {question.title}
        </h1>

        <div style={{ fontSize: 15, lineHeight: 1.8, color: "#333", marginBottom: 18 }}>
          <ReactMarkdown>{question.content || question.body || ""}</ReactMarkdown>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", margin: "18px 0" }} />

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
            style={ghostBtn}
          >
            ↗ Share
          </button>
          <button style={{ ...ghostBtn, cursor: "default" }}>
            💬 {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
          </button>
        </div>
      </div>

      {/* ── community answers ── */}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
        Community Answers ({answers.length})
      </h2>
      {speechMessage && (
        <p style={{ color: "#cf1322", fontSize: 13, margin: "-6px 0 14px" }}>
          {speechMessage}
        </p>
      )}

      {answers.length === 0 ? (
        <div
          style={{
            background: "#f9f9f9",
            border: "1px solid #e8e8e8",
            borderRadius: 10,
            padding: "48px 20px",
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 10, color: "#ccc" }}>💬</div>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Be the first to help!</div>
          <div style={{ color: "#888", fontSize: 14 }}>
            This question is waiting for an expert like you. Share your knowledge and earn reputation points.
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 28 }}>
          {answers.map((a) => (
            <AnswerCard
              key={a.id}
              answer={a}
              onVote={handleVote}
              isVoting={votingAnswerId === a.id}
              isSpeaking={speakingAnswerId === a.id}
              onToggleRead={handleToggleReadAnswer}
            />
          ))}
        </div>
      )}

      {/* ── contribute form ── */}
      {isOwnQuestion ? (
        <div style={{ color: "#888", fontSize: 14, padding: "16px 0" }}>
          You cannot answer your own question.
        </div>
      ) : (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e8e8e8",
            borderRadius: 10,
            padding: "24px 28px",
          }}
        >
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>Contribute an answer</h3>

          {postError && (
            <p style={{ color: "#e74c3c", fontSize: 14, marginBottom: 10 }}>{postError}</p>
          )}

          {/* toolbar + textarea */}
          <div
            style={{
              border: "1px solid #e8e8e8",
              borderRadius: 8,
              overflow: "hidden",
              marginBottom: 14,
            }}
          >
            <MarkdownToolbar onInsert={handleInsert} />
            <div style={{ position: "relative" }}>
              <textarea
                id="answer-textarea"
                value={answerText}
                onChange={handleTextChange}
                placeholder="Type your answer here... You can use Markdown to format your code!"
                rows={8}
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  resize: "vertical",
                  padding: "12px 14px",
                  fontSize: 14,
                  fontFamily: "inherit",
                  lineHeight: 1.7,
                  color: "#222",
                  boxSizing: "border-box",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  top: 8,
                  right: 12,
                  fontSize: 12,
                  color: "#aaa",
                  pointerEvents: "none",
                }}
              >
                {charCount} characters
              </span>
            </div>
          </div>

          {/* attachment picker */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <label
                htmlFor="answer-file-input"
                style={{
                  ...ghostBtn,
                  cursor: answerFiles.length >= MAX_FILES ? "not-allowed" : "pointer",
                  opacity: answerFiles.length >= MAX_FILES ? 0.5 : 1,
                }}
              >
                📎 Attach image or PDF
              </label>
              <input
                id="answer-file-input"
                type="file"
                multiple
                accept={ACCEPTED_TYPES.join(",")}
                onChange={handleFilesSelected}
                disabled={answerFiles.length >= MAX_FILES}
                style={{ display: "none" }}
              />
              <span style={{ fontSize: 12, color: "#aaa" }}>
                Up to {MAX_FILES} files, 10MB each.
              </span>
            </div>

            {attachmentError && (
              <p style={{ color: "#e74c3c", fontSize: 13, marginTop: 6 }}>{attachmentError}</p>
            )}

            {answerFiles.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {answerFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      border: "1px solid #e8e8e8",
                      borderRadius: 6,
                      padding: "6px 10px",
                      fontSize: 12,
                      background: "#fafafa",
                    }}
                  >
                    <span>{file.type === "application/pdf" ? "📄" : "🖼️"}</span>
                    <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      style={{ border: "none", background: "none", cursor: "pointer", color: "#e74c3c", fontWeight: 700 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {fitResult && <FitPanel level={fitResult.level} note={fitResult.note} />}

          {/* action row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 14,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={handleCheckFit}
                disabled={isChecking || answerText.trim().length < 20}
                style={{
                  ...ghostBtn,
                  opacity: answerText.trim().length < 20 ? 0.5 : 1,
                  cursor: answerText.trim().length < 20 ? "not-allowed" : "pointer",
                }}
              >
                {isChecking ? "Checking..." : "✦ Check draft fit"}
              </button>
              <span style={{ fontSize: 12, color: "#aaa" }}>
                Relevance only. Not grading correctness. You need at least 20 characters.
              </span>
            </div>

            <button
              onClick={handlePostAnswer}
              disabled={isPosting}
              style={{
                background: isPosting ? "#f0a070" : "#e67e22",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "10px 22px",
                fontSize: 14,
                fontWeight: 600,
                cursor: isPosting ? "not-allowed" : "pointer",
                minWidth: 140,
                textAlign: "center",
              }}
            >
              {isPosting ? "Posting..." : "Post Your Answer"}
            </button>
          </div>
        </div>
      )}

      </div>

      {/* ── sidebar ── */}
      <aside
        style={{
          width: 280,
          flexShrink: 0,
          position: "sticky",
          top: 24,
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #e8e8e8",
            borderRadius: 10,
            padding: "18px 16px",
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: "#1a1a1a" }}>
            Related Questions
          </h3>

          {similarQuestions.length === 0 ? (
            <p style={{ color: "#999", fontSize: 13 }}>
              No related questions found.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {similarQuestions.map((sq) => (
                <Link
                  key={sq.questionHash || sq.id}
                  to={`/question/${sq.questionHash || sq.id}`}
                  style={{
                    display: "block",
                    padding: "10px 12px",
                    background: "#fafafa",
                    border: "1px solid #f0f0f0",
                    borderRadius: 8,
                    textDecoration: "none",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#e67e22")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#f0f0f0")}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#e67e22",
                      marginBottom: 4,
                      lineHeight: 1.4,
                    }}
                  >
                    {sq.title}
                  </div>
                  <div style={{ fontSize: 12, color: "#888" }}>
                    {sq.author?.firstName || ""} {sq.author?.lastName || ""}{" "}
                    <span style={{ float: "right" }}>
                      {sq.createdAt ? formatDate(sq.createdAt) : ""}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </aside>

    </div>
  );
}