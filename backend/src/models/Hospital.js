const { pool } = require('../config/database');
const { ADMINISTRATIVE_DIVISIONS } = require('../data/administrativeDivisions');

/**
 * Hospital model - Module 3: Hospital Finder
 * Implements parameterized queries for listing, administrative location filtering
 * (state, district, sub_district, city), proximity search, text search, PM-JAY filtering,
 * and LIMIT/OFFSET pagination.
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
        district,
        sub_district,
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
   * Search hospitals with dynamic filters and pagination:
   * - Proximity search with Haversine formula (when latitude & longitude provided)
   * - Administrative filters: state, district, sub_district, city
   * - Text query search across hospital_name and address
   * - PM-JAY status filter
   * - Search radius limit in km (default 50km for geo search)
   * - Pagination (page, limit)
   */
  async search({
    latitude = null,
    longitude = null,
    radiusKm = 50,
    city = null,
    district = null,
    subDistrict = null,
    state = null,
    search = null,
    pmjay = null,
    page = 1,
    limit = 20
  }) {
    const hasCoordinates =
      latitude !== null &&
      longitude !== null &&
      !isNaN(latitude) &&
      !isNaN(longitude);

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (safePage - 1) * safeLimit;

    if (hasCoordinates) {
      const userLat = parseFloat(latitude);
      const userLng = parseFloat(longitude);
      const maxRadius = parseFloat(radiusKm) || 50;

      let whereClause = 'WHERE latitude IS NOT NULL AND longitude IS NOT NULL';
      const baseParams = [];

      if (pmjay !== null) {
        whereClause += ' AND pmjay_status = ?';
        baseParams.push(pmjay ? 1 : 0);
      }

      if (state && state.trim()) {
        whereClause += ' AND LOWER(state) = LOWER(?)';
        baseParams.push(state.trim());
      }

      if (district && district.trim()) {
        whereClause += ' AND (LOWER(district) = LOWER(?) OR LOWER(city) = LOWER(?))';
        baseParams.push(district.trim(), district.trim());
      } else if (city && city.trim()) {
        whereClause += ' AND LOWER(city) = LOWER(?)';
        baseParams.push(city.trim());
      }

      if (subDistrict && subDistrict.trim()) {
        whereClause += ' AND (LOWER(sub_district) = LOWER(?) OR LOWER(address) LIKE LOWER(?))';
        baseParams.push(subDistrict.trim(), `%${subDistrict.trim()}%`);
      }

      if (search && search.trim()) {
        whereClause += ' AND (LOWER(hospital_name) LIKE LOWER(?) OR LOWER(address) LIKE LOWER(?) OR LOWER(city) LIKE LOWER(?) OR LOWER(district) LIKE LOWER(?))';
        const searchPattern = `%${search.trim()}%`;
        baseParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      const sql = `
        SELECT
          hospital_id,
          hospital_name,
          address,
          city,
          district,
          sub_district,
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
        ${whereClause}
        HAVING distance_km <= ?
        ORDER BY distance_km ASC
        LIMIT ? OFFSET ?
      `;

      const queryParams = [userLat, userLng, userLat, ...baseParams, maxRadius, safeLimit, offset];
      const [rows] = await pool.query(sql, queryParams);

      const countSql = `
        SELECT COUNT(*) as total FROM (
          SELECT
            hospital_id,
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
          ${whereClause}
          HAVING distance_km <= ?
        ) AS sub
      `;
      const [countRows] = await pool.query(countSql, [userLat, userLng, userLat, ...baseParams, maxRadius]);
      const total = countRows[0] ? countRows[0].total : rows.length;

      return {
        hospitals: rows,
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit)
      };
    } else {
      // Manual / administrative search without coordinates
      let whereClause = 'WHERE 1 = 1';
      const baseParams = [];

      if (pmjay !== null) {
        whereClause += ' AND pmjay_status = ?';
        baseParams.push(pmjay ? 1 : 0);
      }

      if (state && state.trim()) {
        whereClause += ' AND LOWER(state) = LOWER(?)';
        baseParams.push(state.trim());
      }

      if (district && district.trim()) {
        whereClause += ' AND (LOWER(district) = LOWER(?) OR LOWER(city) = LOWER(?))';
        baseParams.push(district.trim(), district.trim());
      } else if (city && city.trim()) {
        whereClause += ' AND LOWER(city) = LOWER(?)';
        baseParams.push(city.trim());
      }

      if (subDistrict && subDistrict.trim()) {
        whereClause += ' AND (LOWER(sub_district) = LOWER(?) OR LOWER(address) LIKE LOWER(?))';
        baseParams.push(subDistrict.trim(), `%${subDistrict.trim()}%`);
      }

      if (search && search.trim()) {
        whereClause += ' AND (LOWER(hospital_name) LIKE LOWER(?) OR LOWER(address) LIKE LOWER(?) OR LOWER(city) LIKE LOWER(?) OR LOWER(district) LIKE LOWER(?))';
        const searchPattern = `%${search.trim()}%`;
        baseParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      const sql = `
        SELECT
          hospital_id,
          hospital_name,
          address,
          city,
          district,
          sub_district,
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
        ${whereClause}
        ORDER BY hospital_name ASC
        LIMIT ? OFFSET ?
      `;

      const [rows] = await pool.query(sql, [...baseParams, safeLimit, offset]);

      const countSql = `SELECT COUNT(*) as total FROM hospitals ${whereClause}`;
      const [countRows] = await pool.query(countSql, baseParams);
      const total = countRows[0] ? countRows[0].total : rows.length;

      return {
        hospitals: rows,
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit)
      };
    }
  },

  /**
   * Get administrative locations hierarchy (States, Districts, Sub-districts)
   */
  getAdministrativeLocations() {
    return ADMINISTRATIVE_DIVISIONS;
  }
};

module.exports = Hospital;
