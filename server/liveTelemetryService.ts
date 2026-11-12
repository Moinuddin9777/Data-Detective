import type { LiveCorridorStation, LiveTelemetrySnapshot } from '../src/shared/types.ts';

const BENGALURU_STATIONS = [
  { zone: 'Central / CBD', corridor: 'Mekhri Circle & Majestic', latitude: 12.9772, longitude: 77.5713 },
  { zone: 'South Corridor', corridor: 'Silk Board & Electronic City', latitude: 12.9172, longitude: 77.6228 },
  { zone: 'East Tech Belt', corridor: 'Bellandur ORR & Whitefield', latitude: 12.9562, longitude: 77.7011 },
  { zone: 'North Airport', corridor: 'Hebbal & Manyata Nagawara', latitude: 13.0358, longitude: 77.5970 },
  { zone: 'West Freight', corridor: 'Goraguntepalya & Peenya NH-48', latitude: 13.0285, longitude: 77.5408 },
];

function decodeWmoCode(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code >= 1 && code <= 3) return 'Partly Cloudy';
  if (code === 45 || code === 48) return 'Mist / Low Visibility';
  if (code >= 51 && code <= 57) return 'Light Drizzle';
  if (code >= 61 && code <= 67) return 'Active Rain';
  if (code >= 80 && code <= 82) return 'Convective Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Overcast';
}

export class LiveTelemetryService {
  private cachedSnapshot: LiveTelemetrySnapshot | null = null;
  private lastFetchMs = 0;
  private CACHE_TTL_MS = 90 * 1000;

  public async getBengaluruTelemetry(forceRefresh = false): Promise<LiveTelemetrySnapshot> {
    if (!forceRefresh && this.cachedSnapshot && Date.now() - this.lastFetchMs < this.CACHE_TTL_MS) {
      return this.cachedSnapshot;
    }

    try {
      const lats = BENGALURU_STATIONS.map((s) => s.latitude).join(',');
      const lngs = BENGALURU_STATIONS.map((s) => s.longitude).join(',');
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,precipitation,rain,weather_code,wind_speed_10m&timezone=Asia%2FKolkata`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Open-Meteo HTTP ${response.status}`);
      }

      const payload = await response.json();
      const list = Array.isArray(payload) ? payload : [payload];

      const stations: LiveCorridorStation[] = BENGALURU_STATIONS.map((meta, idx) => {
        const cur = list[idx]?.current || list[0]?.current || {};
        const temp = typeof cur.temperature_2m === 'number' ? Math.round(cur.temperature_2m * 10) / 10 : 25.4;
        const precip = typeof cur.precipitation === 'number' ? Math.round(cur.precipitation * 10) / 10 : 0;
        const wind = typeof cur.wind_speed_10m === 'number' ? Math.round(cur.wind_speed_10m * 10) / 10 : 11.2;
        const wmo = typeof cur.weather_code === 'number' ? cur.weather_code : 2;
        const surfaceStatus: 'wet' | 'damp' | 'dry' =
          precip >= 1.0 || wmo >= 61 ? 'wet' : precip > 0 || (wmo >= 51 && wmo <= 57) ? 'damp' : 'dry';

        return {
          zone: meta.zone,
          corridor: meta.corridor,
          latitude: meta.latitude,
          longitude: meta.longitude,
          temperatureC: temp,
          precipitationMm: precip,
          windKmh: wind,
          weatherLabel: decodeWmoCode(wmo),
          surfaceStatus,
        };
      });

      const avgTemp =
        Math.round((stations.reduce((acc, s) => acc + s.temperatureC, 0) / stations.length) * 10) / 10;
      const maxPrecip = Math.max(...stations.map((s) => s.precipitationMm));
      const avgWind =
        Math.round((stations.reduce((acc, s) => acc + s.windKmh, 0) / stations.length) * 10) / 10;
      const wetCount = stations.filter((s) => s.surfaceStatus !== 'dry').length;

      const surfaceRiskLevel: 'elevated' | 'moderate' | 'normal' =
        maxPrecip >= 1.5 || wetCount >= 3 ? 'elevated' : wetCount >= 1 || avgWind >= 22 ? 'moderate' : 'normal';

      const advisory =
        surfaceRiskLevel === 'elevated'
          ? 'Active precipitation detected on Bengaluru corridors — elevated two-wheeler skid risk on flyover expansion joints.'
          : surfaceRiskLevel === 'moderate'
          ? 'Damp surface / breezy corridor conditions — monitor approach speeds at elevated merge ramps.'
          : 'Dry carriageway conditions across major ORR, Hosur Rd, and Ballari Rd corridors — standard visibility.';

      const snapshot: LiveTelemetrySnapshot = {
        fetchedAt: new Date().toISOString(),
        cityTempC: avgTemp,
        cityPrecipitationMm: maxPrecip,
        cityWindKmh: avgWind,
        weatherSummary: stations[0]?.weatherLabel || 'Partly Cloudy',
        surfaceRiskLevel,
        advisory,
        stations,
      };

      this.cachedSnapshot = snapshot;
      this.lastFetchMs = Date.now();
      return snapshot;
    } catch {
      // Non-blocking fallback if external network is unreachable
      const fallback: LiveTelemetrySnapshot = this.cachedSnapshot || {
        fetchedAt: new Date().toISOString(),
        cityTempC: 24.8,
        cityPrecipitationMm: 0,
        cityWindKmh: 12.4,
        weatherSummary: 'Partly Cloudy',
        surfaceRiskLevel: 'normal',
        advisory: 'Dry carriageway conditions across major Bengaluru arterial corridors.',
        stations: BENGALURU_STATIONS.map((s) => ({
          ...s,
          temperatureC: 24.8,
          precipitationMm: 0,
          windKmh: 12.4,
          weatherLabel: 'Partly Cloudy',
          surfaceStatus: 'dry' as const,
        })),
      };
      return fallback;
    }
  }
}
