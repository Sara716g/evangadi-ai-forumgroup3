import { db } from "../../db/config.js";

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
    const result = await db.execute(query, params);
    return result[0] || [];
  } catch (err) {
    console.error("[DB Error]", err.message, { query, params });

    // Handle specific MySQL/MariaDB errors
    if (err.code === "ER_DUP_ENTRY") {
      // Duplicate key error
      const error = new Error("Duplicate entry. Resource already exists.");
      error.statusCode = 409;
      throw error;
    }

    if (err.code === "ER_NO_REFERENCED_ROW") {
      // Foreign key constraint violation
      const error = new Error("Invalid reference. Related resource not found.");
      error.statusCode = 400;
      throw error;
    }

    if (err.code === "ER_NO_SUCH_TABLE") {
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
 * @param {Function} callback - Async function receiving connection object
 * @returns {Promise<any>} - Result from callback function
 */
export const withTransaction = async (callback) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export default db;
