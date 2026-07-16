export {};
require('dotenv').config();
const { pool } = require('../config/pg');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  const client = await pool.connect();
  try {
    // 1. Run migrations / alter table just in case
    console.log('Ensuring tables and columns exist...');
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
      ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS description TEXT;

      CREATE TABLE IF NOT EXISTS vendors (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        description TEXT,
        location TEXT
      );
      ALTER TABLE vendors ADD COLUMN IF NOT EXISTS "userId" INTEGER REFERENCES users(id) ON DELETE SET NULL;
    `);

    // 2. Hash passwords
    const passwordCustomer = 'customerPass123!';
    const passwordVendor = 'vendorPass123!';
    const hashedCustomer = await bcrypt.hash(passwordCustomer, 10);
    const hashedVendor = await bcrypt.hash(passwordVendor, 10);

    // 3. Clear existing users/vendors to avoid conflicts
    console.log('Cleaning up existing sample records...');
    await client.query("DELETE FROM users WHERE email IN ('customer1@ogbenieat.com', 'customer2@ogbenieat.com', 'vendor1@ogbenieat.com', 'vendor2@ogbenieat.com')");
    await client.query("DELETE FROM vendors WHERE name IN ('Amala Express', 'Iyan Palace')");

    // 4. Seed Users
    console.log('Seeding users...');
    
    // Customers
    await client.query(
      `INSERT INTO users (name, email, password, role) VALUES 
       ($1, $2, $3, $4),
       ($5, $6, $7, $8)`,
      [
        'John Customer', 'customer1@ogbenieat.com', hashedCustomer, 'customer',
        'Jane Customer', 'customer2@ogbenieat.com', hashedCustomer, 'customer'
      ]
    );

    // Vendors (Users with role vendor, including location and description)
    await client.query(
      `INSERT INTO users (name, email, password, role, location, description) VALUES 
       ($1, $2, $3, $4, $5, $6),
       ($7, $8, $9, $10, $11, $12)`,
      [
        'Amala Express', 'vendor1@ogbenieat.com', hashedVendor, 'vendor', '12 Marina Road, Lagos', 'The best amala in Lagos',
        'Iyan Palace', 'vendor2@ogbenieat.com', hashedVendor, 'vendor', '45 Toyin Street, Ikeja', 'Delicious pounded yam with rich egusi soup'
      ]
    );

    // Also populate vendors table to be consistent with existing backend design (since the DB schema has a separate vendors table)
    console.log('Seeding vendors table...');
    // Link vendors to their user accounts
    const { rows: vendorUsers } = await client.query(
      "SELECT id, email FROM users WHERE email IN ('vendor1@ogbenieat.com', 'vendor2@ogbenieat.com')"
    );
    const vendorUserMap = {};
    for (const u of vendorUsers) {
      vendorUserMap[u.email] = u.id;
    }
    await client.query(
      `INSERT INTO vendors ("userId", name, description, location) VALUES 
       ($1, $2, $3, $4),
       ($5, $6, $7, $8)`,
      [
        vendorUserMap['vendor1@ogbenieat.com'], 'Amala Express', 'The best amala in Lagos', '12 Marina Road, Lagos',
        vendorUserMap['vendor2@ogbenieat.com'], 'Iyan Palace', 'Delicious pounded yam with rich egusi soup', '45 Toyin Street, Ikeja'
      ]
    );

    console.log('\n--- Database seeded successfully! ---');
    console.log('Use these credentials to log in:');
    console.log('------------------------------------');
    console.log('Role: Customer');
    console.log('Email: customer1@ogbenieat.com');
    console.log('Password: ' + passwordCustomer);
    console.log('------------------------------------');
    console.log('Role: Customer');
    console.log('Email: customer2@ogbenieat.com');
    console.log('Password: ' + passwordCustomer);
    console.log('------------------------------------');
    console.log('Role: Vendor');
    console.log('Email: vendor1@ogbenieat.com');
    console.log('Location: 12 Marina Road, Lagos');
    console.log('Description: The best amala in Lagos');
    console.log('Password: ' + passwordVendor);
    console.log('------------------------------------');
    console.log('Role: Vendor');
    console.log('Email: vendor2@ogbenieat.com');
    console.log('Location: 45 Toyin Street, Ikeja');
    console.log('Description: Delicious pounded yam with rich egusi soup');
    console.log('Password: ' + passwordVendor);
    console.log('------------------------------------');

  } catch (err) {
    console.error('Error during seeding', err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
};

seedData();
