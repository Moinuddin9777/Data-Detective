import fs from 'node:fs';
import path from 'node:path';
import {
  HealthResponse,
  HotspotRecord,
  IncidentRecord,
  OverviewMetrics,
  SupportedInvestigationId,
} from '../src/shared/types.ts';
import { DataRepository } from './types.ts';

export class DemoRepository implements DataRepository {
  public modeName: 'LIVE BIGQUERY' | 'SYNTHETIC DEMO' = 'SYNTHETIC DEMO';
  private cachedRecords: IncidentRecord[] | null = null;
  private csvPath: string;

  constructor() {
    this.csvPath = path.join(process.cwd(), 'data', 'incidents-demo.csv');
  }

  private loadRecords(): IncidentRecord[] {
    if (this.cachedRecords) {
      return this.cachedRecords;
    }

    if (!fs.existsSync(this.csvPath)) {
      console.warn(`[DemoRepository] Demo CSV not found at ${this.csvPath}, fallback to empty`);
      return [];
    }

    const content = fs.readFileSync(this.csvPath, 'utf-8');
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map((h) => h.trim());
    const records: IncidentRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      values.push(cur.trim());

      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || '';
      });

      records.push({
        incident_id: obj.incident_id || `DEMO-${i}`,
        incident_date: obj.incident_date || '2026-01-01',
        area: obj.area || 'Unknown Area',
        incident_type: obj.incident_type || 'crash',
        severity: obj.severity || 'unknown',
        source_name: obj.source_name || 'Synthetic OpenCity Demo',
        source_url: obj.source_url || 'https://opencity.in/demo',
        latitude: obj.latitude ? parseFloat(obj.latitude) : null,
        longitude: obj.longitude ? parseFloat(obj.longitude) : null,
        road_name: obj.road_name || null,
        description: obj.description || null,
        hour: obj.hour !== undefined && obj.hour !== '' ? parseInt(obj.hour, 10) : null,
      });
    }

    this.cachedRecords = records;
    return records;
  }

  public async getHealth(): Promise<HealthResponse> {
    const records = this.loadRecords();
    return {
      mode: 'demo',
      sourceMode: 'SYNTHETIC DEMO',
      bigQueryConnected: false,
      datasetConfigured: false,
      modelConfigured: Boolean(process.env.GEMINI_API_KEY),
      message: `Operating in SYNTHETIC DEMO mode with ${records.length} curated workshop records. Not connected to live Google BigQuery.`,
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'demo-project-sandbox',
      dataset: process.env.BIGQUERY_DATASET || 'bengaluru_mobility',
      table: process.env.BIGQUERY_TABLE || 'incidents',
      location: process.env.BIGQUERY_LOCATION || 'US',
      modelName: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      hasServiceAccountSecret: Boolean(process.env.BIGQUERY_SERVICE_ACCOUNT_JSON),
    };
  }

  public async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    const records = this.loadRecords();
    return {
      success: true,
      message: `Demo CSV verified cleanly (${records.length} deterministic rows loaded). In live mode, this performs 'SELECT 1' and table validation on BigQuery.`,
      details: {
        rowCount: records.length,
        mode: 'demo',
        note: 'Live BigQuery requires Google Cloud ADC or BIGQUERY_SERVICE_ACCOUNT_JSON secret.',
      },
    };
  }

  public async getOverview(startDate?: string, endDate?: string): Promise<OverviewMetrics> {
    const all = this.loadRecords();
    const filtered = all.filter((r) => {
      if (startDate && r.incident_date < startDate) return false;
      if (endDate && r.incident_date > endDate) return false;
      return true;
    });

    const dates = filtered.map((r) => r.incident_date).sort();
    const areas = Array.from(new Set(filtered.map((r) => r.area)));

    const severityCounts = {
      fatal: 0,
      serious: 0,
      minor: 0,
      unknown: 0,
    };

    const typeCounts = {
      crash: 0,
      violation: 0,
      road_issue: 0,
    };

    const areaMap: Record<string, { total: number; fatal: number }> = {};

    filtered.forEach((r) => {
      const sev = r.severity.toLowerCase();
      if (sev === 'fatal') severityCounts.fatal++;
      else if (sev === 'serious') severityCounts.serious++;
      else if (sev === 'minor') severityCounts.minor++;
      else severityCounts.unknown++;

      const type = r.incident_type.toLowerCase();
      if (type === 'crash') typeCounts.crash++;
      else if (type === 'violation') typeCounts.violation++;
      else if (type === 'road_issue') typeCounts.road_issue++;

      if (!areaMap[r.area]) {
        areaMap[r.area] = { total: 0, fatal: 0 };
      }
      areaMap[r.area].total++;
      if (sev === 'fatal') areaMap[r.area].fatal++;
    });

    let highestPriorityArea: OverviewMetrics['highestPriorityArea'] = null;
    let highestRatio = -1;

    Object.entries(areaMap).forEach(([area, stats]) => {
      // Prioritize areas with at least 3 incidents to prevent 1-off sample bias
      if (stats.total >= 3) {
        const ratio = stats.fatal / stats.total;
        if (ratio > highestRatio) {
          highestRatio = ratio;
          highestPriorityArea = {
            area,
            incidents: stats.total,
            fatalShare: Math.round(ratio * 100) / 100,
          };
        }
      }
    });

    // Fallback if no area has >= 3
    if (!highestPriorityArea && Object.keys(areaMap).length > 0) {
      const sorted = Object.entries(areaMap).sort((a, b) => b[1].total - a[1].total);
      const [topArea, topStats] = sorted[0];
      highestPriorityArea = {
        area: topArea,
        incidents: topStats.total,
        fatalShare: topStats.total > 0 ? Math.round((topStats.fatal / topStats.total) * 100) / 100 : 0,
      };
    }

    return {
      incidentCount: filtered.length,
      areasCovered: areas.length,
      firstDate: dates[0] || '2026-01-01',
      lastDate: dates[dates.length - 1] || '2026-06-30',
      highestPriorityArea,
      severityCounts,
      typeCounts,
    };
  }

  public async getHotspots(params: {
    startDate?: string;
    endDate?: string;
    type?: string;
    limit?: number;
  }): Promise<{
    hotspots: HotspotRecord[];
    sql: string;
    parameters: Record<string, any>;
    estimatedBytesProcessed?: number | string;
  }> {
    const limit = params.limit || 10;
    const all = this.loadRecords();

    const filtered = all.filter((r) => {
      if (params.startDate && r.incident_date < params.startDate) return false;
      if (params.endDate && r.incident_date > params.endDate) return false;
      if (params.type && params.type !== 'all' && r.incident_type.toLowerCase() !== params.type.toLowerCase()) {
        return false;
      }
      return true;
    });

    const groups: Record<
      string,
      {
        incidents: number;
        fatalIncidents: number;
        lats: number[];
        lngs: number[];
        roads: string[];
        types: Record<string, number>;
      }
    > = {};

    filtered.forEach((r) => {
      if (!groups[r.area]) {
        groups[r.area] = {
          incidents: 0,
          fatalIncidents: 0,
          lats: [],
          lngs: [],
          roads: [],
          types: {},
        };
      }
      const g = groups[r.area];
      g.incidents++;
      if (r.severity.toLowerCase() === 'fatal') {
        g.fatalIncidents++;
      }
      if (r.latitude !== null) g.lats.push(r.latitude);
      if (r.longitude !== null) g.lngs.push(r.longitude);
      if (r.road_name) g.roads.push(r.road_name);
      g.types[r.incident_type] = (g.types[r.incident_type] || 0) + 1;
    });

    const list: HotspotRecord[] = Object.entries(groups).map(([area, g]) => {
      const avgLat = g.lats.length > 0 ? g.lats.reduce((a, b) => a + b, 0) / g.lats.length : null;
      const avgLng = g.lngs.length > 0 ? g.lngs.reduce((a, b) => a + b, 0) / g.lngs.length : null;
      const topType = Object.entries(g.types).sort((a, b) => b[1] - a[1])[0]?.[0] || 'crash';
      const fatalShare = g.incidents > 0 ? Math.round((g.fatalIncidents / g.incidents) * 1000) / 1000 : 0;

      return {
        area,
        incidents: g.incidents,
        fatalIncidents: g.fatalIncidents,
        fatalShare,
        latitude: avgLat ? Math.round(avgLat * 10000) / 10000 : null,
        longitude: avgLng ? Math.round(avgLng * 10000) / 10000 : null,
        primaryRoad: g.roads[0] || null,
        topIncidentType: topType,
      };
    });

    list.sort((a, b) => b.incidents - a.incidents);

    const sql = `SELECT
  area,
  COUNT(*) AS incidents,
  COUNTIF(LOWER(severity) = 'fatal') AS fatal_incidents,
  ROUND(SAFE_DIVIDE(COUNTIF(LOWER(severity) = 'fatal'), COUNT(*)), 3) AS fatal_share,
  AVG(latitude) AS latitude,
  AVG(longitude) AS longitude
FROM \`PROJECT_ID.bengaluru_mobility.incidents\`
WHERE incident_date BETWEEN @startDate AND @endDate
  AND (@incidentType = 'all' OR incident_type = @incidentType)
  AND area IS NOT NULL
GROUP BY area
ORDER BY incidents DESC
LIMIT @limit;`;

    return {
      hotspots: list.slice(0, limit),
      sql,
      parameters: {
        startDate: params.startDate || '2026-01-01',
        endDate: params.endDate || '2026-06-30',
        incidentType: params.type || 'all',
        limit,
      },
      estimatedBytesProcessed: '2.4 MB (BigQuery Sandbox estimated)',
    };
  }

  public async runInvestigation(params: {
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
  }> {
    const all = this.loadRecords();
    const startDate = params.startDate || '2026-01-01';
    const endDate = params.endDate || '2026-06-30';
    const limit = params.limit || 10;
    const minSampleSize = params.minSampleSize || 3;

    const filtered = all.filter(
      (r) => r.incident_date >= startDate && r.incident_date <= endDate
    );

    switch (params.investigationId) {
      case 'dangerous-junction': {
        const areaGroups: Record<string, { total: number; fatal: number; serious: number; road: string }> = {};
        filtered.forEach((r) => {
          if (!areaGroups[r.area]) {
            areaGroups[r.area] = { total: 0, fatal: 0, serious: 0, road: r.road_name || 'Arterial Corridor' };
          }
          areaGroups[r.area].total++;
          if (r.severity === 'fatal') areaGroups[r.area].fatal++;
          if (r.severity === 'serious') areaGroups[r.area].serious++;
        });

        const rows = Object.entries(areaGroups)
          .map(([area, stats]) => ({
            area,
            total_incidents: stats.total,
            fatal_count: stats.fatal,
            serious_count: stats.serious,
            high_severity_ratio: Math.round(((stats.fatal + stats.serious) / stats.total) * 100),
            primary_road: stats.road,
          }))
          .sort((a, b) => b.total_incidents - a.total_incidents)
          .slice(0, limit);

        const sql = `SELECT
  area,
  COUNT(*) AS total_incidents,
  COUNTIF(LOWER(severity) = 'fatal') AS fatal_count,
  COUNTIF(LOWER(severity) = 'serious') AS serious_count,
  ROUND(SAFE_DIVIDE(COUNTIF(LOWER(severity) IN ('fatal', 'serious')), COUNT(*)) * 100, 1) AS high_severity_ratio,
  ANY_VALUE(road_name) AS primary_road
FROM \`PROJECT_ID.bengaluru_mobility.incidents\`
WHERE incident_date BETWEEN @startDate AND @endDate
  AND area IS NOT NULL
GROUP BY area
ORDER BY total_incidents DESC
LIMIT @limit;`;

        return {
          title: 'Dangerous Junction Clustering Analysis',
          data: rows,
          sql,
          parameters: { startDate, endDate, limit },
          rowCount: rows.length,
          comparisonBaseline: 'City-wide baseline: 34% of recorded incidents are rated fatal or serious.',
          limitations: [
            'Higher incident counts at major junctions (Silk Board, Goraguntepalya) strongly correlate with extreme traffic exposure volume, not necessarily poorer individual driver behavior.',
            'Under-reporting of minor fender-benders skews police-recorded datasets towards high-consequence crashes.',
          ],
          estimatedBytesProcessed: '3.1 MB',
        };
      }

      case 'time-of-day-risk': {
        const hourMap: Record<number, { total: number; fatal: number; crashes: number }> = {};
        for (let h = 0; h < 24; h++) hourMap[h] = { total: 0, fatal: 0, crashes: 0 };

        filtered.forEach((r) => {
          if (r.hour !== null && r.hour >= 0 && r.hour <= 23) {
            hourMap[r.hour].total++;
            if (r.incident_type === 'crash') hourMap[r.hour].crashes++;
            if (r.severity === 'fatal') hourMap[r.hour].fatal++;
          }
        });

        const rows = Object.entries(hourMap).map(([hStr, stats]) => {
          const hour = parseInt(hStr, 10);
          const fatalRate = stats.total > 0 ? Math.round((stats.fatal / stats.total) * 100) : 0;
          const timeBand =
            hour >= 0 && hour <= 5
              ? 'Midnight / Dawn (00-05h)'
              : hour >= 6 && hour <= 10
              ? 'Morning Peak (06-10h)'
              : hour >= 11 && hour <= 16
              ? 'Midday (11-16h)'
              : hour >= 17 && hour <= 21
              ? 'Evening Peak (17-21h)'
              : 'Late Night (22-23h)';

          return {
            hour,
            hour_label: `${hour.toString().padStart(2, '0')}:00`,
            time_band: timeBand,
            incidents: stats.total,
            fatal_count: stats.fatal,
            fatal_percentage: fatalRate,
          };
        });

        const sql = `SELECT
  hour,
  CONCAT(LPAD(CAST(hour AS STRING), 2, '0'), ':00') AS hour_label,
  COUNT(*) AS incidents,
  COUNTIF(LOWER(severity) = 'fatal') AS fatal_count,
  ROUND(SAFE_DIVIDE(COUNTIF(LOWER(severity) = 'fatal'), COUNT(*)) * 100, 1) AS fatal_percentage
FROM \`PROJECT_ID.bengaluru_mobility.incidents\`
WHERE incident_date BETWEEN @startDate AND @endDate
  AND hour IS NOT NULL
GROUP BY hour
ORDER BY hour;`;

        return {
          title: 'Time-of-Day Risk & Fatality Severity Disparity',
          data: rows,
          sql,
          parameters: { startDate, endDate },
          rowCount: rows.length,
          comparisonBaseline: 'Daytime crash fatality share is ~12%, while late-night (22:00–04:00) fatality share jumps to ~58%.',
          limitations: [
            'Hour-of-day analysis requires reliable timestamp logging in the primary source. Approximated or rounded police shift records may cluster at 00:00 or 12:00.',
            'Speeds are higher at night due to empty corridors, magnifying kinetic energy in collisions even with lower total vehicle counts.',
          ],
          estimatedBytesProcessed: '2.8 MB',
        };
      }

      case 'infrastructure-overlap': {
        const areaMap: Record<string, { crashes: number; road_issues: number; violations: number }> = {};
        filtered.forEach((r) => {
          if (!areaMap[r.area]) {
            areaMap[r.area] = { crashes: 0, road_issues: 0, violations: 0 };
          }
          if (r.incident_type === 'crash') areaMap[r.area].crashes++;
          else if (r.incident_type === 'road_issue') areaMap[r.area].road_issues++;
          else if (r.incident_type === 'violation') areaMap[r.area].violations++;
        });

        const rows = Object.entries(areaMap)
          .map(([area, stats]) => ({
            area,
            crashes: stats.crashes,
            road_issues: stats.road_issues,
            violations: stats.violations,
            overlap_score: Math.min(stats.crashes, stats.road_issues * 2),
            has_infrastructure_complaint: stats.road_issues > 0,
          }))
          .sort((a, b) => b.crashes + b.road_issues * 2 - (a.crashes + a.road_issues * 2))
          .slice(0, limit);

        const sql = `WITH AreaAggregates AS (
  SELECT
    area,
    COUNTIF(incident_type = 'crash') AS crashes,
    COUNTIF(incident_type = 'road_issue') AS road_issues,
    COUNTIF(incident_type = 'violation') AS violations
  FROM \`PROJECT_ID.bengaluru_mobility.incidents\`
  WHERE incident_date BETWEEN @startDate AND @endDate
    AND area IS NOT NULL
  GROUP BY area
)
SELECT
  area,
  crashes,
  road_issues,
  violations,
  LEAST(crashes, road_issues * 2) AS overlap_score
FROM AreaAggregates
ORDER BY crashes + (road_issues * 2) DESC
LIMIT @limit;`;

        return {
          title: 'Cross-Domain Infrastructure Defect vs Incident Overlap',
          data: rows,
          sql,
          parameters: { startDate, endDate, limit },
          rowCount: rows.length,
          comparisonBaseline: 'Locations with documented road defects show a 1.8x higher reported crash density.',
          limitations: [
            'CRITICAL CAVEAT: Spatial co-location is correlation, NOT causation. A pothole complaint and a collision occurring in the same 2km radius does NOT prove the pothole caused the crash.',
            'Citizens frequently submit road maintenance complaints for heavily congested roads where they spend the most waiting time, creating citizen-reporting density bias.',
          ],
          estimatedBytesProcessed: '4.2 MB',
        };
      }

      case 'severity-ranking': {
        const areaStats: Record<string, { totalCrashes: number; fatalCrashes: number }> = {};
        filtered
          .filter((r) => r.incident_type === 'crash')
          .forEach((r) => {
            if (!areaStats[r.area]) areaStats[r.area] = { totalCrashes: 0, fatalCrashes: 0 };
            areaStats[r.area].totalCrashes++;
            if (r.severity === 'fatal') areaStats[r.area].fatalCrashes++;
          });

        const rows = Object.entries(areaStats)
          .filter(([_, stats]) => stats.totalCrashes >= minSampleSize)
          .map(([area, stats]) => ({
            area,
            total_crashes: stats.totalCrashes,
            fatal_crashes: stats.fatalCrashes,
            fatal_share_pct: Math.round((stats.fatalCrashes / stats.totalCrashes) * 100),
          }))
          .sort((a, b) => b.fatal_share_pct - a.fatal_share_pct || b.total_crashes - a.total_crashes)
          .slice(0, limit);

        const sql = `SELECT
  area,
  COUNT(*) AS total_crashes,
  COUNTIF(LOWER(severity) = 'fatal') AS fatal_crashes,
  ROUND(SAFE_DIVIDE(COUNTIF(LOWER(severity) = 'fatal'), COUNT(*)) * 100, 1) AS fatal_share_pct
FROM \`PROJECT_ID.bengaluru_mobility.incidents\`
WHERE incident_date BETWEEN @startDate AND @endDate
  AND incident_type = 'crash'
  AND area IS NOT NULL
GROUP BY area
HAVING COUNT(*) >= @minSampleSize
ORDER BY fatal_share_pct DESC, total_crashes DESC
LIMIT @limit;`;

        return {
          title: 'Lethality Share Ranking (Exposure-Adjusted Sample Filter)',
          data: rows,
          sql,
          parameters: { startDate, endDate, minSampleSize, limit },
          rowCount: rows.length,
          comparisonBaseline: 'Enforces minimum sample size (>= 3 recorded incidents) to avoid 1-out-of-1 100% false alarm rankings.',
          limitations: [
            'A high fatality share indicates that WHEN an incident happens here, outcomes are more severe (often due to higher approach speeds or heavy freight interactions like at Goraguntepalya or Hebbal).',
            'This does NOT mean the location has the highest congestion or most raw crashes.',
          ],
          estimatedBytesProcessed: '2.5 MB',
        };
      }

      case 'monthly-trends':
      default: {
        const monthTypeMap: Record<string, Record<string, number>> = {};
        filtered.forEach((r) => {
          const month = r.incident_date.substring(0, 7); // YYYY-MM
          if (!monthTypeMap[month]) monthTypeMap[month] = { crash: 0, violation: 0, road_issue: 0, total: 0 };
          const type = r.incident_type.toLowerCase();
          if (monthTypeMap[month][type] !== undefined) {
            monthTypeMap[month][type]++;
          }
          monthTypeMap[month].total++;
        });

        const rows = Object.entries(monthTypeMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, counts]) => ({
            month,
            crashes: counts.crash || 0,
            violations: counts.violation || 0,
            road_issues: counts.road_issue || 0,
            total_incidents: counts.total || 0,
          }));

        const sql = `SELECT
  DATE_TRUNC(incident_date, MONTH) AS month,
  incident_type,
  COUNT(*) AS incidents
FROM \`PROJECT_ID.bengaluru_mobility.incidents\`
WHERE incident_date BETWEEN @startDate AND @endDate
GROUP BY month, incident_type
ORDER BY month, incident_type;`;

        return {
          title: 'Monthly Incident Evolution & Composition',
          data: rows,
          sql,
          parameters: { startDate, endDate },
          rowCount: rows.length,
          comparisonBaseline: 'Pre-monsoon (April-May) and early monsoon (June) show noticeable uptick in surface road hazard reports.',
          limitations: [
            'Seasonal weather changes directly influence road condition reports and two-wheeler skids on wet metal expansion joints.',
          ],
          estimatedBytesProcessed: '2.1 MB',
        };
      }
    }
  }

  public async getRawIncidents(limit = 100): Promise<IncidentRecord[]> {
    return this.loadRecords().slice(0, limit);
  }
}
