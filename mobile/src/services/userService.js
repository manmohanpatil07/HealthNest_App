import api from './api';

export const userService = {
  /**
   * Get user profile
   */
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (profileData) => {
    const response = await api.put('/user/profile', profileData);
    return response.data;
  },

  /**
   * Get user dashboard data
   */
  getDashboard: async () => {
    const response = await api.get('/user/dashboard');
    return response.data;
  },

  // ──────────────────────── Health Records ────────────────────────

  /**
   * List all health records for authenticated user
   */
  getHealthRecords: async () => {
    const response = await api.get('/health-records');
    return response.data;
  },

  /**
   * Create a new health record
   * @param {{ record_type: string, title: string, description?: string, record_date: string }} data
   */
  createHealthRecord: async (data) => {
    const response = await api.post('/health-records', data);
    return response.data;
  },

  /**
   * Delete a health record by id (ownership enforced on backend)
   * @param {number} recordId
   */
  deleteHealthRecord: async (recordId) => {
    const response = await api.delete(`/health-records/${recordId}`);
    return response.data;
  }
};

export default userService;

