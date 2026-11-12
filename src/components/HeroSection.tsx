import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Compass, Search, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onFindUnusual: () => void;
  onAskQuestion: (question: string) => void;
  isSearching: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onFindUnusual,
  onAskQuestion,
  isSearching,
}) => {
  const [inputQuery, setInputQuery] = useState('');

  const sampleQuestions = [
    'Which areas have the most reported crashes?',
    'Are night-time crashes more severe?',
    'Which locations have repeated incidents?',
    'What should city planners investigate first?',
    'Do potholes and road defects correlate with accidents?',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputQuery.trim()) {
      onAskQuestion(inputQuery.trim());
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white via-white to-slate-50 border border-slate-200/80 p-6 sm:p-8 md:p-10 my-4 shadow-xs">
      {/* Soft pastel ambient background lighting */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-teal-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-sky-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50/90 border border-teal-200/80 text-teal-800 text-xs font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Civic Mobility & Road Safety Intelligence</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
          Where is Bengaluru losing its{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700">
            momentum?
          </span>
        </h1>

        <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          Investigate the city with data. Discover patterns. Question assumptions. Explore evidence-backed incident metrics across Silk Board, Hebbal, Goraguntepalya, and ORR.
        </p>

        {/* Primary Hero CTA */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.01, boxShadow: '0 4px 14px 0 rgba(13, 148, 136, 0.25)' }}
            whileTap={{ scale: 0.99 }}
            onClick={onFindUnusual}
            disabled={isSearching}
            className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm sm:text-base flex items-center gap-2.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-teal-200" />
            <span>{isSearching ? 'Investigating records...' : 'Find something unusual'}</span>
            <ArrowRight className="w-4 h-4 text-teal-200" />
          </motion.button>

          <div className="text-xs text-slate-500 flex items-center gap-1.5 px-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            <span>Runs parameterized SQL against validated dataset</span>
          </div>
        </div>

        {/* Question Bar */}
        <div className="mt-8 pt-6 border-t border-slate-200/80">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask in natural language: e.g., 'Are night-time crashes more severe?'"
                className="w-full pl-11 pr-24 py-3 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all font-normal"
              />
              <button
                type="submit"
                disabled={isSearching || !inputQuery.trim()}
                className="absolute right-2 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-xs font-semibold text-teal-800 border border-teal-200/80 disabled:opacity-40 transition-colors cursor-pointer"
              >
                Ask AI
              </button>
            </div>
          </form>

          {/* Quick Question Chips - Soft Pastel Pills */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mr-1">
              <Compass className="w-3 h-3 text-slate-400" />
              Try asking:
            </span>
            {sampleQuestions.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setInputQuery(q);
                  onAskQuestion(q);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-900 border border-slate-200/70 hover:border-teal-200/80 transition-all text-left cursor-pointer font-normal"
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
