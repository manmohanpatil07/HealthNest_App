const { pool } = require('../config/database');

const Vaccination = {
  /**
   * Find all vaccinations for a user, ordered by vaccination_date DESC
   */
  async findByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT
        vaccination_id,
        user_id,
        vaccine_name,
        vaccination_date,
        next_due_date,
        notes,
        created_at
      FROM vaccinations
      WHERE user_id = ?
      ORDER BY vaccination_date DESC`,
      [userId]
    );
    return rows;
  },

  /**
   * Find upcoming vaccinations (where next_due_date is set and >= today or future)
   */
  async findUpcomingByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT
        vaccination_id,
        user_id,
        vaccine_name,
        vaccination_date,
        next_due_date,
        notes,
        created_at
      FROM vaccinations
      WHERE user_id = ? AND next_due_date IS NOT NULL
      ORDER BY next_due_date ASC`,
      [userId]
    );
    return rows;
  },

  /**
   * Find a single vaccination by ID
   */
  async findById(vaccinationId) {
    const [rows] = await pool.execute(
      `SELECT
        vaccination_id,
        user_id,
        vaccine_name,
        vaccination_date,
        next_due_date,
        notes,
        created_at
      FROM vaccinations
      WHERE vaccination_id = ? LIMIT 1`,
      [vaccinationId]
    );
    return rows[0] || null;
  },

  /**
   * Create a new vaccination record
   */
  async create({ user_id, vaccine_name, vaccination_date, next_due_date = null, notes = null }) {
    const [result] = await pool.execute(
      `INSERT INTO vaccinations
        (user_id, vaccine_name, vaccination_date, next_due_date, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, vaccine_name, vaccination_date, next_due_date || null, notes || null]
    );
    return result.insertId;
  },

  /**
   * Delete vaccination by ID and user_id for strict ownership isolation
   */
  async deleteByIdAndUser(vaccinationId, userId) {
    const [result] = await pool.execute(
      `DELETE FROM vaccinations
       WHERE vaccination_id = ? AND user_id = ?`,
      [vaccinationId, userId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = Vaccination;
