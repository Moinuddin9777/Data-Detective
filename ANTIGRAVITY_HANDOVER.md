# Bengaluru Traffic Detective — Antigravity Handover & Deployment Playbook

This master deployment and configuration playbook contains all project details, GCP identifiers, database schemas, environment variables, and authentication instructions for handoff to Antigravity.

---

## 1. Project Overview & Architecture

- **App Name:** Bengaluru Traffic Detective
- **Description:** Interactive civic mobility and road safety analytics platform powered by Google BigQuery, Google Gemini Flash, and a React + Vite + Express TypeScript stack.
- **Frontend Stack:** React, Tailwind CSS, Recharts, Motion (Framer Motion), Lucide Icons.
- **Backend Stack:** Node.js, Express, `@google-cloud/bigquery`, `@google/genai`.
- **Primary Runtime:** Vite SPA served via Express static middleware with API proxy routes (`/api/*`).

---

## 2. Google Cloud & BigQuery Configuration

- **Target Google Cloud Project ID:** `datadetective-514513`
- **Host Cloud Run Project ID:** `494035511791`
- **BigQuery Dataset ID:** `bengaluru_mobility`
- **BigQuery Table ID:** `incidents`
- **BigQuery Region / Location:** `US`
- **BigQuery Quota Protection:** `maximumBytesBilled: '100000000'` (100 MB per query guardrail)

### BigQuery Table Schema (`bengaluru_mobility.incidents`)
- `incident_id` (STRING, REQUIRED)
- `incident_date` (DATE, REQUIRED — Partitioning Field)
- `area` (STRING, REQUIRED — Clustered Field)
- `incident_type` (STRING, REQUIRED — Clustered Field: `crash`, `violation`, `road_issue`)
- `severity` (STRING, REQUIRED — Clustered Field: `fatal`, `serious`, `minor`, `unknown`)
- `source_name` (STRING, REQUIRED)
- `source_url` (STRING, REQUIRED)
- `latitude` (FLOAT64, NULLABLE)
- `longitude` (FLOAT64, NULLABLE)
- `road_name` (STRING, NULLABLE)
- `description` (STRING, NULLABLE)
- `hour` (INT64, NULLABLE)

---

## 3. Environment Variables (`.env` / Secrets)

```env
# ==============================================================================
# Bengaluru Traffic Detective — Environment Configuration
# ==============================================================================

# DATA_MODE: 'demo' (deterministic synthetic records) or 'bigquery' (live GCP queries)
DATA_MODE="bigquery"

# GOOGLE_CLOUD_PROJECT: Target Google Cloud Project ID
GOOGLE_CLOUD_PROJECT="datadetective-514513"

# BIGQUERY_DATASET: Canonical dataset name
BIGQUERY_DATASET="bengaluru_mobility"

# BIGQUERY_TABLE: Canonical partitioned table name
BIGQUERY_TABLE="incidents"

# BIGQUERY_LOCATION: BigQuery dataset region
BIGQUERY_LOCATION="US"

# GEMINI_API_KEY: Required for Gemini AI interpretations
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# GEMINI_MODEL: Free-tier eligible Flash model ID
GEMINI_MODEL="gemini-2.5-flash"

# BIGQUERY_SERVICE_ACCOUNT_JSON: Optional service account JSON key for hosted preview
# BIGQUERY_SERVICE_ACCOUNT_JSON="{...}"
```

---

## 4. Local Development & Deployment Runbook

### Route A: Local Workstation with ADC (Recommended for Full Live BigQuery Access)
1. Authenticate with Google Cloud CLI:
   ```bash
   gcloud auth login
   gcloud config set project datadetective-514513
   gcloud auth application-default login
   ```
2. Install dependencies and run development server:
   ```bash
   npm install
   npm run dev
   ```

### Route B: Production Build & Deployment
1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Start the production Node.js server:
   ```bash
   node server.ts
   ```
   *(Or configure `"start": "node server.ts"` in `package.json`)*

---

## 5. Verification Endpoints

- **Health Check:** `GET /api/health`
- **Overview Metrics:** `GET /api/overview`
- **Hotspots Analysis:** `GET /api/hotspots?type=all&limit=12`
- **Investigation Execution:** `POST /api/investigate` (payload: `{ investigationId, filters, question }`)
- **Connection Test:** `POST /api/test-bigquery`
- **Table Provisioning:** `POST /api/provision-bigquery`
