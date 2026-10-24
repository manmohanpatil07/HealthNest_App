const crypto = require('crypto');
const QRAccess = require('../models/QRAccess');
const User = require('../models/User');

function generateSecureToken() {
  const year = new Date().getFullYear();
  const hex1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const hex2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `HN-${year}-${hex1}-${hex2}`;
}

const qrController = {
  /**
   * GET /api/qr
   * Get user's active QR access token and basic card metadata
   */
  async getQRCode(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User profile not found.'
        });
      }

      let qr = await QRAccess.findActiveByUserId(userId);

      // If no active QR token exists or current one expired, generate one valid for 30 days
      if (!qr) {
        const token = generateSecureToken();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        const accessId = await QRAccess.create({
          user_id: userId,
          access_token: token,
          permission: 'view',
          expires_at: expiresAt
        });
        qr = await QRAccess.findActiveByUserId(userId);
      }

      return res.status(200).json({
        success: true,
        data: {
          user: {
            user_id: user.user_id,
            full_name: user.full_name,
            blood_group: user.blood_group,
            date_of_birth: user.date_of_birth,
            city: user.city,
            state: user.state
          },
          qr: {
            access_id: qr.access_id,
            access_token: qr.access_token,
            permission: qr.permission,
            expires_at: qr.expires_at,
            created_at: qr.created_at
          }
        }
      });
    } catch (error) {
      console.error('[qrController.getQRCode] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve QR Health Card.'
      });
    }
  },

  /**
   * POST /api/qr/regenerate
   * Invalidate existing tokens and generate a brand new secure access token
   */
  async regenerateQR(req, res) {
    try {
      const userId = req.user.id || req.user.userId;

      // Invalidate existing tokens
      await QRAccess.invalidateUserTokens(userId);

      // Create new token
      const newToken = generateSecureToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await QRAccess.create({
        user_id: userId,
        access_token: newToken,
        permission: 'view',
        expires_at: expiresAt
      });

      const qr = await QRAccess.findActiveByUserId(userId);

      return res.status(200).json({
        success: true,
        message: 'QR code regenerated successfully. Previous code is now invalid.',
        qr
      });
    } catch (error) {
      console.error('[qrController.regenerateQR] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to regenerate QR code.'
      });
    }
  },

  /**
   * PUT /api/qr/permissions
   * Update permission settings for the active QR token
   */
  async updatePermissions(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const { permission } = req.body;

      if (!permission) {
        return res.status(400).json({
          success: false,
          message: 'Permission value is required.'
        });
      }

      await QRAccess.updatePermission(userId, permission);
      const updatedQR = await QRAccess.findActiveByUserId(userId);

      return res.status(200).json({
        success: true,
        message: 'Access permissions updated successfully.',
        qr: updatedQR
      });
    } catch (error) {
      console.error('[qrController.updatePermissions] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update QR permissions.'
      });
    }
  }
};

module.exports = qrController;
