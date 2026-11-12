import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Compass, MapPin } from 'lucide-react';
import { HotspotRecord } from '../shared/types.ts';

interface BengaluruMapProps {
  hotspots: HotspotRecord[];
  onSelectHotspot: (area: string) => void;
  selectedArea: string | null;
}

// Bengaluru Bounding Box approx:
// Lat: 12.80 to 13.10 N
// Lng: 77.45 to 77.78 E
const BENGALURU_BBOX = {
  minLat: 12.80,
  maxLat: 13.10,
  minLng: 77.45,
  maxLng: 77.78,
};

export const BengaluruMap: React.FC<BengaluruMapProps> = ({
  hotspots,
  onSelectHotspot,
  selectedArea,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<HotspotRecord | null>(null);

  // Filter only hotspots that have genuine coordinates
  const validPoints = hotspots.filter(
    (h) => h.latitude !== null && h.longitude !== null
  );

  const mapWidth = 800;
  const mapHeight = 540;

  // Projection formula from GPS lat/lng to SVG x/y
  const project = (lat: number, lng: number) => {
    const x =
      ((lng - BENGALURU_BBOX.minLng) /
        (BENGALURU_BBOX.maxLng - BENGALURU_BBOX.minLng)) *
      mapWidth;
    // Invert latitude for SVG y-axis
    const y =
      mapHeight -
      ((lat - BENGALURU_BBOX.minLat) /
        (BENGALURU_BBOX.maxLat - BENGALURU_BBOX.minLat)) *
        mapHeight;
    return { x, y };
  };

  const ringRoadCenter = project(12.96, 77.62);

  return (
    <div className="relative rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs overflow-hidden">
      {/* Map Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-teal-600" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Geospatial Node Plotter (WGS84)
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-teal-800 border border-slate-200 font-medium">
            {validPoints.length} Geocoded Junctions
          </span>
        </div>
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
          <span>Radius = incident count · Color = fatal severity %</span>
        </div>
      </div>

      {/* Map Canvas / SVG Area - Minimal Light Theme */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-slate-50/70 rounded-xl overflow-hidden border border-slate-200/80 flex items-center justify-center">
        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="w-full h-full select-none"
        >
          {/* Schematic Outer Ring Road & Radial Corridors */}
          <g stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" fill="none">
            {/* Outer Ring Road approximation - Soft Pastel Teal */}
            <ellipse
              cx={ringRoadCenter.x}
              cy={ringRoadCenter.y}
              rx="220"
              ry="160"
              stroke="#0d9488"
              strokeWidth="1.5"
              strokeDasharray="6 4"
              opacity="0.35"
            />
            {/* North-South corridor (Ballari Road to Hosur Road) */}
            <path
              d={`M ${project(13.08, 77.59).x} ${project(13.08, 77.59).y} L ${ringRoadCenter.x} ${ringRoadCenter.y} L ${project(12.82, 77.67).x} ${project(12.82, 77.67).y}`}
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
            {/* East-West corridor (Old Madras Road to Mysore Road) */}
            <path
              d={`M ${project(12.95, 77.52).x} ${project(12.95, 77.52).y} L ${ringRoadCenter.x} ${ringRoadCenter.y} L ${project(12.98, 77.75).x} ${project(12.98, 77.75).y}`}
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
          </g>

          {/* Corridor text labels */}
          <text
            x={project(13.06, 77.59).x + 10}
            y={project(13.06, 77.59).y}
            fill="#64748b"
            fontSize="10"
            fontFamily="monospace"
          >
            Ballari Rd / Airport Corridor
          </text>
          <text
            x={project(12.84, 77.67).x - 110}
            y={project(12.84, 77.67).y + 12}
            fill="#64748b"
            fontSize="10"
            fontFamily="monospace"
          >
            Hosur Rd / E-City Toll
          </text>
          <text
            x={project(12.98, 77.73).x - 40}
            y={project(12.98, 77.73).y - 12}
            fill="#64748b"
            fontSize="10"
            fontFamily="monospace"
          >
            Whitefield Corridor
          </text>
          <text
            x={project(12.95, 77.53).x + 8}
            y={project(12.95, 77.53).y}
            fill="#64748b"
            fontSize="10"
            fontFamily="monospace"
          >
            Mysore Rd Corridor
          </text>

          {/* Render Geocoded Hotspot Nodes - Pastel Palette */}
          {validPoints.map((point) => {
            const { x, y } = project(point.latitude!, point.longitude!);
            const isSelected = selectedArea === point.area;
            const isFatalHeavy = point.fatalShare >= 0.4;
            const radius = Math.max(7, Math.min(20, point.incidents * 2.1));

            const pinColor = isFatalHeavy
              ? '#f43f5e' // Soft rose
              : point.fatalShare >= 0.2
              ? '#fb923c' // Warm amber
              : '#0d9488'; // Pastel teal

            return (
              <g
                key={point.area}
                onClick={() => onSelectHotspot(point.area)}
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="cursor-pointer transition-transform duration-150"
              >
                {/* Pulse ring for high severity */}
                {isFatalHeavy && (
                  <circle
                    cx={x}
                    cy={y}
                    r={radius + 8}
                    fill={pinColor}
                    opacity="0.2"
                    className="animate-ping"
                  />
                )}

                {/* Outer shadow / selection ring */}
                <circle
                  cx={x}
                  cy={y}
                  r={radius + (isSelected ? 5 : 2)}
                  fill="none"
                  stroke={isSelected ? '#0f172a' : pinColor}
                  strokeWidth={isSelected ? '2.5' : '1'}
                  opacity={isSelected ? 1 : 0.4}
                />

                {/* Inner bubble */}
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={pinColor}
                  opacity={isSelected ? 0.95 : 0.85}
                />

                {/* Number inside */}
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={radius > 11 ? '11' : '9'}
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {point.incidents}
                </text>

                {/* Locality text label */}
                <text
                  x={x}
                  y={y - radius - 5}
                  textAnchor="middle"
                  fill={isSelected ? '#0f172a' : '#334155'}
                  fontSize="10"
                  fontWeight={isSelected ? 'bold' : '500'}
                  className="pointer-events-none drop-shadow-xs"
                >
                  {point.area}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover / Tooltip Card - Clean Light Floating */}
        {hoveredPoint && (
          <div className="absolute bottom-3 left-3 bg-white/95 border border-slate-200 p-3 rounded-xl shadow-lg backdrop-blur-md pointer-events-none max-w-xs text-xs z-20">
            <div className="font-semibold text-slate-900 text-sm flex items-center justify-between">
              <span>{hoveredPoint.area}</span>
              <span className="font-mono text-teal-700 font-bold">
                {hoveredPoint.incidents} incidents
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {hoveredPoint.primaryRoad || 'Primary arterial corridor'}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-600">Fatal Crashes:</span>
              <span className="font-mono font-bold text-rose-600">
                {hoveredPoint.fatalIncidents} ({Math.round(hoveredPoint.fatalShare * 100)}%)
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              Coords: {hoveredPoint.latitude?.toFixed(4)}, {hoveredPoint.longitude?.toFixed(4)}
            </div>
          </div>
        )}
      </div>

      {/* Honest Attribution Footer */}
      <div className="mt-3 flex items-start gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
        <AlertCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <span>
          <strong>Geospatial Integrity Note:</strong> Pins represent verified WGS84 coordinates from the canonical dataset. No arbitrary external Google Maps API key required. Circle size indicates incident density; rose highlights nodes with over 40% fatal outcomes.
        </span>
      </div>
    </div>
  );
};
