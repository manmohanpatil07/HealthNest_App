const { pool } = require('../config/database');

/**
 * Hospital model - Module 3: Hospital Finder
 * Implements parameterized queries for listing, city/state filtering,
 * Haversine proximity distance calculation, and single hospital retrieval.
 */
const Hospital = {
  /**
   * Find a hospital by its primary key ID
   * @param {number} hospitalId
   * @returns {Promise<Object|null>}
   */
  async findById(hospitalId) {
    const [rows] = await pool.execute(
      `SELECT
        hospital_id,
        hospital_name,
        address,
        city,
        state,
        pincode,
        hospital_type,
        phone,
        latitude,
        longitude,
        pmjay_status,
        verified_at,
        created_at
      FROM hospitals
      WHERE hospital_id = ?
      LIMIT 1`,
      [hospitalId]
    );
    return rows[0] || null;
  },

  /**
   * Search hospitals with dynamic filters:
   * - Proximity search with Haversine formula (when latitude & longitude provided)
   * - City / State filter
   * - Text query search across hospital_name and address
   * - PM-JAY status filter
   * - Search radius limit in km (default 50km for geo search)
   */
  async search({
    latitude = null,
    longitude = null,
    radiusKm = 50,
    city = null,
    state = null,
    search = null,
    pmjay = null
  }) {
    const hasCoordinates =
      latitude !== null &&
      longitude !== null &&
      !isNaN(latitude) &&
      !isNaN(longitude);

    let sql = '';
    const params = [];

    if (hasCoordinates) {
      const userLat = parseFloat(latitude);
      const userLng = parseFloat(longitude);
      const maxRadius = parseFloat(radiusKm) || 50;

      // Haversine formula distance calculation in Kilometers (Earth radius ~ 6371 km)
      sql = `
        SELECT
          hospital_id,
          hospital_name,
          address,
          city,
          state,
          pincode,
          hospital_type,
          phone,
          latitude,
          longitude,
          pmjay_status,
          verified_at,
          created_at,
          ROUND(
            6371 * ACOS(
              LEAST(1.0, GREATEST(-1.0,
                COS(RADIANS(?))
                * COS(RADIANS(latitude))
                * COS(RADIANS(longitude) - RADIANS(?))
                + SIN(RADIANS(?))
                * SIN(RADIANS(latitude))
              ))
            ),
            1
          ) AS distance_km
        FROM hospitals
        WHERE latitude IS NOT NULL
          AND longitude IS NOT NULL
      `;
      params.push(userLat, userLng, userLat);

      if (pmjay !== null) {
        sql += ' AND pmjay_status = ?';
        params.push(pmjay ? 1 : 0);
      }

      if (city && city.trim()) {
        sql += ' AND LOWER(city) = LOWER(?)';
        params.push(city.trim());
      }

      if (state && state.trim()) {
        sql += ' AND LOWER(state) = LOWER(?)';
        params.push(state.trim());
      }

      if (search && search.trim()) {
        sql += ' AND (LOWER(hospital_name) LIKE LOWER(?) OR LOWER(address) LIKE LOWER(?) OR LOWER(city) LIKE LOWER(?))';
        const searchPattern = `%${search.trim()}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      sql += ' HAVING distance_km <= ?';
      params.push(maxRadius);

      sql += ' ORDER BY distance_km ASC';
    } else {
      // Standard search without coordinates
      sql = `
        SELECT
          hospital_id,
          hospital_name,
          address,
          city,
          state,
          pincode,
          hospital_type,
          phone,
          latitude,
          longitude,
          pmjay_status,
          verified_at,
          created_at,
          NULL AS distance_km
        FROM hospitals
        WHERE 1 = 1
      `;

      if (pmjay !== null) {
        sql += ' AND pmjay_status = ?';
        params.push(pmjay ? 1 : 0);
      }

      if (city && city.trim()) {
        sql += ' AND LOWER(city) = LOWER(?)';
        params.push(city.trim());
      }

      if (state && state.trim()) {
        sql += ' AND LOWER(state) = LOWER(?)';
        params.push(state.trim());
      }

      if (search && search.trim()) {
        sql += ' AND (LOWER(hospital_name) LIKE LOWER(?) OR LOWER(address) LIKE LOWER(?) OR LOWER(city) LIKE LOWER(?))';
        const searchPattern = `%${search.trim()}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      sql += ' ORDER BY hospital_name ASC';
    }

    const [rows] = await pool.execute(sql, params);
    return rows;
  }
};

module.exports = Hospital;
