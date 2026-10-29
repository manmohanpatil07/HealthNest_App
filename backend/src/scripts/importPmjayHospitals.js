/**
 * Import Maharashtra PM-JAY Hospitals from Official NHA Portal
 *
 * Source: National Health Authority (NHA) — PM-JAY Hospital Search
 * URL: https://hospitals.pmjay.gov.in/Search/empnlWorkFlow.htm
 * State: Maharashtra (State Code: 27)
 *
 * Repeatable, production-ready ingestion pipeline:
 * 1. Queries the official portal to discover total page count dynamically.
 * 2. Fetches all pages with concurrency control and exponential backoff retry.
 * 3. Decodes HTML entities and parses authentic hospital records.
 * 4. Normalizes city / district across all 36 Maharashtra districts.
 * 5. Deduplicates and merges with existing MySQL hospitals without clobbering coordinates.
 * 6. Generates an import audit report JSON.
 */

const https = require('https');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const CONFIG = {
  stateCode: 27, // Maharashtra
  concurrency: 4,
  requestTimeoutMs: 30000,
  maxRetries: 4,
  retryDelayMs: 2000
};

// Official 36 Maharashtra Districts
const MH_DISTRICTS = [
  'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara',
  'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli',
  'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mumbai', 'Mumbai Suburban',
  'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar',
  'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara',
  'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal'
];

const DISTRICT_ALIASES = [
  { regex: /AHMED\s*NAGAR|Ahilyanagar|Ahmadnagar/i, dist: 'Ahmednagar' },
  { regex: /RAIGARH\(MH\)|Raigad/i, dist: 'Raigad' },
  { regex: /Mumbai\s*Suburban/i, dist: 'Mumbai Suburban' },
  { regex: /Kalyan|Dombivli|Navi Mumbai|Thane/i, dist: 'Thane' },
  { regex: /Pune|Pimpri|Chinchwad/i, dist: 'Pune' },
  { regex: /Mumbai/i, dist: 'Mumbai' },
  { regex: /Nagpur/i, dist: 'Nagpur' },
  { regex: /Nashik/i, dist: 'Nashik' },
  { regex: /Chhatrapati\s*Sambhajinagar|Aurangabad/i, dist: 'Aurangabad' },
  { regex: /Dharashiv|Osmanabad/i, dist: 'Osmanabad' },
  { regex: /Solapur/i, dist: 'Solapur' },
  { regex: /Kolhapur/i, dist: 'Kolhapur' },
  { regex: /Satara/i, dist: 'Satara' },
  { regex: /Sangli/i, dist: 'Sangli' },
  { regex: /Amravati/i, dist: 'Amravati' }
];

function decodeEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function toTitleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length === 0) return '';
      if (['sdh', 'rh', 'phc', 'aiims', 'esic', 'gmch', 'mc', 'mch'].includes(word)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function fetchPmjayPage(pageNo, totalPages = 0, retryCount = 0) {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      actionFlag: 'ViewRegisteredHosptlsNew',
      search: 'Y',
      appReadOnly: 'Y',
      pageNo: String(pageNo),
      searchState: String(CONFIG.stateCode),
      searchDistrict: -1,
      searchHospType: -1,
      searchSpeciality: -1,
      noOfPages: String(totalPages)
    });

    const options = {
      hostname: 'hospitals.pmjay.gov.in',
      path: '/Search/empnlWorkFlow.htm',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: CONFIG.requestTimeoutMs
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          const err = new Error(`HTTP ${res.statusCode}`);
          if (retryCount < CONFIG.maxRetries) {
            setTimeout(() => {
              fetchPmjayPage(pageNo, totalPages, retryCount + 1).then(resolve).catch(reject);
            }, CONFIG.retryDelayMs * (retryCount + 1));
          } else {
            reject(err);
          }
        }
      });
    });

    req.on('error', (err) => {
      if (retryCount < CONFIG.maxRetries) {
        setTimeout(() => {
          fetchPmjayPage(pageNo, totalPages, retryCount + 1).then(resolve).catch(reject);
        }, CONFIG.retryDelayMs * (retryCount + 1));
      } else {
        reject(err);
      }
    });

    req.on('timeout', () => {
      req.destroy();
      if (retryCount < CONFIG.maxRetries) {
        setTimeout(() => {
          fetchPmjayPage(pageNo, totalPages, retryCount + 1).then(resolve).catch(reject);
        }, CONFIG.retryDelayMs * (retryCount + 1));
      } else {
        reject(new Error(`Timeout on page ${pageNo}`));
      }
    });

    req.write(postData);
    req.end();
  });
}

function extractTotalPages(html) {
  const match = html.match(/viewNextPages\(\s*\d+\s*,\s*(\d+)\s*,\s*\d+\s*\)/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  const matchHidden = html.match(/name=["']noOfPages["'][^>]*value=["'](\d+)["']/i);
  if (matchHidden && matchHidden[1]) {
    return parseInt(matchHidden[1], 10);
  }
  return 215;
}

function parseHospitalRows(html) {
  const records = [];
  const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/i);
  const searchArea = tbodyMatch ? tbodyMatch[1] : html;

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(searchArea)) !== null) {
    const rowHtml = rowMatch[1];
    if (!rowHtml.includes('<td')) continue;

    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells = [];
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push(cellMatch[1]);
    }

    if (cells.length >= 6) {
      const rawName = decodeEntities(cells[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
      const rawType = decodeEntities(cells[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
      const rawAddress = decodeEntities(cells[3].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
      const rawContact = decodeEntities(cells[5].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

      if (!rawName || rawName.length < 3) continue;

      let hospitalType = 'General';
      if (/public/i.test(rawType)) hospitalType = 'Public';
      else if (/private/i.test(rawType)) hospitalType = 'Private';
      else if (/goi/i.test(rawType)) hospitalType = 'Government of India';

      let city = null;
      const addressParts = rawAddress.split(',').map(s => s.trim()).filter(Boolean);

      // Check district matching on parts backwards
      for (let i = addressParts.length - 1; i >= 0; i--) {
        const part = addressParts[i].toUpperCase();
        if (part === 'MAHARASHTRA' || part === 'INDIA') continue;
        const matchedDist = MH_DISTRICTS.find(d => d.toUpperCase() === part);
        if (matchedDist) {
          city = matchedDist;
          break;
        }
      }

      // Check aliases
      if (!city) {
        for (const alias of DISTRICT_ALIASES) {
          if (alias.regex.test(rawAddress) || alias.regex.test(rawName)) {
            city = alias.dist;
            break;
          }
        }
      }

      // Fallback district search
      if (!city) {
        for (const dist of MH_DISTRICTS) {
          const distRegex = new RegExp(`\\b${dist}\\b`, 'i');
          if (distRegex.test(rawAddress)) {
            city = dist;
            break;
          }
        }
      }

      if (!city) {
        city = 'Maharashtra';
      }

      const pinMatch = rawAddress.match(/\b(4\d{5})\b/);
      const pincode = pinMatch ? pinMatch[1] : null;

      let phone = null;
      const cleanPhone = rawContact.replace(/[^\d+,\s/-]/g, '').trim();
      if (cleanPhone && cleanPhone.length >= 7 && !/^(na|nil|-|0+)$/i.test(rawContact)) {
        const primaryNumber = cleanPhone.split(/[,/\s]+/)[0];
        if (primaryNumber && primaryNumber.length >= 7) {
          phone = primaryNumber.slice(0, 20);
        }
      }

      records.push({
        hospital_name: toTitleCase(rawName),
        hospital_type: hospitalType,
        address: rawAddress,
        city: city,
        state: 'Maharashtra',
        pincode: pincode,
        phone: phone,
        latitude: null,
        longitude: null,
        pmjay_status: 1,
        verified_at: new Date()
      });
    }
  }

  return records;
}

async function parallelMap(items, concurrency, fn) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index++;
      try {
        const res = await fn(items[currentIndex], currentIndex);
        results[currentIndex] = res;
      } catch (err) {
        console.error(`Error processing item ${currentIndex + 1}:`, err.message);
        results[currentIndex] = null;
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function runImport() {
  console.log('=====================================================');
  console.log(' HealthNest — Official Maharashtra PM-JAY Importer   ');
  console.log(' Official Source: hospitals.pmjay.gov.in (NHA)        ');
  console.log('=====================================================');

  try {
    console.log('[1/5] Querying NHA portal for Maharashtra records...');
    const page1Html = await fetchPmjayPage(1);
    const totalPages = extractTotalPages(page1Html);
    console.log(`[1/5] Total pages detected: ${totalPages} (~${totalPages * 10} records expected)`);

    console.log(`[2/5] Fetching pages 1 through ${totalPages} with concurrency ${CONFIG.concurrency}...`);
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

    let completedPages = 0;
    const allHtmlPages = await parallelMap(pageNumbers, CONFIG.concurrency, async (pageNo) => {
      const html = pageNo === 1 ? page1Html : await fetchPmjayPage(pageNo, totalPages);
      completedPages++;
      if (completedPages % 25 === 0 || completedPages === totalPages) {
        console.log(`       Fetched ${completedPages}/${totalPages} pages (${Math.round(completedPages / totalPages * 100)}%)`);
      }
      return html;
    });

    console.log('[3/5] Parsing hospital records...');
    const allRecords = [];
    for (const html of allHtmlPages) {
      if (html) {
        const pageRecords = parseHospitalRows(html);
        allRecords.push(...pageRecords);
      }
    }
    console.log(`[3/5] Total parsed hospital records: ${allRecords.length}`);

    const uniqueRecordsMap = new Map();
    for (const rec of allRecords) {
      const key = `${rec.hospital_name.toLowerCase().trim()}|${rec.city.toLowerCase().trim()}`;
      if (!uniqueRecordsMap.has(key)) {
        uniqueRecordsMap.set(key, rec);
      }
    }
    const deduplicatedRecords = Array.from(uniqueRecordsMap.values());
    console.log(`[3/5] Unique records after in-memory deduplication: ${deduplicatedRecords.length}`);

    console.log('[4/5] Reading existing hospitals from database to prevent overwriting coordinates...');
    const [existingRows] = await pool.query('SELECT hospital_id, hospital_name, city, latitude, longitude FROM hospitals');
    const existingMap = new Map();
    for (const row of existingRows) {
      const key = `${row.hospital_name.toLowerCase().trim()}|${row.city.toLowerCase().trim()}`;
      existingMap.set(key, row);
    }

    let insertedCount = 0;
    let updatedCount = 0;

    for (const record of deduplicatedRecords) {
      const key = `${record.hospital_name.toLowerCase().trim()}|${record.city.toLowerCase().trim()}`;
      const existing = existingMap.get(key);

      if (existing) {
        await pool.query(
          `UPDATE hospitals
           SET pmjay_status = 1,
               verified_at = NOW(),
               hospital_type = COALESCE(?, hospital_type),
               phone = COALESCE(?, phone),
               pincode = COALESCE(?, pincode)
           WHERE hospital_id = ?`,
          [record.hospital_type, record.phone, record.pincode, existing.hospital_id]
        );
        updatedCount++;
      } else {
        await pool.query(
          `INSERT INTO hospitals (
             hospital_name, address, city, state, pincode,
             hospital_type, phone, latitude, longitude,
             pmjay_status, verified_at, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            record.hospital_name,
            record.address,
            record.city,
            record.state,
            record.pincode,
            record.hospital_type,
            record.phone,
            null,
            null,
            1
          ]
        );
        insertedCount++;
      }
    }

    console.log(`[4/5] Ingest complete: Newly Inserted: ${insertedCount}, Updated: ${updatedCount}`);

    console.log('[5/5] Generating District Distribution Audit...');
    const [stats] = await pool.query(
      `SELECT city, COUNT(*) AS count
       FROM hospitals
       WHERE pmjay_status = 1
       GROUP BY city
       ORDER BY count DESC`
    );

    const [totalActive] = await pool.query(
      'SELECT COUNT(*) as total, SUM(CASE WHEN pmjay_status = 1 THEN 1 ELSE 0 END) as pmjay_total FROM hospitals'
    );

    const auditReport = {
      importedAt: new Date().toISOString(),
      officialSource: 'https://hospitals.pmjay.gov.in/Search/empnlWorkFlow.htm',
      state: 'Maharashtra',
      pagesProcessed: totalPages,
      totalParsedRecords: allRecords.length,
      uniqueRecords: deduplicatedRecords.length,
      newlyInserted: insertedCount,
      updatedExisting: updatedCount,
      totalInDatabase: totalActive[0].total,
      totalPmjayVerified: totalActive[0].pmjay_total,
      districtBreakdown: stats
    };

    const auditPath = path.join(__dirname, 'pmjay_import_audit.json');
    fs.writeFileSync(auditPath, JSON.stringify(auditReport, null, 2));
    console.log(`Audit report saved to ${auditPath}`);
    console.log('Import successfully finished!');
  } catch (err) {
    console.error('Import failed with error:', err);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runImport();
}

module.exports = { runImport };
