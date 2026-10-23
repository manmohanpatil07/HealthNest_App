const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool suitable for Express apps
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'healthnest_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper function to check connection status
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('[Database] Connected to MySQL successfully (XAMPP)');
    connection.release();
    return true;
  } catch (error) {
    console.warn('[Database] MySQL connection warning:', error.message);
    console.warn('[Database] Please ensure XAMPP MySQL is running if you need DB access.');
    return false;
  }
};

module.exports = {
  pool,
  testConnection
};
