const { pool } = require('../config/database');

const User = {
  /**
   * Find user by mobile number
   * @param {string} mobile 
   * @returns {Promise<Object|null>}
   */
  async findByMobile(mobile) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE mobile = ? LIMIT 1',
      [mobile]
    );
    return rows[0] || null;
  },

  /**
   * Find user by email
   * @param {string} email 
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    if (!email) return null;
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    return rows[0] || null;
  },

  /**
   * Find user by ID (safe fields without password_hash)
   * @param {number} userId 
   * @returns {Promise<Object|null>}
   */
  async findById(userId) {
    const [rows] = await pool.execute(
      `SELECT 
        user_id,
        full_name,
        mobile,
        email,
        date_of_birth,
        gender,
        city,
        state,
        blood_group,
        emergency_contact,
        created_at,
        updated_at
      FROM users 
      WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  },

  /**
   * Create new user
   * @param {Object} userData 
   * @returns {Promise<number>} Inserted user_id
   */
  async create({
    full_name,
    mobile,
    email = null,
    password_hash = null,
    date_of_birth = null,
    gender = null,
    city = null,
    state = null
  }) {
    const [result] = await pool.execute(
      `INSERT INTO users (
        full_name,
        mobile,
        email,
        password_hash,
        date_of_birth,
        gender,
        city,
        state
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name,
        mobile,
        email || null,
        password_hash,
        date_of_birth || null,
        gender || null,
        city || null,
        state || null
      ]
    );
    return result.insertId;
  },

  /**
   * Update user profile
   * @param {number} userId 
   * @param {Object} updateData 
   * @returns {Promise<boolean>}
   */
  async updateProfile(userId, {
    full_name,
    email = null,
    date_of_birth = null,
    gender = null,
    city = null,
    state = null,
    blood_group = null,
    emergency_contact = null
  }) {
    const [result] = await pool.execute(
      `UPDATE users
      SET
        full_name = ?,
        email = ?,
        date_of_birth = ?,
        gender = ?,
        city = ?,
        state = ?,
        blood_group = ?,
        emergency_contact = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?`,
      [
        full_name,
        email || null,
        date_of_birth || null,
        gender || null,
        city || null,
        state || null,
        blood_group || null,
        emergency_contact || null,
        userId
      ]
    );
    return result.affectedRows > 0;
  }
};

module.exports = User;
