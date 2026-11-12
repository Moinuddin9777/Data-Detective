# Bengaluru Traffic Detective — Google AI Studio Master Build Prompt

> Paste the **MASTER PROMPT** section into **Google AI Studio → Build → Web app**. Keep the remaining sections as your setup and verification playbook. Designed for a Bengaluru hands-on workshop, with a BigQuery-backed investigation and a reliable offline/demo fallback.

## Before you paste: important reality checks

- **AI Studio Build can generate a full-stack React + Node.js web app**, including server routes and server-side secrets. It does **not** automatically grant the app access to your Google Cloud BigQuery project.
- **BigQuery does not authenticate with a Gemini API key.** It needs Google Cloud OAuth / Application Default Credentials or an appropriately scoped service account identity. A Google AI Studio secret is a secure *place to store* a credential, not an identity or IAM grant.
- **BigQuery Sandbox** can be used without a billing account; its documented allowances are **1 TiB query processing per month** and **10 GiB lifetime storage**, with automatic table expiry and some feature limitations. Never enable billing just to make this workshop demo run.
- **No claim of guaranteed zero cost**: verify Gemini model free-tier eligibility, AI Studio limits, and any publish/deploy terms on your account. Build and preview first; don't enable paid deployment or a billing account.
- **Traffic is not the same as road crashes**. Unless you have actual speed/travel-time measurements, label results as *road-safety and mobility indicators*, not measured congestion or commute delays.
- **No fabricated Bengaluru statistics**. Any numerical finding must come from an executed BigQuery query or a clearly labeled synthetic/demo dataset.

---

# MASTER PROMPT — COPY INTO GOOGLE AI STUDIO BUILD

You are an expert full-stack engineer, data engineer, urban mobility analyst, interaction designer, and patient workshop instructor. Build a COMPLETE, working, beautiful, secure, mobile-responsive web application named **Bengaluru Traffic Detective** with the tagline **“Find the patterns behind the traffic.”**

This is for a hands-on **Build with AI** workshop in Bengaluru. The app should give attendees an emotional AHA moment by uncovering a genuine, evidence-backed problem in local road safety or mobility data. It must be simple to demo and explain in 90 minutes. **This is NOT a route navigation app, not a generic chatbot, and not a static dashboard.** It is a data investigation tool: **question → BigQuery evidence → insight → action**.

## A. Absolute requirements

1. Generate an actual runnable **full-stack web app** in Google AI Studio Build mode: React + TypeScript frontend and Node.js server endpoints. Do not output only a mockup or pseudocode.
2. Use **only a currently free-tier-eligible Gemini Flash model** for AI explanations; put the model ID in `GEMINI_MODEL` and verify eligibility rather than assuming a particular version remains free. No Pro models. Use server-side Gemini calls only.
3. Integrate **real Google BigQuery queries** through server-side `@google-cloud/bigquery` when credentials are available. Never simulate a successful BigQuery query.
4. Provide a **Demo Mode** with deterministic, explicitly **SYNTHETIC SAMPLE DATA** for attendees who cannot connect BigQuery. Never represent demo numbers as official Bengaluru statistics.
5. Provide a **Connection Setup** screen that tells the user exactly what is missing, what to do, and whether the application is in `LIVE BIGQUERY`, `DEMO`, or `CONNECTION ERROR` mode. Never silently switch to demo data.
6. Do not require Firebase, Firestore, Cloud Run deployment, paid Maps APIs, paid model tiers, BigQuery ML, streaming, or BigQuery DML. Do not ask to enable billing.
7. Build a polished dark urban-intelligence visual design with Bengaluru context, accessible contrast, responsive layout, meaningful loading/empty/error states, and subtle motion.
8. No invented citations, accident counts, live speeds, commute times, or causal conclusions. Every finding must show its data source, date coverage, sample size, limitations, and executed SQL when in live mode.
9. Build the entire app before asking for further enhancements. After implementing, run available build/type checks and fix errors. Do not claim a connection was tested unless a real query succeeded.

## B. Primary user experience

Home screen title: **“Where is Bengaluru losing its momentum?”**
Subtitle: **“Investigate the city with data. Discover patterns. Question assumptions.”**

Top navigation: `Overview` | `Investigate` | `Hotspots` | `Evidence` | `Setup`.

Persistent mode indicator: `LIVE BIGQUERY`, `SYNTHETIC DEMO`, or `NOT CONNECTED`.

Home hero CTA: **“Find something unusual”**. On click, run a predefined, safe investigation against BigQuery if connected, otherwise against labeled synthetic demo data. Show a discovery card with: striking but defensible headline, key metric, comparison baseline, interactive visualization, caveat, suggested action, and **“View SQL evidence”** control.

Three investigation cards:
- **Dangerous junction mystery** — Where do recorded crashes cluster, and which locations warrant further investigation?
- **Time-of-day risk** — When do reported crashes or violations cluster, and how does severity vary?
- **Infrastructure overlap** — Where do reported road maintenance issues overlap with recorded crash locations, *only if both datasets contain compatible geographies and time ranges*?

A question bar accepts natural language such as:
- “Which areas have the most reported crashes?”
- “Are night-time crashes more severe?”
- “Which locations have repeated incidents?”
- “What should city planners investigate first?”

For MVP, map natural language to a **small whitelist of validated investigation IDs and parameters**, not arbitrary AI-generated SQL. If a question is outside supported investigations, explain the limitation and offer the closest supported investigation. Gemini may interpret and summarize; BigQuery is the numerical source of truth.

## C. UI design specifications

Visual direction: modern investigative journalism + civic intelligence; charcoal/navy background, off-white text, teal/cyan highlights, sparing amber/red for risk. Use professional typography and responsive spacing. Avoid gimmicky neon overload and generic chatbot layout.

Components:
- Hero with large title, local Bengaluru microcopy, mode pill and primary CTA.
- KPI row with `Recorded incidents`, `Locations covered`, `Date range`, and `Highest-priority area` (all computed from active source, not hardcoded in live mode).
- Interactive hotspots visualization: prefer a chart/table that works immediately. Add Leaflet/OpenStreetMap map **only when valid coordinates exist**. Respect OSM tile usage policies; never require a Google Maps key. If coordinates are missing, use an honest location-ranked bar chart rather than fabricated pins.
- Investigation results with 2–3 visualizations using Recharts, clear axes, units, legends and source notes.
- `Why this matters` explanatory card.
- `What the data cannot tell us` caveat card.
- Expandable `Evidence` panel: dataset, rows used, SQL, filters, execution timestamp, estimated/actual bytes processed where available, and a CSV export of aggregated results.
- Setup wizard with connection test and clear remediation messages.
- Loading skeletons, keyboard-friendly controls, mobile cards, sensible empty states.

Use real-looking design, but **never seed plausible Bengaluru numbers without marking them SYNTHETIC**.

## D. Data contract and ingestion

Do NOT assume a public BigQuery table named `bengaluru_traffic` exists. The organizer will prepare one or more CSV files from documented public datasets (for example Bengaluru crash records, violations, road repairs from OpenCity). The source URLs and dataset version/date must be recorded in a source manifest. Never scrape a site against its access terms.

Define a canonical BigQuery table schema named:
`PROJECT_ID.bengaluru_mobility.incidents`

Required columns:
- `incident_id STRING`
- `incident_date DATE`
- `area STRING`
- `incident_type STRING` — e.g. `crash`, `violation`, `road_issue`
- `severity STRING` — e.g. `fatal`, `serious`, `minor`, `unknown`
- `source_name STRING`
- `source_url STRING`

Optional columns:
- `latitude FLOAT64`
- `longitude FLOAT64`
- `road_name STRING`
- `description STRING`

**Never fabricate values for missing columns.** Missing coordinates remain NULL; missing severity becomes `unknown`; missing date or area must be handled in the cleaning report. For each input file, provide a mapping interface or a documented transform that maps actual CSV headers to the canonical schema. Do not assume every source has individual event-level records; aggregate-only source files must go to a separate table with their own semantics, not be converted into fake incidents.

Create:
- `data/source-manifest.example.json` with source title, original URL, retrieved date, coverage, license, file path, caveats.
- `data/incidents-demo.csv` with ~60 deterministic synthetic records distributed across **clearly fictitious demo locations or labeled synthetic Bengaluru-area examples**; never call these official data.
- `scripts/validate-csv.ts` (or equivalent) to validate dates, lat/long ranges, duplicates, and required fields before import.
- `sql/create_table.sql` for canonical schema using BigQuery-compatible DDL. Dataset creation instructions should be documented separately.
- `sql/quality_checks.sql` for row count, null coverage, date range, duplicate incident IDs and type distributions.

## E. BigQuery server integration — mandatory

Use `@google-cloud/bigquery` in server-only code. Build a `BigQueryRepository` and a separate `DemoRepository` with the same typed interface. `DATA_MODE` defaults to `demo` unless explicitly set to `bigquery` and authentication succeeds. A failed live query must show an error, not silently switch modes.

Environment variables:
- `DATA_MODE=demo` or `bigquery`
- `GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID`
- `BIGQUERY_DATASET=bengaluru_mobility`
- `BIGQUERY_TABLE=incidents`
- `BIGQUERY_LOCATION=US` (or the actual location selected when creating the dataset)
- `GEMINI_API_KEY` — server secret managed by AI Studio
- `GEMINI_MODEL` — free-tier-eligible Flash model ID selected by the organizer
- `GOOGLE_APPLICATION_CREDENTIALS` — **only when running locally with an authorized credentials file path**
- `BIGQUERY_SERVICE_ACCOUNT_JSON` — optional server-side secret for a **properly authorized, narrowly scoped service account**, only if policy permits; parse securely and never log it or send it to the client.

Authentication strategy:
1. Prefer Google Application Default Credentials in a trusted local or supported managed environment.
2. For AI Studio's hosted preview, explain clearly that the Gemini key does NOT grant BigQuery access. The preview may not inherit the user's Google Cloud login or local ADC credentials. If supported and permitted, use a dedicated least-privilege service account JSON secret stored **server-side only**; if the sandbox or organization does not permit this setup, use Demo Mode and provide the exact local run instructions. Do not claim automatic BigQuery connection.
3. **Do not generate a service account key automatically, request an Owner role, or put credential JSON in source control.** Do not request broader IAM roles than needed.
4. Support a `/api/health` route returning only `{ mode, bigQueryConnected, datasetConfigured, modelConfigured, message }`, never credentials.
5. Support `/api/test-bigquery` which runs a cheap `SELECT 1 AS ok` against the configured project, followed by a schema/row-count check for the configured table; report precise errors and do not leak sensitive details.

BigQuery query requirements:
- Use only validated project/dataset/table identifiers configured server-side; never interpolate user-supplied table names.
- Only allow predefined `SELECT` queries; no DDL/DML from end-user input.
- Parameterize values (`@startDate`, `@endDate`, `@area`, `@limit`) using BigQuery query parameters.
- Apply bounded date ranges and sensible `LIMIT` clauses.
- Set `maximumBytesBilled` to a small organizer-configurable limit (e.g. `100000000`, ~100 MB) for each query, where supported; dry-run estimates when feasible.
- Never scan arbitrary public tables for a user question.
- Handle 403 permissions, 404 missing table, location mismatch, quota and missing credentials with actionable errors.
- Use server-side caching for repeat aggregate requests to reduce quota use.

Required endpoints:
- `GET /api/health`
- `POST /api/test-bigquery`
- `GET /api/overview`
- `GET /api/hotspots?startDate=&endDate=&type=&limit=`
- `POST /api/investigate` with `{ investigationId, filters, question? }`
- `GET /api/evidence/:investigationId` (returns safe SQL template and metadata)

Return a consistent JSON envelope with `sourceMode`, `dataset`, `dateRange`, `rowCount`, `generatedAt`, `data`, `limitations`, and `sql` where applicable.

## F. Required SQL investigations

Create **actual BigQuery Standard SQL** files and wire them to backend endpoints. Adapt identifiers safely. Use the following patterns, updating schema details if the imported dataset requires it.

**1. Overview**
```sql
SELECT
  COUNT(*) AS incident_count,
  COUNT(DISTINCT area) AS areas_covered,
  MIN(incident_date) AS first_date,
  MAX(incident_date) AS last_date
FROM `PROJECT_ID.bengaluru_mobility.incidents`
WHERE incident_date BETWEEN @startDate AND @endDate;
```

**2. Hotspots**
```sql
SELECT
  area,
  COUNT(*) AS incidents,
  COUNTIF(LOWER(severity) = 'fatal') AS fatal_incidents
FROM `PROJECT_ID.bengaluru_mobility.incidents`
WHERE incident_date BETWEEN @startDate AND @endDate
  AND (@incidentType = 'all' OR incident_type = @incidentType)
  AND area IS NOT NULL
GROUP BY area
ORDER BY incidents DESC
LIMIT @limit;
```

**3. Monthly trends**
```sql
SELECT
  DATE_TRUNC(incident_date, MONTH) AS month,
  incident_type,
  COUNT(*) AS incidents
FROM `PROJECT_ID.bengaluru_mobility.incidents`
WHERE incident_date BETWEEN @startDate AND @endDate
GROUP BY month, incident_type
ORDER BY month, incident_type;
```

**4. Severity by area**
```sql
SELECT
  area,
  COUNT(*) AS total,
  COUNTIF(LOWER(severity) = 'fatal') AS fatal,
  SAFE_DIVIDE(COUNTIF(LOWER(severity) = 'fatal'), COUNT(*)) AS fatal_share
FROM `PROJECT_ID.bengaluru_mobility.incidents`
WHERE incident_date BETWEEN @startDate AND @endDate
  AND incident_type = 'crash'
  AND area IS NOT NULL
GROUP BY area
HAVING COUNT(*) >= @minSampleSize
ORDER BY fatal_share DESC, total DESC
LIMIT @limit;
```

**5. Hour-of-day analysis — conditional**
Only implement if an actual source includes a reliable incident timestamp or hour column. If only `DATE` exists, **disable the investigation and explain why**. Do not infer hour from date.

**6. Cross-dataset infrastructure overlap — conditional**
Only implement if sources contain compatible locations, dates and geographic precision. Show that spatial overlap is correlation, not causation. If data quality is insufficient, show an unavailable explanation instead of a fake analysis.

Important: a high incident count may reflect population, traffic exposure, reporting practices, or enforcement intensity. Never call the top area “the most dangerous” without exposure-adjusted evidence. Use “highest number of recorded incidents in this dataset.”

## G. AI investigator behavior

Use Gemini only for:
- Mapping a user question to one of the supported investigation IDs.
- Writing a short human-friendly summary **after** the backend returns verified aggregates.
- Proposing plausible hypotheses and practical next steps, clearly labeled as hypotheses.

Structured output contract:
```json
{
  "headline": "string",
  "finding": "string",
  "evidenceBullets": ["string"],
  "whyItMatters": "string",
  "suggestedActions": ["string"],
  "limitations": ["string"],
  "confidence": "high | medium | low"
}
```

System instruction for Gemini: “You are a cautious civic data analyst. Use only the supplied query results for numerical statements. Never invent figures, citations, geographic coordinates, travel times, causes or data sources. Differentiate observed association from causation. If the sample is insufficient or a metric is unavailable, say so. Explain in accessible language. Avoid ranking risk based solely on raw counts.”

Validate AI responses against the structured schema. If Gemini is unavailable or quota-exhausted, fall back to **deterministic template-based explanations** from the query results, not fabricated prose. Include a `Generated with AI` label only when AI actually ran.

## H. Build sequence — execute in order

1. Create the full project file structure and install only necessary packages.
2. Build the UI and deterministic demo repository so the app works immediately.
3. Build canonical types, input validation and safe API endpoints.
4. Implement BigQuery repository and SQL templates, with strict server-side credential handling.
5. Build the Setup wizard, environment checks and `/api/test-bigquery`.
6. Add Gemini classification and evidence-grounded summarization with a free-eligible Flash model.
7. Add charts and optional geospatial map only when valid coordinates exist.
8. Add source metadata, evidence drawers, CSV export, errors, and limitations.
9. Add a README with the exact manual Google Cloud and AI Studio setup steps below.
10. Run available typecheck/build tests and fix all errors. Confirm demo mode works. **Do not assert live mode works unless a real BigQuery query has returned successfully.**

## I. Acceptance tests

- App opens in demo mode with obvious `SYNTHETIC DEMO` banner.
- Overview, hotspots, trends, investigate, evidence and export all work with deterministic demo data.
- No hardcoded “live” metrics.
- User can see why live BigQuery is not connected.
- A real BigQuery connection uses server-side credentials only.
- `/api/test-bigquery` reports success only after a real successful query.
- SQL is parameterized; table identifiers are server-configured.
- Missing optional timestamp/coordinates disable the relevant visualization instead of inventing values.
- Gemini is optional to numerical correctness; quota failure does not destroy the app.
- No paid API, Pro model, paid map, Firebase or deployment dependency.
- No secrets in client bundle, browser console, error messages or Git repository.
- Mobile layout works; loading/empty/error states are usable.
- README documents all limitations, the free-tier guardrails and the manual BigQuery import.

**Start implementing now. Do not stop at a design proposal. Create working code and then report what was actually tested, what requires user setup, and what remains blocked.**

# END MASTER PROMPT

---

# ORGANIZER SETUP — STEP BY STEP

## 1. Create a no-billing BigQuery project

1. Visit https://console.cloud.google.com/bigquery and sign in.
2. Create a new project, e.g. `bengaluru-traffic-workshop-2026`. Copy the **actual Project ID**, which may differ from the display name.
3. **Do not attach a billing account.** Confirm the BigQuery Sandbox notice appears.
4. In BigQuery Studio, create a dataset named `bengaluru_mobility`. Choose `US` as its location **only if you have no other location requirements**; record the exact selected location. Use the same location in app settings and queries.
5. Run the generated `sql/create_table.sql` after replacing `PROJECT_ID` with your actual project ID. If you import CSV via console first, you can let BigQuery create the table with a manually reviewed schema instead.
6. Sandbox has default expiration behavior; check table expiration before the event.

## 2. Prepare actual Bengaluru data

1. Start with a source registry such as https://opencity.in/ and locate a Bengaluru crash/road-safety dataset with accessible downloadable records. Check its license and coverage.
2. Download a **small, manageable** CSV or XLSX file. Check whether rows are event-level or aggregated. Do not claim a dataset exists at a particular BigQuery path until you import it.
3. Inspect headers, null values, dates, coordinate availability, and duplicates.
4. Normalize columns to the canonical `incidents` schema, retaining original provenance in `source_name` and `source_url`.
5. Import the CSV in BigQuery Studio: select your project/dataset → **Create table** → source **Upload** → CSV → choose table name `incidents` → define/review schema → Create.
6. Run these checks (replace `PROJECT_ID`):

```sql
SELECT COUNT(*) AS rows_loaded,
       MIN(incident_date) AS first_date,
       MAX(incident_date) AS last_date
FROM `PROJECT_ID.bengaluru_mobility.incidents`;
```

```sql
SELECT incident_type, severity, COUNT(*) AS n
FROM `PROJECT_ID.bengaluru_mobility.incidents`
GROUP BY 1, 2 ORDER BY n DESC LIMIT 30;
```

7. Record actual source title, URL, retrieval date, years covered, data limitations and whether locations are approximate.

## 3. BigQuery authentication: choose the feasible route

### Route A — simplest reliable live integration: run exported app locally

1. Install Google Cloud CLI: https://cloud.google.com/sdk/docs/install
2. Run:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud auth application-default login
```

3. Make sure your Google account has permission to create BigQuery query jobs in the project and read the table (typically `roles/bigquery.jobUser` on the project plus `roles/bigquery.dataViewer` on the dataset, or equivalent authorized access). If you own the project, verify rather than unnecessarily changing roles.
4. In Google AI Studio, download the generated project as ZIP, extract it, and run its documented install/start commands locally.
5. Configure the local server environment:

```dotenv
DATA_MODE=bigquery
GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID
BIGQUERY_DATASET=bengaluru_mobility
BIGQUERY_TABLE=incidents
BIGQUERY_LOCATION=US
GEMINI_MODEL=YOUR_VERIFIED_FREE_FLASH_MODEL_ID
GEMINI_API_KEY=YOUR_FREE_TIER_API_KEY
```

6. Start the app, visit Setup and click **Test BigQuery Connection**. Confirm the server runs `SELECT 1` and a real table query. Keep all credentials server-side.

### Route B — hosted Google AI Studio Build preview

1. Open https://aistudio.google.com/ → **Build** → **Web app** and paste the MASTER PROMPT.
2. AI Studio typically manages `GEMINI_API_KEY` as a server-side secret. Confirm it is associated with a free-tier API project/model.
3. **BigQuery will NOT automatically work just because you are signed in to AI Studio.** The hosted server needs a separate authorized Google Cloud identity.
4. If your organization and the BigQuery project allow a narrowly scoped service account and the AI Studio server runtime supports the required server secret, configure `BIGQUERY_SERVICE_ACCOUNT_JSON` in **Secrets**, not in the prompt, source code or client. Grant the identity only the required query-job and dataset read permissions. Never create or expose a broad Owner credential.
5. If service account credentials are unavailable, restricted by policy, or unsupported in your sandbox setup, **use Demo Mode in AI Studio preview and Route A for live BigQuery**. Do not bypass controls or pretend the preview has access.
6. Verify via Setup → Test BigQuery Connection. A green status requires an actual query success.

## 4. Gemini free-tier setup

1. In AI Studio, confirm your Gemini API project/key is on the **Free Tier** and that the selected **Flash** model currently has free API allowance: https://ai.google.dev/gemini-api/docs/pricing
2. Set `GEMINI_MODEL` to that exact available model ID; do not hardcode an unverified name.
3. Keep API key in server-side secrets only. Never paste the key into the master prompt.
4. If the model hits a quota limit, the app should continue to display BigQuery findings with deterministic explanations.

## 5. Free-tier and security safeguards

- Keep BigQuery project **without billing**.
- Set `maximumBytesBilled` on every live query and use narrow date ranges.
- Keep data below sandbox limits; do not use streaming inserts, DML, or transfer services.
- Do not click a deployment option that requests paid billing. Starter-tier publishing, if available to your account, has separate eligibility/limits; verify before using it.
- Do not rely on budget alerts as hard spending caps.
- Avoid personal travel histories, plate numbers, phone numbers and other sensitive personal data.
- Do not publish service account JSON or API keys; rotate any exposed key.

---

# FOLLOW-UP PROMPTS FOR AI STUDIO (IF THE FIRST GENERATION IS INCOMPLETE)

## Prompt 1 — Force working BigQuery integration

> Audit the current app. Show the actual server-side BigQuery client initialization, configured dataset/table identifiers, parameterized SQL, max bytes billed, and the `/api/test-bigquery` endpoint. Fix missing implementations. Never claim BigQuery is connected until `SELECT 1` and a real table query succeed. If hosted credentials are unavailable, keep a visible `NOT CONNECTED` state and explain the local ADC route.

## Prompt 2 — Make the discovery compelling

> Improve the home screen so that clicking “Find something unusual” selects a supported investigation, runs the real data repository, computes a surprising but defensible comparison, and renders a striking evidence-backed story card with a chart, sample size, source, caveat, and suggested action. Do not invent any number or causal claim. In demo mode mark the entire finding SYNTHETIC.

## Prompt 3 — Fix AI reliability

> Remove any path where Gemini can invent statistics or SQL. Use whitelist investigation IDs, backend-validated parameters, and Gemini structured output only after receiving executed query results. Add a deterministic non-AI fallback for API quota failures.

## Prompt 4 — Workshop readiness audit

> Perform a complete workshop readiness pass. Test navigation, demo data, responsive layouts, setup wizard, error states, query safety, evidence drawer, CSV export and free-tier assumptions. Produce a concise checklist of PASS / NEEDS SETUP / BLOCKED with exact steps. Never mark an untested live BigQuery integration PASS.

---

# 90-MINUTE WORKSHOP RUN OF SHOW

| Time | Activity | Visible outcome |
|---|---|---|
| 0–10 min | Tell a Bengaluru commute story; introduce the problem | Everyone recognizes the challenge |
| 10–25 min | Paste master prompt into AI Studio Build | Running app with synthetic demo mode |
| 25–40 min | Show the preloaded BigQuery dataset and execute one SQL query | Real evidence and data lineage |
| 40–55 min | Configure the app's BigQuery connection (organizer-led); use demo fallback where necessary | Connection status clearly visible |
| 55–70 min | Run three investigations | Ranked locations, trends, evidence |
| 70–80 min | Ask Gemini to narrate one verified finding | Data → understandable story |
| 80–90 min | Present a discovery and caveat | AHA moment: evidence over assumptions |

**Workshop reliability tip:** Prebuild one verified BigQuery project, test the dataset and schema a day in advance, and distribute a safe synthetic demo CSV. Do not expect 50 attendees to all create IAM identities and import datasets during a 90-minute workshop. If everyone needs independent live queries, each participant should have their own authorized project and credentials.

---

# OFFICIAL DOCUMENTATION

- Google AI Studio Build mode: https://ai.google.dev/gemini-api/docs/aistudio-build-mode
- BigQuery Sandbox: https://docs.cloud.google.com/bigquery/docs/sandbox
- BigQuery authentication: https://docs.cloud.google.com/bigquery/docs/authentication/getting-started
- BigQuery client libraries: https://docs.cloud.google.com/bigquery/docs/quickstarts/quickstart-client-libraries
- BigQuery public datasets: https://docs.cloud.google.com/bigquery/public-data
- BigQuery datasets: https://docs.cloud.google.com/bigquery/docs/datasets
- Gemini API pricing: https://ai.google.dev/gemini-api/docs/pricing
- AI Studio deployment options: https://ai.google.dev/gemini-api/docs/aistudio-deploying

**Definition of success:** A participant can click an investigation, see a real BigQuery-backed aggregate (when connected), read a careful AI explanation, inspect the executed SQL and source, and identify a credible action or follow-up question — without mistaking a synthetic demo for measured Bengaluru traffic.
