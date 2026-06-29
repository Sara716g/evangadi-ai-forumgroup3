import { db } from './db/config.js';

async function migrate() {
  console.log('Running database migration...\n');

  // 1. Add role column
  try {
    await db.execute("ALTER TABLE users ADD COLUMN role ENUM('user','admin') DEFAULT 'user' AFTER password_hash");
    console.log('✓ Added role column to users');
  } catch (e) {
    if (e.message.includes('Duplicate column')) console.log('- role column already exists');
    else console.error('✗ role error:', e.message);
  }

  // 2. Add status column
  try {
    await db.execute("ALTER TABLE users ADD COLUMN status ENUM('active','banned','suspended') DEFAULT 'active' AFTER role");
    console.log('✓ Added status column to users');
  } catch (e) {
    if (e.message.includes('Duplicate column')) console.log('- status column already exists');
    else console.error('✗ status error:', e.message);
  }

  // 3. Add avatar_url column
  try {
    await db.execute('ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) DEFAULT NULL AFTER bio');
    console.log('✓ Added avatar_url column to users');
  } catch (e) {
    if (e.message.includes('Duplicate column')) console.log('- avatar_url column already exists');
    else console.error('✗ avatar_url error:', e.message);
  }

  // 4. Create password_reset_tokens table
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        token_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(64) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        used TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_password_reset_tokens_token (token),
        INDEX idx_password_reset_tokens_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Created password_reset_tokens table');
  } catch (e) {
    console.error('✗ password_reset_tokens error:', e.message);
  }

  // 5. Create user_credentials table
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_credentials (
        credential_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        credential_type ENUM('employment', 'education', 'location') NOT NULL,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Created user_credentials table');
  } catch (e) {
    console.error('✗ user_credentials error:', e.message);
  }

  // 6. Create notifications table
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        link VARCHAR(500),
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_notifications_user_id (user_id),
        INDEX idx_notifications_is_read (is_read)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Created notifications table');
  } catch (e) {
    console.error('✗ notifications error:', e.message);
  }

  // 7. Create voice_messages table
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS voice_messages (
        voice_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        question_id INT,
        answer_id INT,
        audio_url VARCHAR(500) NOT NULL,
        duration_seconds FLOAT,
        transcript TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE SET NULL,
        FOREIGN KEY (answer_id) REFERENCES answers(answer_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Created voice_messages table');
  } catch (e) {
    console.error('✗ voice_messages error:', e.message);
  }

  // 8. Create ai_assistant_logs table
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ai_assistant_logs (
        log_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_id VARCHAR(100),
        query_text TEXT NOT NULL,
        response_text TEXT,
        source VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_ai_logs_user_id (user_id),
        INDEX idx_ai_logs_session_id (session_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Created ai_assistant_logs table');
  } catch (e) {
    console.error('✗ ai_assistant_logs error:', e.message);
  }

  // 9. Create answer_attachments table
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS answer_attachments (
        attachment_id INT AUTO_INCREMENT PRIMARY KEY,
        answer_id INT NOT NULL,
        file_type ENUM('image','pdf') NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        storage_path VARCHAR(500) NOT NULL,
        byte_size INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (answer_id) REFERENCES answers(answer_id) ON DELETE CASCADE,
        INDEX idx_answer_attachments_answer_id (answer_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Created answer_attachments table');
  } catch (e) {
    console.error('✗ answer_attachments error:', e.message);
  }

  // 10. Create email_verifications table
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        verification_id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        verified TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE INDEX idx_email_verifications_email (email),
        INDEX idx_email_verifications_code (code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Created email_verifications table');
  } catch (e) {
    console.error('✗ email_verifications error:', e.message);
  }

  // Install nodemailer
  console.log('\nIf nodemailer is missing, run: npm install nodemailer');

  // Summary
  const [users] = await db.execute('SELECT user_id, email, role, status FROM users');
  console.log('\nCurrent users:');
  users.forEach(u => console.log(`  ${u.user_id}. ${u.email} — role: ${u.role}, status: ${u.status}`));

  console.log('\nMigration complete!');
  process.exit(0);
}

migrate();
