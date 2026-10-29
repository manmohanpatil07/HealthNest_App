const hospitalService = require('../services/hospitalService');

/**
 * Hospital Controller - Module 3: Hospital Finder
 */
const hospitalController = {
  /**
   * GET /api/hospitals
   * Query params:
   *  - latitude, longitude (optional, for proximity search)
   *  - radius (optional, in km, defaults to 50)
   *  - state, district, sub_district, city (optional, administrative location filters)
   *  - search (optional, text search on name/address)
   *  - pmjay (optional, boolean: true/false)
   *  - page (optional, defaults to 1)
   *  - limit (optional, defaults to 20)
   */
  async getHospitals(req, res) {
    try {
      const result = await hospitalService.searchHospitals(req.query);

      return res.status(200).json({
        success: true,
        count: result.hospitals.length,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hospitals: result.hospitals
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      console.error('[hospitalController.getHospitals] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error retrieving hospitals. Please try again later.'
      });
    }
  },

  /**
   * GET /api/hospitals/locations
   * Query params:
   *  - state (optional, state code or name)
   *  - district (optional, district name)
   * Returns cascading administrative choices (Country -> States -> Districts -> Sub-districts)
   */
  getLocations(req, res) {
    try {
      const { state, district } = req.query;
      const data = hospitalService.getLocations(state, district);
      return res.status(200).json(data);
    } catch (error) {
      console.error('[hospitalController.getLocations] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error retrieving administrative locations.'
      });
    }
  },

  /**
   * GET /api/hospitals/:id
   * Get single hospital by hospital_id
   */
  async getHospitalById(req, res) {
    try {
      const { id } = req.params;
      const hospital = await hospitalService.getHospitalById(id);

      return res.status(200).json({
        success: true,
        hospital
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      console.error('[hospitalController.getHospitalById] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error retrieving hospital details. Please try again later.'
      });
    }
  }
};

module.exports = hospitalController;
