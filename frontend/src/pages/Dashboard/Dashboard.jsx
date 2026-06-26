/**
 * Dashboard: default home after login; question list, quick actions, URL-driven search.
 * Data: `questionService` (keyword `q`, semantic `semantic`, or full list).
 */

import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SquarePen, Library, BookOpen } from "lucide-react";
import { questionService } from "../../services/question/question.service.js";
import { useAuth } from "../../contexts/AuthContext";
import { timeAgo } from "../../lib/utils.js";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const firstName = user?.firstName?.trim() || "";
  const welcomeLine = firstName
    ? `Good to see you, ${firstName}.`
    : "Welcome to the forum.";

  // -----------------------------
  // STATE MANAGEMENT
  // -----------------------------
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const urlSemantic = searchParams.get("semantic") || "";
  const isSemantic = urlSemantic.length > 0;

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Derive searchMode directly from URL params (no useState needed)
  const searchMode = isSemantic ? "semantic" : "keyword";

  // -----------------------------
  // REFACTORED DATA FETCHING LAYER
  // -----------------------------
  useEffect(() => {
    let cancelled = false;

    async function loadQuestions() {
      try {
        setLoading(true);
        setError(null);

        const activeQuery = isSemantic ? urlSemantic : urlQuery;
        let data;
        if (searchMode === "keyword") {
          data = await questionService.getQuestions(activeQuery);
        } else {
          data = await questionService.getSemanticQuestions(activeQuery);
        }

        console.log(`${searchMode.toUpperCase()} service fetched data:`, data);
        if (!cancelled) {
          setQuestions(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Failed to load questions from server.",
          );
          setQuestions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadQuestions();

    return () => {
      cancelled = true;
    };
  }, [searchMode, urlQuery, urlSemantic, isSemantic]);

  // -----------------------------
  // STATS CALCULATIONS
  // -----------------------------
  const safeQuestions = Array.isArray(questions) ? questions : [];
  const totalQuestions = safeQuestions.length;
  const totalReplies = safeQuestions.reduce(
    (sum, q) => sum + (q.answerCount || 0),
    0,
  );
  const unanswered = safeQuestions.filter(
    (q) => (q.answerCount || 0) === 0,
  ).length;
  const yours = safeQuestions.filter(
    (q) => q.author?.id === user?.id || q.isUserOwned,
  ).length;

  const renderSnippet = (text) => {
    if (!text) return "No content available";
    return text.length > 160 ? `${text.substring(0, 160)}...` : text;
  };

  const getInitials = (author, fallbackUsername) => {
    if (author?.firstName && author?.lastName) {
      return `${author.firstName[0]}${author.lastName[0]}`.toUpperCase();
    }
    const name =
      fallbackUsername || author?.username || author?.firstName || "NU";
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className={styles.contentBody}>
      {/* UPPER WHITE CONTAINER COMPONENT CARD */}
      <section className={styles.upperActionHeroCard}>
        <div className={styles.welcomeSection}>
          <span className={styles.breadcrumb}>FORUM HOME</span>
          <h2>{welcomeLine}</h2>
          <p>
            Start a topic, revisit your own threads, or skim the live feed.
            Search above works from any page once you are back on Home.
          </p>
        </div>

        {/* QUICK HUD GRID NAVIGATION ACTION CARDS */}
        <div className={styles.quickCardsGrid}>
          <div className={styles.actionCard} onClick={() => navigate("/questions/ask")}>
            <div className={`${styles.cardIcon} ${styles.iconOrange}`}>
              <SquarePen size={20} />
            </div>
            <div className={styles.cardText}>
              <h3>New Question</h3>
              <p>Share context, errors, and what you already tried</p>
            </div>
          </div>

          <div
            className={styles.actionCard}
            onClick={() => navigate("/my-questions")}
          >
            <div className={`${styles.cardIcon} ${styles.iconOrange}`}>
              <Library />
              <i className="fa-solid fa-bars-staggered"></i>
            </div>
            <div className={styles.cardText}>
              <h3>Your Topics</h3>
              <p>Filtered list of threads you authored</p>
            </div>
          </div>

          <div
            className={styles.actionCard}
            onClick={() => navigate("/rag-documents")}
          >
            <div className={`${styles.cardIcon} ${styles.iconOrange}`}>
              <BookOpen size={20} />
            </div>
            <div className={styles.cardText}>
              <h3>Knowledge Base</h3>
              <p>
                Course library, uploads, and retrieval-backed context for
                threads
              </p>
            </div>
          </div>
        </div>

        {/* FIGURES STRIP BANNER ROW */}
        <div className={styles.figuresSectionBlock}>
          <p className={styles.sectionCaption}>
            Figures below describe the newest threads in this feed (up to 100
            from the API).
          </p>
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Questions</span>
              <span className={styles.statValue}>{totalQuestions}</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Replies</span>
              <span className={styles.statValue}>{totalReplies}</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Unanswered</span>
              <span className={styles.statValue}>{unanswered}</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Yours</span>
              <span className={styles.statValue}>{yours}</span>
            </div>
          </div>
        </div>
      </section>

      {/* LOWER DISCUSSION STREAM TIMELINE CONTAINER */}
      <section className={styles.discussionFeedContainer}>
        <div className={styles.feedHeader}>
          <div>
            <h3>Discussion Feed</h3>
            <p>Your threads use a slim left accent in this list.</p>
          </div>
          <span className={styles.badgeOrange}>NEWEST THREADS</span>
        </div>

        <div className={styles.feedViewportContentFrame}>
          {loading ? (
            <div className={styles.feedStateCenteringFrame}>
              <p className={styles.feedPulseLoaderIndicator}>
                Loading recent questions...
              </p>
            </div>
          ) : error ? (
            <div className={styles.feedStateCenteringFrame}>
              <p className={styles.feedErrorBannerMessage}>{error}</p>
            </div>
          ) : safeQuestions.length === 0 ? (
            <div className={styles.feedEmptyState}>
              <p>No questions found. Be the first to ask!</p>
            </div>
          ) : (
            <div className={styles.feedThreadStreamList}>
              {safeQuestions.map((q) => {
                const isUserOwnedThread =
                  q.author?.id === user?.id || q.isUserOwned;

                return (
                  <div
                    key={q.questionHash || q.id}
                    className={`${styles.feedItemCardRow} ${
                      isUserOwnedThread
                        ? styles.feedItemCardUserOwned
                        : styles.rowCardStandardHover
                    }`}
                    onClick={() =>
                      navigate(`/question/${q.questionHash || q.id}`)
                    }
                  >
                    {/* Circle Avatar initials */}
                    <div
                      className={`${styles.avatar} ${
                        isUserOwnedThread
                          ? styles.feedAvatarBlue
                          : styles.feedAvatarGreen
                      }`}
                    >
                      {getInitials(q.author, q.authorUsername)}
                    </div>

                    {/* Primary Text Segments */}
                    <div className={styles.feedItemTextContentColumn}>
                      <div className={styles.feedItemHeadlineFlexRow}>
                        <h4>{q.title}</h4>
                        {isUserOwnedThread && (
                          <span className={styles.yoursInlineFlagBadge}>
                            Yours
                          </span>
                        )}
                      </div>

                      <p className={styles.feedItemTruncatedDescription}>
                        {renderSnippet(q.content || q.description)}
                      </p>

                      {/* Sub Badges metadata line */}
                      <div className={styles.feedItemMetricsFooterRow}>
                        <span className={styles.feedItemFooterMetricItem}>
                          <i className="fa-regular fa-comment"></i>{" "}
                          {q.answerCount || 0} replies
                        </span>
                        <span>&bull;</span>
                        <span>
                          {timeAgo(q.createdAt)} by{" "}
                          {isUserOwnedThread
                            ? "You"
                            : `${q.author?.firstName || ""} ${q.author?.lastName || ""}`.trim() || "anonymous"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
