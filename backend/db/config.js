import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

// Database connection pool configured to match your .env file
export const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'Customer2',       // Modified to look for DB_USER or default to Customer2
  password: process.env.DB_PASSWORD || 'mustcommit', // Changed from DB_PASS to DB_PASSWORD to match your .env
  database: process.env.DB_NAME || 'evan_forum',   // Updated default fallback to your new database name
  port: process.env.DB_PORT || 3306,               // Added port mapping just in case MAMP uses an alternate port
});

const ensureParams = params => {
  if (params === undefined || params === null) {
    throw new Error('SQL parameters are required');
  }
  const isArray = Array.isArray(params);
  const isObject = !isArray && typeof params === 'object';
  if (!isArray && !isObject) {
    throw new Error('SQL parameters must be an array or object');
  }
};

export const safeExecute = async (sql, params) => {
  if (typeof sql !== 'string' || sql.trim().length === 0) {
    throw new Error('SQL query must be a non-empty string');
  }
  ensureParams(params);
  const [result] = await db.execute(sql, params);
  return result;
};