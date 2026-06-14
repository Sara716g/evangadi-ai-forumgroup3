import { useState, useEffect } from "react";

import { motion as Motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, MessageSquare } from "lucide-react";
import { timeAgo, isAuthoredByUser } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";
import { questionService } from "../../services/question/question.service.js";
import ui from "../../styles/pageStates.module.css";
import styles from "./MyQuestions.module.css";

export default function MyQuestions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadMine() {
      try {
        setLoading(true);
        setError(null);
        const data = await questionServic.getQuestions({ mine: true });
        setQuestions(data);
      } catch (err) {
        setError(err.message || "Failed to fetch questions.");
      } finally {
        setLoading(false);
      }
    }
    loadMine();
  }, []);

  return (
    <div className={styles["my-questions"]}>
      <section
        className={styles["my-questions__intro"]}
        aria-labelledby="my-questions-heading"
      >
        <div className={styles["my-questions__introRow"]}>
          <div className={styles["my-questions__introCopy"]}>
            <p className={styles["my-questions__eyebrow"]}>Your workspace</p>
            <h2
              id="my-questions-heading"
              className={styles["my-questions__title"]}
            >
              Your topics
            </h2>
            <p className={styles["my-questions__subtitle"]}>
              Only questions you created. Open one to read answers or add
              follow-ups. Rows use the same left accent as your threads on Home.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/questions/ask")}
            className={styles["my-questions__button"]}
          >
            <Plus size={18} /> New question
          </button>
        </div>
      </section>

      <div className={styles["my-questions__feed"]}>
        <div className={styles["my-questions__feed-list"]}>
          {loading ? (
            <div
              className={`${ui.pageStates__message} ${ui["pageStates__message--loading"]}`}
            >
              Loading your questions…
            </div>
          ) : error ? (
            <div
              className={`${ui.pageStates__message} ${ui["pageStates__message--error"]}`}
            >
              {error}
            </div>
          ) : questions.length === 0 ? (
            <div
              className={`${ui.pageStates__message} ${ui["pageStates__message--empty"]}`}
            >
              You have not asked any questions yet. Use Ask a Question in the
              sidebar to start.
            </div>
          ) : (
            questions.map((q, i) => {
              const mine = user ? isAuthoredByUser(q, user) : true;
              return (
                <Motion.div
                  key={q.questionHash}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/question/${q.questionHash}`)}
                  className={`${styles["my-questions__discussion"]} ${
                    mine ? styles["my-questions__discussion--mine"] : ""
                  }`}
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${q.author?.firstName}+${q.author?.lastName}&background=random`}
                    alt={`${q.author?.firstName} ${q.author?.lastName}`}
                    className={styles["my-questions__discussion-avatar"]}
                    referrerPolicy="no-referrer"
                  />
                  <div className={styles["my-questions__discussion-content"]}>
                    <div className={styles["my-questions__discussion-header"]}>
                      <h3 className={styles["my-questions__discussion-title"]}>
                        {q.title}
                      </h3>
                      {mine ? (
                        <span className={styles["my-questions__mineLabel"]}>
                          Yours
                        </span>
                      ) : null}
                    </div>
                    <p className={styles["my-questions__discussion-text"]}>
                      {q.content}
                    </p>
                    <div className={styles["my-questions__meta"]}>
                      <span className={styles["my-questions__meta-item"]}>
                        <MessageSquare size={12} /> {q.answerCount || 0} replies
                      </span>

                      <span className={styles["my-questions__meta-item"]}>
                        {timeAgo(q.createdAt)} by You
                      </span>
                    </div>
                  </div>
                </Motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
