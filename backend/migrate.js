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

  // 6. Install nodemailer
  console.log('\nIf nodemailer is missing, run: npm install nodemailer');

  // Summary
  const [users] = await db.execute('SELECT user_id, email, role, status FROM users');
  console.log('\nCurrent users:');
  users.forEach(u => console.log(`  ${u.user_id}. ${u.email} — role: ${u.role}, status: ${u.status}`));

  console.log('\nMigration complete!');
  process.exit(0);
}

migrate();
