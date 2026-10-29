import api from './api';

/**
 * Mobile Hospital Service - Module 3: Hospital Finder
 * Connects to the real backend API with JWT authentication.
 */
export const hospitalService = {
  /**
   * Search and list hospitals with pagination and administrative filters
   * @param {Object} options
   *  - latitude: number (optional)
   *  - longitude: number (optional)
   *  - radius: number (optional, km)
   *  - state: string (optional)
   *  - district: string (optional)
   *  - sub_district: string (optional)
   *  - city: string (optional)
   *  - search: string (optional, keyword search)
   *  - pmjay: boolean (optional)
   *  - page: number (optional, defaults to 1)
   *  - limit: number (optional, defaults to 20)
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
    if (options.state) {
      params.state = options.state;
    }
    if (options.district) {
      params.district = options.district;
    }
    if (options.sub_district) {
      params.sub_district = options.sub_district;
    }
    if (options.city) {
      params.city = options.city;
    }
    if (options.search) {
      params.search = options.search;
    }
    if (options.pmjay !== undefined && options.pmjay !== null) {
      params.pmjay = options.pmjay;
    }
    if (options.page !== undefined && options.page !== null) {
      params.page = options.page;
    }
    if (options.limit !== undefined && options.limit !== null) {
      params.limit = options.limit;
    }

    const response = await api.get('/hospitals', { params });
    return response.data;
  },

  /**
   * Get cascading administrative location options (States -> Districts -> Sub-districts)
   * @param {Object} params - { state?: string, district?: string }
   */
  getLocations: async (params = {}) => {
    const response = await api.get('/hospitals/locations', { params });
    return response.data;
  },

  /**
   * Get hospital details by ID
   * @param {number|string} id
   */
  getHospitalById: async (id) => {
    const response = await api.get(`/hospitals/${id}`);
    return response.data;
  },

  /**
   * Alias for getHospitalById used across screens
   * @param {number|string} id
   */
  getHospitalDetails: async (id) => {
    const response = await api.get(`/hospitals/${id}`);
    return response.data;
  }
};

export default hospitalService;
