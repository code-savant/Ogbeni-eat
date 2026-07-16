export {};
const { pool } = require('../config/pg');

const ALLOWED_ROLES = ['customer', 'vendor', 'admin'];
const ALLOWED_STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];

// ==================== USERS ====================

const getAllUsers = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, name, email, role FROM users');
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid user ID' });

    const { rows } = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid user ID' });

    const { rows: existingRows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!existingRows[0]) return res.status(404).json({ message: 'User not found' });

    const { name, email, role } = req.body;

    // Validate role if provided
    if (role && !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: `Invalid role. Allowed: ${ALLOWED_ROLES.join(', ')}` });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
    }

    const { rows } = await pool.query(
      'UPDATE users SET name = $1, email = $2, role = $3 WHERE id = $4 RETURNING id, name, email, role',
      [name || existingRows[0].name, email || existingRows[0].email, role || existingRows[0].role, id]
    );
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid user ID' });

    const { rows: existingRows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!existingRows[0]) return res.status(404).json({ message: 'User not found' });

    // Prevent admin from deleting themselves
    if (existingRows[0].id === Number(req.user.id)) {
      return res.status(400).json({ message: 'Cannot delete your own admin account' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User removed' });
  } catch (error) {
    next(error);
  }
};

// ==================== VENDORS ====================

const getAllVendors = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM vendors');
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const getVendorById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid vendor ID' });

    const { rows } = await pool.query('SELECT * FROM vendors WHERE id = $1', [id]);
    const vendor = rows[0];
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json(vendor);
  } catch (error) {
    next(error);
  }
};

const updateVendor = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid vendor ID' });

    const { rows: existingRows } = await pool.query('SELECT * FROM vendors WHERE id = $1', [id]);
    if (!existingRows[0]) return res.status(404).json({ message: 'Vendor not found' });

    const { name, description, location } = req.body;
    if (name && typeof name !== 'string') {
      return res.status(400).json({ message: 'Vendor name must be a string' });
    }

    const { rows } = await pool.query(
      'UPDATE vendors SET name = $1, description = $2, location = $3 WHERE id = $4 RETURNING *',
      [name || existingRows[0].name, description || existingRows[0].description, location || existingRows[0].location, id]
    );
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

const deleteVendor = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid vendor ID' });

    const { rows: existingRows } = await pool.query('SELECT * FROM vendors WHERE id = $1', [id]);
    if (!existingRows[0]) return res.status(404).json({ message: 'Vendor not found' });

    await pool.query('DELETE FROM vendors WHERE id = $1', [id]);
    res.json({ message: 'Vendor removed' });
  } catch (error) {
    next(error);
  }
};

// ==================== MENUS ====================

const getAllMenus = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM menus');
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const getMenuById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid menu ID' });

    const { rows } = await pool.query('SELECT * FROM menus WHERE id = $1', [id]);
    const menu = rows[0];
    if (!menu) return res.status(404).json({ message: 'Menu item not found' });
    res.json(menu);
  } catch (error) {
    next(error);
  }
};

const updateMenu = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid menu ID' });

    const { rows: existingRows } = await pool.query('SELECT * FROM menus WHERE id = $1', [id]);
    if (!existingRows[0]) return res.status(404).json({ message: 'Menu item not found' });

    const { vendorId, name, description, price, available } = req.body;

    // Validate price if provided
    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return res.status(400).json({ message: 'Price must be a non-negative number' });
    }

    const { rows } = await pool.query(
      'UPDATE menus SET "vendorId" = $1, name = $2, description = $3, price = $4, available = $5 WHERE id = $6 RETURNING *',
      [vendorId ?? existingRows[0].vendorId, name ?? existingRows[0].name, description ?? existingRows[0].description, price ?? existingRows[0].price, available ?? existingRows[0].available, id]
    );
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

const deleteMenu = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid menu ID' });

    const { rows: existingRows } = await pool.query('SELECT * FROM menus WHERE id = $1', [id]);
    if (!existingRows[0]) return res.status(404).json({ message: 'Menu item not found' });

    await pool.query('DELETE FROM menus WHERE id = $1', [id]);
    res.json({ message: 'Menu item removed' });
  } catch (error) {
    next(error);
  }
};

// ==================== ORDERS ====================

const getAllOrders = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders');
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid order ID' });

    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    const order = rows[0];
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid order ID' });

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
    }

    const { rows: existingRows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (!existingRows[0]) return res.status(404).json({ message: 'Order not found' });

    const { rows } = await pool.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid order ID' });

    const { rows: existingRows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (!existingRows[0]) return res.status(404).json({ message: 'Order not found' });

    await pool.query('DELETE FROM orders WHERE id = $1', [id]);
    res.json({ message: 'Order removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Users
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  // Vendors
  getAllVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
  // Menus
  getAllMenus,
  getMenuById,
  updateMenu,
  deleteMenu,
  // Orders
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
};
