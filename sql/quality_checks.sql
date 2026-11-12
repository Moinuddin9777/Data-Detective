-- ============================================================================
-- Bengaluru Traffic Detective — Data Quality & Integrity Audits
-- Replace `PROJECT_ID` with your real Google Cloud Project ID before executing.
-- ============================================================================

-- 1. Total row count and operational date span
SELECT
  COUNT(*) AS total_rows,
  MIN(incident_date) AS earliest_date,
  MAX(incident_date) AS latest_date,
  COUNT(DISTINCT area) AS unique_areas
FROM `PROJECT_ID.bengaluru_mobility.incidents`;

-- 2. Null coverage check across required and optional columns
SELECT
  COUNTIF(incident_id IS NULL) AS null_incident_ids,
  COUNTIF(incident_date IS NULL) AS null_dates,
  COUNTIF(area IS NULL) AS null_areas,
  COUNTIF(incident_type IS NULL) AS null_types,
  COUNTIF(severity IS NULL) AS null_severities,
  COUNTIF(latitude IS NULL) AS missing_latitudes,
  COUNTIF(longitude IS NULL) AS missing_longitudes,
  COUNTIF(hour IS NULL) AS missing_hours
FROM `PROJECT_ID.bengaluru_mobility.incidents`;

-- 3. Duplicate ID audit (should return zero rows if clean)
SELECT
  incident_id,
  COUNT(*) AS occurrences
FROM `PROJECT_ID.bengaluru_mobility.incidents`
GROUP BY incident_id
HAVING COUNT(*) > 1;

-- 4. Incident type and severity distribution breakdown
SELECT
  incident_type,
  severity,
  COUNT(*) AS incident_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 2) AS percentage
FROM `PROJECT_ID.bengaluru_mobility.incidents`
GROUP BY incident_type, severity
ORDER BY incident_type, incident_count DESC;

-- 5. Outlier geographic coordinate check (Bengaluru metropolitan bounding box)
SELECT
  incident_id,
  area,
  latitude,
  longitude
FROM `PROJECT_ID.bengaluru_mobility.incidents`
WHERE latitude IS NOT NULL
  AND (latitude < 12.5 OR latitude > 13.5 OR longitude < 77.2 OR longitude > 78.0);
