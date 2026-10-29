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
        profile_image_url,
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
    emergency_contact = null,
    profile_image_url = undefined
  }) {
    let sql = `
      UPDATE users
      SET
        full_name = ?,
        email = ?,
        date_of_birth = ?,
        gender = ?,
        city = ?,
        state = ?,
        blood_group = ?,
        emergency_contact = ?
    `;
    const params = [
      full_name,
      email || null,
      date_of_birth || null,
      gender || null,
      city || null,
      state || null,
      blood_group || null,
      emergency_contact || null
    ];

    if (profile_image_url !== undefined) {
      sql += `, profile_image_url = ?`;
      params.push(profile_image_url);
    }

    sql += `, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`;
    params.push(userId);

    const [result] = await pool.execute(sql, params);
    return result.affectedRows > 0;
  },

  /**
   * Update profile image URL directly
   */
  async updateProfileImage(userId, profileImageUrl) {
    const [result] = await pool.execute(
      `UPDATE users
       SET profile_image_url = ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [profileImageUrl, userId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = User;
