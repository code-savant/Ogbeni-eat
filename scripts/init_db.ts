export {};
require('dotenv').config();
const { pool } = require('../config/pg');

const sql = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer'
);

CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT
);

CREATE TABLE IF NOT EXISTS menus (
  id SERIAL PRIMARY KEY,
  "vendorId" INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  available BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "vendorId" INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  "menuId" INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  "totalPrice" NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending'
);
`;

(async () => {
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('DB tables created or already exist');
  } catch (err) {
    console.error('Error creating tables', err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
})();
