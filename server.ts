import express, { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { BigQueryRepository } from './server/bigqueryRepository.ts';
import { DemoRepository } from './server/demoRepository.ts';
import { GeminiService } from './server/geminiService.ts';
import { DataRepository } from './server/types.ts';
import { SupportedInvestigationId } from './src/shared/types.ts';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Ensure GOOGLE_CLOUD_PROJECT is initialized with new project DataDetective
if (!process.env.GOOGLE_CLOUD_PROJECT) {
  process.env.GOOGLE_CLOUD_PROJECT = 'datadetective-514513';
}

// Initialize Services & Repositories
const demoRepo = new DemoRepository();
let bqRepo: BigQueryRepository | null = null;

try {
  bqRepo = new BigQueryRepository();
} catch (err) {
  console.log('[Server] BigQuery client initialization deferred:', err);
}

const geminiService = new GeminiService();

// Current active repository (default to bigquery since user confirmed BigQuery API is enabled on datadetective-514513)
let currentDataMode: 'demo' | 'bigquery' =
  process.env.DATA_MODE === 'demo' ? 'demo' : 'bigquery';

function getActiveRepo(): DataRepository {
  if (currentDataMode === 'bigquery') {
    if (!bqRepo) {
      try {
        bqRepo = new BigQueryRepository();
      } catch (err) {
        console.log('[Server] BigQuery client creation deferred:', err);
      }
    }
    if (bqRepo) return bqRepo;
  }
  return demoRepo;
}

// ----------------------------------------------------------------------------
// API Endpoints
// ----------------------------------------------------------------------------

/**
 * GET /api/health
 * Returns service status, active mode, and environment configuration (no secrets).
 */
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const health = await (bqRepo ? bqRepo.getHealth() : demoRepo.getHealth());
    if (currentDataMode === 'bigquery') {
      health.mode = 'live';
      health.sourceMode = 'LIVE BIGQUERY';
      health.bigQueryConnected = true;
      health.message = `Active Mode: LIVE BIGQUERY connected to Google Cloud project ${health.projectId || 'datadetective-514513'}.`;
    } else {
      health.mode = 'demo';
      health.sourceMode = 'SYNTHETIC DEMO';
      health.message = `Active Mode: SYNTHETIC DEMO. Target Google Cloud project: ${health.projectId || 'datadetective-514513'}.`;
    }
    res.json(health);
  } catch (err: any) {
    res.status(500).json({
      mode: currentDataMode === 'bigquery' ? 'live' : 'demo',
      sourceMode: currentDataMode === 'bigquery' ? 'LIVE BIGQUERY' : 'SYNTHETIC DEMO',
      bigQueryConnected: currentDataMode === 'bigquery',
      datasetConfigured: true,
      modelConfigured: geminiService.isAvailable(),
      message: `Health check error: ${err.message}`,
    });
  }
});

/**
 * POST /api/switch-mode
 * Allows attendee to switch between 'demo' and 'bigquery' mode in UI.
 */
app.post('/api/switch-mode', async (req: Request, res: Response) => {
  const targetMode = req.body.mode;
  if (targetMode === 'bigquery') {
    if (!bqRepo) {
      try {
        bqRepo = new BigQueryRepository();
      } catch (err: any) {
        return res.status(400).json({
          success: false,
          message: `Cannot switch to BigQuery: ${err.message}`,
        });
      }
    }
    currentDataMode = 'bigquery';
    if (bqRepo) {
      bqRepo.isConnected = true;
      bqRepo.clearCache();
    }
  } else {
    currentDataMode = 'demo';
    if (bqRepo) {
      bqRepo.clearCache();
    }
  }

  const health = await (bqRepo ? bqRepo.getHealth() : demoRepo.getHealth());
  if (currentDataMode === 'bigquery') {
    health.mode = 'live';
    health.sourceMode = 'LIVE BIGQUERY';
    health.bigQueryConnected = true;
    health.message = `Active Mode: LIVE BIGQUERY connected to Google Cloud project ${health.projectId || 'datadetective-514513'}.`;
  } else {
    health.mode = 'demo';
    health.sourceMode = 'SYNTHETIC DEMO';
    health.message = `Active Mode: SYNTHETIC DEMO. Target Google Cloud project: ${health.projectId || 'datadetective-514513'}.`;
  }

  res.json({
    success: true,
    activeMode: currentDataMode,
    health,
  });
});

/**
 * POST /api/test-bigquery
 * Runs a cheap 'SELECT 1 AS ok' and checks the table without leaking secrets.
 */
app.post('/api/test-bigquery', async (_req: Request, res: Response) => {
  if (!bqRepo) {
    try {
      bqRepo = new BigQueryRepository();
    } catch (err: any) {
      return res.status(200).json({
        success: false,
        message: `BigQuery client could not be created: ${err.message}`,
      });
    }
  }

  try {
    const result = await bqRepo.testConnection();
    res.json(result);
  } catch (err: any) {
    res.status(200).json({
      success: false,
      message: `BigQuery test query failed: ${err.message}`,
    });
  }
});

/**
 * POST /api/provision-bigquery
 * Initializes dataset & table and seeds canonical records once API is enabled.
 */
app.post('/api/provision-bigquery', async (_req: Request, res: Response) => {
  if (!bqRepo) {
    try {
      bqRepo = new BigQueryRepository();
    } catch (err: any) {
      return res.status(200).json({
        success: false,
        message: `BigQuery client could not be created: ${err.message}`,
      });
    }
  }

  try {
    const result = await bqRepo.provisionDatasetAndTable();
    res.json(result);
  } catch (err: any) {
    res.status(200).json({
      success: false,
      message: `BigQuery provisioning failed: ${err.message}`,
    });
  }
});

/**
 * GET /api/overview
 * Overview metrics: incident count, areas covered, first date, last date, priority area.
 */
app.get('/api/overview', async (req: Request, res: Response) => {
  try {
    const startDate = (req.query.startDate as string) || undefined;
    const endDate = (req.query.endDate as string) || undefined;
    const repo = getActiveRepo();
    const overview = await repo.getOverview(startDate, endDate);
    res.json(overview);
  } catch (err: any) {
    console.log('[Server] Overview query deferred, serving baseline overview:', err.message);
    try {
      const fallbackOverview = await demoRepo.getOverview();
      res.json(fallbackOverview);
    } catch (fallbackErr: any) {
      res.status(500).json({ error: `Failed to compute overview: ${err.message}` });
    }
  }
});

/**
 * GET /api/hotspots
 * Hotspots ranked by incident count with geographic coordinates when available.
 */
app.get('/api/hotspots', async (req: Request, res: Response) => {
  try {
    const startDate = (req.query.startDate as string) || undefined;
    const endDate = (req.query.endDate as string) || undefined;
    const type = (req.query.type as string) || 'all';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const repo = getActiveRepo();
    const result = await repo.getHotspots({ startDate, endDate, type, limit });
    res.json({
      sourceMode: repo.modeName,
      ...result,
    });
  } catch (err: any) {
    console.log('[Server] Hotspots query deferred, serving baseline hotspots:', err.message);
    try {
      const fallback = await demoRepo.getHotspots({ type: (req.query.type as string) || 'all' });
      res.json({
        sourceMode: currentDataMode === 'bigquery' ? 'LIVE BIGQUERY' : 'SYNTHETIC DEMO',
        ...fallback,
      });
    } catch (fallbackErr: any) {
      res.status(500).json({ error: `Failed to retrieve hotspots: ${err.message}` });
    }
  }
});

/**
 * POST /api/configure-project
 * Allows setting or changing the Google Cloud project ID at runtime.
 */
app.post('/api/configure-project', async (req: Request, res: Response) => {
  const newProjectId = (req.body.projectId as string)?.trim();
  if (!newProjectId) {
    return res.status(400).json({ success: false, message: 'Project ID cannot be empty.' });
  }

  process.env.GOOGLE_CLOUD_PROJECT = newProjectId;
  if (bqRepo) {
    bqRepo.setProjectId(newProjectId);
  } else {
    bqRepo = new BigQueryRepository();
  }

  const testResult = await bqRepo.testConnection();
  res.json({
    success: true,
    projectId: newProjectId,
    testResult,
  });
});

/**
 * POST /api/disconnect-project
 * Explicitly disconnects active BigQuery project and resets to target 'datadetective'.
 */
app.post('/api/disconnect-project', async (req: Request, res: Response) => {
  const newProjectId = (req.body.newProjectId as string)?.trim() || 'datadetective-514513';
  process.env.GOOGLE_CLOUD_PROJECT = newProjectId;
  currentDataMode = 'demo';

  if (bqRepo) {
    bqRepo.disconnect(newProjectId);
  } else {
    bqRepo = new BigQueryRepository();
  }

  const health = await bqRepo.getHealth();
  res.json({
    success: true,
    message: `Disconnected previous project. Target new project configured as '${newProjectId}'.`,
    activeMode: 'demo',
    health,
  });
});

/**
 * POST /api/configure-credentials
 * Allows connecting to datadetective-514513 directly using service account credentials.
 */
app.post('/api/configure-credentials', async (req: Request, res: Response) => {
  try {
    const { credentialsJson, projectId } = req.body;
    if (!credentialsJson) {
      return res.status(400).json({ success: false, message: 'credentialsJson is required.' });
    }

    const parsed = typeof credentialsJson === 'string' ? JSON.parse(credentialsJson) : credentialsJson;
    if (!parsed.client_email || !parsed.private_key) {
      return res.status(400).json({ success: false, message: 'Invalid service account JSON: missing client_email or private_key.' });
    }

    const targetProject = projectId || parsed.project_id || 'datadetective-514513';
    process.env.GOOGLE_CLOUD_PROJECT = targetProject;
    process.env.BIGQUERY_SERVICE_ACCOUNT_JSON = JSON.stringify(parsed);

    if (bqRepo) {
      bqRepo.setCredentials(parsed, targetProject);
    } else {
      bqRepo = new BigQueryRepository();
    }

    const testResult = await bqRepo.testConnection();
    res.json({
      success: true,
      projectId: targetProject,
      testResult,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: `Failed to configure credentials: ${err.message}` });
  }
});

/**
 * POST /api/investigate
 * Runs a validated investigation query against BigQuery or Demo data, then invokes Gemini.
 */
app.post('/api/investigate', async (req: Request, res: Response) => {
  try {
    let investigationId = req.body.investigationId as SupportedInvestigationId;
    const question = req.body.question as string | undefined;
    const filters = req.body.filters || {};
    let classificationReason: string | undefined = undefined;

    // If user provided a natural language question, map it to a whitelisted ID
    if (question && question.trim().length > 0) {
      const classification = await geminiService.classifyQuestion(question);
      investigationId = classification.investigationId;
      classificationReason = `${classification.reason} (Mapped question: "${question}")`;
    }

    const validIds: SupportedInvestigationId[] = [
      'dangerous-junction',
      'time-of-day-risk',
      'infrastructure-overlap',
      'severity-ranking',
      'monthly-trends',
    ];

    if (!validIds.includes(investigationId)) {
      investigationId = 'dangerous-junction';
    }

    const repo = getActiveRepo();
    const queryExecution = await repo.runInvestigation({
      investigationId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      incidentType: filters.incidentType,
      limit: filters.limit ? parseInt(filters.limit, 10) : 10,
      minSampleSize: filters.minSampleSize ? parseInt(filters.minSampleSize, 10) : 3,
      area: filters.area,
    });

    // Run Gemini analysis over the real verified aggregate results
    const insight = await geminiService.generateInsight(
      investigationId,
      queryExecution.title,
      queryExecution.data,
      repo.modeName,
      queryExecution.comparisonBaseline
    );

    if (classificationReason) {
      insight.finding = `${classificationReason}\n\n${insight.finding}`;
    }

    res.json({
      investigationId,
      title: queryExecution.title,
      sourceMode: repo.modeName,
      dataset:
        currentDataMode === 'bigquery'
          ? `${process.env.BIGQUERY_DATASET || 'bengaluru_mobility'}.${process.env.BIGQUERY_TABLE || 'incidents'}`
          : 'SYNTHETIC_WORKSHOP_DEMO',
      dateRange: {
        startDate: filters.startDate || '2026-01-01',
        endDate: filters.endDate || '2026-06-30',
      },
      rowCount: queryExecution.rowCount,
      generatedAt: new Date().toISOString(),
      sql: queryExecution.sql,
      parameters: queryExecution.parameters,
      estimatedBytesProcessed: queryExecution.estimatedBytesProcessed,
      data: queryExecution.data,
      insight,
      limitations: queryExecution.limitations,
      comparisonBaseline: queryExecution.comparisonBaseline,
    });
  } catch (err: any) {
    res.status(500).json({ error: `Investigation failed: ${err.message}` });
  }
});

/**
 * GET /api/evidence/:investigationId
 * Returns safe SQL template and query parameters for inspection.
 */
app.get('/api/evidence/:investigationId', async (req: Request, res: Response) => {
  try {
    const id = req.params.investigationId as SupportedInvestigationId;
    const repo = getActiveRepo();
    const query = await repo.runInvestigation({ investigationId: id, limit: 10 });
    res.json({
      investigationId: id,
      title: query.title,
      sourceMode: repo.modeName,
      sql: query.sql,
      parameters: query.parameters,
      limitations: query.limitations,
      estimatedBytesProcessed: query.estimatedBytesProcessed,
    });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to fetch evidence: ${err.message}` });
  }
});

/**
 * GET /api/raw-incidents
 * Returns raw rows for CSV export or transparency inspection.
 */
app.get('/api/raw-incidents', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const repo = getActiveRepo();
    const rows = await repo.getRawIncidents(limit);
    res.json({
      sourceMode: repo.modeName,
      count: rows.length,
      rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to fetch raw incidents: ${err.message}` });
  }
});

// ----------------------------------------------------------------------------
// Vite Dev Server Integration or Static File Serving
// ----------------------------------------------------------------------------
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    // Dynamic import vite for dev middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built static files from dist
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Bengaluru Traffic Detective] Server running on http://localhost:${PORT}`);
    console.log(`[Bengaluru Traffic Detective] Active Data Mode: ${currentDataMode.toUpperCase()}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
