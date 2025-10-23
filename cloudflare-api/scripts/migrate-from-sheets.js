/**
 * Migration Script: Google Sheets → Cloudflare D1
 * 
 * Usage: node scripts/migrate-from-sheets.js
 */

const GOOGLE_SHEETS_API = 'https://script.google.com/macros/s/AKfycbwH_2Pbdzmh3apj-CtR47yaq7-9cWCEKv-El5IDn1HlaKpNvNPOcppTPXsDeji2On-Cpw/exec';

const CLIENTS = [
  { slug: 'funtrip-tours', name: 'FunTrip Tours in Jamaica', email: 'info@funtriptoursinjamaica.com' },
  { slug: 'kamar-tours', name: 'Kamar Tours Jamaica', email: 'info@kamartoursjamaica.com' }
];

async function fetchToursFromSheets(clientSlug) {
  const url = `${GOOGLE_SHEETS_API}?client=${clientSlug}`;
  console.log(`Fetching tours from Google Sheets for ${clientSlug}...`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.tours || [];
}

function generateInsertSQL(client, tours) {
  let sql = '';
  
  // Insert client
  sql += `-- Insert client: ${client.name}\n`;
  sql += `INSERT INTO clients (slug, name, email, status) VALUES ('${client.slug}', '${client.name}', '${client.email}', 'active');\n\n`;
  
  // Insert tours
  tours.forEach((tour, index) => {
    sql += `-- Tour ${index + 1}: ${tour.name}\n`;
    sql += `INSERT INTO tours (\n`;
    sql += `  client_id,\n`;
    sql += `  slug,\n`;
    sql += `  name,\n`;
    sql += `  excerpt,\n`;
    sql += `  description_html,\n`;
    sql += `  image,\n`;
    sql += `  gallery,\n`;
    sql += `  location,\n`;
    sql += `  type,\n`;
    sql += `  duration,\n`;
    sql += `  duration_minutes,\n`;
    sql += `  from_price,\n`;
    sql += `  highlights,\n`;
    sql += `  itinerary,\n`;
    sql += `  inclusions,\n`;
    sql += `  exclusions,\n`;
    sql += `  faqs,\n`;
    sql += `  tags,\n`;
    sql += `  status\n`;
    sql += `) VALUES (\n`;
    sql += `  (SELECT id FROM clients WHERE slug = '${client.slug}'),\n`;
    sql += `  '${escapeSQL(tour.slug)}',\n`;
    sql += `  '${escapeSQL(tour.name)}',\n`;
    sql += `  '${escapeSQL(tour.excerpt || '')}',\n`;
    sql += `  '${escapeSQL(tour.descriptionHTML || tour.description_html || '')}',\n`;
    sql += `  '${escapeSQL(tour.image || '')}',\n`;
    sql += `  '${escapeSQL(JSON.stringify(ensureArray(tour.gallery)))}',\n`;
    sql += `  '${escapeSQL(tour.location || '')}',\n`;
    sql += `  '${escapeSQL(tour.type || '')}',\n`;
    sql += `  '${escapeSQL(tour.duration || '')}',\n`;
    sql += `  ${parseInt(tour.durationMinutes || tour.duration_minutes || 0)},\n`;
    sql += `  ${parseFloat(tour.fromPrice || tour.from_price || 0)},\n`;
    sql += `  '${escapeSQL(JSON.stringify(ensureArray(tour.highlights)))}',\n`;
    sql += `  '${escapeSQL(JSON.stringify(ensureArray(tour.itinerary)))}',\n`;
    sql += `  '${escapeSQL(JSON.stringify(ensureArray(tour.inclusions)))}',\n`;
    sql += `  '${escapeSQL(JSON.stringify(ensureArray(tour.exclusions)))}',\n`;
    sql += `  '${escapeSQL(JSON.stringify(ensureArray(tour.faqs)))}',\n`;
    sql += `  '${escapeSQL(JSON.stringify(ensureArray(tour.tags)))}',\n`;
    sql += `  'active'\n`;
    sql += `);\n\n`;
  });
  
  return sql;
}

function escapeSQL(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "''");
}

function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(value.replace(/,\s*$/, ''));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function main() {
  console.log('🚀 Starting migration from Google Sheets to Cloudflare D1...\n');
  
  let fullSQL = `-- Migration from Google Sheets to Cloudflare D1
-- Generated: ${new Date().toISOString()}
-- 
-- Usage: 
--   wrangler d1 execute tourism-db --file=migrations/0002_data_import.sql
-- 

`;
  
  for (const client of CLIENTS) {
    try {
      const tours = await fetchToursFromSheets(client.slug);
      console.log(`✅ Fetched ${tours.length} tours for ${client.name}`);
      
      const sql = generateInsertSQL(client, tours);
      fullSQL += sql;
      
    } catch (error) {
      console.error(`❌ Error fetching ${client.slug}:`, error.message);
    }
  }
  
  // Write to file
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join(__dirname, '../migrations/0002_data_import.sql');
  
  fs.writeFileSync(outputPath, fullSQL);
  
  console.log(`\n✅ Migration SQL generated: ${outputPath}`);
  console.log('\nNext steps:');
  console.log('1. Review the generated SQL file');
  console.log('2. Run: wrangler d1 execute tourism-db --file=migrations/0002_data_import.sql');
}

main().catch(console.error);

