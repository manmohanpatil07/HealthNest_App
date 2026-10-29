import api from './api';

/**
 * Provider API service – Healthcare Provider Module (Module-2)
 * All calls attach the stored JWT automatically via api.js interceptor.
 */
export const providerService = {
  /**
   * POST /api/auth/provider-register
   * Register a new healthcare provider account.
   * Returns { success, token, role, userId, provider }
   */
  register: async (providerData) => {
    const response = await api.post('/auth/provider-register', providerData);
    return response.data;
  },

  /**
   * POST /api/auth/provider-login
   * Authenticate a healthcare provider with mobile/email + password.
   * Returns { success, token, role, userId, provider }
   */
  login: async ({ identifier, password }) => {
    const response = await api.post('/auth/provider-login', { identifier, password });
    return response.data;
  },

  /**
   * GET /api/provider/profile
   * Fetch the authenticated provider's profile.
   * Returns { success, provider }
   */
  getProfile: async () => {
    const response = await api.get('/provider/profile');
    return response.data;
  },

  /**
   * PUT /api/provider/profile
   * Update the authenticated provider's profile.
   * Returns { success, message, provider }
   */
  updateProfile: async (profileData) => {
    const response = await api.put('/provider/profile', profileData);
    return response.data;
  },

  /**
   * POST /api/provider/scan-qr
   * Validate a scanned QR access token and retrieve authorized patient data.
   * Returns { success, patient, healthRecords, documents, vaccinations, accessInfo }
   */
  scanQR: async (accessToken) => {
    const response = await api.post('/provider/scan-qr', { access_token: accessToken });
    return response.data;
  },

  /**
   * GET /api/provider/patient/:token
   * Retrieve authorized patient details by QR access token.
   * Returns { success, patient, healthRecords, documents, vaccinations, accessInfo }
   */
  getPatientByToken: async (accessToken) => {
    const response = await api.get(`/provider/patient/${encodeURIComponent(accessToken)}`);
    return response.data;
  },

  /**
   * GET /api/provider/history
   * Retrieve patient access history for authenticated provider.
   * Returns { success, count, history }
   */
  getHistory: async () => {
    const response = await api.get('/provider/history');
    return response.data;
  },

  /**
   * GET /api/provider/history/:accessId
   * Retrieve authorized patient details from historical access ID.
   * Returns { success, patient, healthRecords, documents, vaccinations, accessInfo }
   */
  getPatientByHistoryId: async (accessId) => {
    const response = await api.get(`/provider/history/${encodeURIComponent(accessId)}`);
    return response.data;
  },
};

export default providerService;
