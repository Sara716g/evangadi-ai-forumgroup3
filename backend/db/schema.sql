-- Database Schema for Evangadi Forum
-- Platform: PostgreSQL

-- -----------------------------------------------------------------------------
-- 1. Users Table
-- Stores user account information.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(320) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'banned', 'suspended')),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_code VARCHAR(64) DEFAULT NULL,
    verification_code_expires_at TIMESTAMP DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    avatar_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (email = LOWER(email))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_verification_code ON users(verification_code);

-- -----------------------------------------------------------------------------
-- 2. Questions Table
-- Stores the main questions posted by users.
-- Supports full-text search on title and content for exact match search.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS questions CASCADE;
CREATE TABLE questions (
    question_id SERIAL PRIMARY KEY,
    question_hash CHAR(16) NOT NULL UNIQUE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (CHAR_LENGTH(title) >= 5),
    CHECK (CHAR_LENGTH(content) >= 10)
);

CREATE INDEX idx_questions_user_id ON questions(user_id);
CREATE INDEX idx_questions_created_at ON questions(created_at);

-- Full-text search index for exact match search mode
CREATE INDEX ft_questions_search ON questions USING GIN (to_tsvector('english', title || ' ' || content));

-- -----------------------------------------------------------------------------
-- 3. Question Vectors Table
-- Stores embeddings for the AI Semantic Search feature (Gemini default model).
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS question_vectors CASCADE;
CREATE TABLE question_vectors (
    vector_id BIGSERIAL PRIMARY KEY,
    question_id INT NOT NULL UNIQUE REFERENCES questions(question_id) ON DELETE CASCADE,
    source_text TEXT NOT NULL,
    embedding JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'ready',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 4. Answers Table
-- Stores answers to questions.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS answers CASCADE;
CREATE TABLE answers (
    answer_id SERIAL PRIMARY KEY,
    question_id INT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_user_id ON answers(user_id);
CREATE INDEX idx_answers_created_at ON answers(created_at);

-- -----------------------------------------------------------------------------
-- 4b. Answer Attachments Table
-- Stores images and PDF files attached to an answer.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS answer_attachments CASCADE;
CREATE TABLE answer_attachments (
    attachment_id SERIAL PRIMARY KEY,
    answer_id INT NOT NULL REFERENCES answers(answer_id) ON DELETE CASCADE,
    file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('image', 'pdf')),
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    storage_path VARCHAR(1024) NOT NULL,
    byte_size BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_answer_attachments_answer_id ON answer_attachments(answer_id);

-- -----------------------------------------------------------------------------
-- 5. Answer Votes Table
-- Stores upvotes for answers (one vote per user per answer).
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS answer_votes CASCADE;
CREATE TABLE answer_votes (
    vote_id SERIAL PRIMARY KEY,
    answer_id INT NOT NULL REFERENCES answers(answer_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(answer_id, user_id)
);

CREATE INDEX idx_answer_votes_answer_id ON answer_votes(answer_id);
CREATE INDEX idx_answer_votes_user_id ON answer_votes(user_id);

-- -----------------------------------------------------------------------------
-- 5b. Answer Comments Table
-- Stores comments on answers.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS answer_comments CASCADE;
CREATE TABLE answer_comments (
    comment_id SERIAL PRIMARY KEY,
    answer_id INT NOT NULL REFERENCES answers(answer_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_answer_comments_answer_id ON answer_comments(answer_id);
CREATE INDEX idx_answer_comments_user_id ON answer_comments(user_id);

-- -----------------------------------------------------------------------------
-- 6. RAG: user-owned PDF documents, text chunks, and chunk embeddings
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS documents CASCADE;
CREATE TABLE documents (
    document_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(512) NOT NULL,
    mime_type VARCHAR(128) NOT NULL DEFAULT 'application/pdf',
    storage_path VARCHAR(1024) NOT NULL,
    byte_size BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_user_created ON documents(user_id, created_at);

DROP TABLE IF EXISTS document_chunks CASCADE;
CREATE TABLE document_chunks (
    chunk_id BIGSERIAL PRIMARY KEY,
    document_id INT NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    page_start INT NULL,
    page_end INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, chunk_index)
);

CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);

DROP TABLE IF EXISTS document_chunk_vectors CASCADE;
CREATE TABLE document_chunk_vectors (
    chunk_vector_id BIGSERIAL PRIMARY KEY,
    chunk_id BIGINT NOT NULL UNIQUE REFERENCES document_chunks(chunk_id) ON DELETE CASCADE,
    source_text TEXT NOT NULL,
    embedding JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ready',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 7. Password Reset Tokens Table
-- Stores tokens for the forgot-password flow.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
CREATE TABLE password_reset_tokens (
    token_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- -----------------------------------------------------------------------------
-- 8. User Credentials Table
-- Stores profile credentials (employment, education, location).
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS user_credentials CASCADE;
CREATE TABLE user_credentials (
    credential_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    credential_type VARCHAR(20) NOT NULL CHECK (credential_type IN ('employment', 'education', 'location')),
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 9. Notifications Table
-- Stores user notifications (answers, mentions, etc.).
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500) DEFAULT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- -----------------------------------------------------------------------------
-- 10. Voice Messages Table
-- Stores voice messages attached to questions or answers.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS voice_messages CASCADE;
CREATE TABLE voice_messages (
    voice_message_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INT NOT NULL,
    duration FLOAT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    question_id INT DEFAULT NULL REFERENCES questions(question_id) ON DELETE SET NULL,
    answer_id INT DEFAULT NULL REFERENCES answers(answer_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_voice_messages_user_id ON voice_messages(user_id);

-- -----------------------------------------------------------------------------
-- 11. AI Assistant Logs Table
-- Stores AI assistant interactions for debugging and analytics.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS ai_assistant_logs CASCADE;
CREATE TABLE ai_assistant_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_assistant_logs_user_id ON ai_assistant_logs(user_id);

-- -----------------------------------------------------------------------------
-- 12. Email Verifications Table
-- Stores temporary registration data before email verification.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS email_verifications CASCADE;
CREATE TABLE email_verifications (
    verification_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(6) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_verifications_email ON email_verifications(email);
CREATE INDEX idx_email_verifications_code ON email_verifications(code);
