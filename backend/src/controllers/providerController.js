const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const Provider = require('../models/Provider');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'healthnest_jwt_secret_key_dev_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const providerController = {
  /**
   * Healthcare Provider Registration
   * POST /api/auth/provider-register
   */
  async register(req, res) {
    try {
      const {
        full_name,
        mobile,
        email,
        password,
        provider_type,
        clinic_name,
        city,
        state
      } = req.body;

      // Validate required fields
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

      // Check duplicate mobile in providers
      const existingProviderByMobile = await Provider.findByMobile(cleanMobile);
      if (existingProviderByMobile) {
        return res.status(409).json({
          success: false,
          message: 'A provider account with this mobile number already exists'
        });
      }

      // Check duplicate email if provided
      const cleanEmail = email && email.trim() ? email.trim() : null;
      if (cleanEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid email address format'
          });
        }

        const existingProviderByEmail = await Provider.findByEmail(cleanEmail);
        if (existingProviderByEmail) {
          return res.status(409).json({
            success: false,
            message: 'A provider account with this email address already exists'
          });
        }
      }

      // Hash password using bcrypt
      const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

      // Insert new provider
      const providerId = await Provider.create({
        full_name: full_name.trim(),
        mobile: cleanMobile,
        email: cleanEmail,
        password_hash,
        provider_type: provider_type && provider_type.trim() ? provider_type.trim() : 'healthcare_provider',
        clinic_name: clinic_name && clinic_name.trim() ? clinic_name.trim() : null,
        city: city && city.trim() ? city.trim() : null,
        state: state && state.trim() ? state.trim() : null
      });

      // Fetch created provider profile without password_hash
      const newProvider = await Provider.findById(providerId);

      // Generate JWT with healthcare_provider role
      const token = jwt.sign(
        {
          id: providerId,
          providerId,
          role: 'healthcare_provider',
          mobile: cleanMobile
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return res.status(201).json({
        success: true,
        message: 'Healthcare provider account created successfully',
        token,
        role: 'healthcare_provider',
        userId: providerId,
        provider: newProvider
      });
    } catch (error) {
      console.error('[providerController.register] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during provider registration. Please try again later.'
      });
    }
  },

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
   * Update authenticated provider's profile
   * PUT /api/provider/profile
   * Requires JWT with role: 'healthcare_provider'
   * Body: { full_name, mobile, email, provider_type, clinic_name, city, state }
   */
  async updateProfile(req, res) {
    try {
      const providerId = req.user.providerId || req.user.id;
      const currentProvider = await Provider.findById(providerId);

      if (!currentProvider) {
        return res.status(404).json({
          success: false,
          message: 'Provider not found'
        });
      }

      const {
        full_name,
        mobile,
        email,
        provider_type,
        clinic_name,
        city,
        state
      } = req.body;

      // 1. Validate full_name
      if (!full_name || !full_name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Full name is required.'
        });
      }

      // 2. Validate mobile
      const newMobile = mobile !== undefined ? String(mobile).trim() : currentProvider.mobile;
      if (!newMobile) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number is required.'
        });
      }
      if (newMobile.length !== 10 || !/^[0-9]+$/.test(newMobile)) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number must be exactly 10 digits.'
        });
      }

      // Check mobile uniqueness if changed
      if (newMobile !== currentProvider.mobile) {
        const existingWithMobile = await Provider.findByMobile(newMobile);
        if (existingWithMobile && existingWithMobile.provider_id !== providerId) {
          return res.status(409).json({
            success: false,
            message: 'This mobile number is already registered to another provider account.'
          });
        }
      }

      // 3. Validate email (optional)
      let cleanEmail = email !== undefined ? (email ? String(email).trim().toLowerCase() : null) : currentProvider.email;
      if (cleanEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address.'
          });
        }

        // Check email uniqueness if changed
        if (cleanEmail !== (currentProvider.email ? currentProvider.email.toLowerCase() : null)) {
          const existingWithEmail = await Provider.findByEmail(cleanEmail);
          if (existingWithEmail && existingWithEmail.provider_id !== providerId) {
            return res.status(409).json({
              success: false,
              message: 'This email address is already registered to another provider account.'
            });
          }
        }
      }

      // 4. Update profile in database
      await Provider.updateProfile(providerId, {
        full_name: full_name.trim(),
        mobile: newMobile,
        email: cleanEmail,
        provider_type: provider_type ? provider_type.trim() : (currentProvider.provider_type || 'healthcare_provider'),
        clinic_name: clinic_name ? clinic_name.trim() : null,
        city: city ? city.trim() : null,
        state: state ? state.trim() : null
      });

      // Fetch fresh updated safe provider record (no password_hash)
      const updatedProvider = await Provider.findById(providerId);

      return res.status(200).json({
        success: true,
        message: 'Provider profile updated successfully.',
        provider: updatedProvider
      });
    } catch (error) {
      console.error('[providerController.updateProfile] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error updating provider profile.'
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
      const token = req.body.access_token || req.body.token;

      if (!token || !String(token).trim()) {
        return res.status(400).json({
          success: false,
          message: 'QR access token is required'
        });
      }

      // 1. Look up the token in qr_access
      const [qrRows] = await pool.execute(
        `SELECT
          access_id,
          user_id,
          provider_id,
          access_token,
          permission,
          expires_at,
          created_at
        FROM qr_access
        WHERE access_token = ?
        LIMIT 1`,
        [String(token).trim()]
      );

      if (!qrRows.length) {
        return res.status(404).json({
          success: false,
          errorCode: 'INVALID_QR',
          message: 'This does not appear to be a valid HealthNest QR code. Please try again.'
        });
      }

      const qrRecord = qrRows[0];

      // 2. Check token expiration
      if (qrRecord.expires_at && new Date(qrRecord.expires_at) < new Date()) {
        return res.status(403).json({
          success: false,
          errorCode: 'EXPIRED_QR',
          message: 'This QR code has expired. Ask the patient to regenerate their QR code from the HealthNest app.'
        });
      }

      // 3. Parse and check permission
      // Permission can be 'view', 'all', or comma-separated permissions like 'healthRecords,documents,vaccinations'
      const rawPerm = (qrRecord.permission || '').trim();
      const lowerPerm = rawPerm.toLowerCase();

      // If explicit revoked/none
      if (!rawPerm || lowerPerm === 'none' || lowerPerm === 'revoked') {
        return res.status(403).json({
          success: false,
          errorCode: 'UNAUTHORIZED_ACCESS',
          message: 'Access revoked or unauthorized. View permission is required.'
        });
      }

      // Allow full access if 'view', 'all', or wildcard
      const hasFullAccess = lowerPerm === 'view' || lowerPerm === 'all' || lowerPerm === '*';
      const allowRecords = hasFullAccess || lowerPerm.includes('healthrecord');
      const allowDocs = hasFullAccess || lowerPerm.includes('document');
      const allowVaccines = hasFullAccess || lowerPerm.includes('vaccin');

      // Patient profile is always viewable if any access is granted; if none of the categories are granted:
      if (!hasFullAccess && !allowRecords && !allowDocs && !allowVaccines) {
        return res.status(403).json({
          success: false,
          errorCode: 'UNAUTHORIZED_ACCESS',
          message: 'Access revoked or unauthorized. View permission is required.'
        });
      }

      // 4. Check provider relationship if assigned, or record provider relationship if unassigned
      if (qrRecord.provider_id && qrRecord.provider_id !== providerId) {
        return res.status(403).json({
          success: false,
          errorCode: 'UNAUTHORIZED_PROVIDER',
          message: 'This QR code was issued for a different healthcare provider.'
        });
      }

      // If token had no provider explicitly bound, bind it to this authenticated provider upon successful scan
      if (!qrRecord.provider_id) {
        await pool.execute(
          `UPDATE qr_access SET provider_id = ? WHERE access_id = ?`,
          [providerId, qrRecord.access_id]
        );
        qrRecord.provider_id = providerId;
      }

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

      // Fetch health records with attachments (read-only) if permitted
      const HealthRecord = require('../models/HealthRecord');
      const healthRecords = allowRecords ? await HealthRecord.findByUserId(authorizedUserId) : [];

      // Fetch documents (read-only, metadata + file_url) if permitted
      let documents = [];
      if (allowDocs) {
        const [docs] = await pool.execute(
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
        documents = docs;
      }

      // Fetch vaccinations (read-only) if permitted
      let vaccinations = [];
      if (allowVaccines) {
        const [vaxes] = await pool.execute(
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
        vaccinations = vaxes;
      }

      return res.status(200).json({
        success: true,
        patient,
        healthRecords,
        documents,
        vaccinations,
        accessInfo: {
          access_id: qrRecord.access_id,
          access_token: qrRecord.access_token,
          permission: qrRecord.permission,
          expires_at: qrRecord.expires_at,
          granted_categories: {
            healthRecords: allowRecords,
            documents: allowDocs,
            vaccinations: allowVaccines
          }
        }
      });
    } catch (error) {
      console.error('[providerController.scanQR] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error validating QR code. Please try again.'
      });
    }
  },

  /**
   * Get authorized patient data using validated QR access token
   * GET /api/provider/patient/:token
   * Requires JWT with role: 'healthcare_provider'
   */
  async getAuthorizedPatient(req, res) {
    try {
      const providerId = req.user.providerId || req.user.id;
      const { token } = req.params;

      if (!token || !token.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Access token parameter is required'
        });
      }

      // 1. Look up token in qr_access
      const [qrRows] = await pool.execute(
        `SELECT
          access_id,
          user_id,
          provider_id,
          access_token,
          permission,
          expires_at,
          created_at
        FROM qr_access
        WHERE access_token = ?
        LIMIT 1`,
        [token.trim()]
      );

      if (!qrRows.length) {
        return res.status(404).json({
          success: false,
          errorCode: 'INVALID_QR',
          message: 'This access token is invalid or has expired.'
        });
      }

      const qrRecord = qrRows[0];

      // 2. Check token expiration
      if (qrRecord.expires_at && new Date(qrRecord.expires_at) < new Date()) {
        return res.status(403).json({
          success: false,
          errorCode: 'EXPIRED_QR',
          message: 'This QR code authorization has expired. Ask the patient to regenerate their QR code.'
        });
      }

      // 3. Parse and check permission
      // Permission can be 'view', 'all', or comma-separated permissions like 'healthRecords,documents,vaccinations'
      const rawPerm = (qrRecord.permission || '').trim();
      const lowerPerm = rawPerm.toLowerCase();

      // If explicit revoked/none
      if (!rawPerm || lowerPerm === 'none' || lowerPerm === 'revoked') {
        return res.status(403).json({
          success: false,
          errorCode: 'UNAUTHORIZED_ACCESS',
          message: 'Access revoked or unauthorized. View permission is required.'
        });
      }

      // Allow full access if 'view', 'all', or wildcard
      const hasFullAccess = lowerPerm === 'view' || lowerPerm === 'all' || lowerPerm === '*';
      const allowRecords = hasFullAccess || lowerPerm.includes('healthrecord');
      const allowDocs = hasFullAccess || lowerPerm.includes('document');
      const allowVaccines = hasFullAccess || lowerPerm.includes('vaccin');

      // Patient profile is always viewable if any access is granted; if none of the categories are granted:
      if (!hasFullAccess && !allowRecords && !allowDocs && !allowVaccines) {
        return res.status(403).json({
          success: false,
          errorCode: 'UNAUTHORIZED_ACCESS',
          message: 'Access revoked or unauthorized. View permission is required.'
        });
      }

      // 4. Check provider relationship if assigned, or record provider relationship if unassigned
      if (qrRecord.provider_id && qrRecord.provider_id !== providerId) {
        return res.status(403).json({
          success: false,
          errorCode: 'UNAUTHORIZED_PROVIDER',
          message: 'This QR code was issued for a different healthcare provider.'
        });
      }

      // If token had no provider explicitly bound, bind it to this authenticated provider upon successful scan
      if (!qrRecord.provider_id) {
        await pool.execute(
          `UPDATE qr_access SET provider_id = ? WHERE access_id = ?`,
          [providerId, qrRecord.access_id]
        );
        qrRecord.provider_id = providerId;
      }

      const authorizedUserId = qrRecord.user_id;

      // Fetch patient profile
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

      // Fetch health records with attachments (read-only) if permitted
      const HealthRecord = require('../models/HealthRecord');
      const healthRecords = allowRecords ? await HealthRecord.findByUserId(authorizedUserId) : [];

      // Fetch documents (read-only) if permitted
      let documents = [];
      if (allowDocs) {
        const [docs] = await pool.execute(
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
        documents = docs;
      }

      // Fetch vaccinations (read-only) if permitted
      let vaccinations = [];
      if (allowVaccines) {
        const [vaxes] = await pool.execute(
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
        vaccinations = vaxes;
      }

      return res.status(200).json({
        success: true,
        patient,
        healthRecords,
        documents,
        vaccinations,
        accessInfo: {
          access_id: qrRecord.access_id,
          permission: qrRecord.permission,
          expires_at: qrRecord.expires_at,
          granted_categories: {
            healthRecords: allowRecords,
            documents: allowDocs,
            vaccinations: allowVaccines
          }
        }
      });
    } catch (error) {
      console.error('[providerController.getAuthorizedPatient] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error retrieving authorized patient details.'
      });
    }
  },

  /**
   * Get patient history accessed by the authenticated provider
   * GET /api/provider/history
   * Requires JWT with role: 'healthcare_provider'
   * Returns list of patients who have shared QR access with this provider.
   * Does NOT expose raw access tokens.
   */
  async getHistory(req, res) {
    try {
      const providerId = req.user.providerId || req.user.id;

      const [rows] = await pool.execute(
        `SELECT
          q.access_id,
          q.user_id,
          q.permission,
          q.expires_at,
          q.created_at AS accessed_at,
          u.full_name,
          u.gender,
          u.date_of_birth,
          u.blood_group,
          u.city,
          u.state
        FROM qr_access q
        INNER JOIN users u ON q.user_id = u.user_id
        WHERE q.provider_id = ?
        ORDER BY q.created_at DESC`,
        [providerId]
      );

      const history = rows.map((row) => {
        const isExpired = row.expires_at && new Date(row.expires_at) < new Date();
        const permStr = (row.permission || '').toLowerCase();
        const isRevoked = !permStr || permStr === 'none' || permStr === 'revoked';

        let status = 'active';
        if (isRevoked) {
          status = 'revoked';
        } else if (isExpired) {
          status = 'expired';
        }

        return {
          access_id: row.access_id,
          user_id: row.user_id,
          full_name: row.full_name,
          gender: row.gender,
          date_of_birth: row.date_of_birth,
          blood_group: row.blood_group,
          city: row.city,
          state: row.state,
          permission: row.permission,
          expires_at: row.expires_at,
          accessed_at: row.accessed_at,
          status // 'active' | 'expired' | 'revoked'
        };
      });

      return res.status(200).json({
        success: true,
        count: history.length,
        history
      });
    } catch (error) {
      console.error('[providerController.getHistory] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error retrieving patient history.'
      });
    }
  },

  /**
   * Get patient details by access_id from provider history
   * GET /api/provider/history/:accessId
   * Requires JWT with role: 'healthcare_provider'
   * Validates:
   *  1. access_id exists in qr_access
   *  2. provider_id matches authenticated provider
   *  3. Token has not expired (expires_at >= NOW())
   *  4. Permission is not revoked
   */
  async getHistoryPatientDetails(req, res) {
    try {
      const providerId = req.user.providerId || req.user.id;
      const { accessId } = req.params;

      if (!accessId || isNaN(Number(accessId))) {
        return res.status(400).json({
          success: false,
          message: 'Valid access ID is required.'
        });
      }

      // 1. Look up by access_id
      const [qrRows] = await pool.execute(
        `SELECT
          access_id,
          user_id,
          provider_id,
          permission,
          expires_at,
          created_at
        FROM qr_access
        WHERE access_id = ?
        LIMIT 1`,
        [Number(accessId)]
      );

      if (!qrRows.length) {
        return res.status(404).json({
          success: false,
          errorCode: 'PATIENT_NOT_FOUND',
          message: 'Patient access record not found in history.'
        });
      }

      const qrRecord = qrRows[0];

      // 2. Cross-provider validation: Must belong to authenticated provider
      if (qrRecord.provider_id !== providerId) {
        return res.status(403).json({
          success: false,
          errorCode: 'UNAUTHORIZED_PROVIDER',
          message: 'You are not authorized to view this patient access record.'
        });
      }

      // 3. Expiration validation
      if (qrRecord.expires_at && new Date(qrRecord.expires_at) < new Date()) {
        return res.status(403).json({
          success: false,
          errorCode: 'EXPIRED_ACCESS',
          message: 'This patient authorization has expired. A fresh QR code scan is required to view medical details.'
        });
      }

      // 4. Permission validation
      const rawPerm = (qrRecord.permission || '').trim();
      const lowerPerm = rawPerm.toLowerCase();
      if (!rawPerm || lowerPerm === 'none' || lowerPerm === 'revoked') {
        return res.status(403).json({
          success: false,
          errorCode: 'REVOKED_ACCESS',
          message: 'Access to this patient record has been revoked by the patient.'
        });
      }

      const hasFullAccess = lowerPerm === 'view' || lowerPerm === 'all' || lowerPerm === '*';
      const allowRecords = hasFullAccess || lowerPerm.includes('healthrecord');
      const allowDocs = hasFullAccess || lowerPerm.includes('document');
      const allowVaccines = hasFullAccess || lowerPerm.includes('vaccin');

      const authorizedUserId = qrRecord.user_id;

      // 5. Fetch patient profile
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
          errorCode: 'PATIENT_NOT_FOUND',
          message: 'Patient user account was not found.'
        });
      }

      const patient = userRows[0];

      // 6. Fetch health records with attachments if permitted
      const HealthRecord = require('../models/HealthRecord');
      const healthRecords = allowRecords ? await HealthRecord.findByUserId(authorizedUserId) : [];

      // 7. Fetch documents if permitted
      let documents = [];
      if (allowDocs) {
        const [docs] = await pool.execute(
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
        documents = docs;
      }

      // 8. Fetch vaccinations if permitted
      let vaccinations = [];
      if (allowVaccines) {
        const [vaxes] = await pool.execute(
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
        vaccinations = vaxes;
      }

      return res.status(200).json({
        success: true,
        patient,
        healthRecords,
        documents,
        vaccinations,
        accessInfo: {
          access_id: qrRecord.access_id,
          permission: qrRecord.permission,
          expires_at: qrRecord.expires_at,
          granted_categories: {
            healthRecords: allowRecords,
            documents: allowDocs,
            vaccinations: allowVaccines
          }
        }
      });
    } catch (error) {
      console.error('[providerController.getHistoryPatientDetails] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error retrieving patient details from history.'
      });
    }
  }
};

module.exports = providerController;
