/*import express from 'express';
import { db } from './db/config.js';
import { mainRouter } from './src/api/routes.js';
import { errorHandler } from './src/middleware/error-handler.js';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3777;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/api', mainRouter);

app.use(errorHandler);

// Start server
/*const startServer = async () => {
  try {
    // Test database connection
    const connection = await db.getConnection();

    console.log('Database connection established successfully.');
    connection.release();
*/
/*const startServer = async () => {
  try {
    console.log('Starting server...');*/

    // COMMENT OUT DB TEST TEMPORARILY
    // const connection = await db.getConnection();
    // console.log('Database connection established successfully.');
    // connection.release();
/*
    app.listen(port, () => {
      console.log(`SERVER RUNNING: http://localhost:${port}`);
    });

  } catch (error) {
    console.error('Server failed:', error.message);
  }
};

startServer();*/

    /*app.listen(port, err => {
      if (err) {
        console.error('Failed to start the server:', err.message);
        process.exit(1);
      }
      console.log(`Server running on port http://localhost:${port}`);
    });

app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}`);
});


  } catch (error) {
    console.error(
      'Failed to connect to the database. Server not started.',
      error.message,
    );
    process.exit(1);
  }
};

startServer();*/



import express from 'express';
import cors from 'cors';
import mainRouter from './src/api/routes.js';
import { errorHandler } from './src/middleware/error-handler.js';

const app = express();
const port = process.env.PORT || 3777;

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// health
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// routes
app.use('/api', mainRouter);

// error handler
app.use(errorHandler);

// start server
app.listen(port, () => {
  console.log(`SERVER RUNNING: http://localhost:${port}`);
});