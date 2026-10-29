const { pool } = require('../config/database');

const HealthRecord = {
  /**
   * Get all health records for a user, ordered by record_date DESC, with their attachments
   */
  async findByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT
        hr.record_id,
        hr.user_id,
        hr.record_type,
        hr.title,
        hr.description,
        hr.record_date,
        hr.created_at,
        hra.attachment_id,
        hra.file_name,
        hra.file_url,
        hra.file_type,
        hra.file_size
      FROM health_records hr
      LEFT JOIN health_record_attachments hra ON hr.record_id = hra.record_id
      WHERE hr.user_id = ?
      ORDER BY hr.record_date DESC, hr.created_at DESC`,
      [userId]
    );

    // Group attachments by record_id
    const recordMap = new Map();
    for (const row of rows) {
      if (!recordMap.has(row.record_id)) {
        recordMap.set(row.record_id, {
          record_id: row.record_id,
          user_id: row.user_id,
          record_type: row.record_type,
          title: row.title,
          description: row.description,
          record_date: row.record_date,
          created_at: row.created_at,
          attachments: []
        });
      }

      if (row.attachment_id) {
        recordMap.get(row.record_id).attachments.push({
          attachment_id: row.attachment_id,
          file_name: row.file_name,
          file_url: row.file_url,
          file_type: row.file_type,
          file_size: row.file_size
        });
      }
    }

    return Array.from(recordMap.values());
  },

  /**
   * Get a single record by ID with attachments
   */
  async findById(recordId) {
    const [rows] = await pool.execute(
      `SELECT
        hr.record_id,
        hr.user_id,
        hr.record_type,
        hr.title,
        hr.description,
        hr.record_date,
        hr.created_at,
        hra.attachment_id,
        hra.file_name,
        hra.file_url,
        hra.file_type,
        hra.file_size
      FROM health_records hr
      LEFT JOIN health_record_attachments hra ON hr.record_id = hra.record_id
      WHERE hr.record_id = ?`,
      [recordId]
    );

    if (!rows.length) return null;

    const first = rows[0];
    const record = {
      record_id: first.record_id,
      user_id: first.user_id,
      record_type: first.record_type,
      title: first.title,
      description: first.description,
      record_date: first.record_date,
      created_at: first.created_at,
      attachments: []
    };

    for (const r of rows) {
      if (r.attachment_id) {
        record.attachments.push({
          attachment_id: r.attachment_id,
          file_name: r.file_name,
          file_url: r.file_url,
          file_type: r.file_type,
          file_size: r.file_size
        });
      }
    }

    return record;
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
   * Add attachment to a health record
   */
  async addAttachment({ record_id, user_id, file_name, file_url, file_type, file_size = null }) {
    const [result] = await pool.execute(
      `INSERT INTO health_record_attachments
        (record_id, user_id, file_name, file_url, file_type, file_size)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [record_id, user_id, file_name, file_url, file_type, file_size]
    );
    return result.insertId;
  },

  /**
   * Get attachments for a specific record
   */
  async getAttachments(recordId) {
    const [rows] = await pool.execute(
      `SELECT attachment_id, record_id, user_id, file_name, file_url, file_type, file_size, created_at
       FROM health_record_attachments
       WHERE record_id = ?`,
      [recordId]
    );
    return rows;
  },

  /**
   * Delete a record — cascades to delete health_record_attachments
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
