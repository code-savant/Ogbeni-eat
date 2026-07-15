export {};
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/pg');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
};

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, location, description } = req.body;

    if (role === 'admin') {
      return res.status(400).json({ message: 'Admin role is not allowed' });
    }

    if (role !== 'vendor' && (location || description)) {
      return res.status(400).json({ message: 'Location and description are only allowed for vendors' });
    }

    const { rows: existingRows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const existingUser = existingRows[0];
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password, role, location, description) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [
        name,
        email,
        hashedPassword,
        role || 'customer',
        role === 'vendor' ? location || null : null,
        role === 'vendor' ? description || null : null,
      ]
    );
    const user = rows[0];

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        description: user.description,
      },
      token: generateToken(user),
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { rows: found } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = found[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        description: user.description,
      },
      token: generateToken(user),
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, name, email, role, location, description FROM users WHERE id = $1', [Number(req.user.id)]);
    const user = rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
