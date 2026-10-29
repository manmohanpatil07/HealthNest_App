const { pool } = require('../src/config/database');

async function runMigration() {
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM hospitals LIKE 'district'");
    if (cols.length === 0) {
      console.log('Adding district column...');
      await pool.query('ALTER TABLE hospitals ADD COLUMN district VARCHAR(100) NULL AFTER city');
    } else {
      console.log('district column already exists.');
    }

    const [subCols] = await pool.query("SHOW COLUMNS FROM hospitals LIKE 'sub_district'");
    if (subCols.length === 0) {
      console.log('Adding sub_district column...');
      await pool.query('ALTER TABLE hospitals ADD COLUMN sub_district VARCHAR(100) NULL AFTER district');
    } else {
      console.log('sub_district column already exists.');
    }

    console.log('Columns verified. Running administrative backfill...');
    const { ADMINISTRATIVE_DIVISIONS } = require('../src/data/administrativeDivisions');
    const mhState = ADMINISTRATIVE_DIVISIONS.states.find(s => s.code === 'MH');

    // 1. Map known districts
    for (const dist of mhState.districts) {
      // Set district where city matches district name or any alias
      await pool.query('UPDATE hospitals SET district = ? WHERE LOWER(city) = LOWER(?)', [dist.name, dist.name]);
      for (const alias of dist.aliases) {
        await pool.query('UPDATE hospitals SET district = ? WHERE LOWER(city) = LOWER(?)', [dist.name, alias]);
      }
    }

    // 2. Map sub-districts / talukas where explicitly mentioned in address
    // Requirements: "Do not infer a hospital's district or sub-district from its name. Use normalized administrative values from genuine hospital records. Preserve records whose administrative location is unavailable; report them as incomplete rather than assigning guessed values."
    let mappedTalukas = 0;
    const [allHospitals] = await pool.query('SELECT hospital_id, address, district FROM hospitals');

    for (const h of allHospitals) {
      if (!h.address) continue;
      const targetDist = mhState.districts.find(d => d.name.toLowerCase() === (h.district || '').toLowerCase());
      if (!targetDist) continue;

      // Look for authentic taluka mention in the address string
      for (const sub of targetDist.subDistricts) {
        // e.g. "Taluka Sangamner", "Tq-Dharni", "tq kalyan", "Tehsil Haveli", or ", Udgir,"
        const patterns = [
          new RegExp(`\\b(Taluka|Tal|Tq|Tehsil)[\\s:-]+${sub}\\b`, 'i'),
          new RegExp(`\\b${sub}[\\s:-]+(Taluka|Tal|Tq|Tehsil)\\b`, 'i'),
          new RegExp(`\\b${sub}\\b`, 'i')
        ];

        let matched = false;
        // Don't match subdistrict if it's identical to the district name unless preceded by taluka/tq
        if (sub.toLowerCase() === targetDist.name.toLowerCase()) {
          if (new RegExp(`\\b(Taluka|Tal|Tq|Tehsil)[\\s:-]+${sub}\\b`, 'i').test(h.address) ||
              new RegExp(`\\b${sub}[\\s:-]+(Taluka|Tal|Tq|Tehsil)\\b`, 'i').test(h.address)) {
            matched = true;
          }
        } else {
          for (const p of patterns) {
            if (p.test(h.address)) {
              matched = true;
              break;
            }
          }
        }

        if (matched) {
          await pool.query('UPDATE hospitals SET sub_district = ? WHERE hospital_id = ?', [sub, h.hospital_id]);
          mappedTalukas++;
          break;
        }
      }
    }

    const [stats] = await pool.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN district IS NOT NULL THEN 1 ELSE 0 END) as with_district,
        SUM(CASE WHEN sub_district IS NOT NULL THEN 1 ELSE 0 END) as with_sub_district
      FROM hospitals
    `);

    console.log('Migration & Backfill Summary:', stats[0]);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

runMigration();

