const { pool } = require('../config/database');

const QRAccess = {
  /**
   * Find active QR access for user
   */
  async findActiveByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT
        access_id,
        user_id,
        provider_id,
        access_token,
        permission,
        expires_at,
        created_at
      FROM qr_access
      WHERE user_id = ?
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC
      LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  },

  /**
   * Find QR access by access_token
   */
  async findByToken(token) {
    const [rows] = await pool.execute(
      `SELECT
        access_id,
        user_id,
        provider_id,
        access_token,
        permission,
        expires_at,
        created_at
      FROM qr_access
      WHERE access_token = ? LIMIT 1`,
      [token]
    );
    return rows[0] || null;
  },

  /**
   * Create a new QR access record
   */
  async create({ user_id, provider_id = null, access_token, permission = 'view', expires_at }) {
    const [result] = await pool.execute(
      `INSERT INTO qr_access
        (user_id, provider_id, access_token, permission, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, provider_id || null, access_token, permission, expires_at]
    );
    return result.insertId;
  },

  /**
   * Invalidate / delete existing active QR access for a user before regenerating
   */
  async invalidateUserTokens(userId) {
    const [result] = await pool.execute(
      `DELETE FROM qr_access WHERE user_id = ?`,
      [userId]
    );
    return result.affectedRows;
  },

  /**
   * Update permissions on user's active QR access
   */
  async updatePermission(userId, permission) {
    const [result] = await pool.execute(
      `UPDATE qr_access
       SET permission = ?
       WHERE user_id = ? AND (expires_at IS NULL OR expires_at > NOW())`,
      [permission, userId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = QRAccess;
