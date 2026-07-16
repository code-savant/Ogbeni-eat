export {};
const { pool } = require('../config/pg');

const getOrders = async (req, res, next) => {
  try {
    const userId = Number(req.user.id);
    const { rows } = await pool.query('SELECT * FROM orders WHERE "userId" = $1', [userId]);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const userId = Number(req.user.id);
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1 AND "userId" = $2', [id, userId]);
    const order = rows[0];
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    next(error);
  }
};

const ALLOWED_STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];

const createOrder = async (req, res, next) => {
  try {
    const userId = Number(req.user.id);
    const { vendorId, menuId, quantity, totalPrice } = req.body;

    // Input validation
    if (!vendorId || !menuId || totalPrice === undefined) {
      return res.status(400).json({ message: 'vendorId, menuId, and totalPrice are required' });
    }
    if (typeof totalPrice !== 'number' || totalPrice < 0) {
      return res.status(400).json({ message: 'totalPrice must be a non-negative number' });
    }
    if (quantity !== undefined && (typeof quantity !== 'number' || quantity < 1)) {
      return res.status(400).json({ message: 'quantity must be a positive number' });
    }

    const { rows } = await pool.query(
      'INSERT INTO orders ("userId", "vendorId", "menuId", quantity, "totalPrice", status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [userId, vendorId, menuId, quantity ?? 1, totalPrice, 'pending']
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    const userId = Number(req.user.id);

    // Input validation
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
    }

    const { rows: existingRows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (!existingRows[0]) return res.status(404).json({ message: 'Order not found' });

    // Ownership check - only the order owner can update status
    if (existingRows[0].userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    const { rows } = await pool.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
};
