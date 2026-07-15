const { pool } = require('../config/pg');

const getVendors = async (req, res, next) => {
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
    const { rows } = await pool.query('SELECT * FROM vendors WHERE id = $1', [id]);
    const vendor = rows[0];
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json(vendor);
  } catch (error) {
    next(error);
  }
};

const createVendor = async (req, res, next) => {
  try {
    const { name, description, location } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO vendors (name, description, location) VALUES ($1, $2, $3) RETURNING *',
      [name, description || null, location || null]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
};

const updateVendor = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { rows: existingRows } = await pool.query('SELECT * FROM vendors WHERE id = $1', [id]);
    if (!existingRows[0]) return res.status(404).json({ message: 'Vendor not found' });
    const { name, description, location } = req.body;
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
    const { rows: existingRows } = await pool.query('SELECT * FROM vendors WHERE id = $1', [id]);
    if (!existingRows[0]) return res.status(404).json({ message: 'Vendor not found' });
    await pool.query('DELETE FROM vendors WHERE id = $1', [id]);
    res.json({ message: 'Vendor removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
};
