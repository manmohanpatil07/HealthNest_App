const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'healthnest_jwt_secret_key_dev_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const authController = {
  /**
   * User Registration
   * POST /api/auth/register
   */
  async register(req, res) {
    try {
      const {
        full_name,
        mobile,
        email,
        password,
        date_of_birth,
        gender,
        city,
        state
      } = req.body;

      // Validate required fields per ARCHITECTURE.md & Module-1.md
      if (!full_name || !full_name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Full Name is required'
        });
      }

      if (!mobile || !mobile.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Mobile Number is required'
        });
      }

      const cleanMobile = mobile.trim();
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(cleanMobile)) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number must be a valid 10-digit number'
        });
      }

      if (!password || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      if (!date_of_birth) {
        return res.status(400).json({
          success: false,
          message: 'Date of Birth is required'
        });
      }

      if (!gender) {
        return res.status(400).json({
          success: false,
          message: 'Gender is required'
        });
      }

      // Check for duplicate mobile
      const existingUserByMobile = await User.findByMobile(cleanMobile);
      if (existingUserByMobile) {
        return res.status(409).json({
          success: false,
          message: 'An account with this mobile number already exists'
        });
      }

      // Check for duplicate email if email provided
      const cleanEmail = email && email.trim() ? email.trim() : null;
      if (cleanEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid email address format'
          });
        }

        const existingUserByEmail = await User.findByEmail(cleanEmail);
        if (existingUserByEmail) {
          return res.status(409).json({
            success: false,
            message: 'An account with this email address already exists'
          });
        }
      }

      // Hash password using bcrypt
      const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

      // Insert new user
      const userId = await User.create({
        full_name: full_name.trim(),
        mobile: cleanMobile,
        email: cleanEmail,
        password_hash,
        date_of_birth,
        gender,
        city: city && city.trim() ? city.trim() : null,
        state: state && state.trim() ? state.trim() : null
      });

      // Fetch created user profile without password_hash
      const newUser = await User.findById(userId);

      // Generate JWT token
      const token = jwt.sign(
        { id: userId, userId, role: 'user', mobile: cleanMobile },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        role: 'user',
        userId,
        user: newUser
      });
    } catch (error) {
      console.error('[authController.register] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during registration. Please try again later.'
      });
    }
  },

  /**
   * User Login
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const { mobile, password } = req.body;

      if (!mobile || !mobile.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number is required'
        });
      }

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required'
        });
      }

      const cleanMobile = mobile.trim();
      const user = await User.findByMobile(cleanMobile);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid mobile number or password'
        });
      }

      if (!user.password_hash) {
        return res.status(401).json({
          success: false,
          message: 'Password not set for this account. Please use OTP or reset password.'
        });
      }

      // Verify bcrypt password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid mobile number or password'
        });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.user_id, userId: user.user_id, role: 'user', mobile: user.mobile },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Safe user object without password_hash
      const { password_hash, ...safeUser } = user;

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        role: 'user',
        userId: user.user_id,
        user: safeUser
      });
    } catch (error) {
      console.error('[authController.login] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during login. Please try again later.'
      });
    }
  },

  /**
   * Get Current Authenticated User Profile
   * GET /api/auth/me
   */
  async getMe(req, res) {
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
      console.error('[authController.getMe] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error retrieving user profile.'
      });
    }
  }
};

module.exports = authController;
