const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
const pool = new Pool({ connectionString });

pool.on('error', (err) => {
  console.error('Unexpected PG pool error', err);
});

module.exports = { pool };
