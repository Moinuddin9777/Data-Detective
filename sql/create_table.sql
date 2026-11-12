-- ============================================================================
-- Bengaluru Traffic Detective — Canonical BigQuery DDL
-- Target: `PROJECT_ID.bengaluru_mobility.incidents`
-- Replace `PROJECT_ID` with your real Google Cloud Project ID before executing.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS `PROJECT_ID.bengaluru_mobility`
OPTIONS (
  location = 'US',
  description = 'Bengaluru road safety and urban mobility incident repository'
);

CREATE TABLE IF NOT EXISTS `PROJECT_ID.bengaluru_mobility.incidents` (
  incident_id STRING NOT NULL OPTIONS(description="Unique deterministic incident identifier"),
  incident_date DATE NOT NULL OPTIONS(description="Calendar date of the recorded incident (YYYY-MM-DD)"),
  area STRING NOT NULL OPTIONS(description="Standardized Bengaluru junction, locality, or corridor name"),
  incident_type STRING NOT NULL OPTIONS(description="Classification: crash, violation, road_issue"),
  severity STRING NOT NULL OPTIONS(description="Severity grade: fatal, serious, minor, unknown"),
  source_name STRING NOT NULL OPTIONS(description="Originating dataset title or agency"),
  source_url STRING NOT NULL OPTIONS(description="Canonical documentation or download URL"),
  latitude FLOAT64 OPTIONS(description="WGS84 latitude coordinate (approx 12.7 to 13.3 for Bengaluru)"),
  longitude FLOAT64 OPTIONS(description="WGS84 longitude coordinate (approx 77.4 to 77.8 for Bengaluru)"),
  road_name STRING OPTIONS(description="Specific arterial, ring road, or junction name"),
  description STRING OPTIONS(description="Brief event description or police summary"),
  hour INT64 OPTIONS(description="Optional 24-hour timestamp (0-23) if recorded in source")
)
PARTITION BY incident_date
CLUSTER BY area, incident_type, severity
OPTIONS (
  description = "Bengaluru mobility incidents partitioned by date and clustered by area"
);
