import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Compass, Flame, ShieldAlert } from 'lucide-react';
import { OverviewMetrics } from '../shared/types.ts';

interface KpiRowProps {
  metrics: OverviewMetrics | null;
  loading: boolean;
  sourceMode: string;
}

export const KpiRow: React.FC<KpiRowProps> = ({ metrics, loading, sourceMode }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 my-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl bg-white border border-slate-200 animate-pulse p-4 shadow-xs"
          />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Recorded Incidents',
      value: metrics?.incidentCount !== undefined ? metrics.incidentCount.toLocaleString() : '0',
      subtitle: `${metrics?.typeCounts?.crash || 0} crashes · ${metrics?.typeCounts?.road_issue || 0} road defects`,
      icon: ShieldAlert,
      iconBg: 'bg-teal-50 text-teal-700 border-teal-200/60',
      topBorder: 'bg-teal-500',
    },
    {
      label: 'Locations Covered',
      value: metrics?.areasCovered !== undefined ? metrics.areasCovered.toString() : '0',
      subtitle: 'Key Bengaluru arterial nodes',
      icon: Compass,
      iconBg: 'bg-sky-50 text-sky-700 border-sky-200/60',
      topBorder: 'bg-sky-500',
    },
    {
      label: 'Observation Window',
      value: metrics?.firstDate && metrics?.lastDate ? `${metrics.firstDate.slice(5)} to ${metrics.lastDate.slice(5)}` : '2026',
      subtitle: metrics?.firstDate ? `Full year: ${metrics.firstDate.slice(0, 4)}` : '2026 partition',
      icon: Calendar,
      iconBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
      topBorder: 'bg-indigo-500',
    },
    {
      label: 'Highest-Priority Area',
      value: metrics?.highestPriorityArea?.area || 'Silk Board',
      subtitle: metrics?.highestPriorityArea
        ? `${Math.round(metrics.highestPriorityArea.fatalShare * 100)}% fatal share (${metrics.highestPriorityArea.incidents} incidents)`
        : 'Assessing density',
      icon: Flame,
      iconBg: 'bg-rose-50 text-rose-700 border-rose-200/60',
      topBorder: 'bg-rose-400',
    },
  ];

  return (
    <div className="my-6">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active Dataset Baseline
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {sourceMode}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 hidden sm:block">
          Aggregated dynamically from query execution
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-xs group"
            >
              {/* Subtle top indicator */}
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${card.topBorder}`} />

              <div className="flex items-start justify-between">
                <p className="text-xs font-medium text-slate-500 group-hover:text-slate-700 transition-colors">
                  {card.label}
                </p>
                <div className={`p-2 rounded-xl border ${card.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-2.5">
                <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 truncate">
                  {card.value}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 truncate">
                  {card.subtitle}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
