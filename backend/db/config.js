/**
 * @file PostgreSQL connection pool configuration.
 *
 * Reads database credentials from environment variables and exports a
 * promise-based connection pool used throughout the backend. The pool
 * handles connection reuse, timeouts, and automatic reconnection.
 *
 * Supports Render PostgreSQL and other cloud providers via DATABASE_URL
 * or individual env vars for local development.
 */

import dotenv from "dotenv";
dotenv.config();
import pg from "pg";
const { Pool } = pg;

/**
 * Normalise environment variables.
 * Supports DATABASE_URL (Render, cloud providers) or individual vars (local dev).
 */
const dbHost = process.env.DB_HOST?.trim() || "localhost";
const dbUser =
  process.env.DB_USER?.trim() || process.env.DB_USERNAME?.trim() || "postgres";
const dbPassword =
  process.env.DB_PASSWORD?.trim() || process.env.DB_PASS?.trim() || "";
const dbName = process.env.DB_NAME?.trim() || "evangadi_forum";
const dbPort = Number(process.env.DB_PORT?.trim() || 5432);

/** Shared PostgreSQL promise-based connection pool. */
export const db = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      port: dbPort,
    });

/**
 * Validate that params is an array (positional), as required by pg's
 * $1, $2 placeholders to prevent SQL injection.
 */
const ensureParams = (params) => {
  if (params === undefined || params === null) {
    throw new Error("SQL parameters are required");
  }
  if (!Array.isArray(params)) {
    throw new Error("SQL parameters must be an array for PostgreSQL ($1, $2, ...)");
  }
};

/**
 * Wrapper around db.query() that validates inputs before running the query.
 * Prevents accidental execution of empty or malformed queries.
 *
 * @param {string} sql - Prepared statement string with $1, $2 placeholders.
 * @param {Array} params - Bound parameter values.
 * @returns {Promise<object>} The PostgreSQL result set.
 */
export const safeExecute = async (sql, params = []) => {
  if (typeof sql !== "string" || sql.trim().length === 0) {
    throw new Error("SQL query must be a non-empty string");
  }
  ensureParams(params);
  const result = await db.query(sql, params);
  return result.rows;
};
