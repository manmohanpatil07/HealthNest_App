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
      district,
      sub_district,
      subDistrict,
      state,
      search,
      pmjay,
      page,
      limit
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

    // Validate radius (sensible default 25 km, configurable up to 500 km)
    let radiusKm = 25;
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
    const result = await Hospital.search({
      latitude: lat,
      longitude: lng,
      radiusKm,
      city: city ? String(city).trim() : null,
      district: district ? String(district).trim() : null,
      subDistrict: (sub_district || subDistrict) ? String(sub_district || subDistrict).trim() : null,
      state: state ? String(state).trim() : null,
      search: search ? String(search).trim() : null,
      pmjay: pmjayFilter,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20
    });

    return result;
  },

  /**
   * Get administrative hierarchy (States, Districts, Sub-districts)
   */
  getLocations(stateCode = null, districtName = null) {
    const adminData = Hospital.getAdministrativeLocations();

    // If districtName provided, return sub-districts for that district
    if (districtName) {
      const stateObj = adminData.states.find(s =>
        !stateCode || s.code.toLowerCase() === stateCode.toLowerCase() || s.name.toLowerCase() === stateCode.toLowerCase()
      );
      if (!stateObj) {
        return { success: true, subDistricts: [] };
      }
      const distObj = stateObj.districts.find(d =>
        d.name.toLowerCase() === districtName.toLowerCase() ||
        (d.aliases && d.aliases.some(a => a.toLowerCase() === districtName.toLowerCase()))
      );
      return {
        success: true,
        district: distObj ? distObj.name : districtName,
        subDistricts: distObj ? distObj.subDistricts : []
      };
    }

    // If stateCode provided, return districts for that state
    if (stateCode) {
      const stateObj = adminData.states.find(s =>
        s.code.toLowerCase() === stateCode.toLowerCase() || s.name.toLowerCase() === stateCode.toLowerCase()
      );
      return {
        success: true,
        state: stateObj ? stateObj.name : stateCode,
        isSupported: stateObj ? Boolean(stateObj.isSupported) : false,
        districts: stateObj ? stateObj.districts.map(d => ({ name: d.name, subDistrictsCount: d.subDistricts.length })) : []
      };
    }

    // Return all states
    return {
      success: true,
      country: adminData.country,
      states: adminData.states.map(s => ({
        code: s.code,
        name: s.name,
        isSupported: s.isSupported,
        districtCount: s.districts.length
      }))
    };
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
