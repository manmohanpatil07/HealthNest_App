const User = require('../models/User');
const { pool } = require('../config/database');
const { calculateHealthSummary } = require('../services/healthSummaryService');
const path = require('path');
const fs = require('fs');

/**
 * User Controller - Module 1: User Profile & Authentication
 */
const userController = {
  /**
   * Get user profile by ID from token
   * GET /api/user/profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User profile not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: user,
        user: user
      });
    } catch (error) {
      console.error('[userController.getProfile] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile. Please try again later.'
      });
    }
  },

  /**
   * Update user profile
   * PUT /api/user/profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const updateData = req.body;

      // Prevent unauthorized modification of critical fields
      delete updateData.user_id;
      delete updateData.password_hash;
      delete updateData.created_at;

      // Validate blood_group if provided
      if (updateData.blood_group) {
        const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        if (!validBloodGroups.includes(updateData.blood_group)) {
          return res.status(400).json({
            success: false,
            message: `Invalid blood group. Must be one of: ${validBloodGroups.join(', ')}`
          });
        }
      }

      // Validate gender if provided
      if (updateData.gender) {
        const validGenders = ['Male', 'Female', 'Other'];
        if (!validGenders.includes(updateData.gender)) {
          return res.status(400).json({
            success: false,
            message: 'Gender must be Male, Female, or Other.'
          });
        }
      }

      const success = await User.updateProfile(userId, updateData);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'User not found or no changes made.'
        });
      }

      const updatedUser = await User.findById(userId);

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      });
    } catch (error) {
      console.error('[userController.updateProfile] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile. Please try again later.'
      });
    }
  },

  /**
   * Upload user profile photo
   * POST /api/user/profile/photo
   */
  async uploadProfilePhoto(req, res) {
    try {
      const userId = req.user.id || req.user.userId;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No photo uploaded. Please select a valid JPG, PNG, or WebP image.'
        });
      }

      // Construct publicly accessible static URL path
      const profileImageUrl = `/uploads/profiles/${req.file.filename}`;

      // Retrieve previous photo to delete old file if it exists locally
      const currentUser = await User.findById(userId);
      if (currentUser?.profile_image_url && currentUser.profile_image_url.startsWith('/uploads/profiles/')) {
        const oldFilePath = path.join(__dirname, '../../', currentUser.profile_image_url);
        if (fs.existsSync(oldFilePath)) {
          fs.unlink(oldFilePath, (err) => {
            if (err) console.warn('Failed to delete old avatar file:', err.message);
          });
        }
      }

      await User.updateProfileImage(userId, profileImageUrl);

      return res.status(200).json({
        success: true,
        message: 'Profile photo uploaded successfully',
        profile_image_url: profileImageUrl
      });
    } catch (error) {
      console.error('[userController.uploadProfilePhoto] Error:', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to upload profile photo.'
      });
    }
  },

  /**
   * Remove user profile photo
   * DELETE /api/user/profile/photo
   */
  async removeProfilePhoto(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const currentUser = await User.findById(userId);

      if (currentUser?.profile_image_url) {
        // Delete file from disk if hosted locally
        if (currentUser.profile_image_url.startsWith('/uploads/profiles/')) {
          const filePath = path.join(__dirname, '../../', currentUser.profile_image_url);
          if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
              if (err) console.warn('Failed to delete avatar file:', err.message);
            });
          }
        }
        await User.updateProfileImage(userId, null);
      }

      return res.status(200).json({
        success: true,
        message: 'Profile photo removed successfully'
      });
    } catch (error) {
      console.error('[userController.removeProfilePhoto] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to remove profile photo.'
      });
    }
  },

  /**
   * Get user dashboard data with transparent, data-based health summary
   * GET /api/user/dashboard
   */
  async getDashboard(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // 1. Fetch recent health records for authenticated user
      const [recentRecords] = await pool.execute(
        `SELECT record_id, record_type, title, description, record_date, created_at 
         FROM health_records 
         WHERE user_id = ? 
         ORDER BY record_date DESC 
         LIMIT 2`,
        [userId]
      );

      // 2. Fetch all health records count for this user
      const [allHealthRecords] = await pool.execute(
        `SELECT record_id, record_date FROM health_records WHERE user_id = ?`,
        [userId]
      );

      // 3. Fetch all vaccinations for this user to calculate accurate reminders
      const [allVaccinations] = await pool.execute(
        `SELECT vaccination_id, vaccine_name, vaccination_date, next_due_date, notes 
         FROM vaccinations 
         WHERE user_id = ? 
         ORDER BY next_due_date ASC`,
        [userId]
      );

      // 4. Calculate transparent record-based health summary
      const healthSummary = calculateHealthSummary({
        vaccinations: allVaccinations,
        healthRecords: allHealthRecords,
        user
      });

      // 5. Select primary upcoming vaccination if any
      const upcomingVaccines = allVaccinations.filter(v => v.next_due_date !== null);

      return res.status(200).json({
        success: true,
        data: {
          user: {
            user_id: user.user_id,
            full_name: user.full_name,
            blood_group: user.blood_group,
            profile_image_url: user.profile_image_url || null,
            city: user.city,
            state: user.state,
            gender: user.gender
          },
          healthStatus: {
            state: healthSummary.state,
            status: healthSummary.title,
            reason: healthSummary.reason,
            severity: healthSummary.severity,
            indicatorEmoji: healthSummary.indicatorEmoji,
            lastUpdated: `Calculated ${healthSummary.lastCalculated}`,
            bloodGroup: user.blood_group || 'Not set',
            metrics: healthSummary.metrics
          },
          upcomingVaccination: upcomingVaccines[0] || null,
          recentRecords: recentRecords || []
        }
      });
    } catch (error) {
      console.error('[userController.getDashboard] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to load dashboard data.'
      });
    }
  }
};

module.exports = userController;
