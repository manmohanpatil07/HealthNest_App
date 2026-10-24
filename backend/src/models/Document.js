const { pool } = require('../config/database');

const Document = {
  /**
   * Find all documents for a user, newest first
   */
  async findByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT
        document_id,
        user_id,
        document_type,
        document_name,
        file_url,
        uploaded_at
      FROM documents
      WHERE user_id = ?
      ORDER BY uploaded_at DESC`,
      [userId]
    );
    return rows;
  },

  /**
   * Find a single document by ID
   */
  async findById(documentId) {
    const [rows] = await pool.execute(
      `SELECT
        document_id,
        user_id,
        document_type,
        document_name,
        file_url,
        uploaded_at
      FROM documents
      WHERE document_id = ? LIMIT 1`,
      [documentId]
    );
    return rows[0] || null;
  },

  /**
   * Create document record
   */
  async create({ user_id, document_type, document_name, file_url }) {
    const [result] = await pool.execute(
      `INSERT INTO documents
        (user_id, document_type, document_name, file_url)
       VALUES (?, ?, ?, ?)`,
      [user_id, document_type, document_name, file_url]
    );
    return result.insertId;
  },

  /**
   * Delete document by ID and user_id for strict ownership isolation
   */
  async deleteByIdAndUser(documentId, userId) {
    const [result] = await pool.execute(
      `DELETE FROM documents
       WHERE document_id = ? AND user_id = ?`,
      [documentId, userId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = Document;
