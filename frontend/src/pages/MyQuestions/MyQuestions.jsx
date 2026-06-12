import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./MyQuestions.module.css";
import dashboardStyles from "../Dashboard/Dashboard.module.css"; // Reuse dashboard item styles directly
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext"; // Import auth context for ownership badge logic

function MyQuestions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myQuestions, setMyQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyQuestions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get the logged-in user's token from localStorage
        const token = localStorage.getItem("token");

        // Hitting the endpoint
        const response = await axios.get(
          "http://localhost:3777/api/questions?mine=true",
          {
            headers: {
              Authorization: `Bearer ${token}`, // Sending the token so the backend knows who "mine" refers to
            },
          },
        );
        console.log("Backend Raw Response Data:", response.data);

        // Safe handling of data fields depending on backend format
        if (response.data && Array.isArray(response.data.data)) {
          setMyQuestions(response.data.data);
        } else if (response.data && Array.isArray(response.data)) {
          setMyQuestions(response.data);
        } else if (response.data && Array.isArray(response.data.questions)) {
          setMyQuestions(response.data.questions);
        } else {
          setMyQuestions([]);
        }
      } catch (err) {
        console.error("Error loading workspace topics:", err);
        setError("Failed to fetch questions.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyQuestions();
  }, []);

  // Local helper utilities mirrored from your Dashboard layout logic
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
    <div className={styles.workspace_container}>
      {/* 1. Header Card Box Layout */}
      <div className={styles.header_card}>
        <div className={styles.header_info}>
          <span className={styles.badge}>YOUR WORKSPACE</span>
          <h1 className={styles.title}>Your topics</h1>
          <p className={styles.description}>
            Only questions you created. Open one to read answers or add
            follow-ups. Rows use the same left accent as your threads on Home.
          </p>
        </div>
        <Link to="/questions/ask" className={styles.new_question_btn}>
          <span className={styles.plus_icon}>+</span> New question
        </Link>
      </div>

      {/* 2. Main Content Card Shell */}
      <div
        className={`${styles.content_card} ${!isLoading && !error && myQuestions.length > 0 ? styles.has_content : ""}`}
      >
        {/* Loading State Container */}
        {isLoading && (
          <div className={styles.state_wrapper}>
            <p className={styles.loading_text}>Loading your questions...</p>
          </div>
        )}

        {/* Error State Container */}
        {!isLoading && error && (
          <div className={styles.state_wrapper}>
            <div className={styles.error_box}>
              <p className={styles.error_text}>{error}</p>
            </div>
          </div>
        )}

        {/* Empty State Container with explicit link back to ask page */}
        {!isLoading && !error && myQuestions.length === 0 && (
          <div className={styles.state_wrapper}>
            <div className={styles.empty_box}>
              <p className={styles.empty_text}>
                You have not asked any questions yet. Use{" "}
                <Link to="/questions/ask" className={styles.inline_link}>
                  Ask a Question
                </Link>{" "}
                in the sidebar to start.
              </p>
            </div>
          </div>
        )}

        {/* Populated List State Container */}
        {!isLoading && !error && myQuestions.length > 0 && (
          <div className={styles.questions_feed}>
            {myQuestions.map((q) => {
              const isUserOwnedThread =
                q.author?.id === user?.id || q.isUserOwned;

              return (
                <div
                  key={q.questionHash || q.id}
                  className={`${dashboardStyles.feedItemCardRow} ${
                    isUserOwnedThread
                      ? dashboardStyles.feedItemCardUserOwned
                      : dashboardStyles.rowCardStandardHover
                  }`}
                  onClick={() =>
                    navigate(`/question/${q.questionHash || q.id}`)
                  }
                >
                  {/* Circle Avatar initials */}
                  <div
                    className={`${dashboardStyles.avatar} ${
                      isUserOwnedThread
                        ? dashboardStyles.feedAvatarBlue
                        : dashboardStyles.feedAvatarGreen
                    }`}
                  >
                    {getInitials(q.author, q.authorUsername)}
                  </div>

                  {/* Primary Text Segments */}
                  <div className={dashboardStyles.feedItemTextContentColumn}>
                    <div className={dashboardStyles.feedItemHeadlineFlexRow}>
                      <h4>{q.title}</h4>
                      {isUserOwnedThread && (
                        <span className={dashboardStyles.yoursInlineFlagBadge}>
                          Yours
                        </span>
                      )}
                    </div>

                    <p className={dashboardStyles.feedItemTruncatedDescription}>
                      {renderSnippet(q.content || q.description)}
                    </p>

                    {/* Sub Badges metadata line */}
                    <div className={dashboardStyles.feedItemMetricsFooterRow}>
                      <span
                        className={dashboardStyles.feedItemFooterMetricItem}
                      >
                        <i className="fa-regular fa-comment"></i>{" "}
                        {q.answerCount || 0} replies
                      </span>
                      <span>•</span>
                      <span>
                        {q.timeAgo ||
                          `Asked by ${q.author?.username || "anonymous"}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyQuestions;
