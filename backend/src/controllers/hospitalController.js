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
   *  - city, state (optional, for location filter)
   *  - search (optional, text search on name/address)
   *  - pmjay (optional, boolean: true/false)
   */
  async getHospitals(req, res) {
    try {
      const hospitals = await hospitalService.searchHospitals(req.query);

      return res.status(200).json({
        success: true,
        count: hospitals.length,
        hospitals
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
        message: 'Server error retrieving hospital details.'
      });
    }
  }
};

module.exports = hospitalController;
