import request from 'supertest';
import { mockPool, mockQuery, mockBcryptCompare, createTestApp } from './setup';

const app = createTestApp();

describe('Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // Check existing user
        .mockResolvedValueOnce({ // Insert user
          rows: [{
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            role: 'customer',
          }],
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id', 1);
      expect(res.body.user).toHaveProperty('name', 'John Doe');
      expect(res.body.user).toHaveProperty('email', 'john@example.com');
      expect(res.body.user).toHaveProperty('role', 'customer');
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'john@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    it('should return 400 if password is too short', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('8 characters');
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'invalid-email',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid email');
    });

    it('should return 400 for invalid role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'admin',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid role');
    });

    it('should return 400 if email already exists', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, email: 'john@example.com' }],
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashedpassword',
          role: 'customer',
        }],
      });
      mockBcryptCompare.mockResolvedValueOnce(true);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'john@example.com');
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    it('should return 400 if password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    it('should return 401 for invalid credentials', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockBcryptCompare.mockResolvedValueOnce(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { id: 1, email: 'john@example.com', role: 'customer' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1h' }
      );

      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'customer',
        }],
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', 'john@example.com');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('missing');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('invalid');
    });
  });
});
