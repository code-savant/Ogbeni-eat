import request from 'supertest';
import jwt from 'jsonwebtoken';
import { mockPool, mockQuery, createTestApp } from './setup';

const app = createTestApp();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const generateToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '1h', algorithm: 'HS256' });

describe('Menu Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const customerToken = generateToken({ id: 1, email: 'customer@test.com', role: 'customer' });
  const vendorToken = generateToken({ id: 2, email: 'vendor@test.com', role: 'vendor' });

  describe('GET /api/menus', () => {
    it('should return all menus without auth', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, vendorId: 1, name: 'Amala', price: 1500, available: true }],
      });

      const res = await request(app).get('/api/menus');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('name', 'Amala');
    });
  });

  describe('GET /api/menus/:id', () => {
    it('should return a menu by id', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, vendorId: 1, name: 'Amala', price: 1500, available: true }],
      });

      const res = await request(app).get('/api/menus/1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Amala');
    });

    it('should return 404 for non-existent menu', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/menus/999');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/menus', () => {
    it('should create a menu with auth', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, vendorId: 1, name: 'Egusi', price: 2000, available: true }],
      });

      const res = await request(app)
        .post('/api/menus')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ vendorId: 1, name: 'Egusi', price: 2000 });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('name', 'Egusi');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/menus')
        .send({ vendorId: 1, name: 'Egusi', price: 2000 });

      expect(res.status).toBe(401);
    });

    it('should return 400 if vendorId is missing', async () => {
      const res = await request(app)
        .post('/api/menus')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ name: 'Egusi', price: 2000 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    it('should return 400 if price is negative', async () => {
      const res = await request(app)
        .post('/api/menus')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ vendorId: 1, name: 'Egusi', price: -500 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('non-negative');
    });
  });

  describe('PUT /api/menus/:id', () => {
    it('should update a menu with auth', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, vendorId: 1, name: 'Old Menu', price: 1000, available: true }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 1, vendorId: 1, name: 'Updated Menu', price: 1000, available: true }],
        });

      const res = await request(app)
        .put('/api/menus/1')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ name: 'Updated Menu' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Updated Menu');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .put('/api/menus/1')
        .send({ name: 'Updated' });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/menus/:id', () => {
    it('should delete a menu with auth', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, vendorId: 1, name: 'To Delete' }],
        })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .delete('/api/menus/1')
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('removed');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).delete('/api/menus/1');

      expect(res.status).toBe(401);
    });
  });
});
