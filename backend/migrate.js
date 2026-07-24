/**
 * @file One-time database migration script.
 *
 * Adds missing columns and creates tables required by Milestone 4 features
 * (admin roles, user profiles, notifications, voice messages, RAG, etc.).
 * Safe to run repeatedly — each step catches errors so previously-applied
 * changes are skipped.
 *
 * Adapted for PostgreSQL: uses $1 placeholders, SERIAL, BOOLEAN, VARCHAR+CHECK
 * instead of MySQL-specific ENUM, AUTO_INCREMENT, ENGINE, etc.
 */

import { db } from './db/config.js';

async function migrate() {
  console.log('Running database migration...\n');

  // Helper: check if a column exists
  const columnExists = async (table, column) => {
    const result = await db.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = $1 AND column_name = $2
      )`,
      [table, column]
    );
    return result.rows[0].exists;
  };

  // Helper: check if a table exists
  const tableExists = async (table) => {
    const result = await db.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = $1
      )`,
      [table]
    );
    return result.rows[0].exists;
  };

  // 1. Add role column
  try {
    if (!(await columnExists('users', 'role'))) {
      await db.query("ALTER TABLE users ADD COLUMN role VARCHAR(10) DEFAULT 'user'");
      console.log('✓ Added role column to users');
    } else {
      console.log('- role column already exists');
    }
  } catch (e) {
    console.error('✗ role error:', e.message);
  }

  // 2. Add status column
  try {
    if (!(await columnExists('users', 'status'))) {
      await db.query("ALTER TABLE users ADD COLUMN status VARCHAR(10) DEFAULT 'active'");
      console.log('✓ Added status column to users');
    } else {
      console.log('- status column already exists');
    }
  } catch (e) {
    console.error('✗ status error:', e.message);
  }

  // 3. Add avatar_url column
  try {
    if (!(await columnExists('users', 'avatar_url'))) {
      await db.query('ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) DEFAULT NULL');
      console.log('✓ Added avatar_url column to users');
    } else {
      console.log('- avatar_url column already exists');
    }
  } catch (e) {
    console.error('✗ avatar_url error:', e.message);
  }

  // 3b. Add is_verified column
  try {
    await db.execute('ALTER TABLE users ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER avatar_url');
    console.log('✓ Added is_verified column to users');
  } catch (e) {
    if (e.message.includes('Duplicate column')) console.log('- is_verified column already exists');
    else console.error('✗ is_verified error:', e.message);
  }

  // 3c. Add verification_code column
  try {
    await db.execute('ALTER TABLE users ADD COLUMN verification_code VARCHAR(6) DEFAULT NULL AFTER is_verified');
    console.log('✓ Added verification_code column to users');
  } catch (e) {
    if (e.message.includes('Duplicate column')) console.log('- verification_code column already exists');
    else console.error('✗ verification_code error:', e.message);
  }

  // 3d. Add verification_code_expires_at column
  try {
    await db.execute('ALTER TABLE users ADD COLUMN verification_code_expires_at DATETIME DEFAULT NULL AFTER verification_code');
    console.log('✓ Added verification_code_expires_at column to users');
  } catch (e) {
    if (e.message.includes('Duplicate column')) console.log('- verification_code_expires_at column already exists');
    else console.error('✗ verification_code_expires_at error:', e.message);
  }

  // 4. Create password_reset_tokens table
  try {
    if (!(await tableExists('password_reset_tokens'))) {
      await db.query(`
        CREATE TABLE password_reset_tokens (
          token_id SERIAL PRIMARY KEY,
          user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
          token VARCHAR(64) NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          used SMALLINT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Created password_reset_tokens table');
    } else {
      console.log('- password_reset_tokens table already exists');
    }
  } catch (e) {
    console.error('✗ password_reset_tokens error:', e.message);
  }

  // 5. Create user_credentials table
  try {
    if (!(await tableExists('user_credentials'))) {
      await db.query(`
        CREATE TABLE user_credentials (
          credential_id SERIAL PRIMARY KEY,
          user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
          credential_type VARCHAR(20) NOT NULL CHECK (credential_type IN ('employment', 'education', 'location')),
          title VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Created user_credentials table');
    } else {
      console.log('- user_credentials table already exists');
    }
  } catch (e) {
    console.error('✗ user_credentials error:', e.message);
  }

  // 6. Create notifications table
  try {
    if (!(await tableExists('notifications'))) {
      await db.query(`
        CREATE TABLE notifications (
          notification_id SERIAL PRIMARY KEY,
          user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT,
          link VARCHAR(500),
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Created notifications table');
    } else {
      console.log('- notifications table already exists');
    }
  } catch (e) {
    console.error('✗ notifications error:', e.message);
  }

  // 7. Create voice_messages table
  try {
    if (!(await tableExists('voice_messages'))) {
      await db.query(`
        CREATE TABLE voice_messages (
          voice_message_id SERIAL PRIMARY KEY,
          user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
          question_id INT REFERENCES questions(question_id) ON DELETE SET NULL,
          answer_id INT REFERENCES answers(answer_id) ON DELETE SET NULL,
          audio_url VARCHAR(500) NOT NULL,
          duration_seconds FLOAT,
          transcript TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Created voice_messages table');
    } else {
      console.log('- voice_messages table already exists');
    }
  } catch (e) {
    console.error('✗ voice_messages error:', e.message);
  }

  // 8. Create ai_assistant_logs table
  try {
    if (!(await tableExists('ai_assistant_logs'))) {
      await db.query(`
        CREATE TABLE ai_assistant_logs (
          log_id SERIAL PRIMARY KEY,
          user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
          session_id VARCHAR(100),
          query_text TEXT NOT NULL,
          response_text TEXT,
          source VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Created ai_assistant_logs table');
    } else {
      console.log('- ai_assistant_logs table already exists');
    }
  } catch (e) {
    console.error('✗ ai_assistant_logs error:', e.message);
  }

  // 9. Create answer_attachments table
  try {
    if (!(await tableExists('answer_attachments'))) {
      await db.query(`
        CREATE TABLE answer_attachments (
          attachment_id SERIAL PRIMARY KEY,
          answer_id INT NOT NULL REFERENCES answers(answer_id) ON DELETE CASCADE,
          file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('image', 'pdf')),
          original_name VARCHAR(255) NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          storage_path VARCHAR(500) NOT NULL,
          byte_size INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Created answer_attachments table');
    } else {
      console.log('- answer_attachments table already exists');
    }
  } catch (e) {
    console.error('✗ answer_attachments error:', e.message);
  }

  // 10. Create email_verifications table
  try {
    if (!(await tableExists('email_verifications'))) {
      await db.query(`
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
        )
      `);
      console.log('✓ Created email_verifications table');
    } else {
      console.log('- email_verifications table already exists');
    }
  } catch (e) {
    console.error('✗ email_verifications error:', e.message);
  }

  // Remind about optional dependency
  console.log('\nIf nodemailer is missing, run: npm install nodemailer');

  /** Print a quick summary of existing users after migration. */
  const usersResult = await db.query('SELECT user_id, email, role, status FROM users');
  console.log('\nCurrent users:');
  usersResult.rows.forEach(u => console.log(`  ${u.user_id}. ${u.email} — role: ${u.role}, status: ${u.status}`));

  console.log('\nMigration complete!');
  process.exit(0);
}

migrate();
