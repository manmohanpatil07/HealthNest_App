const Hospital = require('../models/Hospital');

/**
 * Hospital Service - Module 3: Hospital Finder
 * Handles business validation and data layer retrieval
 */
const hospitalService = {
  /**
   * Search hospitals with validation
   * @param {Object} queryParams
   */
  async searchHospitals(queryParams) {
    const {
      latitude,
      longitude,
      radius,
      city,
      state,
      search,
      pmjay
    } = queryParams;

    // Validate latitude & longitude if provided
    let lat = null;
    let lng = null;

    if (latitude !== undefined && latitude !== null && String(latitude).trim() !== '') {
      lat = parseFloat(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        const error = new Error('Invalid latitude. Latitude must be a numeric value between -90 and 90.');
        error.statusCode = 400;
        throw error;
      }
    }

    if (longitude !== undefined && longitude !== null && String(longitude).trim() !== '') {
      lng = parseFloat(longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        const error = new Error('Invalid longitude. Longitude must be a numeric value between -180 and 180.');
        error.statusCode = 400;
        throw error;
      }
    }

    // Both coordinates must be present if one is provided
    if ((lat !== null && lng === null) || (lat === null && lng !== null)) {
      const error = new Error('Both latitude and longitude must be provided for location-based search.');
      error.statusCode = 400;
      throw error;
    }

    // Validate radius
    let radiusKm = 50;
    if (radius !== undefined && radius !== null && String(radius).trim() !== '') {
      const parsedRadius = parseFloat(radius);
      if (isNaN(parsedRadius) || parsedRadius <= 0 || parsedRadius > 500) {
        const error = new Error('Invalid search radius. Radius must be between 1 and 500 km.');
        error.statusCode = 400;
        throw error;
      }
      radiusKm = parsedRadius;
    }

    // Validate PM-JAY status filter
    let pmjayFilter = null;
    if (pmjay !== undefined && pmjay !== null && String(pmjay).trim() !== '') {
      const lower = String(pmjay).trim().toLowerCase();
      if (lower === 'true' || lower === '1') {
        pmjayFilter = true;
      } else if (lower === 'false' || lower === '0') {
        pmjayFilter = false;
      } else {
        const error = new Error('Invalid pmjay parameter. Must be a boolean (true or false).');
        error.statusCode = 400;
        throw error;
      }
    }

    // Query hospitals via model
    const hospitals = await Hospital.search({
      latitude: lat,
      longitude: lng,
      radiusKm,
      city: city ? String(city).trim() : null,
      state: state ? String(state).trim() : null,
      search: search ? String(search).trim() : null,
      pmjay: pmjayFilter
    });

    return hospitals;
  },

  /**
   * Get hospital details by ID
   * @param {number|string} id
   */
  async getHospitalById(id) {
    const hospitalId = parseInt(id, 10);
    if (isNaN(hospitalId) || hospitalId <= 0) {
      const error = new Error('Invalid hospital ID. ID must be a positive integer.');
      error.statusCode = 400;
      throw error;
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      const error = new Error('Hospital not found');
      error.statusCode = 404;
      throw error;
    }

    return hospital;
  }
};

module.exports = hospitalService;
