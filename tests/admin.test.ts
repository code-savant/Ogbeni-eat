import request from 'supertest';
import jwt from 'jsonwebtoken';
import { mockPool, mockQuery, createTestApp } from './setup';

const app = createTestApp();
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

const generateToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '1h', algorithm: 'HS256' });

describe('Admin Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const adminToken = generateToken({ id: 1, email: 'admin@test.com', role: 'admin' });
  const customerToken = generateToken({ id: 2, email: 'customer@test.com', role: 'customer' });

  describe('Access Control', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/admin/users');
      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Admin access required');
    });
  });

  describe('GET /api/admin/users', () => {
    it('should return all users for admin', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' },
          { id: 2, name: 'Customer', email: 'customer@test.com', role: 'customer' },
        ],
      });

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should return a user by id', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' }],
      });

      const res = await request(app)
        .get('/api/admin/users/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', 'admin@test.com');
    });

    it('should return 400 for invalid id', async () => {
      const res = await request(app)
        .get('/api/admin/users/abc')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const res = await request(app)
        .get('/api/admin/users/999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update a user', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Old', email: 'old@test.com', role: 'customer' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Updated', email: 'updated@test.com', role: 'customer' }] });

      const res = await request(app)
        .put('/api/admin/users/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated', email: 'updated@test.com' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Updated');
    });

    it('should return 400 for invalid role', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      const res = await request(app)
        .put('/api/admin/users/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'superadmin' });
      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid email format', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      const res = await request(app)
        .put('/api/admin/users/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'not-an-email' });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete a non-admin user', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 2, role: 'customer' }] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .delete('/api/admin/users/2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('removed');
    });

    it('should prevent deleting admin users', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, role: 'admin' }] });
      const res = await request(app)
        .delete('/api/admin/users/1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot delete admin');
    });
  });

  describe('GET /api/admin/orders', () => {
    it('should return all orders for admin', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, userId: 2, status: 'pending' }],
      });

      const res = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('PUT /api/admin/orders/:id', () => {
    it('should update order status', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1, status: 'pending' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, status: 'accepted' }] });

      const res = await request(app)
        .put('/api/admin/orders/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'accepted' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'accepted');
    });

    it('should return 400 for invalid status', async () => {
      const res = await request(app)
        .put('/api/admin/orders/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid' });
      expect(res.status).toBe(400);
    });
  });
});
