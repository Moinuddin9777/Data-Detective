import React from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Layers,
  MapPin,
  Search,
  Settings,
  Sparkles,
} from 'lucide-react';
import { HealthResponse } from '../shared/types.ts';

interface HeaderProps {
  activeTab: 'overview' | 'investigate' | 'hotspots' | 'evidence' | 'setup';
  setActiveTab: (tab: 'overview' | 'investigate' | 'hotspots' | 'evidence' | 'setup') => void;
  health: HealthResponse | null;
  onSwitchMode: (mode: 'demo' | 'bigquery') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  health,
  onSwitchMode,
}) => {
  const isLive = health?.sourceMode === 'LIVE BIGQUERY' || health?.mode === 'live';
  const isDemo = !isLive;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'investigate', label: 'Investigate', icon: Search },
    { id: 'hotspots', label: 'Hotspots', icon: MapPin },
    { id: 'evidence', label: 'Evidence', icon: Layers },
    { id: 'setup', label: 'Setup', icon: Settings },
  ] as const;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      {/* Top Banner Notice for Demo Mode - Soft Pastel Amber */}
      {isDemo && (
        <div className="bg-amber-50/90 border-b border-amber-200/70 px-4 py-1.5 text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-4xl">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-900 tracking-wide border border-amber-300/60">
              SYNTHETIC DEMO
            </span>
            <span className="truncate text-amber-900/90 font-medium">
              Operating on deterministic workshop records. Connect Google BigQuery in Setup to query live Bengaluru data.
            </span>
          </div>
          <button
            onClick={() => setActiveTab('setup')}
            className="text-amber-900 hover:text-amber-950 font-semibold ml-2 underline shrink-0 text-[11px]"
          >
            Connection Setup &rarr;
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2.5 text-left group transition-all"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-700 shadow-xs group-hover:border-teal-300 transition-colors">
              <Sparkles className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base tracking-tight text-slate-900 group-hover:text-teal-900 transition-colors">
                  Bengaluru Traffic Detective
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 hidden sm:inline-block">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal">Find the patterns behind the traffic.</p>
            </div>
          </button>
        </div>

        {/* Navigation Tabs - Minimal Pill Container */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'text-teal-950 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 bg-white rounded-lg border border-slate-200/90 shadow-xs"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 relative z-10 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mode Indicator & Quick Switch */}
        <div className="flex items-center gap-2">
          {isLive ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-mono font-medium tracking-wide">LIVE BIGQUERY</span>
              <button
                onClick={() => onSwitchMode('demo')}
                title="Switch back to demo mode"
                className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 transition-colors ml-1 font-medium cursor-pointer"
              >
                Use Demo
              </button>
            </div>
          ) : isDemo ? (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="font-mono font-medium tracking-wide">SYNTHETIC DEMO</span>
              <button
                onClick={() => onSwitchMode('bigquery')}
                title="Attempt live BigQuery connection"
                className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors ml-1 font-medium cursor-pointer"
              >
                Try Live
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertTriangle className="w-3 h-3 text-rose-500" />
              <span className="font-mono font-medium tracking-wide">NOT CONNECTED</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav Row */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200/80 bg-white/95 py-1.5 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-teal-700 font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
