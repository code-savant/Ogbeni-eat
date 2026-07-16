export {};
require('dotenv').config();
const { pool } = require('../config/pg');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  const client = await pool.connect();
  try {
    console.log('Ensuring users table exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer',
        location TEXT,
        description TEXT
      );
    `);

    const adminEmail = 'admin@ogbenieat.com';
    const adminPassword = 'AdminPass123!';

    // Check if admin already exists
    const { rows: existing } = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (existing[0]) {
      console.log(`Admin user already exists (${adminEmail}). Skipping.`);
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await client.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      ['Super Admin', adminEmail, hashedPassword, 'admin']
    );

    console.log('\n--- Admin user created successfully! ---');
    console.log('Email: ' + adminEmail);
    console.log('Password: ' + adminPassword);
    console.log('Role: admin');
    console.log('------------------------------------');
    console.log('IMPORTANT: Change this password in production!');
  } catch (err) {
    console.error('Error seeding admin user', err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
};

seedAdmin();
