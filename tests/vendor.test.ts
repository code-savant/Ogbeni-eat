import request from 'supertest';
import jwt from 'jsonwebtoken';
import { mockPool, mockQuery, createTestApp } from './setup';

const app = createTestApp();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const generateToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '1h', algorithm: 'HS256' });

describe('Vendor Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const customerToken = generateToken({ id: 1, email: 'customer@test.com', role: 'customer' });
  const vendorToken = generateToken({ id: 2, email: 'vendor@test.com', role: 'vendor' });

  describe('GET /api/vendors', () => {
    it('should return all vendors without auth', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Test Vendor', description: 'Test', location: 'Lagos' }],
      });

      const res = await request(app).get('/api/vendors');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('name', 'Test Vendor');
    });
  });

  describe('GET /api/vendors/:id', () => {
    it('should return a vendor by id', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Test Vendor', description: 'Test', location: 'Lagos' }],
      });

      const res = await request(app).get('/api/vendors/1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Test Vendor');
    });

    it('should return 404 for non-existent vendor', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/vendors/999');

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found');
    });
  });

  describe('POST /api/vendors', () => {
    it('should create a vendor with auth', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, userId: 2, name: 'New Vendor', description: 'New', location: 'Ikeja' }],
      });

      const res = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ name: 'New Vendor', description: 'New', location: 'Ikeja' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('name', 'New Vendor');
      expect(res.body).toHaveProperty('userId', 2);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/vendors')
        .send({ name: 'New Vendor' });

      expect(res.status).toBe(401);
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ description: 'No name' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });
  });

  describe('PUT /api/vendors/:id', () => {
    it('should update a vendor if owner', async () => {
      mockQuery
        .mockResolvedValueOnce({ // Find vendor
          rows: [{ id: 1, userId: 2, name: 'Old Name', description: 'Old', location: 'Old' }],
        })
        .mockResolvedValueOnce({ // Update vendor
          rows: [{ id: 1, userId: 2, name: 'New Name', description: 'Old', location: 'Old' }],
        });

      const res = await request(app)
        .put('/api/vendors/1')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'New Name');
    });

    it('should return 403 if not owner', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, userId: 99, name: 'Other Vendor', description: 'Other', location: 'Other' }],
      });

      const res = await request(app)
        .put('/api/vendors/1')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Not authorized');
    });

    it('should return 404 for non-existent vendor', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .put('/api/vendors/999')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/vendors/:id', () => {
    it('should delete a vendor if owner', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, userId: 2, name: 'To Delete' }],
        })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .delete('/api/vendors/1')
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('removed');
    });

    it('should return 403 if not owner', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, userId: 99, name: 'Not Mine' }],
      });

      const res = await request(app)
        .delete('/api/vendors/1')
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Not authorized');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).delete('/api/vendors/1');

      expect(res.status).toBe(401);
    });
  });
});
