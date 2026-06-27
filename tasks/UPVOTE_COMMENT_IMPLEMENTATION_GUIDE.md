# Implementation Guide: Answer Upvote & Comment System

## Overview

This document provides a complete, step-by-step guide to implement two features on the Evangadi Forum platform:

1. **Answer Upvote System** — Users can upvote helpful answers (toggle on/off, one vote per user)
2. **Answer Comment System** — Users can add comments below any answer

The guide covers database, backend (Node.js/Express/MySQL), and frontend (React/Vite).

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Database Changes](#2-database-changes)
3. [Backend — Upvote Feature](#3-backend--upvote-feature)
4. [Backend — Comment Feature](#4-backend--comment-feature)
5. [Backend — Update Answer Query](#5-backend--update-answer-query)
6. [Frontend — Services](#6-frontend--services)
7. [Frontend — UI Components](#7-frontend--ui-components)
8. [Testing](#8-testing)
9. [File Reference](#9-file-reference)

---

## 1. Prerequisites

- Node.js + Express backend with MySQL (mysql2/promise)
- React + Vite frontend with Axios
- JWT authentication middleware already in place
- Existing tables: `users`, `questions`, `answers`

---

## 2. Database Changes

### 2.1 Create `answer_votes` Table

This table tracks which users have upvoted which answers. The UNIQUE constraint ensures one vote per user per answer.

```sql
CREATE TABLE `answer_votes` (
    `vote_id` INT AUTO_INCREMENT PRIMARY KEY,
    `answer_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`answer_id`) REFERENCES `answers`(`answer_id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
    UNIQUE KEY `uniq_answer_votes` (`answer_id`, `user_id`),
    INDEX `idx_answer_votes_answer_id` (`answer_id`),
    INDEX `idx_answer_votes_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.2 Create `answer_comments` Table

This table stores comments on answers.

```sql
CREATE TABLE `answer_comments` (
    `comment_id` INT AUTO_INCREMENT PRIMARY KEY,
    `answer_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `content` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`answer_id`) REFERENCES `answers`(`answer_id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
    INDEX `idx_answer_comments_answer_id` (`answer_id`),
    INDEX `idx_answer_comments_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.3 Run Migration

Save the SQL above in `backend/db/migration_answer_votes.sql` and `backend/db/migration_answer_comments.sql`. Run against your database:

```bash
mysql -u <user> -p <database_name> < backend/db/migration_answer_votes.sql
mysql -u <user> -p <database_name> < backend/db/migration_answer_comments.sql
```

Or use Node.js:

```js
const mysql = require('mysql2/promise');
async function migrate() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'your_user',
    password: 'your_password',
    database: 'your_database'
  });
  // paste the CREATE TABLE statements here
  await conn.execute(`CREATE TABLE IF NOT EXISTS answer_votes (...)`);
  await conn.execute(`CREATE TABLE IF NOT EXISTS answer_comments (...)`);
  console.log('Tables created!');
  await conn.end();
}
migrate();
```

---

## 3. Backend — Upvote Feature

### 3.1 Create Vote Service

**File:** `backend/src/api/answer/service/answerVote.service.js`

```js
import { safeExecute } from '../../../../db/config.js';
import { NotFoundError } from '../../../utils/errors/index.js';

/**
 * Toggle upvote for an answer.
 * If the user has already voted, remove the vote.
 * If the user has not voted, add a vote.
 * Returns { voted: true/false, voteCount: number }
 */
export const toggleAnswerVoteService = async ({ answerId, userId }) => {
  // 1. Check answer exists
  const answerSql = 'SELECT answer_id FROM answers WHERE answer_id = ? LIMIT 1';
  const answerRows = await safeExecute(answerSql, [answerId]);
  if (answerRows.length === 0) {
    throw new NotFoundError('Answer not found');
  }

  // 2. Check if user already voted
  const existingVoteSql = 'SELECT vote_id FROM answer_votes WHERE answer_id = ? AND user_id = ? LIMIT 1';
  const existingVotes = await safeExecute(existingVoteSql, [answerId, userId]);

  // 3. Toggle: remove if exists, insert if not
  if (existingVotes.length > 0) {
    await safeExecute('DELETE FROM answer_votes WHERE answer_id = ? AND user_id = ?', [answerId, userId]);
  } else {
    await safeExecute('INSERT INTO answer_votes (answer_id, user_id) VALUES (?, ?)', [answerId, userId]);
  }

  // 4. Get updated count
  const countSql = 'SELECT COUNT(*) AS vote_count FROM answer_votes WHERE answer_id = ?';
  const countRows = await safeExecute(countSql, [answerId]);

  return {
    voted: existingVotes.length === 0, // true if vote was added, false if removed
    voteCount: countRows[0].vote_count,
  };
};
```

### 3.2 Create Vote Controller

**File:** `backend/src/api/answer/controller/answerVote.controller.js`

```js
import { StatusCodes } from 'http-status-codes';
import { toggleAnswerVoteService } from '../service/answerVote.service.js';

export const toggleAnswerVoteController = async (req, res, next) => {
  try {
    const { answerId } = req.params;
    const userId = req.user.id;

    const result = await toggleAnswerVoteService({
      answerId: Number(answerId),
      userId,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
```

### 3.3 Add Vote Route

**File:** `backend/src/api/answer/routes/answer.routes.js`

Add this import at the top:

```js
import { toggleAnswerVoteController } from '../controller/answerVote.controller.js';
```

Add this route after the existing routes (BEFORE `export default`):

```js
router.post('/:answerId/vote', toggleAnswerVoteController);
```

---

## 4. Backend — Comment Feature

### 4.1 Create Comment Service

**File:** `backend/src/api/answer/service/answerComment.service.js`

```js
import { safeExecute } from '../../../../db/config.js';
import { NotFoundError, BadRequestError } from '../../../utils/errors/index.js';

/**
 * Get all comments for an answer.
 */
export const getAnswerCommentsService = async ({ answerId }) => {
  // Check answer exists
  const answerSql = 'SELECT answer_id FROM answers WHERE answer_id = ? LIMIT 1';
  const answerRows = await safeExecute(answerSql, [answerId]);
  if (answerRows.length === 0) {
    throw new NotFoundError('Answer not found');
  }

  const sql = `
    SELECT
      c.comment_id,
      c.content,
      c.created_at,
      u.user_id AS author_id,
      u.first_name,
      u.last_name
    FROM answer_comments c
    JOIN users u ON c.user_id = u.user_id
    WHERE c.answer_id = ?
    ORDER BY c.created_at ASC
  `;

  const rows = await safeExecute(sql, [answerId]);

  return rows.map((row) => ({
    id: row.comment_id,
    content: row.content,
    createdAt: row.created_at,
    author: {
      id: row.author_id,
      firstName: row.first_name,
      lastName: row.last_name,
    },
  }));
};

/**
 * Create a new comment on an answer.
 */
export const createAnswerCommentService = async ({ answerId, userId, content }) => {
  // Check answer exists
  const answerSql = 'SELECT answer_id FROM answers WHERE answer_id = ? LIMIT 1';
  const answerRows = await safeExecute(answerSql, [answerId]);
  if (answerRows.length === 0) {
    throw new NotFoundError('Answer not found');
  }

  // Validate content
  if (!content || content.trim().length === 0) {
    throw new BadRequestError('Comment content cannot be empty.');
  }

  // Insert comment
  const insertSql = 'INSERT INTO answer_comments (answer_id, user_id, content) VALUES (?, ?, ?)';
  const insertResult = await safeExecute(insertSql, [answerId, userId, content.trim()]);
  const commentId = insertResult.insertId;

  // Fetch and return the created comment
  const fetchSql = `
    SELECT
      c.comment_id,
      c.content,
      c.created_at,
      u.user_id AS author_id,
      u.first_name,
      u.last_name
    FROM answer_comments c
    JOIN users u ON c.user_id = u.user_id
    WHERE c.comment_id = ?
    LIMIT 1
  `;

  const rows = await safeExecute(fetchSql, [commentId]);
  const row = rows[0];

  return {
    id: row.comment_id,
    content: row.content,
    createdAt: row.created_at,
    author: {
      id: row.author_id,
      firstName: row.first_name,
      lastName: row.last_name,
    },
  };
};
```

### 4.2 Create Comment Controller

**File:** `backend/src/api/answer/controller/answerComment.controller.js`

```js
import { StatusCodes } from 'http-status-codes';
import { getAnswerCommentsService, createAnswerCommentService } from '../service/answerComment.service.js';

export const getAnswerCommentsController = async (req, res, next) => {
  try {
    const { answerId } = req.params;

    const comments = await getAnswerCommentsService({
      answerId: Number(answerId),
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
};

export const createAnswerCommentController = async (req, res, next) => {
  try {
    const { answerId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const comment = await createAnswerCommentService({
      answerId: Number(answerId),
      userId,
      content,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};
```

### 4.3 Add Comment Routes

**File:** `backend/src/api/answer/routes/answer.routes.js`

Add this import at the top:

```js
import { getAnswerCommentsController, createAnswerCommentController } from '../controller/answerComment.controller.js';
```

Add these routes after the vote route:

```js
router.get('/:answerId/comments', getAnswerCommentsController);
router.post('/:answerId/comments', createAnswerCommentController);
```

### 4.4 Final Answer Routes File

The complete `answer.routes.js` should look like this:

```js
import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';
import { createAnswerValidation } from '../validations/answer.validation.js';
import { createAnswerController } from '../controller/answer.controller.js';
import { toggleAnswerVoteController } from '../controller/answerVote.controller.js';
import { getAnswerCommentsController, createAnswerCommentController } from '../controller/answerComment.controller.js';

const router = express.Router();

router.use(authenticateUser);
router.post('/', createAnswerValidation, validationErrorHandler, createAnswerController);
router.post('/:answerId/vote', toggleAnswerVoteController);
router.get('/:answerId/comments', getAnswerCommentsController);
router.post('/:answerId/comments', createAnswerCommentController);

export default router;
```

---

## 5. Backend — Update Answer Query

When fetching a question with its answers, the query must include `vote_count`, `user_has_voted`, and `comment_count` for each answer.

### 5.1 Update `mapAnswerRow`

**File:** `backend/src/api/question/service/question.service.js`

Find the `mapAnswerRow` function and add `voteCount`, `commentCount`, and `userHasVoted`:

```js
const mapAnswerRow = row => ({
  id: row.answer_id,
  content: row.content,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  voteCount: Number(row.vote_count ?? 0),
  commentCount: Number(row.comment_count ?? 0),
  userHasVoted: row.user_has_voted === 1,
  author: {
    id: row.author_id,
    firstName: row.first_name,
    lastName: row.last_name,
  },
});
```

### 5.2 Update `getSingleQuestionService`

Find the `getSingleQuestionService` function. Update it to accept `userId` and use the new SQL query with LEFT JOINs for votes and comments.

The service signature changes from:

```js
export const getSingleQuestionService = async ({ questionHash }) => {
```

to:

```js
export const getSingleQuestionService = async ({ questionHash, userId }) => {
```

The answers SQL query changes to:

```js
const answersSql = `
  SELECT
    a.answer_id,
    a.content,
    a.created_at,
    a.updated_at,
    u.user_id AS author_id,
    u.first_name,
    u.last_name,
    COALESCE(v.vote_count, 0) AS vote_count,
    COALESCE(c.comment_count, 0) AS comment_count,
    CASE WHEN uv.vote_id IS NOT NULL THEN 1 ELSE 0 END AS user_has_voted
  FROM answers a
  JOIN users u ON a.user_id = u.user_id
  LEFT JOIN (
    SELECT answer_id, COUNT(*) AS vote_count
    FROM answer_votes
    GROUP BY answer_id
  ) v ON v.answer_id = a.answer_id
  LEFT JOIN (
    SELECT answer_id, COUNT(*) AS comment_count
    FROM answer_comments
    GROUP BY answer_id
  ) c ON c.answer_id = a.answer_id
  LEFT JOIN answer_votes uv ON uv.answer_id = a.answer_id AND uv.user_id = ?
  WHERE a.question_id = ?
  ORDER BY a.created_at ASC
`;

const answers = await safeExecute(answersSql, [userId || null, question.question_id]);
```

### 5.3 Update Controller

**File:** `backend/src/api/question/controller/question.controller.js`

Find `getSingleQuestionController` and pass `userId`:

```js
export const getSingleQuestionController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;
    const userId = req.user.id;

    const result = await getSingleQuestionService({
      questionHash,
      userId,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Question fetched successfully',
      question: result.question,
      answers: result.answers,
      answersMeta: result.answersMeta,
    });
  } catch (error) {
    next(error);
  }
};
```

---

## 6. Frontend — Services

### 6.1 Vote Service

**File:** `frontend/src/services/answer/answerVote.service.js`

```js
import { apiClient } from "../core/api.client.js";

export async function toggleAnswerVote(answerId) {
  const res = await apiClient.post(`/api/answers/${answerId}/vote`);
  return res.data;
}

export default { toggleAnswerVote };
```

### 6.2 Comment Service

**File:** `frontend/src/services/answer/answerComment.service.js`

```js
import { apiClient } from "../core/api.client.js";

export async function getAnswerComments(answerId) {
  const res = await apiClient.get(`/api/answers/${answerId}/comments`);
  return res.data;
}

export async function postAnswerComment(answerId, content) {
  const res = await apiClient.post(`/api/answers/${answerId}/comments`, { content });
  return res.data;
}

export default { getAnswerComments, postAnswerComment };
```

### 6.3 Export Services

**File:** `frontend/src/services/index.js`

Add these exports:

```js
export { toggleAnswerVote } from "./answer/answerVote.service.js";
export { getAnswerComments, postAnswerComment } from "./answer/answerComment.service.js";
```

---

## 7. Frontend — UI Components

### 7.1 Imports

At the top of `QuestionDetail.jsx`, add:

```jsx
import { toggleAnswerVote } from "../../services/answer/answerVote.service";
import { getAnswerComments, postAnswerComment } from "../../services/answer/answerComment.service";
import { useAuth } from "../../contexts/AuthContext.jsx";
```

Make sure `useState` and `useEffect` are imported:

```jsx
import { useState, useEffect } from "react";
```

### 7.2 CommentSection Component

Add this component BEFORE the `AnswerCard` component:

```jsx
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
          {/* Header */}
          <div style={{ padding: "12px 16px 8px" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>Comments</span>
          </div>

          {/* Comment input */}
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

          {/* Comments list */}
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
```

### 7.3 AnswerCard Component

Replace the existing `AnswerCard` component with:

```jsx
function AnswerCard({ answer, onVote, isVoting }) {
  const name = answer.author?.username || answer.author?.name || "new user";
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
      {/* Answer content */}
      <div style={{ padding: "16px 20px" }}>
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

      {/* Vote + Comment bar */}
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
        {/* Upvote button */}
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

        {/* Comment toggle */}
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

      {/* Comments panel (below the bar) */}
      <CommentSection
        answerId={answer.id}
        isOpen={showComments}
        onCommentAdded={() => setCommentCount((c) => c + 1)}
      />
    </div>
  );
}
```

### 7.4 Main Component Changes

In the main `QuestionDetail` default export function:

1. Add `useAuth` hook:
```jsx
const { user } = useAuth();
```

2. Add state for voting:
```jsx
const [votingAnswerId, setVotingAnswerId] = useState(null);
```

3. Add the vote handler function:
```jsx
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
    // Silently fail
  } finally {
    setVotingAnswerId(null);
  }
}
```

4. Update the AnswerCard rendering:
```jsx
{answers.map((a) => (
  <AnswerCard
    key={a.id}
    answer={a}
    onVote={handleVote}
    isVoting={votingAnswerId === a.id}
  />
))}
```

---

## 8. Testing

### 8.1 Test Upvote

1. Log in as a user
2. Navigate to a question with answers
3. Click ▲ on an answer → count should increase by 1, arrow turns orange
4. Click ▲ again → count decreases by 1, arrow turns gray (toggle off)
5. Log in as a different user → should see the same count but can vote independently

### 8.2 Test Comments

1. Click 💬 on an answer → comment panel expands below the bar
2. Type a comment and click Post or press Enter → comment appears in the list
3. Comment count on the 💬 button increments by 1
4. Log out → comment input should not appear (only logged-in users can comment)

### 8.3 Edge Cases

- Upvoting without login → should redirect to /auth
- Posting empty comment → should be prevented by button disabled state
- Multiple rapid clicks on vote → should not break count (toggle logic)
- Answer with no comments → shows "No comments yet. Be the first to comment!"

---

## 9. File Reference

### New Files Created

| File | Purpose |
|------|---------|
| `backend/db/migration_answer_votes.sql` | SQL migration for answer_votes table |
| `backend/db/migration_answer_comments.sql` | SQL migration for answer_comments table |
| `backend/src/api/answer/service/answerVote.service.js` | Toggle vote logic |
| `backend/src/api/answer/controller/answerVote.controller.js` | Vote endpoint handler |
| `backend/src/api/answer/service/answerComment.service.js` | Get/post comments logic |
| `backend/src/api/answer/controller/answerComment.controller.js` | Comment endpoint handlers |
| `frontend/src/services/answer/answerVote.service.js` | Frontend vote API call |
| `frontend/src/services/answer/answerComment.service.js` | Frontend comment API calls |

### Modified Files

| File | Change |
|------|--------|
| `backend/db/schema.sql` | Added answer_votes and answer_comments tables |
| `backend/src/api/answer/routes/answer.routes.js` | Added vote and comment routes |
| `backend/src/api/question/service/question.service.js` | Updated mapAnswerRow and getSingleQuestionService |
| `backend/src/api/question/controller/question.controller.js` | Pass userId to service |
| `frontend/src/services/index.js` | Exported new services |
| `frontend/src/pages/QuestionDetail/QuestionDetail.jsx` | Added CommentSection, updated AnswerCard |

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/answers/:answerId/vote` | Yes | Toggle upvote |
| GET | `/api/answers/:answerId/comments` | Yes | Get all comments |
| POST | `/api/answers/:answerId/comments` | Yes | Post a comment |

### Key Design Decisions

- **Toggle vote** instead of separate upvote/downvote — simpler, one click, cleaner UX
- **No avatar on comments** — keeps comments compact and clean (Quora style)
- **Lazy load comments** — only fetch when user clicks 💬, reduces unnecessary API calls
- **Optimistic UI for votes** — count updates instantly, no loading state
- **Local state for comment count** — increments on post without refetching the whole question
- **Relative timestamps** — "2h", "5m", "just now" instead of full dates
- **Inline comment panel** — expands below the vote bar, no floating dropdowns

---

*Generated for Evangadi Forum Group 3 — Upvote & Comment Feature Implementation*
