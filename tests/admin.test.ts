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

  // ==================== ACCESS CONTROL ====================

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

  // ==================== USERS ====================

  describe('Users', () => {
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

      it('should prevent deleting own admin account', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, role: 'admin' }] });
        const res = await request(app)
          .delete('/api/admin/users/1')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Cannot delete your own');
      });
    });
  });

  // ==================== VENDORS ====================

  describe('Vendors', () => {
    describe('GET /api/admin/vendors', () => {
      it('should return all vendors', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [
            { id: 1, name: 'Vendor A', description: 'Desc A', location: 'Lagos' },
            { id: 2, name: 'Vendor B', description: 'Desc B', location: 'Abuja' },
          ],
        });

        const res = await request(app)
          .get('/api/admin/vendors')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(2);
      });
    });

    describe('GET /api/admin/vendors/:id', () => {
      it('should return a vendor by id', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 1, name: 'Vendor A', description: 'Desc A', location: 'Lagos' }],
        });

        const res = await request(app)
          .get('/api/admin/vendors/1')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('name', 'Vendor A');
      });

      it('should return 400 for invalid id', async () => {
        const res = await request(app)
          .get('/api/admin/vendors/abc')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(400);
      });

      it('should return 404 for non-existent vendor', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });
        const res = await request(app)
          .get('/api/admin/vendors/999')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(404);
      });
    });

    describe('PUT /api/admin/vendors/:id', () => {
      it('should update a vendor', async () => {
        mockQuery
          .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Old Name', description: 'Old', location: 'Lagos' }] })
          .mockResolvedValueOnce({ rows: [{ id: 1, name: 'New Name', description: 'New', location: 'Abuja' }] });

        const res = await request(app)
          .put('/api/admin/vendors/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'New Name', description: 'New', location: 'Abuja' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('name', 'New Name');
      });

      it('should return 400 for invalid name type', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
        const res = await request(app)
          .put('/api/admin/vendors/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 123 });
        expect(res.status).toBe(400);
      });

      it('should return 404 for non-existent vendor', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });
        const res = await request(app)
          .put('/api/admin/vendors/999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'New' });
        expect(res.status).toBe(404);
      });
    });

    describe('DELETE /api/admin/vendors/:id', () => {
      it('should delete a vendor', async () => {
        mockQuery
          .mockResolvedValueOnce({ rows: [{ id: 1, name: 'To Delete' }] })
          .mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
          .delete('/api/admin/vendors/1')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('removed');
      });

      it('should return 400 for invalid id', async () => {
        const res = await request(app)
          .delete('/api/admin/vendors/abc')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(400);
      });

      it('should return 404 for non-existent vendor', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });
        const res = await request(app)
          .delete('/api/admin/vendors/999')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(404);
      });
    });
  });

  // ==================== MENUS ====================

  describe('Menus', () => {
    describe('GET /api/admin/menus', () => {
      it('should return all menus', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [
            { id: 1, vendorId: 1, name: 'Amala', price: 1500, available: true },
            { id: 2, vendorId: 1, name: 'Egusi', price: 2000, available: true },
          ],
        });

        const res = await request(app)
          .get('/api/admin/menus')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(2);
      });
    });

    describe('GET /api/admin/menus/:id', () => {
      it('should return a menu by id', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 1, vendorId: 1, name: 'Amala', price: 1500, available: true }],
        });

        const res = await request(app)
          .get('/api/admin/menus/1')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('name', 'Amala');
      });

      it('should return 400 for invalid id', async () => {
        const res = await request(app)
          .get('/api/admin/menus/abc')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(400);
      });

      it('should return 404 for non-existent menu', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });
        const res = await request(app)
          .get('/api/admin/menus/999')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(404);
      });
    });

    describe('PUT /api/admin/menus/:id', () => {
      it('should update a menu', async () => {
        mockQuery
          .mockResolvedValueOnce({ rows: [{ id: 1, vendorId: 1, name: 'Old Menu', price: 1000, available: true }] })
          .mockResolvedValueOnce({ rows: [{ id: 1, vendorId: 1, name: 'New Menu', price: 2500, available: false }] });

        const res = await request(app)
          .put('/api/admin/menus/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'New Menu', price: 2500, available: false });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('name', 'New Menu');
        expect(res.body).toHaveProperty('price', 2500);
      });

      it('should return 400 for negative price', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
        const res = await request(app)
          .put('/api/admin/menus/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ price: -500 });
        expect(res.status).toBe(400);
        expect(res.body.message).toContain('non-negative');
      });

      it('should return 400 for invalid id', async () => {
        const res = await request(app)
          .put('/api/admin/menus/abc')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'New' });
        expect(res.status).toBe(400);
      });

      it('should return 404 for non-existent menu', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });
        const res = await request(app)
          .put('/api/admin/menus/999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'New' });
        expect(res.status).toBe(404);
      });
    });

    describe('DELETE /api/admin/menus/:id', () => {
      it('should delete a menu', async () => {
        mockQuery
          .mockResolvedValueOnce({ rows: [{ id: 1, name: 'To Delete' }] })
          .mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
          .delete('/api/admin/menus/1')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('removed');
      });

      it('should return 400 for invalid id', async () => {
        const res = await request(app)
          .delete('/api/admin/menus/abc')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(400);
      });

      it('should return 404 for non-existent menu', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });
        const res = await request(app)
          .delete('/api/admin/menus/999')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(404);
      });
    });
  });

  // ==================== ORDERS ====================

  describe('Orders', () => {
    describe('GET /api/admin/orders', () => {
      it('should return all orders', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [
            { id: 1, userId: 2, status: 'pending' },
            { id: 2, userId: 3, status: 'completed' },
          ],
        });

        const res = await request(app)
          .get('/api/admin/orders')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      });
    });

    describe('GET /api/admin/orders/:id', () => {
      it('should return an order by id', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 1, userId: 2, status: 'pending' }],
        });

        const res = await request(app)
          .get('/api/admin/orders/1')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'pending');
      });

      it('should return 400 for invalid id', async () => {
        const res = await request(app)
          .get('/api/admin/orders/abc')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(400);
      });

      it('should return 404 for non-existent order', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });
        const res = await request(app)
          .get('/api/admin/orders/999')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(404);
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

      it('should return 400 if status is missing', async () => {
        const res = await request(app)
          .put('/api/admin/orders/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({});
        expect(res.status).toBe(400);
      });

      it('should return 400 for invalid order id', async () => {
        const res = await request(app)
          .put('/api/admin/orders/abc')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'accepted' });
        expect(res.status).toBe(400);
      });

      it('should return 404 for non-existent order', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });
        const res = await request(app)
          .put('/api/admin/orders/999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'accepted' });
        expect(res.status).toBe(404);
      });
    });

    describe('DELETE /api/admin/orders/:id', () => {
      it('should delete an order', async () => {
        mockQuery
          .mockResolvedValueOnce({ rows: [{ id: 1, status: 'pending' }] })
          .mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
          .delete('/api/admin/orders/1')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('removed');
      });

      it('should return 400 for invalid id', async () => {
        const res = await request(app)
          .delete('/api/admin/orders/abc')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(400);
      });

      it('should return 404 for non-existent order', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });
        const res = await request(app)
          .delete('/api/admin/orders/999')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(404);
      });
    });
  });
});
