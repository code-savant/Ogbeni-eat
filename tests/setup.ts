export {};

// Set JWT_SECRET before any imports so auth middleware doesn't exit
process.env.JWT_SECRET = 'test-secret-key';

// Mock the database pool before any imports
const mockQuery = jest.fn();

const mockPool = {
  query: mockQuery,
  connect: jest.fn().mockResolvedValue({
    query: mockQuery,
    release: jest.fn(),
  }),
  on: jest.fn(),
};

// Mock config/pg
jest.mock('../config/pg', () => ({
  pool: mockPool,
}));

// Mock bcryptjs
const mockBcryptHash = jest.fn().mockResolvedValue('$2a$10$mockedhashedpassword');
const mockBcryptCompare = jest.fn();

jest.mock('bcryptjs', () => ({
  hash: mockBcryptHash,
  compare: mockBcryptCompare,
}));

// Create test Express app
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('../middleware/errorMiddleware');
const vendorRoutes = require('../routes/vendorRoutes');
const menuRoutes = require('../routes/menuRoutes');
const orderRoutes = require('../routes/orderRoutes');
const authRoutes = require('../routes/authRoutes');

const createTestApp = () => {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/vendors', vendorRoutes);
  app.use('/api/menus', menuRoutes);
  app.use('/api/orders', orderRoutes);
  app.use(errorHandler);
  return app;
};

export { mockPool, mockQuery, mockBcryptHash, mockBcryptCompare, createTestApp };
