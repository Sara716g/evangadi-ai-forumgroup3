import pool from "../config/database.js";

/**
 * Safe database execution wrapper
 * Handles query execution with automatic error handling
 *
 * @param {string} query - SQL query with $1, $2, etc. for parameterized queries
 * @param {Array} params - Array of parameters to bind to the query
 * @returns {Promise<Array>} - Array of rows returned by the query
 * @throws {Error} - Custom error with statusCode property for HTTP responses
 */
export const safeExecute = async (query, params = []) => {
  try {
    const result = await pool.query(query, params);
    return result.rows || [];
  } catch (err) {
    console.error("[DB Error]", err.message, { query, params });

    // Handle specific PostgreSQL errors
    if (err.code === "23505") {
      // Unique constraint violation
      const error = new Error("Duplicate entry. Resource already exists.");
      error.statusCode = 409;
      throw error;
    }

    if (err.code === "23503") {
      // Foreign key constraint violation
      const error = new Error("Invalid reference. Related resource not found.");
      error.statusCode = 400;
      throw error;
    }

    if (err.code === "42P01") {
      // Table does not exist
      const error = new Error("Database table not found.");
      error.statusCode = 500;
      throw error;
    }

    // Generic database error
    const error = new Error("Database operation failed.");
    error.statusCode = 500;
    throw error;
  }
};

/**
 * Execute a transaction with multiple queries
 * Rolls back automatically on any error
 *
 * @param {Function} callback - Async function receiving client object
 * @returns {Promise<any>} - Result from callback function
 */
export const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export default pool;
