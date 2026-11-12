/**
 * Shared Type Definitions between Frontend and Backend
 */

export interface IncidentRecord {
  incident_id: string;
  incident_date: string;
  area: string;
  incident_type: 'crash' | 'violation' | 'road_issue' | string;
  severity: 'fatal' | 'serious' | 'minor' | 'unknown' | string;
  source_name: string;
  source_url: string;
  latitude: number | null;
  longitude: number | null;
  road_name: string | null;
  description: string | null;
  hour: number | null;
}

export interface OverviewMetrics {
  incidentCount: number;
  areasCovered: number;
  firstDate: string;
  lastDate: string;
  highestPriorityArea: {
    area: string;
    incidents: number;
    fatalShare: number;
  } | null;
  severityCounts: {
    fatal: number;
    serious: number;
    minor: number;
    unknown: number;
  };
  typeCounts: {
    crash: number;
    violation: number;
    road_issue: number;
  };
}

export interface HotspotRecord {
  area: string;
  incidents: number;
  fatalIncidents: number;
  fatalShare: number;
  latitude: number | null;
  longitude: number | null;
  primaryRoad?: string | null;
  topIncidentType?: string;
}

export interface InvestigationAIInsight {
  headline: string;
  finding: string;
  evidenceBullets: string[];
  whyItMatters: string;
  suggestedActions: string[];
  limitations: string[];
  confidence: 'high' | 'medium' | 'low';
  isAiGenerated: boolean;
}

export interface InvestigationResult {
  investigationId: string;
  title: string;
  sourceMode: 'LIVE BIGQUERY' | 'SYNTHETIC DEMO';
  dataset: string;
  dateRange: { startDate: string; endDate: string };
  rowCount: number;
  generatedAt: string;
  sql: string;
  parameters: Record<string, any>;
  estimatedBytesProcessed?: number | string;
  data: any[];
  insight: InvestigationAIInsight;
  limitations: string[];
  comparisonBaseline?: string;
}

export interface HealthResponse {
  mode: 'live' | 'demo' | 'not_connected';
  sourceMode: 'LIVE BIGQUERY' | 'SYNTHETIC DEMO' | 'NOT CONNECTED';
  bigQueryConnected: boolean;
  datasetConfigured: boolean;
  modelConfigured: boolean;
  message: string;
  projectId?: string;
  dataset?: string;
  table?: string;
  location?: string;
  modelName?: string;
  hasServiceAccountSecret?: boolean;
}

export type SupportedInvestigationId =
  | 'dangerous-junction'
  | 'time-of-day-risk'
  | 'infrastructure-overlap'
  | 'severity-ranking'
  | 'monthly-trends';
