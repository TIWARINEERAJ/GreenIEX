import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

import { AppDataSource } from './data-source';
import { marketRouter } from './routes/market';
import { recRouter } from './routes/rec';
import { carbonRouter } from './routes/carbon';
import { orderRouter } from './routes/orders';
import { setupWebSocket } from './websocket';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/market', marketRouter);
app.use('/api/rec', recRouter);
app.use('/api/carbon', carbonRouter);
app.use('/api/orders', orderRouter);

// WebSocket setup
setupWebSocket(io);

const PORT = process.env.PORT || 3001;

// Initialize database connection
AppDataSource.initialize()
  .then(() => {
    logger.info('Database Configuration:', AppDataSource.options);
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch((error: Error) => {
    logger.error('Error during Data Source initialization:', error);
  });
