# Master Task List: AI-Powered Evangadi Forum

This document provides a consolidated, milestone-by-milestone breakdown of all frontend and backend tasks for the project, referencing the detailed documentation files.

---

## Milestone 1: Authentication (Auth)

_The foundation of user access. Both backend APIs and frontend pages are implemented here._

### Backend Tasks

- **Task Name**: Register User (`T-04`)

  - **Description**: Implement `POST /api/auth/register` to validate input, hash passwords using bcrypt, and create new user accounts.
  - **Reference**: `/auth/register.md`

- **Task Name**: Login User (`T-05`)
  - **Description**: Implement `POST /api/auth/login` to verify user credentials and issue signed JWT tokens for session management.
  - **Reference**: `/auth/login.md`

### Frontend Tasks

- **Task Name**: Axios + Auth Service (`T-06`)

  - **Description**: Setup Axios interceptors to automatically attach JWT tokens to API requests and handle global 401 unauthorized redirects.

- **Task Name**: Auth Page UI (`T-07`)

  - **Description**: Build the combined Login/Register page at `/auth` utilizing Framer Motion for smooth form transitions.
  - **Reference**: `/auth/task-auth.md`

- **Task Name**: AuthContext + ProtectedRoute (`T-08`)

  - **Description**: Create the global React authentication context and route guards to protect authenticated pages from unauthorized access.

- **Task Name**: Public Landing Page (`T-00`)
  - **Description**: Build the unauthenticated `/` homepage to market the application and direct users to sign up or log in.
  - **Reference**: `/public/task-landing.md`

---

## Milestone 2: Questions & Answers

_The core community forum functionality, featuring AI-assisted drafting and answer evaluation._

### Backend Tasks

- **Task Name**: Create Question & Auto-Embed (`T-09`)

  - **Description**: Implement `POST /api/questions` to save questions and simultaneously generate AI vector embeddings for semantic search.
  - **Reference**: `/question/create-question.md`

- **Task Name**: List Questions (`T-10`)

  - **Description**: Implement `GET /api/questions` with support for keyword search and a "mine" filter.
  - **Reference**: `/question/list-questions.md`

- **Task Name**: Get Single Question Details (`T-10`)

  - **Description**: Implement `GET /api/questions/:questionHash` to fetch a specific question and all its associated answers.
  - **Reference**: `/question/single-question.md`

- **Task Name**: Semantic Search Questions (`T-11`)

  - **Description**: Implement `GET /api/questions/search` to find conceptually related questions using AI vector cosine similarity.
  - **Reference**: `/question/search-questions.md`

- **Task Name**: Find Similar Questions (`T-11`)

  - **Description**: Implement `GET /api/questions/:questionHash/similar` to recommend related questions based on an existing question's vector.
  - **Reference**: `/question/similar-questions.md`

- **Task Name**: Create Answer (`T-12`)

  - **Description**: Implement `POST /api/answers` to allow users to answer community questions (preventing them from answering their own).
  - **Reference**: `/answer/create-answer.md`

- **Task Name**: AI Question Draft Coach (`T-17`)

  - **Description**: Implement `POST /api/questions/draft-coach` to provide real-time AI feedback and tips on question drafts.
  - **Reference**: `/question/draft-coach.md`

- **Task Name**: AI Answer Fit Evaluation (`T-18`)
  - **Description**: Implement `POST /api/questions/:questionHash/answer-fit` to evaluate how strongly a draft answer addresses the question.
  - **Reference**: `/question/answer-fit.md`

### Frontend Tasks

- **Task Name**: Layout Shell (`T-13`)

  - **Description**: Create the `Layout`, `Navbar`, and `Sidebar` components to wrap and navigate between protected routes.

- **Task Name**: Dashboard Page (`T-14`)

  - **Description**: Build the `/dashboard` page to list questions and handle keyword/semantic search inputs.
  - **Reference**: `/dashboard/task-dashboard.md`

- **Task Name**: Post Question Page (`T-15`)

  - **Description**: Build the `/questions/ask` form, seamlessly integrating the AI Draft Coach for real-time writing feedback.
  - **Reference**: `/post-question/task-post-question.md`

- **Task Name**: Question Detail Page (`T-16` & `T-20`)

  - **Description**: Build the `/questions/:questionHash` page to display the question, answers, and the new answer form equipped with AI Answer Fit.
  - **Reference**: `/question-detail/task-question-detail.md`

- **Task Name**: My Questions Page (`T-21`)
  - **Description**: Build the `/my-questions` page to display a personalized list of only the user's authored questions.
  - **Reference**: `/my-questions/task-my-questions.md`

---

## Milestone 3: Knowledge Base (RAG)

_Advanced AI feature allowing users to upload PDFs, perform semantic searches within them, and ask AI-grounded questions._

### Backend Tasks

- **Task Name**: Upload & Process RAG Document (`T-22`)

  - **Description**: Implement `POST /api/rag/documents` to securely upload PDFs, parse text, chunk paragraphs, and generate vector embeddings.
  - **Reference**: `/rag/create-document.md`

- **Task Name**: Semantic Search in RAG Document (`T-23`)

  - **Description**: Implement `GET /api/rag/documents/:documentId/search` to find and return the most relevant text excerpts within a PDF.
  - **Reference**: `/rag/search-document.md`

- **Task Name**: AI Query Grounded in RAG Document (`T-23`)

  - **Description**: Implement `POST /api/rag/documents/:documentId/query` to generate accurate AI answers based purely on the uploaded PDF's context.
  - **Reference**: `/rag/query-document.md`

- **Task Name**: Get RAG Document Metadata (`T-24`)

  - **Description**: Implement `GET /api/rag/documents/:documentId` to fetch processing status and metadata for a document.
  - **Reference**: `/rag/get-document-meta.md`

- **Task Name**: Stream RAG Document PDF (`T-24`)

  - **Description**: Implement `GET /api/rag/documents/:documentId/file` to serve the PDF blob for browser previews.
  - **Reference**: `/rag/get-document-file.md`

- **Task Name**: List My RAG Documents (`T-24`)

  - **Description**: Implement `GET /api/rag/documents` to list all PDFs uploaded by the authenticated user.
  - **Reference**: `/rag/list-documents.md`

- **Task Name**: Delete RAG Document (`T-24`)
  - **Description**: Implement `DELETE /api/rag/documents/:documentId` to safely remove a PDF from disk and cascade delete its vectors from the database.
  - **Reference**: `/rag/delete-document.md`

### Frontend Tasks

- **Task Name**: RAG Documents Page (`T-24` & `T-25`)
  - **Description**: Build the `/rag-documents` page featuring a document list sidebar, PDF upload dropzone, and a 3-tab active view interface (Ask AI, Semantic Search, PDF Preview).
  - **Reference**: `/rag-documents/task-rag-documents.md`

---

## Milestone 4: Enhanced Forum Features

_Improved community features including file uploads, voting, notifications, and AI assistance._

### Backend Tasks

- **Task Name**: Attachments (`T-26`)
  - **Description**: Implement file upload/download/delete endpoints for images and documents (max 10MB).
  - **Reference**: `/attachment/`

- **Task Name**: Voice Messages (`T-27`)
  - **Description**: Implement audio upload/streaming endpoints for voice messages.
  - **Reference**: `/voice-message/`

- **Task Name**: Voting & Comments (`T-28`)
  - **Description**: Implement upvote/downvote for answers, plus add/list comments on answers.
  - **Reference**: `/vote/`, `/comment/`

- **Task Name**: Notifications (`T-29`)
  - **Description**: Implement CRUD for notifications (create, list, mark as read).
  - **Reference**: `/notification/`

- **Task Name**: AI Assistant (`T-30`)
  - **Description**: Implement AI-powered answer generation for questions.
  - **Reference**: `/ai-assistant/answer.md`

- **Task Name**: Duplicate Detection (`T-31`)
  - **Description**: Implement endpoint to detect similar existing questions using AI.
  - **Reference**: `/duplicate/check-duplicate.md`

- **Task Name**: Categories (`T-32`)
  - **Description**: Implement category listing and filter questions by category.
  - **Reference**: `/category/`

- **Task Name**: External Forum Search (`T-33`)
  - **Description**: Implement endpoint to search questions from external forums (StackOverflow, Dev.to).
  - **Reference**: `/community/external-forums.md`

- **Task Name**: Bookmarks (`T-34`)
  - **Description**: Implement save/unsave questions and list user bookmarks.
  - **Reference**: `/bookmark/`

- **Task Name**: User Profiles (`T-35`)
  - **Description**: Implement get/update profile, upload avatar, and profile stats.
  - **Reference**: `/profile/`

- **Task Name**: Admin - Manage Users (`T-37`)
  - **Description**: Implement admin endpoints to list users, update status (ban/unban), and get stats.
  - **Reference**: `/admin/`

- **Task Name**: Admin - Manage Questions (`T-37`)
  - **Description**: Implement admin endpoints to delete questions and answers.
  - **Reference**: `/admin/`

### Frontend Tasks

- **Task Name**: File Upload Component (`T-26`)
  - **Description**: Build drag-and-drop file upload with preview for images/documents.
  - **Reference**: `/attachment/task-attachment.md`

- **Task Name**: Voice Recorder (`T-27`)
  - **Description**: Build audio recording component with playback controls.
  - **Reference**: `/voice-message/task-voice.md`

- **Task Name**: Voting & Comments UI (`T-28`)
  - **Description**: Build upvote/downvote buttons and comment section for answers.
  - **Reference**: `/voting/task-voting.md`

- **Task Name**: Notifications (`T-29`)
  - **Description**: Build notifications page and bell icon with unread count.
  - **Reference**: `/notifications/`

- **Task Name**: Duplicate Warning (`T-31`)
  - **Description**: Build duplicate question detection UI when posting new questions.
  - **Reference**: `/duplicate/task-duplicate.md`

- **Task Name**: Category Sidebar (`T-32`)
  - **Description**: Build category filter sidebar for dashboard page.
  - **Reference**: `/categories/task-categories.md`

- **Task Name**: Bookmarks Page (`T-34`)
  - **Description**: Build bookmarks page and bookmark button component.
  - **Reference**: `/bookmark/`

- **Task Name**: User Profile (`T-35`)
  - **Description**: Build profile page with edit form and avatar upload.
  - **Reference**: `/profile/`

- **Task Name**: Dark Mode (`T-36`)
  - **Description**: Implement dark mode toggle with CSS variables and localStorage.
  - **Reference**: `/theme/task-dark-mode.md`

- **Task Name**: Admin Dashboard (`T-37`)
  - **Description**: Build admin dashboard with stats and management pages for users and questions.
  - **Reference**: `/admin/`
