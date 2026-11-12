import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HealthResponse,
  HotspotRecord,
  InvestigationResult,
  OverviewMetrics,
  SupportedInvestigationId,
} from './shared/types.ts';
import { Header } from './components/Header.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { OverviewView } from './components/OverviewView.tsx';
import { InvestigateView } from './components/InvestigateView.tsx';
import { HotspotsView } from './components/HotspotsView.tsx';
import { EvidenceView } from './components/EvidenceView.tsx';
import { SetupView } from './components/SetupView.tsx';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'investigate' | 'hotspots' | 'evidence' | 'setup'>('overview');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [hotspots, setHotspots] = useState<HotspotRecord[]>([]);
  const [currentInvestigation, setCurrentInvestigation] = useState<InvestigationResult | null>(null);
  const [discoveryResult, setDiscoveryResult] = useState<InvestigationResult | null>(null);

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingHotspots, setLoadingHotspots] = useState(true);
  const [loadingInvestigation, setLoadingInvestigation] = useState(false);
  const [hotspotType, setHotspotType] = useState('all');

  // Notification / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data: HealthResponse = await res.json();
      setHealth(data);
    } catch (err) {
      console.error('Failed to fetch health:', err);
    }
  };

  const fetchOverview = async () => {
    setLoadingOverview(true);
    try {
      const res = await fetch('/api/overview');
      const data = await res.json();
      if (data && !data.error && data.severityCounts) {
        setMetrics(data);
      }
    } catch (err) {
      console.error('Failed to fetch overview metrics:', err);
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchHotspots = async (type = 'all') => {
    setLoadingHotspots(true);
    try {
      const res = await fetch(`/api/hotspots?type=${type}&limit=12`);
      const data = await res.json();
      setHotspots(data.hotspots || []);
    } catch (err) {
      console.error('Failed to fetch hotspots:', err);
    } finally {
      setLoadingHotspots(false);
    }
  };

  const runInvestigation = async (
    investigationId: SupportedInvestigationId,
    filters: Record<string, any> = {},
    question?: string
  ) => {
    setLoadingInvestigation(true);
    try {
      const res = await fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investigationId,
          filters,
          question,
        }),
      });
      const data: InvestigationResult = await res.json();
      setCurrentInvestigation(data);
      return data;
    } catch (err) {
      console.error('Investigation failed:', err);
      showToast('Investigation query failed. Check server logs.');
      return null;
    } finally {
      setLoadingInvestigation(false);
    }
  };

  // Initial Data Fetch
  useEffect(() => {
    fetchHealth();
    fetchOverview();
    fetchHotspots('all');

    // Run a default investigation for immediate display
    runInvestigation('time-of-day-risk').then((res) => {
      if (res) {
        setDiscoveryResult(res);
      }
    });
  }, []);

  // CTA: "Find something unusual"
  const handleFindUnusual = async () => {
    showToast('Investigating temporal patterns across Bengaluru corridors...');
    const result = await runInvestigation('time-of-day-risk', {
      startDate: '2026-01-01',
      endDate: '2026-06-30',
    });
    if (result) {
      setDiscoveryResult(result);
      // If currently on overview, stay and let the discovery card highlight
      if (activeTab !== 'overview') {
        setActiveTab('overview');
      }
      // Scroll to discovery card
      window.scrollTo({ top: 380, behavior: 'smooth' });
    }
  };

  // Natural language question from Hero
  const handleAskQuestion = async (question: string) => {
    showToast(`Analyzing question: "${question.slice(0, 30)}..."`);
    setActiveTab('investigate');
    const result = await runInvestigation('dangerous-junction', {}, question);
    if (result) {
      showToast(`Mapped to: ${result.title}`);
    }
  };

  // Switch mode between demo and live BigQuery
  const handleSwitchMode = async (mode: 'demo' | 'bigquery') => {
    try {
      const res = await fetch('/api/switch-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Switched active mode to ${mode.toUpperCase()}`);
        fetchHealth();
        fetchOverview();
        fetchHotspots(hotspotType);
        if (currentInvestigation) {
          runInvestigation(currentInvestigation.investigationId as SupportedInvestigationId);
        }
      } else {
        showToast(data.message || 'Mode switch failed');
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  // Export CSV helper
  const handleExportCsv = (inv: InvestigationResult) => {
    if (!inv.data || inv.data.length === 0) return;
    const headers = Object.keys(inv.data[0]).join(',');
    const rows = inv.data.map((row) =>
      Object.values(row)
        .map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${inv.investigationId}-results-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${inv.data.length} records to CSV`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      {/* Toast Banner - Minimal Light Floating */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-18 right-4 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-teal-300 text-xs font-semibold shadow-xl backdrop-blur-md flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        onSwitchMode={handleSwitchMode}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Hero Section shown on Overview */}
        {activeTab === 'overview' && (
          <HeroSection
            onFindUnusual={handleFindUnusual}
            onAskQuestion={handleAskQuestion}
            isSearching={loadingInvestigation}
          />
        )}

        {/* Tab Views */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <OverviewView
                metrics={metrics}
                loading={loadingOverview}
                sourceMode={health?.sourceMode || 'SYNTHETIC DEMO'}
                discoveryResult={discoveryResult}
                onRunInvestigation={(id) => {
                  setActiveTab('investigate');
                  runInvestigation(id);
                }}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            </motion.div>
          )}

          {activeTab === 'investigate' && (
            <motion.div
              key="investigate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <InvestigateView
                investigation={currentInvestigation}
                loading={loadingInvestigation}
                onRunInvestigation={(id, filters) => runInvestigation(id, filters)}
                onExportCsv={handleExportCsv}
              />
            </motion.div>
          )}

          {activeTab === 'hotspots' && (
            <motion.div
              key="hotspots"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <HotspotsView
                hotspots={hotspots}
                loading={loadingHotspots}
                sourceMode={health?.sourceMode || 'SYNTHETIC DEMO'}
                onFilterChange={(type) => {
                  setHotspotType(type);
                  fetchHotspots(type);
                }}
                selectedType={hotspotType}
                onExportCsv={() => {
                  if (currentInvestigation) handleExportCsv(currentInvestigation);
                  else showToast('Exported Hotspots');
                }}
              />
            </motion.div>
          )}

          {activeTab === 'evidence' && (
            <motion.div
              key="evidence"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <EvidenceView sourceMode={health?.sourceMode || 'SYNTHETIC DEMO'} />
            </motion.div>
          )}

          {activeTab === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <SetupView
                health={health}
                onRefreshHealth={fetchHealth}
                onSwitchMode={handleSwitchMode}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Civic Footer - Minimal Light Theme */}
      <footer className="border-t border-slate-200/90 bg-white py-6 px-4 sm:px-6 lg:px-8 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Bengaluru Traffic Detective</span>
            <span>·</span>
            <span>Build with AI Workshop Edition</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>BigQuery Sandbox Ready (1 TiB/mo allowance)</span>
            <span>·</span>
            <span>Gemini Flash Grounded</span>
            <span>·</span>
            <button
              onClick={() => setActiveTab('evidence')}
              className="text-teal-700 hover:text-teal-900 font-medium hover:underline cursor-pointer"
            >
              Methodology & Limitations
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
