/**
 * @file Backend application entry point.
 * 
 * Bootstraps the Express server, connects to MySQL, registers middleware
 * and route modules, and starts listening on the configured port.
 */

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db/config.js';
import { mainRouter } from './src/api/routes.js';
import { errorHandler } from './src/middleware/error-handler.js';
import cors from 'cors';

/**
 * Resolve __filename and __dirname for ES modules.
 * Express static serving and path resolution depend on these values.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3777;

// --- Global middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/** Serve uploaded files (avatars, RAG PDFs, answer attachments, voice messages) */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/** Root health message — prevents "Cannot GET /" when visiting the base URL. */
app.get("/", (req, res) => {
  res.send(
    "Welcome to the Evangadi AI Forum Backend! Server is running smoothly.",
  );
});

/** Lightweight health-check endpoint for uptime monitors and load balancers. */
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

/** Mount all API routes under /api prefix. */
app.use("/api", mainRouter);

/** Global error handler — catches unhandled errors thrown in route handlers. */
app.use(errorHandler);

/**
 * Start the server after verifying the database connection.
 * Exits the process immediately if the DB pool cannot connect or the port
 * is already in use, so container orchestrators know the startup failed.
 */
const startServer = async () => {
  try {
    const connection = await db.getConnection();

    console.log("Database connection established successfully.");
    connection.release();

    app.listen(port, (err) => {
      if (err) {
        if (err.code === 'EADDRINUSE') {
          console.error(
            `Port ${port} is already in use. Try setting a different PORT in backend/.env or start the server with PORT=<port> node index.js`,
          );
        } else {
          console.error('Failed to start the server:', err.message);
        }
        process.exit(1);
      }
      console.log(`Server running on port http://localhost:${port}`);
    });
  } catch (error) {
    console.error(
      "Failed to connect to the database. Server not started.",
      error.message,
    );
    process.exit(1);
  }
};

startServer();

