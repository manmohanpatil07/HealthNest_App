const { pool } = require('../config/database');

const HealthRecord = {
  /**
   * Get all health records for a user, ordered by record_date DESC
   */
  async findByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT
        record_id,
        user_id,
        record_type,
        title,
        description,
        record_date,
        created_at
      FROM health_records
      WHERE user_id = ?
      ORDER BY record_date DESC`,
      [userId]
    );
    return rows;
  },

  /**
   * Get a single record by ID — includes user_id so caller can verify ownership
   */
  async findById(recordId) {
    const [rows] = await pool.execute(
      `SELECT
        record_id,
        user_id,
        record_type,
        title,
        description,
        record_date,
        created_at
      FROM health_records
      WHERE record_id = ? LIMIT 1`,
      [recordId]
    );
    return rows[0] || null;
  },

  /**
   * Create a new health record
   * @returns {number} inserted record_id
   */
  async create({ user_id, record_type, title, description = null, record_date }) {
    const [result] = await pool.execute(
      `INSERT INTO health_records
        (user_id, record_type, title, description, record_date)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, record_type, title, description || null, record_date]
    );
    return result.insertId;
  },

  /**
   * Delete a record — enforces ownership via AND user_id = ?
   * @returns {boolean} true if deleted
   */
  async deleteByIdAndUser(recordId, userId) {
    const [result] = await pool.execute(
      `DELETE FROM health_records
       WHERE record_id = ? AND user_id = ?`,
      [recordId, userId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = HealthRecord;
