export {};
const { pool } = require('../config/pg');

const getMenus = async (req, res, next) => {
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
    const { rows } = await pool.query('SELECT * FROM menus WHERE id = $1', [id]);
    const menu = rows[0];
    if (!menu) return res.status(404).json({ message: 'Menu item not found' });
    res.json(menu);
  } catch (error) {
    next(error);
  }
};

const createMenu = async (req, res, next) => {
  try {
    const { vendorId, name, description, price, available } = req.body;

    // Input validation
    if (!vendorId || !name || price === undefined) {
      return res.status(400).json({ message: 'vendorId, name, and price are required' });
    }
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ message: 'Price must be a non-negative number' });
    }

    const { rows } = await pool.query(
      'INSERT INTO menus ("vendorId", name, description, price, available) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [vendorId, name, description || null, price, available ?? true]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
};

const updateMenu = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const userId = Number(req.user.id);
    const { rows: existingRows } = await pool.query('SELECT * FROM menus WHERE id = $1', [id]);
    if (!existingRows[0]) return res.status(404).json({ message: 'Menu item not found' });

    // Ownership check via vendor
    if (existingRows[0].vendorId) {
      const { rows: vendorRows } = await pool.query('SELECT "userId" FROM vendors WHERE id = $1', [existingRows[0].vendorId]);
      if (vendorRows[0] && vendorRows[0].userId && vendorRows[0].userId !== userId) {
        return res.status(403).json({ message: 'Not authorized to update this menu item' });
      }
    }

    const { vendorId, name, description, price, available } = req.body;
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
    const userId = Number(req.user.id);
    const { rows: existingRows } = await pool.query('SELECT * FROM menus WHERE id = $1', [id]);
    if (!existingRows[0]) return res.status(404).json({ message: 'Menu item not found' });

    // Ownership check via vendor
    if (existingRows[0].vendorId) {
      const { rows: vendorRows } = await pool.query('SELECT "userId" FROM vendors WHERE id = $1', [existingRows[0].vendorId]);
      if (vendorRows[0] && vendorRows[0].userId && vendorRows[0].userId !== userId) {
        return res.status(403).json({ message: 'Not authorized to delete this menu item' });
      }
    }

    await pool.query('DELETE FROM menus WHERE id = $1', [id]);
    res.json({ message: 'Menu item removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
};
