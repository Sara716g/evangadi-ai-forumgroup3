import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { getSingleQuestion } from "../../services/";
import { postAnswer, assessAnswerFit } from "../../services/answer.service";

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

// ── answer card ──────────────────────────────────────────────────────────────

function AnswerCard({ answer }) {
  const name = answer.author?.username || answer.author?.name || "new user";
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8e8e8",
        borderRadius: 8,
        padding: "16px 20px",
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <Avatar name={name} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
          <div style={{ fontSize: 12, color: "#888" }}>{formatDate(answer.createdAt)}</div>
        </div>
      </div>
      <div style={{ fontSize: 15, lineHeight: 1.7, color: "#222" }}>
        <ReactMarkdown>{answer.content}</ReactMarkdown>
      </div>
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

// ── page ─────────────────────────────────────────────────────────────────────

export default function QuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [question,   setQuestion]  = useState(null);
  const [answers,    setAnswers]   = useState([]);
  const [isLoading,  setIsLoading] = useState(true);
  const [loadError,  setLoadError] = useState(false);

  const [answerText, setAnswerText] = useState("");
  const [charCount,  setCharCount]  = useState(0);

  const [isPosting,  setIsPosting]  = useState(false);
  const [postError,  setPostError]  = useState("");

  const [isChecking, setIsChecking] = useState(false);
  const [fitResult,  setFitResult]  = useState(null); // { level, note }

  // fetch on mount
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setLoadError(false);
      try {
        const data = await getSingleQuestion(id);
        setQuestion(data.question ?? data);
        setAnswers(data.answers ?? []);
      } catch {
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  function handleTextChange(e) {
    setAnswerText(e.target.value);
    setCharCount(e.target.value.length);
    setPostError("");
    setFitResult(null);
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
      const newAnswer = await postAnswer(question.id, answerText);
      setAnswers((prev) => [...prev, newAnswer]);
      setAnswerText("");
      setCharCount(0);
      setFitResult(null);
    } catch {
      setPostError("Failed to post answer. Please try again.");
    } finally {
      setIsPosting(false);
    }
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
          onClick={() => navigate("/")}
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

  const authorName    = question.author?.username || question.author?.name || "New User";
  // ⬇ swap `false` for a real auth check once you have a currentUser context
  const isOwnQuestion = false;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px" }}>

      {/* back link */}
      <Link
        to="/"
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
            <AnswerCard key={a.id} answer={a} />
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
  );
}
