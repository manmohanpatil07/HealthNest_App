import api from './api';

/**
 * Mobile Hospital Service - Module 3: Hospital Finder
 * Connects to the real backend API with JWT authentication.
 */
export const hospitalService = {
  /**
   * Search and list hospitals
   * @param {Object} options
   *  - latitude: number (optional)
   *  - longitude: number (optional)
   *  - radius: number (optional, km)
   *  - city: string (optional)
   *  - state: string (optional)
   *  - search: string (optional, keyword search)
   *  - pmjay: boolean (optional)
   */
  getHospitals: async (options = {}) => {
    const params = {};

    if (options.latitude !== undefined && options.latitude !== null) {
      params.latitude = options.latitude;
    }
    if (options.longitude !== undefined && options.longitude !== null) {
      params.longitude = options.longitude;
    }
    if (options.radius !== undefined && options.radius !== null) {
      params.radius = options.radius;
    }
    if (options.city) {
      params.city = options.city;
    }
    if (options.state) {
      params.state = options.state;
    }
    if (options.search) {
      params.search = options.search;
    }
    if (options.pmjay !== undefined && options.pmjay !== null) {
      params.pmjay = options.pmjay;
    }

    const response = await api.get('/hospitals', { params });
    return response.data;
  },

  /**
   * Get hospital details by ID
   * @param {number|string} id
   */
  getHospitalDetails: async (id) => {
    const response = await api.get(`/hospitals/${id}`);
    return response.data;
  },
};

export default hospitalService;
