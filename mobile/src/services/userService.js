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
  }
};

export default userService;
