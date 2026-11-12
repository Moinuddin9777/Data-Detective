import type {
  HealthResponse,
  HotspotRecord,
  IncidentRecord,
  OverviewMetrics,
  SupportedInvestigationId,
} from '../src/shared/types.ts';

export interface DataRepository {
  modeName: 'LIVE BIGQUERY' | 'SYNTHETIC DEMO';
  getHealth(): Promise<HealthResponse>;
  testConnection(): Promise<{ success: boolean; message: string; details?: any }>;
  provisionDatasetAndTable?(): Promise<{ success: boolean; message: string; details?: any }>;
  getOverview(startDate?: string, endDate?: string): Promise<OverviewMetrics>;
  getHotspots(params: {
    startDate?: string;
    endDate?: string;
    type?: string;
    limit?: number;
  }): Promise<{
    hotspots: HotspotRecord[];
    sql: string;
    parameters: Record<string, any>;
    estimatedBytesProcessed?: number | string;
  }>;
  runInvestigation(params: {
    investigationId: SupportedInvestigationId;
    startDate?: string;
    endDate?: string;
    incidentType?: string;
    limit?: number;
    minSampleSize?: number;
    area?: string;
  }): Promise<{
    title: string;
    data: any[];
    sql: string;
    parameters: Record<string, any>;
    rowCount: number;
    limitations: string[];
    comparisonBaseline?: string;
    estimatedBytesProcessed?: number | string;
  }>;
  getRawIncidents(limit?: number): Promise<IncidentRecord[]>;
}
