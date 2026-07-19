/**
 * @file Production start script.
 *
 * Initializes the database (runs schema.sql then migrate.js) and starts
 * the Express server. Used by Render and other PaaS deployments.
 *
 * Adapted for PostgreSQL: uses db.query() instead of db.execute().
 */

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  console.log('=== Database Initialization ===\n');

  // Step 1: Run schema.sql for a fresh database
  try {
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');

    // Execute the entire schema as one statement (PostgreSQL handles multiple statements)
    try {
      await db.query(schema);
      console.log('Schema loaded successfully.');
    } catch (e) {
      // Ignore "already exists" errors during fresh schema load
      if (!e.message.includes('already exists') && !e.message.includes('Duplicate')) {
        console.warn('Schema statement warning:', e.message.substring(0, 100));
      }
    }
  } catch (e) {
    console.warn('Schema load skipped (tables may already exist):', e.message.substring(0, 80));
  }

  // Step 2: Run incremental migrations
  try {
    await import('./migrate.js');
  } catch (e) {
    console.warn('Migration skipped:', e.message.substring(0, 80));
  }
}

async function start() {
  try {
    await initDatabase();
    console.log('\n=== Starting Server ===');

    // Import and start the main app
    await import('./index.js');
  } catch (error) {
    console.error('Failed to start:', error.message);
    process.exit(1);
  }
}

start();
