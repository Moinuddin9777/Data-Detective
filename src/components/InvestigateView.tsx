import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  BarChart2,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  Copy,
  Download,
  Filter,
  Lightbulb,
  MapPin,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  InvestigationResult,
  SupportedInvestigationId,
} from '../shared/types.ts';

interface InvestigateViewProps {
  investigation: InvestigationResult | null;
  loading: boolean;
  onRunInvestigation: (
    id: SupportedInvestigationId,
    filters?: Record<string, any>
  ) => void;
  onExportCsv: (investigation: InvestigationResult) => void;
}

export const InvestigateView: React.FC<InvestigateViewProps> = ({
  investigation,
  loading,
  onRunInvestigation,
  onExportCsv,
}) => {
  const [selectedId, setSelectedId] = useState<SupportedInvestigationId>(
    (investigation?.investigationId as SupportedInvestigationId) || 'dangerous-junction'
  );
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-06-30');
  const [limit, setLimit] = useState(10);
  const [minSampleSize, setMinSampleSize] = useState(3);
  const [showSqlDrawer, setShowSqlDrawer] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const investigationOptions: {
    id: SupportedInvestigationId;
    title: string;
    icon: any;
    tag: string;
  }[] = [
    {
      id: 'dangerous-junction',
      title: 'Dangerous Junctions',
      icon: MapPin,
      tag: 'Hotspots',
    },
    {
      id: 'time-of-day-risk',
      title: 'Time-of-Day Risk',
      icon: Clock,
      tag: 'Temporal',
    },
    {
      id: 'infrastructure-overlap',
      title: 'Infrastructure Defect Overlap',
      icon: Wrench,
      tag: 'Civic Cross-Analysis',
    },
    {
      id: 'severity-ranking',
      title: 'Lethality Share Ranking',
      icon: Shield,
      tag: 'Statistical',
    },
    {
      id: 'monthly-trends',
      title: 'Monthly Incident Evolution',
      icon: TrendingUp,
      tag: 'Longitudinal',
    },
  ];

  const handleSelectInvestigation = (id: SupportedInvestigationId) => {
    setSelectedId(id);
    onRunInvestigation(id, { startDate, endDate, limit, minSampleSize });
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    onRunInvestigation(selectedId, { startDate, endDate, limit, minSampleSize });
  };

  const handleCopySql = () => {
    if (investigation?.sql) {
      navigator.clipboard.writeText(investigation.sql);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Selector Tabs - Minimal Light Buttons */}
      <div className="flex flex-wrap items-center gap-2 pb-1 overflow-x-auto">
        {investigationOptions.map((opt) => {
          const Icon = opt.icon;
          const isActive = selectedId === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleSelectInvestigation(opt.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-teal-50 text-teal-900 border border-teal-200/90 shadow-xs font-semibold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/90'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
              <span>{opt.title}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 hidden sm:inline">
                {opt.tag}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Parameters Bar */}
      <form
        onSubmit={handleApplyFilters}
        className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Start:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:bg-white focus:border-teal-500 font-mono text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">End:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:bg-white focus:border-teal-500 font-mono text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Row Limit:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value, 10))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:bg-white focus:border-teal-500 text-xs cursor-pointer"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
            </select>
          </div>

          {selectedId === 'severity-ranking' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Min Crashes:</span>
              <input
                type="number"
                min={1}
                max={20}
                value={minSampleSize}
                onChange={(e) => setMinSampleSize(parseInt(e.target.value, 10))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 w-16 text-center font-mono text-xs focus:outline-none focus:bg-white focus:border-teal-500"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Executing SQL...' : 'Run Query'}</span>
          </button>
        </div>
      </form>

      {/* Main Results Container */}
      {loading ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-700">
            Executing parameterized BigQuery SQL against partition...
          </p>
          <p className="text-xs text-slate-400 font-mono">
            Evaluating @startDate = '{startDate}' AND @endDate = '{endDate}'
          </p>
        </div>
      ) : !investigation ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 text-slate-500">
          Select an investigation above to execute queries.
        </div>
      ) : (
        <div className="space-y-6">
          {/* AI Investigator Briefing Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold font-mono px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80">
                  {investigation.title}
                </span>
                <span className="text-xs text-slate-500">
                  {investigation.rowCount} rows processed
                </span>
              </div>

              <div className="flex items-center gap-2">
                {investigation.insight.isAiGenerated ? (
                  <span className="text-[11px] font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/80 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    Gemini Flash Model
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Deterministic Evidence Template
                  </span>
                )}

                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                    investigation.sourceMode.includes('DEMO')
                      ? 'bg-amber-50 text-amber-900 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  }`}
                >
                  {investigation.sourceMode}
                </span>
              </div>
            </div>

            <div className="mt-5">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                {investigation.insight.headline}
              </h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed whitespace-pre-line font-normal">
                {investigation.insight.finding}
              </p>
            </div>

            {/* Evidence Findings Grid */}
            <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {investigation.insight.evidenceBullets.map((bullet, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 flex items-start gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1.5" />
                  <span className="leading-relaxed">{bullet}</span>
                </div>
              ))}
            </div>

            {/* Why this matters & Suggested Actions - Pastel Cards */}
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/70">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-900 uppercase tracking-wider mb-2">
                  <Lightbulb className="w-4 h-4 text-teal-600" />
                  Policy Impact & Why This Matters
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {investigation.insight.whyItMatters}
                </p>
                {investigation.insight.suggestedActions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-teal-200/50">
                    <span className="text-[11px] font-semibold text-teal-950 block mb-1">
                      Auditor Action Items:
                    </span>
                    <ul className="text-xs text-slate-700 space-y-1 pl-4 list-disc marker:text-teal-600">
                      {investigation.insight.suggestedActions.map((act, i) => (
                        <li key={i}>{act}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Data Limitations & Biases
                </div>
                <ul className="text-xs text-slate-700 space-y-1.5 pl-4 list-disc marker:text-amber-600 leading-relaxed">
                  {investigation.insight.limitations.map((lim, i) => (
                    <li key={i}>{lim}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Dynamic Interactive Chart based on Active Investigation */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-teal-600" />
                  Visual Query Projection: {investigation.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Executed against {investigation.sourceMode} partition
                </p>
              </div>

              <button
                onClick={() => onExportCsv(investigation)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Aggregated CSV</span>
              </button>
            </div>

            {/* Chart 1: Dangerous Junction / Clustering */}
            {selectedId === 'dangerous-junction' && (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={investigation.data}
                    margin={{ top: 10, right: 20, left: -10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="area"
                      stroke="#94a3b8"
                      fontSize={11}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} />
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
                    <Legend />
                    <Bar dataKey="total_incidents" name="Total Incidents" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="fatal_count" name="Fatal Crashes" fill="#fb7185" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="serious_count" name="Serious Injuries" fill="#fb923c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Chart 2: Time-of-day risk */}
            {selectedId === 'time-of-day-risk' && (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={investigation.data}
                    margin={{ top: 10, right: 20, left: -10, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient id="colorFatalPctLight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fb7185" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#fb7185" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="colorIncidentsLight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="hour_label" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
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
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="incidents"
                      name="Incident Count"
                      stroke="#0d9488"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorIncidentsLight)"
                    />
                    <Area
                      type="monotone"
                      dataKey="fatal_percentage"
                      name="Fatality Share %"
                      stroke="#fb7185"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorFatalPctLight)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Chart 3: Infrastructure Overlap */}
            {selectedId === 'infrastructure-overlap' && (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={investigation.data}
                    margin={{ top: 10, right: 20, left: -10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="area"
                      stroke="#94a3b8"
                      fontSize={11}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} />
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
                    <Legend />
                    <Bar dataKey="crashes" name="Reported Crashes" fill="#fb7185" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="road_issues" name="Citizen Road Defects (BBMP)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="overlap_score" name="Co-occurrence Score" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Chart 4: Severity Ranking */}
            {selectedId === 'severity-ranking' && (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={investigation.data}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} unit="%" />
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
                      formatter={(val: any) => [`${val}%`, 'Fatal Share']}
                    />
                    <Bar dataKey="fatal_share_pct" name="Fatal Outcome Share (%)" fill="#fb7185" radius={[0, 4, 4, 0]}>
                      {investigation.data.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? '#fb7185' : index === 1 ? '#fb923c' : '#2dd4bf'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Chart 5: Monthly Trends */}
            {selectedId === 'monthly-trends' && (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={investigation.data}
                    margin={{ top: 10, right: 20, left: -10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
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
                    <Legend />
                    <Line type="monotone" dataKey="crashes" name="Crashes" stroke="#fb7185" strokeWidth={2} />
                    <Line type="monotone" dataKey="violations" name="Violations" stroke="#6366f1" strokeWidth={2} />
                    <Line type="monotone" dataKey="road_issues" name="Road Defects" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Expandable SQL Drawer & Raw Query Table */}
          <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowSqlDrawer(!showSqlDrawer)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <Code2 className="w-4 h-4 text-teal-600" />
                <span>Executed BigQuery SQL & Row Data</span>
                {showSqlDrawer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <span>{investigation.estimatedBytesProcessed || 'Sandbox Dry-run'}</span>
              </div>
            </div>

            <AnimatePresence>
              {showSqlDrawer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-slate-100 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-500">
                      Standard SQL Query
                    </span>
                    <button
                      onClick={handleCopySql}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-mono text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedSql ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSql ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <pre className="p-3 rounded-xl bg-slate-900 font-mono text-[11px] text-teal-200 overflow-x-auto border border-slate-800">
                    {investigation.sql}
                  </pre>

                  {/* Raw Data Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                          {investigation.data.length > 0 &&
                            Object.keys(investigation.data[0]).map((col) => (
                              <th key={col} className="p-2.5 font-semibold">
                                {col}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {investigation.data.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            {Object.values(row).map((val: any, cIdx) => (
                              <td key={cIdx} className="p-2.5 text-slate-700">
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
