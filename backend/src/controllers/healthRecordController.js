const HealthRecord = require('../models/HealthRecord');
const path = require('path');
const fs = require('fs');

// Valid record types matching UI_INSTRUCTIONS.md Section 24
const VALID_RECORD_TYPES = [
  'Blood Test',
  'Prescription',
  'Consultation',
  'Radiology',
  'Other'
];

const healthRecordController = {
  /**
   * GET /api/health-records
   * List all health records for the authenticated user (including attachments)
   */
  async getRecords(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const records = await HealthRecord.findByUserId(userId);

      return res.status(200).json({
        success: true,
        records,
        count: records.length
      });
    } catch (error) {
      console.error('[healthRecordController.getRecords] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve health records.'
      });
    }
  },

  /**
   * GET /api/health-records/:id
   * Get single health record details with attachments (ownership enforced)
   */
  async getRecordById(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const recordId = parseInt(req.params.id, 10);

      if (!recordId || isNaN(recordId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid record ID.'
        });
      }

      const record = await HealthRecord.findById(recordId);
      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Health record not found.'
        });
      }

      if (record.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You cannot view another user\'s record.'
        });
      }

      return res.status(200).json({
        success: true,
        record
      });
    } catch (error) {
      console.error('[healthRecordController.getRecordById] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve record.'
      });
    }
  },

  /**
   * POST /api/health-records
   * Create a new health record with optional file attachment
   * Supports both JSON and multipart/form-data
   */
  async createRecord(req, res) {
    let uploadedFilePath = null;
    try {
      const userId = req.user.id || req.user.userId;
      const { record_type, title, description, record_date } = req.body;

      // Track uploaded file if present
      if (req.file) {
        uploadedFilePath = req.file.path;
      }

      // Validate required fields per Module-1.md Section 6.3
      if (!record_type || !record_type.trim()) {
        if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
        return res.status(400).json({
          success: false,
          message: 'Record Type is required.'
        });
      }

      if (!VALID_RECORD_TYPES.includes(record_type.trim())) {
        if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
        return res.status(400).json({
          success: false,
          message: `Record Type must be one of: ${VALID_RECORD_TYPES.join(', ')}.`
        });
      }

      if (!title || !title.trim()) {
        if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
        return res.status(400).json({
          success: false,
          message: 'Title is required.'
        });
      }

      if (!record_date || !record_date.trim()) {
        if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
        return res.status(400).json({
          success: false,
          message: 'Record Date is required.'
        });
      }

      // Validate date format
      const parsedDate = new Date(record_date.trim());
      if (isNaN(parsedDate.getTime())) {
        if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
        return res.status(400).json({
          success: false,
          message: 'Record Date must be a valid date (YYYY-MM-DD).'
        });
      }

      // 1. Create health record entry
      const recordId = await HealthRecord.create({
        user_id: userId,
        record_type: record_type.trim(),
        title: title.trim(),
        description: description && description.trim() ? description.trim() : null,
        record_date: record_date.trim()
      });

      // 2. If photo attachment was uploaded, save attachment association
      if (req.file) {
        const fileUrl = `/uploads/attachments/${req.file.filename}`;
        await HealthRecord.addAttachment({
          record_id: recordId,
          user_id: userId,
          file_name: req.file.originalname,
          file_url: fileUrl,
          file_type: req.file.mimetype,
          file_size: req.file.size
        });
      }

      const newRecord = await HealthRecord.findById(recordId);

      return res.status(201).json({
        success: true,
        message: 'Health record added successfully.',
        record: newRecord
      });
    } catch (error) {
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        try { fs.unlinkSync(uploadedFilePath); } catch (e) {}
      }
      console.error('[healthRecordController.createRecord] Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create health record.'
      });
    }
  },

  /**
   * DELETE /api/health-records/:id
   * Delete a health record — ownership enforced at DB level (AND user_id = ?)
   */
  async deleteRecord(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const recordId = parseInt(req.params.id, 10);

      if (!recordId || isNaN(recordId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid record ID.'
        });
      }

      const record = await HealthRecord.findById(recordId);
      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Health record not found.'
        });
      }

      // Ownership check — if record belongs to another user, deny
      if (record.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You cannot delete another user\'s record.'
        });
      }

      // Clean up attachment files from disk
      if (record.attachments && record.attachments.length > 0) {
        for (const att of record.attachments) {
          if (att.file_url && att.file_url.startsWith('/uploads/attachments/')) {
            const filePath = path.join(__dirname, '../../', att.file_url);
            if (fs.existsSync(filePath)) {
              try { fs.unlinkSync(filePath); } catch (e) {}
            }
          }
        }
      }

      // Parameterised DELETE enforces ownership at DB level too
      const deleted = await HealthRecord.deleteByIdAndUser(recordId, userId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Health record not found or already deleted.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Health record deleted successfully.'
      });
    } catch (error) {
      console.error('[healthRecordController.deleteRecord] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete health record.'
      });
    }
  }
};

module.exports = healthRecordController;
