/**
 * Bengaluru Traffic Detective — CSV Ingestion Validator
 * Run with: npx tsx scripts/validate-csv.ts data/incidents-demo.csv
 */
import fs from 'node:fs';
import path from 'node:path';

interface IncidentRow {
  incident_id: string;
  incident_date: string;
  area: string;
  incident_type: string;
  severity: string;
  source_name: string;
  source_url: string;
  latitude?: string;
  longitude?: string;
  road_name?: string;
  description?: string;
  hour?: string;
}

const REQUIRED_COLUMNS = [
  'incident_id',
  'incident_date',
  'area',
  'incident_type',
  'severity',
  'source_name',
  'source_url',
];

const VALID_TYPES = new Set(['crash', 'violation', 'road_issue']);
const VALID_SEVERITIES = new Set(['fatal', 'serious', 'minor', 'unknown']);

export function parseCSV(content: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple regex or split respecting quotes
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const rowObj: Record<string, string> = {};
    headers.forEach((h, index) => {
      rowObj[h] = values[index] || '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

export function validateDataset(filePath: string) {
  console.log(`[CSV Validator] Inspecting file: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File does not exist at ${filePath}`);
    return false;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { headers, rows } = parseCSV(raw);

  console.log(`[CSV Validator] Total rows parsed: ${rows.length}`);
  console.log(`[CSV Validator] Headers found: ${headers.join(', ')}`);

  // Check required headers
  const missingHeaders = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missingHeaders.length > 0) {
    console.error(`FAILED: Missing required columns: ${missingHeaders.join(', ')}`);
    return false;
  }

  const seenIds = new Set<string>();
  let duplicateCount = 0;
  let invalidDateCount = 0;
  let invalidTypeCount = 0;
  let invalidSeverityCount = 0;
  let coordinateOutlierCount = 0;

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;

    // Check duplicate ID
    if (seenIds.has(row.incident_id)) {
      console.warn(`Line ${rowNum}: Duplicate incident_id '${row.incident_id}'`);
      duplicateCount++;
    } else {
      seenIds.add(row.incident_id);
    }

    // Validate ISO date (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.incident_date)) {
      console.warn(`Line ${rowNum}: Invalid date format '${row.incident_date}', expected YYYY-MM-DD`);
      invalidDateCount++;
    }

    // Validate incident_type
    if (!VALID_TYPES.has(row.incident_type.toLowerCase())) {
      console.warn(`Line ${rowNum}: Unrecognized incident_type '${row.incident_type}'`);
      invalidTypeCount++;
    }

    // Validate severity
    if (!VALID_SEVERITIES.has(row.severity.toLowerCase())) {
      console.warn(`Line ${rowNum}: Unrecognized severity '${row.severity}'`);
      invalidSeverityCount++;
    }

    // Coordinates bounding box check (Bengaluru approx: 12.5 - 13.5 N, 77.2 - 78.0 E)
    if (row.latitude && row.longitude) {
      const lat = parseFloat(row.latitude);
      const lng = parseFloat(row.longitude);
      if (isNaN(lat) || isNaN(lng) || lat < 12.5 || lat > 13.5 || lng < 77.2 || lng > 78.0) {
        console.warn(`Line ${rowNum}: Coordinates outside expected Bengaluru bounding box (${lat}, ${lng})`);
        coordinateOutlierCount++;
      }
    }
  });

  const passed =
    duplicateCount === 0 &&
    invalidDateCount === 0 &&
    invalidTypeCount === 0 &&
    invalidSeverityCount === 0 &&
    coordinateOutlierCount === 0;

  if (passed) {
    console.log(`SUCCESS: Dataset validated cleanly with 0 fatal errors. Ready for BigQuery ingestion.`);
  } else {
    console.log(`VALIDATION FINISHED with issues. Duplicates: ${duplicateCount}, Invalid Dates: ${invalidDateCount}, Invalid Types: ${invalidTypeCount}, Outlier coords: ${coordinateOutlierCount}`);
  }

  return passed;
}

// Allow direct CLI invocation
if (process.argv[1]?.includes('validate-csv.ts')) {
  const target = process.argv[2] || path.join(process.cwd(), 'data', 'incidents-demo.csv');
  validateDataset(target);
}
