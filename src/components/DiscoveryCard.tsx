import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  Check,
  FileSpreadsheet,
  Info,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import { InvestigationResult } from '../shared/types.ts';

interface DiscoveryCardProps {
  investigation: InvestigationResult | null;
  onExploreFurther: (id: string) => void;
  onExportCsv?: () => void;
}

export const DiscoveryCard: React.FC<DiscoveryCardProps> = ({
  investigation,
  onExploreFurther,
  onExportCsv,
}) => {
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!investigation) return null;

  const isDemo = investigation.sourceMode.includes('DEMO');
  const insight = investigation.insight;

  const handleCopySql = () => {
    navigator.clipboard.writeText(investigation.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 my-6 shadow-xs"
    >
      {/* Header tags */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200/80">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            DISCOVERY FINDING
          </span>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {investigation.investigationId}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {insight.isAiGenerated ? (
            <span className="text-[11px] font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/80 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-600" />
              Generated with Gemini
            </span>
          ) : (
            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Deterministic Evidence Template
            </span>
          )}

          <span
            className={`text-[11px] font-mono px-2 py-0.5 rounded ${
              isDemo
                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
            }`}
          >
            {investigation.sourceMode}
          </span>
        </div>
      </div>

      {/* Main Headline & Narrative */}
      <div className="mt-5">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
          {insight.headline}
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
          {insight.finding}
        </p>
      </div>

      {/* Comparison Baseline Callout */}
      {investigation.comparisonBaseline && (
        <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
          <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700">
            <span className="font-semibold text-slate-900">Comparison Baseline: </span>
            {investigation.comparisonBaseline}
          </div>
        </div>
      )}

      {/* Evidence Bullets */}
      <div className="mt-5 grid sm:grid-cols-2 gap-3">
        {insight.evidenceBullets.map((bullet, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-start gap-2.5 text-xs text-slate-700"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1.5" />
            <span className="leading-relaxed">{bullet}</span>
          </div>
        ))}
      </div>

      {/* Two Column Section: Why it matters vs What the data cannot tell us - Pastel Cards */}
      <div className="mt-5 grid md:grid-cols-2 gap-4">
        {/* Why this matters - Pastel Teal */}
        <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/70">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-900 uppercase tracking-wider mb-2">
            <Lightbulb className="w-4 h-4 text-teal-600" />
            Why this matters for Bengaluru
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {insight.whyItMatters}
          </p>
          {insight.suggestedActions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-teal-200/50">
              <span className="text-[11px] font-semibold text-teal-950 block mb-1.5">
                Suggested interventions:
              </span>
              <ul className="text-xs text-slate-700 space-y-1 pl-4 list-disc marker:text-teal-600">
                {insight.suggestedActions.slice(0, 2).map((act, i) => (
                  <li key={i}>{act}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Caveats - Pastel Amber */}
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            What the data cannot tell us (Caveats)
          </div>
          <ul className="text-xs text-slate-700 space-y-1.5 pl-4 list-disc marker:text-amber-600 leading-relaxed">
            {insight.limitations.map((lim, i) => (
              <li key={i}>{lim}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Footer & SQL Evidence Toggle */}
      <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSql(!showSql)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 border border-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{showSql ? 'Hide SQL Evidence' : 'View SQL Evidence'}</span>
            {showSql ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>
          )}
        </div>

        <button
          onClick={() => onExploreFurther(investigation.investigationId)}
          className="px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <span>Deep-Dive in Investigate Tab</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-teal-700" />
        </button>
      </div>

      {/* Expandable SQL Panel */}
      <AnimatePresence>
        {showSql && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mt-4 pt-4 border-t border-slate-100"
          >
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span className="text-teal-400 font-semibold">BigQuery SQL</span>
                  <span>·</span>
                  <span>{investigation.estimatedBytesProcessed || 'Sandbox Dry-run'}</span>
                  <span>·</span>
                  <span>{investigation.rowCount} rows</span>
                </div>
                <button
                  onClick={handleCopySql}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <pre className="p-3 rounded-xl bg-slate-950 text-[11px] font-mono text-teal-200 overflow-x-auto border border-slate-800 leading-relaxed">
                {investigation.sql}
              </pre>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-mono text-slate-400">
                <span className="text-slate-500">Parameters:</span>
                {Object.entries(investigation.parameters).map(([k, v]) => (
                  <span key={k} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
                    @{k} = "{String(v)}"
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
