import request from 'supertest';
import jwt from 'jsonwebtoken';
import { mockPool, mockQuery, createTestApp } from './setup';

const app = createTestApp();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const generateToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '1h', algorithm: 'HS256' });

describe('Order Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const customerToken = generateToken({ id: 1, email: 'customer@test.com', role: 'customer' });
  const otherCustomerToken = generateToken({ id: 99, email: 'other@test.com', role: 'customer' });

  describe('GET /api/orders', () => {
    it('should return orders for authenticated user', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, userId: 1, vendorId: 1, menuId: 1, quantity: 2, totalPrice: 3000, status: 'pending' }],
      });

      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('userId', 1);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/orders');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return order if owner', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, userId: 1, vendorId: 1, menuId: 1, status: 'pending' }],
      });

      const res = await request(app)
        .get('/api/orders/1')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', 1);
    });

    it('should return 404 if order belongs to another user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/orders/1')
        .set('Authorization', `Bearer ${otherCustomerToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/orders', () => {
    it('should create an order with auth', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, userId: 1, vendorId: 1, menuId: 1, quantity: 2, totalPrice: 3000, status: 'pending' }],
      });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ vendorId: 1, menuId: 1, quantity: 2, totalPrice: 3000 });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('status', 'pending');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({ vendorId: 1, menuId: 1, totalPrice: 3000 });

      expect(res.status).toBe(401);
    });

    it('should return 400 if vendorId is missing', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ menuId: 1, totalPrice: 3000 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    it('should return 400 if totalPrice is negative', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ vendorId: 1, menuId: 1, totalPrice: -100 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('non-negative');
    });

    it('should return 400 if quantity is less than 1', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ vendorId: 1, menuId: 1, quantity: 0, totalPrice: 3000 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('positive');
    });
  });

  describe('PUT /api/orders/:id', () => {
    it('should update order status if owner', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, userId: 1, vendorId: 1, status: 'pending' }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 1, userId: 1, vendorId: 1, status: 'accepted' }],
        });

      const res = await request(app)
        .put('/api/orders/1')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'accepted' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'accepted');
    });

    it('should return 403 if not owner', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, userId: 1, vendorId: 1, status: 'pending' }],
      });

      const res = await request(app)
        .put('/api/orders/1')
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({ status: 'accepted' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Not authorized');
    });

    it('should return 400 for invalid status', async () => {
      const res = await request(app)
        .put('/api/orders/1')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'invalid_status' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid status');
    });

    it('should return 400 if status is missing', async () => {
      const res = await request(app)
        .put('/api/orders/1')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    it('should return 404 for non-existent order', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .put('/api/orders/999')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'accepted' });

      expect(res.status).toBe(404);
    });
  });
});
