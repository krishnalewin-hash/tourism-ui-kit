/**
 * Migration script: Google Sheets → Cloudflare D1
 * 
 * This script:
 * 1. Fetches data from Google Sheets API
 * 2. Generates SQL INSERT statements
 * 3. Outputs to migration.sql file
 * 
 * Usage:
 *   node scripts/migrate-from-sheets.js
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const GOOGLE_SHEETS_API = 'https://script.google.com/macros/s/AKfycbwH_2Pbdzmh3apj-CtR47yaq7-9cWCEKv-El5IDn1HlaKpNvNPOcppTPXsDeji2On-Cpw/exec';

const CLIENTS = [
  { name: 'kamar-tours', displayName: 'Kamar Tours Jamaica' },
  { name: 'funtrip-tours', displayName: 'FunTrip Tours Jamaica' },
];

/**
 * Escape SQL strings
 */
function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  if (typeof str === 'number') return str;
  return `'${String(str).replace(/'/g, "''")}'`;
}

/**
 * Convert array to JSON string for DB storage
 */
function arrayToJson(arr) {
  if (!arr || !Array.isArray(arr)) return 'NULL';
  return escapeSql(JSON.stringify(arr));
}

/**
 * Fetch tours from Google Sheets for a client
 */
async function fetchToursFromSheets(clientName) {
  const url = `${GOOGLE_SHEETS_API}?client=${clientName}`;
  console.log(`Fetching tours for ${clientName}...`);
  
  try {
    const response = await fetch(url, { follow: 20 });
    const data = await response.json();
    
    if (!data.tours || !Array.isArray(data.tours)) {
      console.error(`No tours found for ${clientName}`);
      return [];
    }
    
    console.log(`✓ Found ${data.tours.length} tours for ${clientName}`);
    return data.tours;
  } catch (error) {
    console.error(`Error fetching tours for ${clientName}:`, error.message);
    return [];
  }
}

/**
 * Generate SQL for a tour
 */
function generateTourSql(tour, clientId) {
  const values = [
    clientId,
    escapeSql(tour.slug),
    escapeSql(tour.name),
    escapeSql(tour.excerpt),
    escapeSql(tour.descriptionHTML || tour.description_html),
    escapeSql(tour.image),
    arrayToJson(tour.gallery),
    escapeSql(tour.location),
    escapeSql(tour.type),
    escapeSql(tour.duration),
    tour.durationMinutes || tour.duration_minutes || 'NULL',
    escapeSql(tour.pricingType || tour.pricing_type),
    tour.fromPrice || tour.from_price || 'NULL',
    arrayToJson(tour.highlights),
    arrayToJson(tour.itinerary),
    arrayToJson(tour.inclusions),
    arrayToJson(tour.exclusions),
    arrayToJson(tour.faqs),
    arrayToJson(tour.tags),
  ].join(', ');

  return `INSERT INTO tours (client_id, slug, name, excerpt, description_html, image, gallery, location, type, duration, duration_minutes, pricing_type, from_price, highlights, itinerary, inclusions, exclusions, faqs, tags) VALUES (${values});`;
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 Starting migration from Google Sheets to D1...\n');

  let sql = '-- Migration from Google Sheets to Cloudflare D1\n';
  sql += `-- Generated: ${new Date().toISOString()}\n\n`;

  // Insert clients
  sql += '-- Insert clients\n';
  CLIENTS.forEach((client, index) => {
    const clientId = index + 1;
    sql += `INSERT INTO clients (id, name, status) VALUES (${clientId}, ${escapeSql(client.name)}, 'active');\n`;
  });
  sql += '\n';

  // Fetch and insert tours for each client
  for (let i = 0; i < CLIENTS.length; i++) {
    const client = CLIENTS[i];
    const clientId = i + 1;
    
    sql += `-- Tours for ${client.displayName}\n`;
    
    const tours = await fetchToursFromSheets(client.name);
    
    if (tours.length === 0) {
      sql += `-- No tours found for ${client.name}\n`;
    } else {
      tours.forEach(tour => {
        sql += generateTourSql(tour, clientId) + '\n';
      });
    }
    
    sql += '\n';
  }

  // Write to file
  const outputPath = path.join(__dirname, '..', 'migrations', '0002_seed_data.sql');
  fs.writeFileSync(outputPath, sql, 'utf8');
  
  console.log(`\n✅ Migration SQL generated: ${outputPath}`);
  console.log('\nNext steps:');
  console.log('1. Run: wrangler d1 execute tourism-db-staging --file=migrations/0002_seed_data.sql');
  console.log('2. Test the staging API');
  console.log('3. Run: wrangler d1 execute tourism-db-production --file=migrations/0002_seed_data.sql');
}

migrate().catch(console.error);

