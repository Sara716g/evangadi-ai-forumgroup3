# Milestone 4 - Group Summary

## Overview

This document explains all Milestone 4 features, and where to add new code.

---

## Feature List

| Task | Feature |
|------|---------|
| T-26 | File Attachments |
| T-27 | Voice Messages |
| T-28 | Voting & Comments |
| T-29 | Notification |
| T-30 | AI Assistant |
| T-31 | Forgot Password |
| T-32 | Duplicate Detection |
| T-33 | External Forum Search |
| T-35 | User Profiles |
| T-36 | Dark Mode |

## Folder Structure

### Backend - Where to Add New Code

```
backend/src/api/
├── auth/              (Milestone 1 - done, UPDATE for T-31 Forgot Password)
├── question/          (Milestone 2 - done)
├── answer/            (Milestone 2 - done)
├── rag/               (Milestone 3 - done)
├── attachment/        (NEW - T-26) ← 
├── voice-message/     (NEW - T-27) ← 
├── vote/              (NEW - T-28) ← 
├── comment/           (NEW - T-28) ← 
├── notification/      (NEW - T-29) ← 
├── ai-assistant/      (NEW - T-30) ← 
├── profile/           (NEW - T-35) ←
├── admin/             (NEW - T-37) ←
└── routes.js          (UPDATE - add new routes)
```

### Frontend - Where to Add New Code

```
frontend/src/
├── components/
│   ├── Layout/        (done)
│   ├── Navbar/        (UPDATE - add notification bell)
│   ├── Sidebar/       (done)
│   ├── Attachment/    (NEW - T-26) ← 
│   ├── VoiceRecorder/ (NEW - T-27) ← 
│   ├── Voting/        (NEW - T-28) ← 
│   ├── Comment/       (NEW - T-28) ← 
│   ├── Notification/  (NEW - T-29) ←
│   ├── admin/         (NEW - T-37) ←
│   ├── Profile/       (NEW - T-35) ← 
│   └── ThemeToggle/   (NEW - T-36) ← 
│
├── pages/
│   ├── Dashboard/     (done)
│   ├── Auth/          (done, UPDATE for T-31 Forgot Password)
│   ├── Admin/         (NEW - T-37) ←
│   ├── Notifications/ (NEW - T-29) ← 
│   └── Profile/       (NEW - T-35) ← 
│
├── services/ (UPDATE - add API calls)
│   ├── attachment.service.js (NEW)
│   ├── voice.service.js (NEW)
│   ├── vote.service.js (NEW)
│   ├── comment.service.js (NEW)
│   ├── notification.service.js (NEW)
│   ├── profile.service.js (NEW)
│   └── admin.service.js (NEW)
│
└── contexts/
    └── ThemeContext.jsx (NEW - T-36) ← Bini creates
```

---

## What Each Person Needs to Do

### (T-26 + T-36)

**Backend:**
1. Create `backend/src/api/attachment/` folder
2. Create files: `attachment.controller.js`, `attachment.service.js`, `attachment.validation.js`

**Frontend:**
1. Create `frontend/src/components/Attachment/FileUpload.jsx`
2. Create `frontend/src/components/ThemeToggle/ThemeToggle.jsx`
3. Create `frontend/src/contexts/ThemeContext.jsx`

**API Endpoints:**
- `POST /api/attachments` - upload file
- `GET /api/attachments/:id` - download file
- `DELETE /api/attachments/:id` - delete file

---

### (T-27)

**Backend:**
1. Create `backend/src/api/voice-message/` folder
2. Create files: `voice-message.controller.js`, `voice-message.service.js`

**Frontend:**
1. Create `frontend/src/components/VoiceRecorder/VoiceRecorder.jsx`

**API Endpoints:**
- `POST /api/voice-messages` - upload audio
- `GET /api/voice-messages/:id` - play audio

---

### (T-28)

**Backend:**
1. Create `backend/src/api/vote/` folder
2. Create `backend/src/api/comment/` folder

**Frontend:**
1. Create `frontend/src/components/Voting/VoteButtons.jsx`
2. Create `frontend/src/components/Comment/CommentSection.jsx`

**API Endpoints:**
- `POST /api/answers/:id/vote` - upvote/downvote
- `POST /api/answers/:id/comments` - add comment
- `GET /api/answers/:id/comments` - list comments

---

### (T-29 + T-35)

**Backend:**
1. Create `backend/src/api/notification/` folder
2. Create `backend/src/api/profile/` folder

**Frontend:**
1. Create `frontend/src/components/Notification/NotificationBell.jsx`
2. Create `frontend/src/pages/Notifications/Notifications.jsx`
3. Create `frontend/src/components/Profile/ProfileCard.jsx`
4. Create `frontend/src/pages/Profile/Profile.jsx`
5. Create `frontend/src/components/Profile/ProfileEditForm.jsx`

**API Endpoints:**
- `POST /api/notifications` - create notification
- `GET /api/notifications` - list notifications
- `PUT /api/notifications/:id/read` - mark read
- `GET /api/profile/:userId` - get profile
- `PUT /api/profile` - update profile
- `POST /api/profile/avatar` - upload avatar

---

### (T-30)

**Backend:**
1. Create `backend/src/api/ai-assistant/` folder
2. Create files: `ai-assistant.controller.js`, `ai-assistant.service.js`

**API Endpoints:**
- `POST /api/ai-assistant/answer` - get AI answer

---

### (T-31 Forgot Password)

**Backend:**
1. Update `backend/src/api/auth/` folder - add forgot-password and reset-password files

**Frontend:**
1. Create `frontend/src/pages/Auth/ForgotPassword.jsx`
2. Create `frontend/src/pages/Auth/ResetPassword.jsx`

**API Endpoints:**
- `POST /api/auth/forgot-password` - send reset email
- `POST /api/auth/reset-password` - reset password with token

---

### (T-32 Duplicate Detection)

**Backend:**
1. Update `backend/src/api/question/` - enhance duplicate detection with AI vector cosine similarity

**Frontend:**
1. Update `frontend/src/pages/PostQuestion/PostQuestion.jsx` - show duplicate warnings during question creation

**API Endpoints:**
- `POST /api/questions` - returns duplicate warnings when similar question detected (cosine similarity > 90%)

---

### (T-33)

**Backend:**
1. Create `backend/src/api/community/` folder
2. Create files: `community.controller.js`, `community.service.js`

**API Endpoints:**
- `GET /api/community/external` - search external forums

---

## Important Notes

1. **Each person creates their own folder** in `backend/src/api/`
2. **Each person creates their own components** in `frontend/src/components/`
3. **Use existing patterns** - look at `auth/` or `question/` folders for reference
4. **Update routes.js** - add your new routes at the end
5. **Create feature branches** - name: `feature/T-XX-your-name`

---

## Git Branch Naming

```bash
git checkout -b feature/T-26-bini-attachments
git checkout -b feature/T-27-melat-voice
git checkout -b feature/T-28-melese-voting
git checkout -b feature/T-29-you-notifications
git checkout -b feature/T-30-beza-ai
git checkout -b feature/T-31-gebre-forgot-password
git checkout -b feature/T-32-duplicate-detection
git checkout -b feature/T-33-tsi-external
git checkout -b feature/T-35-you-profiles
git checkout -b feature/T-36-bini-darkmode
```

---

## Task Documentation

All task details are in: `tasks/MASTER_TASK_LIST.md`

Each task has detailed docs in:

- `tasks/backend/[feature-name]/`
- `tasks/frontend/[feature-name]/`

---

## Timeline

| Week   | Focus                                              |
| ------ | -------------------------------------------------- |
| Week 1 | Setup branches, create folders, start backend APIs |
| Week 2 | Complete backend, start frontend components        |
| Week 3 | Complete frontend, integrate with backend          |
| Week 4 | Testing, bug fixes, final touches                  |

---

## Questions?

Ask in our group chat or check the task documentation files.
