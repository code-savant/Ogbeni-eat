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

const createOrder = async (req, res, next) => {
  try {
    const userId = Number(req.user.id);
    const { vendorId, menuId, quantity, totalPrice } = req.body;
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
    const { rows: existingRows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (!existingRows[0]) return res.status(404).json({ message: 'Order not found' });
    const { rows } = await pool.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [req.body.status, id]);
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
