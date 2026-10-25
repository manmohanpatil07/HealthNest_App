const { pool } = require('../config/database');

/**
 * Provider model – Healthcare Provider (Module-2)
 * All queries are parameterized to prevent SQL injection.
 * password_hash is never returned by findById.
 */
const Provider = {
  /**
   * Find a provider by mobile number (includes password_hash for login check)
   * @param {string} mobile
   * @returns {Promise<Object|null>}
   */
  async findByMobile(mobile) {
    const [rows] = await pool.execute(
      `SELECT
        provider_id,
        full_name,
        mobile,
        email,
        password_hash,
        provider_type,
        clinic_name,
        city,
        state,
        created_at
      FROM providers
      WHERE mobile = ?
      LIMIT 1`,
      [mobile]
    );
    return rows[0] || null;
  },

  /**
   * Find a provider by email (includes password_hash for login check)
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    if (!email) return null;
    const [rows] = await pool.execute(
      `SELECT
        provider_id,
        full_name,
        mobile,
        email,
        password_hash,
        provider_type,
        clinic_name,
        city,
        state,
        created_at
      FROM providers
      WHERE email = ?
      LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  },

  /**
   * Get provider profile by ID (safe – no password_hash)
   * @param {number} providerId
   * @returns {Promise<Object|null>}
   */
  async findById(providerId) {
    const [rows] = await pool.execute(
      `SELECT
        provider_id,
        full_name,
        mobile,
        email,
        provider_type,
        clinic_name,
        city,
        state,
        created_at
      FROM providers
      WHERE provider_id = ?
      LIMIT 1`,
      [providerId]
    );
    return rows[0] || null;
  }
};

module.exports = Provider;
