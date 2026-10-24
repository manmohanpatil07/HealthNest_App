const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');

const VALID_DOC_TYPES = ['Prescription', 'Medical Report', 'Report'];

const documentController = {
  /**
   * GET /api/documents
   * List all documents for authenticated user
   */
  async getDocuments(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const documents = await Document.findByUserId(userId);

      return res.status(200).json({
        success: true,
        documents,
        count: documents.length
      });
    } catch (error) {
      console.error('[documentController.getDocuments] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve documents.'
      });
    }
  },

  /**
   * POST /api/documents/upload
   * Upload file and save document metadata
   */
  async uploadDocument(req, res) {
    try {
      const userId = req.user.id || req.user.userId;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded. Please select a valid document.'
        });
      }

      let { document_type, document_name } = req.body;

      // Validate document_type
      if (!document_type || !document_type.trim()) {
        document_type = 'Prescription';
      } else {
        document_type = document_type.trim();
        // Standardize Medical Report
        if (document_type.toLowerCase().includes('report')) {
          document_type = 'Medical Report';
        } else if (document_type.toLowerCase().includes('prescription')) {
          document_type = 'Prescription';
        }
      }

      // Default document_name to original filename if not provided
      const docName = (document_name && document_name.trim()) 
        ? document_name.trim() 
        : req.file.originalname;

      // Construct file URL
      const fileUrl = `/uploads/${req.file.filename}`;

      const documentId = await Document.create({
        user_id: userId,
        document_type: document_type,
        document_name: docName,
        file_url: fileUrl
      });

      const newDoc = await Document.findById(documentId);

      return res.status(201).json({
        success: true,
        message: 'Document uploaded successfully!',
        document: newDoc
      });
    } catch (error) {
      console.error('[documentController.uploadDocument] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Upload failed. Please check your connection and try again.'
      });
    }
  },

  /**
   * GET /api/documents/:id/download
   * Securely download or stream user's document
   */
  async downloadDocument(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const documentId = parseInt(req.params.id, 10);

      if (!documentId || isNaN(documentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document ID.'
        });
      }

      const doc = await Document.findById(documentId);
      if (!doc) {
        return res.status(404).json({
          success: false,
          message: 'Document not found.'
        });
      }

      // Cross-user access protection
      if (doc.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You cannot access another user\'s document.'
        });
      }

      // Check if file exists on disk
      const filename = path.basename(doc.file_url);
      const filePath = path.join(__dirname, '../../uploads', filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Document file not found on server.'
        });
      }

      // Stream file as download or inline view
      return res.download(filePath, doc.document_name);
    } catch (error) {
      console.error('[documentController.downloadDocument] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to download document.'
      });
    }
  },

  /**
   * DELETE /api/documents/:id
   * Delete document metadata and remove file from storage
   */
  async deleteDocument(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const documentId = parseInt(req.params.id, 10);

      if (!documentId || isNaN(documentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document ID.'
        });
      }

      const doc = await Document.findById(documentId);
      if (!doc) {
        return res.status(404).json({
          success: false,
          message: 'Document not found.'
        });
      }

      // Cross-user access protection
      if (doc.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You cannot delete another user\'s document.'
        });
      }

      // Delete from DB with user_id parameter check
      const deleted = await Document.deleteByIdAndUser(documentId, userId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Document not found or already deleted.'
        });
      }

      // Clean up file from disk
      try {
        const filename = path.basename(doc.file_url);
        const filePath = path.join(__dirname, '../../uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileErr) {
        console.warn('[documentController.deleteDocument] File cleanup warning:', fileErr.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Document deleted successfully.'
      });
    } catch (error) {
      console.error('[documentController.deleteDocument] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete document.'
      });
    }
  }
};

module.exports = documentController;
