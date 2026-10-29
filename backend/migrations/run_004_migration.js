const { pool } = require('../src/config/database');

async function migrate() {
  try {
    console.log('Running 004 migration for health_record_attachments...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS health_record_attachments (
        attachment_id INT AUTO_INCREMENT PRIMARY KEY,
        record_id INT NOT NULL,
        user_id INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_hr_attachment_record FOREIGN KEY (record_id) REFERENCES health_records(record_id) ON DELETE CASCADE,
        CONSTRAINT fk_hr_attachment_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_hr_attachments_record (record_id),
        INDEX idx_hr_attachments_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Table health_record_attachments created or already exists.');
  } catch (err) {
    console.error('Migration 004 failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();

