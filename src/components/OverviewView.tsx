import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BarChart3,
  Clock,
  MapPin,
  PieChart,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  InvestigationResult,
  OverviewMetrics,
  SupportedInvestigationId,
} from '../shared/types.ts';
import { DiscoveryCard } from './DiscoveryCard.tsx';
import { KpiRow } from './KpiRow.tsx';

interface OverviewViewProps {
  metrics: OverviewMetrics | null;
  loading: boolean;
  sourceMode: string;
  discoveryResult: InvestigationResult | null;
  onRunInvestigation: (id: SupportedInvestigationId) => void;
  onNavigateToTab: (tab: 'investigate' | 'hotspots' | 'evidence' | 'setup') => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  metrics,
  loading,
  sourceMode,
  discoveryResult,
  onRunInvestigation,
  onNavigateToTab,
}) => {
  // Severity chart data with pleasing pastel tones
  const severityData = metrics?.severityCounts
    ? [
        { name: 'Fatal', count: metrics.severityCounts.fatal || 0, color: '#fb7185' },
        { name: 'Serious', count: metrics.severityCounts.serious || 0, color: '#fb923c' },
        { name: 'Minor', count: metrics.severityCounts.minor || 0, color: '#2dd4bf' },
        { name: 'Unknown', count: metrics.severityCounts.unknown || 0, color: '#94a3b8' },
      ]
    : [];

  // Incident type data
  const typeData = metrics?.typeCounts
    ? [
        { name: 'Crashes', count: metrics.typeCounts.crash || 0, fill: '#0d9488' },
        { name: 'Violations', count: metrics.typeCounts.violation || 0, fill: '#6366f1' },
        { name: 'Road Defects', count: metrics.typeCounts.road_issue || 0, fill: '#f59e0b' },
      ]
    : [];

  const investigationCards: {
    id: SupportedInvestigationId;
    title: string;
    description: string;
    tag: string;
    icon: any;
    tagBg: string;
    accent: string;
  }[] = [
    {
      id: 'dangerous-junction',
      title: 'Dangerous Junction Mystery',
      description: 'Where do recorded crashes cluster, and which nodes warrant further infrastructure audits?',
      tag: 'HOTSPOTS',
      icon: MapPin,
      tagBg: 'bg-teal-50 text-teal-800 border-teal-200/80',
      accent: 'text-teal-700',
    },
    {
      id: 'time-of-day-risk',
      title: 'Time-of-Day Risk & Fatality Spike',
      description: 'Why do late-night crashes (22:00–04:00) cause 2.5x more fatal outcomes than peak daytime jams?',
      tag: 'TEMPORAL',
      icon: Clock,
      tagBg: 'bg-rose-50 text-rose-800 border-rose-200/80',
      accent: 'text-rose-600',
    },
    {
      id: 'infrastructure-overlap',
      title: 'Infrastructure & Road Defect Overlap',
      description: 'Do recorded pothole/drainage complaints spatially correlate with collision locations? (Correlation ≠ Causation)',
      tag: 'CROSS-DATASET',
      icon: Wrench,
      tagBg: 'bg-amber-50 text-amber-800 border-amber-200/80',
      accent: 'text-amber-600',
    },
    {
      id: 'severity-ranking',
      title: 'Lethality Share Ranking',
      description: 'Adjust for sample size (>= 3 incidents) to isolate high-speed corridors with catastrophic outcomes.',
      tag: 'STATISTICAL',
      icon: ShieldAlert,
      tagBg: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
      accent: 'text-indigo-600',
    },
    {
      id: 'monthly-trends',
      title: 'Monthly Incident Evolution',
      description: 'Track seasonal variations and pre-monsoon road hazard complaints across calendar partitions.',
      tag: 'LONGITUDINAL',
      icon: TrendingUp,
      tagBg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
      accent: 'text-emerald-700',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Dynamic KPI Bar */}
      <KpiRow metrics={metrics} loading={loading} sourceMode={sourceMode} />

      {/* Discovery Card (if generated from "Find something unusual") */}
      {discoveryResult && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Latest Automated Investigation Finding
            </span>
          </div>
          <DiscoveryCard
            investigation={discoveryResult}
            onExploreFurther={() => onNavigateToTab('investigate')}
          />
        </div>
      )}

      {/* Core Investigations Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Predefined Investigations
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Safe, parameterized BigQuery SQL queries mapped to civic mobility questions
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('investigate')}
            className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 cursor-pointer"
          >
            Open Investigator Studio &rarr;
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {investigationCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
                whileHover={{ y: -3, transition: { duration: 0.15 } }}
                className="flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 cursor-pointer group transition-all"
                onClick={() => onRunInvestigation(card.id)}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold border ${card.tagBg}`}>
                      {card.tag}
                    </span>
                    <Icon className={`w-4 h-4 ${card.accent} group-hover:scale-110 transition-transform`} />
                  </div>

                  <h3 className="text-base font-semibold text-slate-900 group-hover:text-teal-800 transition-colors">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed font-normal">
                    {card.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500 group-hover:text-teal-700 transition-colors">
                  <span>Run Investigation</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Aggregate Visualizations Grid - Light Corporate Recharts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Severity Breakdown */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-600" />
                Recorded Incident Severity Distribution
              </h3>
              <p className="text-[11px] text-slate-500">
                Fatal vs serious vs minor outcome proportion
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {metrics?.incidentCount || 0} Total
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={severityData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#0f172a',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(val: any) => [`${val} records`, 'Count']}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex items-center justify-around text-xs font-mono text-slate-600 border-t border-slate-100 pt-3">
            {severityData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span>
                  {s.name}: <strong className="text-slate-900">{s.count}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Incident Type Distribution */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-600" />
                Incident Domain Composition
              </h3>
              <p className="text-[11px] text-slate-500">
                Crash safety vs enforcement violation vs municipal road defect
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Multi-source
            </span>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={typeData}
                margin={{ top: 10, right: 20, left: 20, bottom: 5 }}
              >
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} tickLine={false} width={95} />
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
                <Bar dataKey="count" fill="#0d9488" radius={[0, 6, 6, 0]}>
                  {typeData.map((entry, idx) => (
                    <Cell key={`bar-${idx}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <strong>Mobility Context:</strong> Crashes represent tangible physical impacts, while road defects stem from citizen civic complaints filed via BBMP portals.
          </div>
        </div>
      </div>
    </div>
  );
};
