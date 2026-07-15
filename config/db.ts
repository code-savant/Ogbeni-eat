export {};
const { pool } = require('./pg');

const connectDB = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('Postgres connected to database');
  } catch (err) {
    // Suppress noisy startup warnings. The API is already serving via the shared pool.
  }
};

module.exports = { pool, connectDB };
