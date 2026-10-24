const Vaccination = require('../models/Vaccination');

const vaccinationController = {
  /**
   * GET /api/vaccinations
   * Get all vaccination records for authenticated user
   */
  async getVaccinations(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const vaccinations = await Vaccination.findByUserId(userId);
      const upcoming = await Vaccination.findUpcomingByUserId(userId);

      return res.status(200).json({
        success: true,
        vaccinations,
        upcoming,
        count: vaccinations.length
      });
    } catch (error) {
      console.error('[vaccinationController.getVaccinations] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve vaccination records.'
      });
    }
  },

  /**
   * POST /api/vaccinations
   * Add a new vaccination record
   */
  async createVaccination(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const { vaccine_name, vaccination_date, next_due_date, notes } = req.body;

      if (!vaccine_name || !vaccine_name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Vaccine Name is required.'
        });
      }

      if (!vaccination_date || !vaccination_date.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Vaccination Date is required.'
        });
      }

      // Validate date formats
      const vDate = new Date(vaccination_date.trim());
      if (isNaN(vDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Vaccination Date must be a valid date (YYYY-MM-DD).'
        });
      }

      let cleanNextDueDate = null;
      if (next_due_date && next_due_date.trim()) {
        const nDate = new Date(next_due_date.trim());
        if (isNaN(nDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Next Due Date must be a valid date (YYYY-MM-DD).'
          });
        }
        cleanNextDueDate = next_due_date.trim();
      }

      const vaccinationId = await Vaccination.create({
        user_id: userId,
        vaccine_name: vaccine_name.trim(),
        vaccination_date: vaccination_date.trim(),
        next_due_date: cleanNextDueDate,
        notes: notes && notes.trim() ? notes.trim() : null
      });

      const newRecord = await Vaccination.findById(vaccinationId);

      return res.status(201).json({
        success: true,
        message: 'Vaccination record added!',
        vaccination: newRecord
      });
    } catch (error) {
      console.error('[vaccinationController.createVaccination] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to add vaccination record.'
      });
    }
  },

  /**
   * DELETE /api/vaccinations/:id
   * Delete vaccination record with ownership protection
   */
  async deleteVaccination(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const vaccinationId = parseInt(req.params.id, 10);

      if (!vaccinationId || isNaN(vaccinationId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vaccination ID.'
        });
      }

      const record = await Vaccination.findById(vaccinationId);
      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Vaccination record not found.'
        });
      }

      if (record.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You cannot delete another user\'s vaccination record.'
        });
      }

      const deleted = await Vaccination.deleteByIdAndUser(vaccinationId, userId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Vaccination record not found or already deleted.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Vaccination record deleted successfully.'
      });
    } catch (error) {
      console.error('[vaccinationController.deleteVaccination] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete vaccination record.'
      });
    }
  }
};

module.exports = vaccinationController;
