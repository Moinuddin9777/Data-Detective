import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  BarChart2,
  Compass,
  Download,
  MapPin,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { HotspotRecord } from '../shared/types.ts';
import { BengaluruMap } from './BengaluruMap.tsx';

interface HotspotsViewProps {
  hotspots: HotspotRecord[];
  loading: boolean;
  sourceMode: string;
  onFilterChange: (type: string) => void;
  selectedType: string;
  onExportCsv: () => void;
}

export const HotspotsView: React.FC<HotspotsViewProps> = ({
  hotspots,
  loading,
  sourceMode,
  onFilterChange,
  selectedType,
  onExportCsv,
}) => {
  const [viewMode, setViewMode] = useState<'map' | 'chart'>('map');
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  const activeHotspot = hotspots.find((h) => h.area === selectedArea) || hotspots[0];

  return (
    <div className="space-y-6">
      {/* Header Controls - Minimal Light Panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            Bengaluru Incident Hotspots & Corridors
          </h2>
          <p className="text-xs text-slate-500">
            Top arterial nodes ranked by incident density across active {sourceMode} partition
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-white text-slate-900 border border-slate-200/90 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-teal-600" />
              <span>Map View</span>
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'chart'
                  ? 'bg-white text-slate-900 border border-slate-200/90 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Ranked Chart</span>
            </button>
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => onFilterChange(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-teal-500 cursor-pointer"
          >
            <option value="all">All Incident Types</option>
            <option value="crash">Crashes Only</option>
            <option value="violation">Violations Only</option>
            <option value="road_issue">Road Defects Only</option>
          </select>

          <button
            onClick={onExportCsv}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 rounded-2xl bg-white border border-slate-200 flex items-center justify-center animate-pulse text-slate-400">
          Loading hotspot nodes...
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Visual: Map or Chart */}
          <div className="lg:col-span-2">
            {viewMode === 'map' ? (
              <BengaluruMap
                hotspots={hotspots}
                onSelectHotspot={(area) => setSelectedArea(area)}
                selectedArea={selectedArea}
              />
            ) : (
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    Ranked Incident Count by Location
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">
                    Top {hotspots.length} Nodes
                  </span>
                </div>
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={hotspots}
                      margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                      <YAxis dataKey="area" type="category" stroke="#64748b" fontSize={11} width={110} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e2e8f0',
                          borderRadius: '0.75rem',
                          fontSize: '12px',
                          color: '#0f172a',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Bar dataKey="incidents" name="Total Incidents" fill="#0d9488" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="fatalIncidents" name="Fatal Crashes" fill="#fb7185" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Focal Node Inspector */}
          <div className="space-y-4">
            {activeHotspot ? (
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                    Node Focus Inspector
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    Ranked #{hotspots.findIndex((h) => h.area === activeHotspot.area) + 1}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    {activeHotspot.area}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeHotspot.primaryRoad || 'Major arterial corridor'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] text-slate-500 block">Total Incidents</span>
                    <span className="text-xl font-bold font-mono text-teal-700">
                      {activeHotspot.incidents}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] text-slate-500 block">Fatal Crashes</span>
                    <span className="text-xl font-bold font-mono text-rose-600">
                      {activeHotspot.fatalIncidents}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs text-slate-600">Fatal Severity Proportion:</span>
                  <span className="text-sm font-bold font-mono text-amber-700">
                    {Math.round(activeHotspot.fatalShare * 100)}%
                  </span>
                </div>

                {activeHotspot.latitude && activeHotspot.longitude && (
                  <div className="text-[11px] font-mono text-slate-500 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    GPS: {activeHotspot.latitude.toFixed(4)}° N, {activeHotspot.longitude.toFixed(4)}° E
                  </div>
                )}

                <div className="text-[11px] text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                  <strong>Reporting Context:</strong> High incident counts reflect extreme vehicle throughput and high reporting rates at major merge nodes.
                </div>
              </div>
            ) : null}

            {/* Quick list of other hotspots */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                All Corridors ({hotspots.length})
              </span>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {hotspots.map((h, i) => (
                  <button
                    key={h.area}
                    onClick={() => setSelectedArea(h.area)}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      activeHotspot?.area === h.area
                        ? 'bg-teal-50 text-teal-900 border border-teal-200/80 font-semibold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="font-medium truncate">
                      {i + 1}. {h.area}
                    </span>
                    <span className="font-mono text-slate-500 font-semibold ml-2">
                      {h.incidents}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
