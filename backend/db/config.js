import dotenv from "dotenv";
dotenv.config();
import mysql from "mysql2/promise";

const dbHost = process.env.DB_HOST?.trim() || "localhost";
const dbUser =
  process.env.DB_USER?.trim() || process.env.DB_USERNAME?.trim() || "Customer2";
const dbPassword =
  process.env.DB_PASSWORD?.trim() || process.env.DB_PASS?.trim();
const dbName = process.env.DB_NAME?.trim() || "evangadi_forum";
const dbPort = Number(process.env.DB_PORT?.trim() || 3306);

export const db = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  port: dbPort,
  timezone: '+00:00',
});

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

export const safeExecute = async (sql, params) => {
  if (typeof sql !== "string" || sql.trim().length === 0) {
    throw new Error("SQL query must be a non-empty string");
  }
  ensureParams(params);
  const [result] = await db.execute(sql, params);
  return result;
};