const { pool } = require('../src/config/database');

async function migrate() {
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM users LIKE 'profile_image_url'");
    if (cols.length === 0) {
      console.log('Adding profile_image_url column...');
      await pool.query('ALTER TABLE users ADD COLUMN profile_image_url VARCHAR(500) NULL AFTER blood_group');
      console.log('profile_image_url column added successfully.');
    } else {
      console.log('profile_image_url column already exists.');
    }
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();

