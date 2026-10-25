const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const Provider = require('../models/Provider');

const JWT_SECRET = process.env.JWT_SECRET || 'healthnest_jwt_secret_key_dev_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const providerController = {
  /**
   * Provider Login
   * POST /api/auth/provider-login
   * Accepts mobile or email + password.
   * Returns JWT with role: 'healthcare_provider'.
   */
  async login(req, res) {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !identifier.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number or email is required'
        });
      }

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required'
        });
      }

      const cleanIdentifier = identifier.trim();

      // Try to find provider by mobile first, then email
      const isMobile = /^[0-9]{10}$/.test(cleanIdentifier);
      let provider = isMobile
        ? await Provider.findByMobile(cleanIdentifier)
        : await Provider.findByEmail(cleanIdentifier);

      // Fallback: if mobile lookup returned nothing, try email (and vice-versa)
      if (!provider && isMobile) {
        provider = await Provider.findByEmail(cleanIdentifier);
      }
      if (!provider && !isMobile) {
        provider = await Provider.findByMobile(cleanIdentifier);
      }

      if (!provider) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      if (!provider.password_hash) {
        return res.status(401).json({
          success: false,
          message: 'Password not set for this provider account'
        });
      }

      // Verify bcrypt password
      const isMatch = await bcrypt.compare(password, provider.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Issue JWT with healthcare_provider role
      const token = jwt.sign(
        {
          id: provider.provider_id,
          providerId: provider.provider_id,
          role: 'healthcare_provider'
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Safe provider object – strip password_hash
      const { password_hash, ...safeProvider } = provider;

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        role: 'healthcare_provider',
        userId: provider.provider_id,
        provider: safeProvider
      });
    } catch (error) {
      console.error('[providerController.login] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during provider login. Please try again later.'
      });
    }
  },

  /**
   * Get authenticated provider's profile
   * GET /api/provider/profile
   * Requires JWT with role: 'healthcare_provider'
   */
  async getProfile(req, res) {
    try {
      const providerId = req.user.providerId || req.user.id;
      const provider = await Provider.findById(providerId);

      if (!provider) {
        return res.status(404).json({
          success: false,
          message: 'Provider not found'
        });
      }

      return res.status(200).json({
        success: true,
        provider
      });
    } catch (error) {
      console.error('[providerController.getProfile] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error retrieving provider profile.'
      });
    }
  },

  /**
   * Validate a scanned QR access token and return authorized patient data
   * POST /api/provider/scan-qr
   * Body: { access_token: string }
   * Requires JWT with role: 'healthcare_provider'
   *
   * Validates:
   *  1. Provider JWT (handled by middleware)
   *  2. QR token exists in qr_access
   *  3. permission = 'view'
   *  4. expires_at is NULL or in the future
   * Then returns patient profile + health_records + documents + vaccinations.
   */
  async scanQR(req, res) {
    try {
      const providerId = req.user.providerId || req.user.id;
      const { access_token } = req.body;

      if (!access_token || !access_token.trim()) {
        return res.status(400).json({
          success: false,
          message: 'QR access token is required'
        });
      }

      // Validate token – check expiry and permission
      const [qrRows] = await pool.execute(
        `SELECT
          access_id,
          user_id,
          provider_id,
          permission,
          expires_at,
          created_at
        FROM qr_access
        WHERE access_token = ?
          AND permission = 'view'
          AND (expires_at IS NULL OR expires_at > NOW())
        LIMIT 1`,
        [access_token.trim()]
      );

      if (!qrRows.length) {
        return res.status(403).json({
          success: false,
          message: 'QR code is invalid, expired, or unauthorized'
        });
      }

      const qrRecord = qrRows[0];
      const authorizedUserId = qrRecord.user_id;

      // Fetch patient profile (safe fields)
      const [userRows] = await pool.execute(
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
          created_at
        FROM users
        WHERE user_id = ?
        LIMIT 1`,
        [authorizedUserId]
      );

      if (!userRows.length) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      const patient = userRows[0];

      // Fetch health records (read-only)
      const [healthRecords] = await pool.execute(
        `SELECT
          record_id,
          user_id,
          record_type,
          title,
          description,
          record_date,
          created_at
        FROM health_records
        WHERE user_id = ?
        ORDER BY record_date DESC, created_at DESC`,
        [authorizedUserId]
      );

      // Fetch documents (read-only, metadata + file_url)
      const [documents] = await pool.execute(
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
        [authorizedUserId]
      );

      // Fetch vaccinations (read-only)
      const [vaccinations] = await pool.execute(
        `SELECT
          vaccination_id,
          user_id,
          vaccine_name,
          vaccination_date,
          next_due_date,
          notes,
          created_at
        FROM vaccinations
        WHERE user_id = ?
        ORDER BY vaccination_date DESC, created_at DESC`,
        [authorizedUserId]
      );

      return res.status(200).json({
        success: true,
        patient,
        healthRecords,
        documents,
        vaccinations,
        accessInfo: {
          access_id: qrRecord.access_id,
          permission: qrRecord.permission,
          expires_at: qrRecord.expires_at
        }
      });
    } catch (error) {
      console.error('[providerController.scanQR] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error validating QR code. Please try again.'
      });
    }
  }
};

module.exports = providerController;
