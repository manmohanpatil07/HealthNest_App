const fs = require('fs');
const html = fs.readFileSync('backend/sample-page1.html', 'utf8');

const match = html.match(/openHospitalBasicDtls\('([^']+)'\)/);
console.log('Sample hospital id in link:', match ? match[1] : 'None');

const linkIdx = html.indexOf('openHospitalBasicDtls');
if (linkIdx !== -1) {
  console.log('Context of link:');
  console.log(html.substring(linkIdx - 50, linkIdx + 200));
}

// Search for openHospitalBasicDtls definition
const fnIdx = html.indexOf('function openHospitalBasicDtls');
if (fnIdx !== -1) {
  console.log('fn def:');
  console.log(html.substring(fnIdx, fnIdx + 400));
}

