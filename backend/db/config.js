import dotenv from "dotenv";
dotenv.config();
import pg from "pg";

const { Pool } = pg;

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export const safeExecute = async (sql, params) => {
  if (typeof sql !== "string" || sql.trim().length === 0) {
    throw new Error("SQL query must be a non-empty string");
  }
  if (params === undefined || params === null) {
    throw new Error("SQL parameters are required");
  }
  const result = await db.query(sql, params);
  return result.rows;
};