# Evangadi AI Forum — Defense Presentation
## Team Leader: Sara Getachew (GitHub: Sara716g)

---

# SLIDE 1: Title

## AI-Powered Evangadi Forum
### Full-Stack Community Q&A Platform with AI Integration

- **Repository:** https://github.com/Sara716g/evangadi-ai-forumgroup3
- **Team:** Group 3
- **Team Leader:** Sara Getachew
- **Tech Stack:** React + Vite | Express.js | MySQL | Google Gemini API

---

# SLIDE 2: Project Purpose & Overview

## What We Built

A Q&A community forum for software developers with AI-powered features:

| Feature | Description |
|---------|-------------|
| Questions & Answers | Core forum with hash-based routing |
| Semantic Search | Vector embeddings for conceptual search |
| AI Draft Coach | Real-time feedback on question drafts |
| RAG Documents | PDF upload with AI-grounded Q&A |
| AI Assistant | Floating AI help widget |
| Voice Messages | Audio recording and playback |
| Voting & Comments | Community engagement features |
| Notifications | Real-time alerts with grouping |
| Dark Mode | Theme switching with CSS variables |
| Admin Dashboard | User management and moderation |

**Problem Solved:** Reduces duplicate questions via AI detection and improves answer quality through AI assistance.

---

# SLIDE 3: System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 19 + Vite)              │
│  Pages (13) │ Components (13) │ Services │ Contexts (2)     │
└─────────────────────────┬───────────────────────────────────┘
                          │ REST API (Axios)
┌─────────────────────────┴───────────────────────────────────┐
│                     BACKEND (Express 5 + Node.js)           │
│  11 API Modules │ Middleware │ Services │ Controllers        │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
  ┌───────┴───────┐             ┌─────────┴─────────┐
  │  MySQL (15)   │             │  Google Gemini    │
  │  Tables       │             │  API (Embeddings  │
  │               │             │  + Text Gen)      │
  └───────────────┘             └───────────────────┘
```

**Design Pattern:** MVC with Service Layer

---

# SLIDE 4: Database Design

## 15 Tables (Verified from `backend/db/schema.sql`)

| Table | Purpose |
|-------|---------|
| `users` | Accounts with roles, status, email verification |
| `questions` | Forum questions with hash-based routing |
| `question_vectors` | Gemini embeddings for semantic search |
| `answers` | User responses |
| `answer_attachments` | Images/PDFs on answers |
| `answer_votes` | Upvote system |
| `answer_comments` | Comments on answers |
| `documents` | RAG PDF metadata |
| `document_chunks` | Chunked PDF text (900 chars, 120 overlap) |
| `document_chunk_vectors` | RAG embeddings |
| `notifications` | User alerts |
| `voice_messages` | Audio storage |
| `ai_assistant_logs` | AI interaction logs |
| `email_verifications` | Registration verification |
| `password_reset_tokens` | Password reset flow |
| `user_credentials` | Profile credentials |

**Key:** Foreign keys with CASCADE, FULLTEXT indexes, JSON vector storage.

---

# SLIDE 5: Git Workflow

## Branching Strategy: Feature Branches

**Total branches (local + remote):** 50
**Total commits on main (first-parent):** 147
**Total contributors (by commit):** 20 unique authors

**Contributor Commit Counts (verified via `git shortlog`):**

| Contributor | Commits |
|------------|---------|
| Sara716g (me) | 80 |
| 2017MT (Teshome) | 10 |
| Sara Getachew | 7 |
| teshome-dot | 7 |
| codeZus (Bini) | 7 |
| knieynur (Tsion) | 6 |
| melat kiflu | 5 |
| gebre2026 | 5 |
| bsratkafl (Bisrat) | 5 |
| bezawit16-ke | 4 |
| melesets (Melese) | 3 |
| Bezawit | 3 |
| abubekerMH | 3 |
| Others | 8 |

**My total commits (Sara716g + Sara Getachew):** 87

---

# SLIDE 6: Pull Requests I Merged

## 12 PRs Verified as Merged by Me

All of the following merge commits are authored by `Sara716g`:

| Commit | PR | Feature | Original Author |
|--------|-----|---------|-----------------|
| `2ee6adf` | #14 | RAG Documents sidebar, upload | Melat |
| `61e2faa` | #16 | RAG 3-tab view (Ask AI, Search, PDF) | Melese |
| `d6537ac` | #18 | Delete RAG Document | Bisrat |
| `5d5a5d2` | #19 | Stream RAG Document PDF | Gebre |
| `893b985` | #20 | RAG document semantic search | Abubeker |
| `280c617` | #21 | RAG CRUD metadata + db.js utility | Bini & Beza |
| `63b387a` | #26 | Voice accessibility — speech input & read aloud | Bisrat |
| `9329855` | #27 | AI Assistant integration | Bezawit |
| `7641c75` | #28 | Notifications and User Profiles (T-29, T-35) | Sara & Beza |
| `1bcaa71` | #28 | Forgot Password feature (T-31) | Gebre |
| `9dafbf6` | #32 | Duplicate question prevention (T-32) | Abubeker |
| `f6f3729` | #24 (or #33) | External forum search (T-33) | Tsion |

---

# SLIDE 7: Merge Conflicts I Resolved

## 6 Verified Conflict Resolutions

| Commit | Conflict | Resolution Approach |
|--------|----------|-------------------|
| `883da56` | Main vs Feature/Frontend-updated-v2 | Merged main into feature branch, resolved all file-level conflicts |
| `7a9bca3` | RAG batch processing vs PDF viewer | Kept batch processing backend + enhanced PDF viewer frontend |
| `741a2e4` | T-24Bini/Metadata endpoint | Added `getDocumentMetaService`, resolved route conflicts |
| `8550d8d` | T-24-List-My-Rag-Docs | Merged list endpoint with existing CRUD operations |
| `fb15d67` | MyQuestions UI changes | Kept MyQuestions UI improvements from feature branch |
| `61c29af` | General conflicts | Resolved file path and import conflicts |

---

# SLIDE 8: My Technical Contributions

## Features I Personally Developed

### 1. Dark Mode (T-36) — Commit `e8db636`
**Files changed:** 8 files, +282 / -147 lines
- Created `ThemeContext.jsx` and `ThemeToggle.jsx`
- Added CSS variables for dark theme
- Updated `App.jsx`, `Navbar.jsx`, `index.css`
- Follow-up fixes: `5029a90`, `f1e17e1`, `e34b50e`, `78b56d9`, `15c453e`

### 2. Notifications & User Profiles (T-29, T-35) — Commit `06f8ff8`
- Backend: notification module + profile module (routes, controllers, services, validations)
- Frontend: `NotificationBell`, `Notifications` page, `ProfileCard`, `ProfileEditForm`, `Profile` page
- Schema: `notifications`, `user_credentials` tables
- Follow-up: `0936b36` (removed duplicate sidebar entries), `858fe30` (fixed import path)

### 3. Admin Dashboard (T-37) — Commit `64e4091`
- Backend: admin module with stats, user management, content moderation endpoints
- Frontend: `AdminDashboard`, `ManageUsers`, `ManageQuestions` pages
- Schema: `role`, `status` columns on users table

### 4. RAG Documents Page — Commit `779abd1`
- Built sidebar, document list, upload, tab-based reader view
- Follow-up fixes: `dff2b7e`, `ca36df6`, `0f196ae`, `a25e36d`

---

# SLIDE 9: My Integration & Leadership Work

## Team Coordination Evidence

**PR Reviews & Merges:** 12 verified merge commits by me
**Conflict Resolutions:** 6 verified merge conflict resolutions
**Bug Fixes Post-Integration:** 20+ fix commits (verified from git log)

**Key Integration Activities (verified commits):**

| Activity | Evidence |
|----------|----------|
| Schema management | `c949a7b`, `6a802f4`, `6aafea8` (3 schema updates) |
| Migration scripts | `c5ff59f` (group setup migration) |
| Import path fixes | `d23d2f7`, `29bab87`, `5890076`, `858fe30` |
| RAG integration | `dff2b7e`, `ca36df6`, `0f196ae`, `a25e36d`, `38f0558` |
| Auth fixes | `a896ae2` (duplicate navigate, answer fit, isOwnQuestion) |
| UI fixes | `411e20d` (footer overlap), `d37836e` (Share/Answers buttons) |
| Lint cleanup | `0b5e0e2` (resolved lint errors in cherry-picked files) |
| Documentation | `5429df0` (project completion report) |

---

# SLIDE 10: Milestones Completed

## Verified Milestone Delivery

| Milestone | Features | Status |
|-----------|----------|--------|
| **M1: Auth** | Register, Login, JWT, Protected Routes | ✅ Verified in `backend/src/api/auth/` |
| **M2: Q&A** | Questions, Answers, Semantic Search, Draft Coach, Answer Fit | ✅ Verified in `backend/src/api/question/`, `answer/` |
| **M3: RAG** | PDF Upload, Chunking, Embeddings, Semantic Search, Query | ✅ Verified in `backend/src/api/rag/` |
| **M4: Enhanced** | T-26 to T-37 (11 features) | ✅ Verified across all modules |

**M4 Features with verified code:**
- T-26: File Attachments (`backend/src/api/answer/answer.upload.config.js`)
- T-27: Voice Messages (`backend/src/api/voice-message/`)
- T-28: Voting & Comments (schema tables verified)
- T-29: Notifications (`backend/src/api/notification/`)
- T-30: AI Assistant (`backend/src/api/ai-assistant/`)
- T-31: Forgot Password (`backend/src/api/auth/controller/forgot-password.controller.js`)
- T-32: Duplicate Detection (PR #32 merged)
- T-33: External Search (`backend/src/api/community/`)
- T-35: User Profiles (`backend/src/api/profile/`)
- T-36: Dark Mode (commit `e8db636`)
- T-37: Admin Dashboard (`backend/src/api/admin/`)

---

# SLIDE 11: Challenges & Solutions

## Verified Challenges

### 1. Multiple Team Members Editing Same Files
**Evidence:** 6 merge conflicts resolved by me
**Solution:** Established feature branch naming (`feature/T-XX-description`), coordinated merge schedule, resolved conflicts promptly

### 2. RAG Page Integration Issues
**Evidence:** 5 fix commits for RAG (`dff2b7e`, `ca36df6`, `0f196ae`, `a25e36d`, `38f0558`)
**Solution:** Fixed broken imports, search params, duplicate routes, response formats, layout issues

### 3. Import Path Errors After Merges
**Evidence:** 4 import fix commits (`d23d2f7`, `29bab87`, `5890076`, `858fe30`)
**Solution:** Systematically corrected import paths after cherry-picking and merging

### 4. Schema Mismatches
**Evidence:** 3 schema update commits (`c949a7b`, `6a802f4`, `6aafea8`)
**Solution:** Added missing tables (`answer_comments`, `email_verifications`) and columns (`bio`, `avatar_url`)

---

# SLIDE 12: Defense Q&A

## Likely Examiner Questions & Evidence-Based Answers

### Q1: What is your specific role as team leader?
**A:** I merged 12 pull requests, resolved 6 merge conflicts, made 87 commits, managed the database schema (3 updates), integrated features across 4 milestones, and fixed integration bugs (20+ fix commits). All verified from git history.

### Q2: How does semantic search work?
**A:** Questions are embedded using Gemini API (`question_vectors` table). Search computes cosine similarity between query and stored vectors. Results above threshold are returned ranked. Verified in `backend/src/api/question/service/question.service.js`.

### Q3: How does the RAG system work?
**A:** PDFs are uploaded, parsed with `pdf-parse`, chunked into 900-character segments, embedded via Gemini, and stored in `document_chunks` + `document_chunk_vectors`. Queries find relevant chunks by cosine similarity. Verified in `backend/src/api/rag/`.

### Q4: How did you handle merge conflicts?
**A:** I resolved 6 conflicts (commits `883da56`, `7a9bca3`, `741a2e4`, `8550d8d`, `fb15d67`, `61c29af`). I analyzed both versions, combined features where possible, and tested the merged result.

### Q5: What evidence do you have of your contributions?
**A:** Git log shows 87 commits under `Sara716g` and `Sara Getachew`, 12 merge commits for PRs, 6 conflict resolution commits, and feature commits for Dark Mode (`e8db636`), Notifications (`06f8ff8`), and Admin Dashboard (`64e4091`).

### Q6: What would you improve with more time?
**A:** Add unit/integration tests (vitest config exists but no test files found), implement WebSocket for real-time notifications, add Redis caching, and create CI/CD pipeline.

---

# SPEAKER NOTES

## Slide 1 — Title (30 seconds)
"Good morning. I'm Sara Getachew, team leader of Group 3. Today I'll present our AI-Powered Evangadi Forum, a full-stack Q&A platform built with React, Express.js, MySQL, and Google Gemini API."

## Slide 2 — Overview (1 minute)
"Our platform solves duplicate questions and low-quality answers in developer communities. It has 11 major features including semantic search, AI draft coaching, RAG document Q&A, voice messages, and an admin dashboard. The repository is on GitHub with 147 commits on main."

## Slide 3 — Architecture (1 minute)
"We follow an MVC pattern. The React frontend communicates with Express backend via REST API. The backend uses 11 API modules with controllers, services, and validations. MySQL stores data across 15 tables, and Gemini API handles embeddings and text generation."

## Slide 4 — Database (1 minute)
"Our schema has 15 tables with foreign key constraints, FULLTEXT indexes for search, and JSON columns for vector storage. Key tables include questions, answers, question_vectors for semantic search, and document_chunks for RAG."

## Slide 5 — Git Workflow (1 minute)
"We used feature branches. I made 87 commits total. 20 unique contributors are in the repository. I managed 50 branches and coordinated merges across the team."

## Slide 6 — PRs Merged (1 minute)
"I merged 12 pull requests covering RAG features (PRs #14, #16, #18, #19, #20, #21), voice accessibility (#26), AI assistant (#27), notifications and profiles (#28), forgot password (#28), duplicate detection (#32), and external search (#24)."

## Slide 7 — Conflicts (1 minute)
"I resolved 6 merge conflicts. The most significant was `883da56` where I merged main into the frontend feature branch, reconciling all file-level conflicts across backend and frontend."

## Slide 8 — My Features (1.5 minutes)
"I personally developed three major features: Dark Mode with ThemeContext and CSS variables (8 files, +282/-147 lines), Notifications and Profiles with full backend and frontend modules, and the Admin Dashboard with user management and content moderation."

## Slide 9 — Integration (1 minute)
"As integration lead, I fixed 20+ bugs after merges including import paths, RAG page layout, auth issues, and schema mismatches. I also created migration scripts and updated documentation."

## Slide 10 — Milestones (1 minute)
"We completed all 4 milestones: Authentication, Q&A System, RAG Knowledge Base, and 11 Enhanced Forum Features. All features have verified code in the repository."

## Slide 11 — Challenges (1 minute)
"Our main challenges were merge conflicts from parallel development and RAG integration issues. I resolved conflicts systematically and fixed integration bugs through dedicated fix commits."

## Slide 12 — Q&A (remaining time)
"I'm happy to answer any questions. All claims in this presentation are backed by specific commits and file references in the repository."
