const User = require('../models/User');

const userController = {
  /**
   * Get authenticated user's profile
   * GET /api/user/profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      return res.status(200).json({
        success: true,
        user
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
   * Update authenticated user's profile
   * PUT /api/user/profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const {
        full_name,
        email,
        date_of_birth,
        gender,
        city,
        state,
        blood_group,
        emergency_contact
      } = req.body;

      if (!full_name || !full_name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Full Name is required'
        });
      }

      // Check email uniqueness if email provided and changed
      let cleanEmail = email && email.trim() ? email.trim() : null;
      if (cleanEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid email address format'
          });
        }

        const existingEmailUser = await User.findByEmail(cleanEmail);
        if (existingEmailUser && existingEmailUser.user_id !== userId) {
          return res.status(409).json({
            success: false,
            message: 'An account with this email address already exists'
          });
        }
      }

      let cleanEmergency = emergency_contact && emergency_contact.trim() ? emergency_contact.trim() : null;
      if (cleanEmergency) {
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(cleanEmergency)) {
          return res.status(400).json({
            success: false,
            message: 'Emergency contact must be a valid 10-digit mobile number'
          });
        }
      }

      await User.updateProfile(userId, {
        full_name: full_name.trim(),
        email: cleanEmail,
        date_of_birth: date_of_birth || null,
        gender: gender || null,
        city: city && city.trim() ? city.trim() : null,
        state: state && state.trim() ? state.trim() : null,
        blood_group: blood_group || null,
        emergency_contact: cleanEmergency
      });

      const updatedUser = await User.findById(userId);

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully!',
        user: updatedUser
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
   * Get user dashboard data (summary, upcoming vaccine, recent records)
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

      // Check if recent records or vaccinations exist for this user in DB
      const { pool } = require('../config/database');
      
      const [recentRecords] = await pool.execute(
        `SELECT record_id, record_type, title, description, record_date, created_at 
         FROM health_records 
         WHERE user_id = ? 
         ORDER BY record_date DESC 
         LIMIT 2`,
        [userId]
      );

      const [upcomingVaccines] = await pool.execute(
        `SELECT vaccination_id, vaccine_name, vaccination_date, next_due_date, notes 
         FROM vaccinations 
         WHERE user_id = ? AND next_due_date IS NOT NULL 
         ORDER BY next_due_date ASC 
         LIMIT 1`,
        [userId]
      );

      return res.status(200).json({
        success: true,
        data: {
          user: {
            user_id: user.user_id,
            full_name: user.full_name,
            blood_group: user.blood_group,
            city: user.city,
            state: user.state
          },
          healthStatus: {
            status: 'All Good ✓',
            lastUpdated: 'Today',
            bloodGroup: user.blood_group || 'Not set'
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
