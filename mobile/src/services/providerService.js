import api from './api';

/**
 * Provider API service – Healthcare Provider Module (Module-2)
 * All calls attach the stored JWT automatically via api.js interceptor.
 */
export const providerService = {
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
   * POST /api/provider/scan-qr
   * Validate a scanned QR access token and retrieve authorized patient data.
   * Returns { success, patient, healthRecords, documents, vaccinations, accessInfo }
   */
  scanQR: async (accessToken) => {
    const response = await api.post('/provider/scan-qr', { access_token: accessToken });
    return response.data;
  },
};

export default providerService;
