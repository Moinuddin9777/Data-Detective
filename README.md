# Bengaluru Traffic Detective 🚦🔍
> **“Find the patterns behind the traffic.”**
> Built for the Bengaluru *Build with AI* Workshop (90-Minute Hands-on Data Investigation).

---

## 🌟 Overview

**Bengaluru Traffic Detective** is an evidence-backed civic data investigation application. It moves beyond generic chat interfaces and traffic heatmaps to deliver an emotional AHA moment: uncovering patterns in local road safety and urban mobility data.

- **Question → BigQuery Evidence → AI Insight → Action**
- Real Google BigQuery standard SQL integration (parameterized, max bytes billed protection).
- Server-side Gemini Flash model for evidence-grounded interpretation (strictly using verified query aggregates; no hallucinated numbers).
- Deterministic **Synthetic Demo Mode** for immediate offline/workshop reliability when attendees have not yet configured cloud credentials.
- Geocoded Bengaluru hotspot map (WGS84 projection of major nodes like Silk Board, Goraguntepalya, KR Puram, Hebbal, Marathahalli).
- Transparency console with complete DDL, data manifest, and CSV export.

---

## ⚙️ Architecture & Data Contract

### Canonical Table: `PROJECT_ID.bengaluru_mobility.incidents`

| Column | Type | Description |
|---|---|---|
| `incident_id` | STRING NOT NULL | Unique deterministic incident identifier |
| `incident_date`| DATE NOT NULL | Date of recorded incident (YYYY-MM-DD) |
| `area` | STRING NOT NULL | Bengaluru locality / junction (Silk Board, Hebbal, etc.) |
| `incident_type`| STRING NOT NULL | `crash`, `violation`, or `road_issue` |
| `severity` | STRING NOT NULL | `fatal`, `serious`, `minor`, or `unknown` |
| `source_name` | STRING NOT NULL | Data archive or agency title (e.g. OpenCity) |
| `source_url` | STRING NOT NULL | Canonical documentation URL |
| `latitude` | FLOAT64 | WGS84 latitude coordinate |
| `longitude` | FLOAT64 | WGS84 longitude coordinate |
| `road_name` | STRING | Arterial road or flyover corridor |
| `description` | STRING | Brief incident summary |
| `hour` | INT64 | 24-hour timestamp (0–23) if available |

---

## 🚀 Getting Started

### Mode 1: Synthetic Demo Mode (Default, Zero-Setup)
The app starts out-of-the-box in `SYNTHETIC DEMO` mode.
It loads deterministic records from `data/incidents-demo.csv`, enabling:
- Real-time SQL simulation
- Interactive charts and maps
- Gemini AI interpretation
- Complete CSV export

---

### Mode 2: Live BigQuery Connection

#### Route A — Recommended: Run Exported App Locally with Google ADC
1. Download the app repository or ZIP.
2. Log in with Google Cloud CLI:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   gcloud auth application-default login
   ```
3. Grant your account `roles/bigquery.jobUser` on the project and `roles/bigquery.dataViewer` on the dataset.
4. Set environment variables in `.env`:
   ```dotenv
   DATA_MODE=bigquery
   GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID
   BIGQUERY_DATASET=bengaluru_mobility
   BIGQUERY_TABLE=incidents
   BIGQUERY_LOCATION=US
   GEMINI_API_KEY=YOUR_FREE_GEMINI_KEY
   GEMINI_MODEL=gemini-2.5-flash
   ```
5. Run:
   ```bash
   npm install
   npm run dev
   ```
6. Open http://localhost:3000, go to **Setup**, and click **Test BigQuery Connection**.

#### Route B — Hosted AI Studio Build Preview
1. BigQuery does **not** authenticate with a Gemini API key.
2. In Google AI Studio, open **Settings > Secrets**.
3. If permitted by your organization, add `BIGQUERY_SERVICE_ACCOUNT_JSON` containing a narrowly-scoped service account key with only `roles/bigquery.jobUser` and `roles/bigquery.dataViewer`.
4. If service account keys are restricted, use **Synthetic Demo Mode** in the preview.

---

## 🛡️ Free-Tier & Cost Safeguards

- **BigQuery Sandbox**: Requires **zero billing account**. Provides **1 TiB of free query processing per month** and **10 GiB storage**.
- **Query Bounding**: Every backend query enforces `maximumBytesBilled: 100000000` (~100 MB).
- **Gemini Free-Tier**: Uses Flash models (`gemini-2.5-flash` or `gemini-3.8-flash`) eligible for free API quota.
- **Server-Side In-Memory Cache**: Repeat queries within 60 seconds are served from memory to conserve quota.

---

## 📁 Repository Structure

```
├── data/
│   ├── incidents-demo.csv               # Deterministic synthetic Bengaluru records
│   └── source-manifest.example.json     # Data lineage & licensing documentation
├── sql/
│   ├── create_table.sql                 # Canonical BigQuery DDL
│   └── quality_checks.sql               # Data integrity validation queries
├── scripts/
│   └── validate-csv.ts                  # Pre-ingestion validation tool
├── server/
│   ├── types.ts                         # DataRepository interface
│   ├── demoRepository.ts                # In-memory deterministic repository
│   ├── bigqueryRepository.ts            # Live parameterized BigQuery client
│   └── geminiService.ts                 # Server-side Gemini Flash structured outputs
├── src/
│   ├── components/
│   │   ├── Header.tsx                   # Top navigation with persistent mode pill
│   │   ├── HeroSection.tsx              # Hero CTA & natural language question bar
│   │   ├── DiscoveryCard.tsx            # Evidence-backed finding with SQL drawer
│   │   ├── KpiRow.tsx                   # Dynamic KPI metrics
│   │   ├── BengaluruMap.tsx             # Geospatial WGS84 node plotter
│   │   ├── OverviewView.tsx             # Overview charts and investigation cards
│   │   ├── InvestigateView.tsx          # Deep-dive queries, filters, Recharts
│   │   ├── HotspotsView.tsx             # Ranked corridors and node focus inspector
│   │   ├── EvidenceView.tsx             # DDL, manifest, raw table, CSV export
│   │   └── SetupView.tsx                # Connection health test & playbook
│   ├── shared/types.ts                  # Shared TypeScript interfaces
│   ├── App.tsx                          # Root application & state
│   ├── main.tsx                         # Entry point
│   └── index.css                        # Tailwind v4 styles & civic theme
├── server.ts                            # Fullstack Express server with Vite middleware
├── tsconfig.json
├── package.json
└── README.md
```

---

## 📊 Scientific Mobility Disclaimers

1. **Traffic Congestion ≠ Road Crashes**: Gridlocked peak-hour crawls limit kinetic impact energy; fatal collisions disproportionately surge late at night on unlit, high-speed bypasses.
2. **Exposure & Population Bias**: High raw incident counts at nodes like Central Silk Board or Goraguntepalya reflect astronomical vehicle throughput, not solely bad junction geometry.
3. **Correlation ≠ Causation**: Pothole and road maintenance complaints overlapping with collision corridors does not prove civic defects caused the crashes.
