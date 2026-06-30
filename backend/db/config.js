/**
 * @file MySQL connection pool configuration.
 *
 * Reads database credentials from environment variables and exports a
 * promise-based connection pool used throughout the backend. The pool
 * handles connection reuse, timeouts, and automatic reconnection.
 */

import dotenv from "dotenv";
dotenv.config();
import mysql from "mysql2/promise";

/**
 * Normalise environment variables. Supports both DB_PASSWORD and DB_PASS
 * naming conventions so team members can use either convention in .env.
 */
const dbHost = process.env.DB_HOST?.trim() || "localhost";
const dbUser =
  process.env.DB_USER?.trim() || process.env.DB_USERNAME?.trim() || "Customer2";
const dbPassword =
  process.env.DB_PASSWORD?.trim() || process.env.DB_PASS?.trim();
const dbName = process.env.DB_NAME?.trim() || "evangadi_forum";
const dbPort = Number(process.env.DB_PORT?.trim() || 3306);

/** Shared MySQL2 promise-based connection pool. */
export const db = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  port: dbPort,
  timezone: '+00:00',
});

/**
 * Validate that params is an array (positional) or object (named), as
 * required by mysql2's execute() to prevent SQL injection.
 */
const ensureParams = (params) => {
  if (params === undefined || params === null) {
    throw new Error("SQL parameters are required");
  }
  const isArray = Array.isArray(params);
  const isObject = !isArray && typeof params === "object";
  if (!isArray && !isObject) {
    throw new Error("SQL parameters must be an array or object");
  }
};

/**
 * Wrapper around db.execute() that validates inputs before running the query.
 * Prevents accidental execution of empty or malformed queries.
 *
 * @param {string} sql - Prepared statement string with ? placeholders.
 * @param {Array|object} params - Bound parameter values.
 * @returns {Promise<object>} The MySQL result set.
 */
export const safeExecute = async (sql, params = []) => {
  if (typeof sql !== "string" || sql.trim().length === 0) {
    throw new Error("SQL query must be a non-empty string");
  }
  ensureParams(params);
  const [result] = await db.execute(sql, params);
  return result;
};
