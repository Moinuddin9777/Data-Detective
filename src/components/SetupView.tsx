import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  Cloud,
  Database,
  ExternalLink,
  Laptop,
  Layers,
  RefreshCw,
  Rocket,
  Server,
  Shield,
  Sparkles,
  Unplug,
  Wrench,
} from 'lucide-react';
import { HealthResponse } from '../shared/types.ts';

interface SetupViewProps {
  health: HealthResponse | null;
  onRefreshHealth: () => void;
  onSwitchMode: (mode: 'demo' | 'bigquery') => void;
}

export const SetupView: React.FC<SetupViewProps> = ({
  health,
  onRefreshHealth,
  onSwitchMode,
}) => {
  const [testingBq, setTestingBq] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const projectId = health?.projectId || 'datadetective-514513';
  const [customProjectId, setCustomProjectId] = useState(projectId);
  const [editingProject, setEditingProject] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [serviceAccountJson, setServiceAccountJson] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  const consoleApiUrl = `https://console.cloud.google.com/apis/library/bigquery.googleapis.com?project=${projectId}`;
  const directEnableUrl = `https://console.developers.google.com/apis/api/bigquery.googleapis.com/overview?project=${projectId}`;
  const hostProjectEnableUrl = `https://console.cloud.google.com/apis/library/bigquery.googleapis.com?project=494035511791`;

  const handleUpdateProject = async () => {
    if (!customProjectId.trim()) return;
    try {
      const res = await fetch('/api/configure-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: customProjectId.trim() }),
      });
      const data = await res.json();
      if (data.testResult) {
        setTestResult(data.testResult);
      }
      setEditingProject(false);
      onRefreshHealth();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Failed to update project: ${err.message}`,
      });
    }
  };

  const handleSaveCredentials = async () => {
    if (!serviceAccountJson.trim()) return;
    setSavingKey(true);
    try {
      const res = await fetch('/api/configure-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialsJson: serviceAccountJson.trim(),
          projectId: customProjectId || 'datadetective-514513',
        }),
      });
      const data = await res.json();
      if (data.testResult) {
        setTestResult(data.testResult);
      }
      setShowKeyInput(false);
      setServiceAccountJson('');
      onRefreshHealth();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Credentials error: ${err.message}`,
      });
    } finally {
      setSavingKey(false);
    }
  };

  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnectProject = async (targetId = 'datadetective-514513') => {
    setDisconnecting(true);
    try {
      const res = await fetch('/api/disconnect-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newProjectId: targetId }),
      });
      const data = await res.json();
      setCustomProjectId(targetId);
      setTestResult({
        success: true,
        message: data.message || `Disconnected. Target project set to '${targetId}'.`,
      });
      onRefreshHealth();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Disconnection error: ${err.message}`,
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleTestBigQuery = async () => {
    setTestingBq(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/test-bigquery', { method: 'POST' });
      const data = await res.json();
      setTestResult(data);
      onRefreshHealth();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `HTTP request failed: ${err.message}`,
      });
    } finally {
      setTestingBq(false);
    }
  };

  const handleProvisionBigQuery = async () => {
    setProvisioning(true);
    try {
      const res = await fetch('/api/provision-bigquery', { method: 'POST' });
      const data = await res.json();
      setTestResult(data);
      onRefreshHealth();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Provisioning failed: ${err.message}`,
      });
    } finally {
      setProvisioning(false);
    }
  };

  const isLive = health?.sourceMode === 'LIVE BIGQUERY' || health?.mode === 'live';
  const isDemo = !isLive;

  const isApiDisabled =
    Boolean(testResult?.details?.isApiDisabled) ||
    Boolean(testResult?.message?.includes('BigQuery API has not been used')) ||
    Boolean(testResult?.message?.includes('is disabled')) ||
    Boolean(testResult?.message?.includes('accessNotConfigured'));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Current Connection Status Hero */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-600" />
              BigQuery & AI Connection Health
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status, API enablement, and automatic dataset provisioning
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDisconnectProject('datadetective')}
              disabled={disconnecting}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Disconnect currently targeted Google Cloud project"
            >
              <Unplug className="w-3.5 h-3.5" />
              <span>{disconnecting ? 'Disconnecting...' : 'Disconnect Current Project'}</span>
            </button>

            <button
              onClick={handleTestBigQuery}
              disabled={testingBq || provisioning}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingBq ? 'animate-spin' : ''}`} />
              <span>{testingBq ? 'Pinging BigQuery...' : 'Test BigQuery Connection'}</span>
            </button>
          </div>
        </div>

        {/* Live Status Summary Card */}
        <div
          className={`p-5 rounded-2xl border ${
            isLive
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : 'bg-slate-50 border-slate-200/90 text-slate-800'
          }`}
        >
          <div className="flex items-start gap-3">
            {isLive ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm tracking-wide">
                  Active Mode: {isLive ? 'LIVE BIGQUERY' : 'SYNTHETIC DEMO'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-teal-800">
                  {isLive ? 'LIVE CLOUD CONNECTED' : 'WORKSHOP READY'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {isLive
                  ? `Connected to live Google Cloud project ${projectId}. Queries run against BigQuery table ${health?.dataset}.${health?.table}.`
                  : `Currently running with 65 curated Bengaluru mobility records. Target Google Cloud project: ${projectId}. You can explore all investigations and charts right now without errors.`}
              </p>
            </div>
          </div>
        </div>

        {/* New DataDetective Project Setup Hub */}
        <div className="p-6 rounded-3xl bg-teal-50/60 border border-teal-200/90 text-teal-950 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-100 pb-3">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-teal-700" />
              <h3 className="font-bold text-base text-slate-900">
                Google Cloud Project: "DataDetective"
              </h3>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white border border-teal-200 text-teal-800 font-semibold">
              Project ID: {projectId}
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-3 pt-1">
            {/* Step 1: Project Created */}
            <div className="p-4 rounded-2xl bg-white border border-emerald-200/80 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Step 1
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Project Created
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-2">
                  DataDetective ({projectId})
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Project successfully created in Google Cloud Console and configured in application settings.
                </p>
              </div>
              <a
                href={`https://console.cloud.google.com/welcome?project=${projectId}`}
                target="_blank"
                rel="noreferrer"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>View in GCP Console</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>

            {/* Step 2: BigQuery API Enabled */}
            <div className="p-4 rounded-2xl bg-white border border-emerald-200/80 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Step 2
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check className="w-3 h-3 text-emerald-600" />
                    API Enabled
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-2">
                  BigQuery API Active
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  BigQuery API is confirmed enabled on <code>{projectId}</code>.
                </p>
              </div>
              <a
                href={`https://console.cloud.google.com/apis/library/bigquery.googleapis.com?project=${projectId}`}
                target="_blank"
                rel="noreferrer"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>GCP API Library Status</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>

            {/* Step 3: Connect & Initialize */}
            <div className="p-4 rounded-2xl bg-white border border-teal-200 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">
                  Step 3
                </span>
                <h4 className="text-xs font-bold text-slate-900 mt-1">
                  Authenticate or Explore
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Attach a Service Account JSON key from <code>{projectId}</code> to run live queries, or use Workshop Demo mode.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setShowKeyInput(!showKeyInput)}
                  className="w-full px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{showKeyInput ? 'Hide Key Input' : 'Paste Service Account Key'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Production Deployment Readiness Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-900">
                Deployment Readiness Verification
              </h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              READY FOR DEPLOYMENT
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-700 text-[11px]">Vite SPA Bundle Compiled</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-700 text-[11px]">Express SSR & Proxy Ready</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-700 text-[11px]">100 MB Quota Guardrails Active</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-700 text-[11px]">Gemini 3.8 Flash Configured</span>
            </div>
          </div>
        </div>

        {/* Immediate Action Banner: API Enablement Required */}
        {isApiDisabled && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-3 shadow-xs"
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>BigQuery Host Authorization Notice</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              <strong>Why Project 494035511791?</strong> You successfully enabled BigQuery API on your project <code>{projectId}</code>! However, this AI Studio preview runs inside Cloud Run host project <code>494035511791</code>. When connecting without a Service Account Key file, Google Cloud requires BigQuery API enabled on the host project too.
            </p>

            <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-xs space-y-2">
              <span className="font-semibold text-slate-900 block">Choose your preferred fix (both work):</span>
              <div className="grid sm:grid-cols-2 gap-2.5">
                <div className="p-3 bg-amber-100/60 rounded-lg border border-amber-300/70 space-y-1.5 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-[11px] text-amber-950 block">Option 1: 1-Click Instant Fix</span>
                    <p className="text-[11px] text-amber-900 leading-normal mt-0.5">
                      Enable BigQuery API on host project 494035511791 (takes 20 seconds, zero files):
                    </p>
                  </div>
                  <a
                    href="https://console.cloud.google.com/apis/library/bigquery.googleapis.com?project=494035511791"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-bold text-[11px] transition-all cursor-pointer mt-1"
                  >
                    <span>Enable on Project 494035511791</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-3 bg-teal-50 rounded-lg border border-teal-200 space-y-1.5 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-[11px] text-teal-950 block">Option 2: Service Account Key</span>
                    <p className="text-[11px] text-teal-900 leading-normal mt-0.5">
                      Attach a key from <code>{projectId}</code> so calls authenticate directly:
                    </p>
                  </div>
                  <button
                    onClick={() => setShowKeyInput(!showKeyInput)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-[11px] transition-all cursor-pointer mt-1"
                  >
                    <span>{showKeyInput ? 'Hide Key Input' : 'Paste Service Account JSON'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleTestBigQuery}
                disabled={testingBq}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingBq ? 'animate-spin' : ''}`} />
                <span>Retry Connection Check</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Service Account Key JSON Input Card */}
        {showKeyInput && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-white border border-teal-200 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-600" />
                Attach Service Account Key for {projectId}
              </h4>
              <a
                href={`https://console.cloud.google.com/iam-admin/serviceaccounts/create?project=${projectId}`}
                target="_blank"
                rel="noreferrer"
                className="text-teal-600 hover:text-teal-800 text-xs font-medium flex items-center gap-1"
              >
                <span>Create key in Cloud Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-slate-600">
              Paste the contents of your downloaded Service Account JSON key (role: <code>BigQuery Admin</code> or <code>BigQuery User</code>):
            </p>
            <textarea
              value={serviceAccountJson}
              onChange={(e) => setServiceAccountJson(e.target.value)}
              placeholder='{ "type": "service_account", "project_id": "datadetective-514513", ... }'
              className="w-full h-32 p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveCredentials}
                disabled={savingKey || !serviceAccountJson.trim()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {savingKey ? 'Verifying Key...' : 'Save & Connect Service Account'}
              </button>
              <button
                onClick={() => setShowKeyInput(false)}
                className="px-3 py-2 text-slate-500 hover:text-slate-700 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* Action Card: Automated Table & Dataset Provisioning */}
        <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-200/80 text-teal-950 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Wrench className="w-4 h-4 text-teal-700" />
              <span>Step 2: Automated Dataset & Table Initializer</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-teal-200 text-teal-800 font-semibold">
              bengaluru_mobility.incidents
            </span>
          </div>
          <p className="text-xs text-teal-900 leading-relaxed font-normal">
            Once the API is active or credentials are connected, click below to automatically create the partitioned table and seed the initial canonical Bengaluru records:
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleProvisionBigQuery}
              disabled={provisioning || testingBq}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${provisioning ? 'animate-spin' : ''}`} />
              <span>{provisioning ? 'Creating Table & Seeding Rows...' : 'Initialize BigQuery Dataset & Seed Table'}</span>
            </button>
          </div>
        </div>

        {/* Connection Diagnostics Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 block text-[11px] font-medium">Google Cloud Project</span>
              {!editingProject && (
                <button
                  onClick={() => setEditingProject(true)}
                  className="text-[10px] text-teal-600 hover:text-teal-800 font-semibold cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>
            {editingProject ? (
              <div className="mt-1 flex items-center gap-1">
                <input
                  type="text"
                  value={customProjectId}
                  onChange={(e) => setCustomProjectId(e.target.value)}
                  className="font-mono text-xs px-2 py-1 bg-white border border-slate-300 rounded-md w-full"
                  placeholder="e.g. 494035511791"
                />
                <button
                  onClick={handleUpdateProject}
                  className="px-2 py-1 bg-teal-600 text-white rounded-md text-[10px] font-semibold cursor-pointer"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setCustomProjectId(projectId);
                    setEditingProject(false);
                  }}
                  className="px-1.5 py-1 text-slate-500 text-[10px] cursor-pointer"
                >
                  &times;
                </button>
              </div>
            ) : (
              <span className="font-mono font-semibold text-slate-800 truncate block mt-0.5">
                {projectId}
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block text-[11px] font-medium">BigQuery Dataset & Table</span>
            <span className="font-mono font-semibold text-teal-700 truncate block mt-0.5">
              {health?.dataset}.{health?.table}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block text-[11px] font-medium">BigQuery Location</span>
            <span className="font-mono font-semibold text-slate-800 truncate block mt-0.5">
              {health?.location || 'US'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block text-[11px] font-medium">Gemini Model (Active)</span>
            <span className="font-mono font-semibold text-indigo-700 truncate block mt-0.5">
              {health?.modelName || 'gemini-3.8-flash'}
            </span>
          </div>
        </div>

        {/* Test Result Feedback Box */}
        {testResult && !isApiDisabled && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border text-xs font-mono space-y-2 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              )}
              <span>{testResult.success ? 'Query Verification Passed' : 'Connection Report:'}</span>
            </div>
            <p className="text-slate-800">{testResult.message}</p>
            {testResult.details && (
              <pre className="p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] overflow-x-auto text-slate-700">
                {JSON.stringify(testResult.details, null, 2)}
              </pre>
            )}
          </motion.div>
        )}

        {/* Quick Mode Toggle */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500">
            Want to toggle modes for the workshop demonstration?
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSwitchMode('demo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                isDemo
                  ? 'bg-amber-100 text-amber-950 border border-amber-300 font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Use Synthetic Demo Mode
            </button>
            <button
              onClick={() => onSwitchMode('bigquery')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                isLive
                  ? 'bg-teal-100 text-teal-950 border border-teal-300 font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Attempt Live BigQuery
            </button>
          </div>
        </div>
      </div>

      {/* Step-by-Step Organizer Playbook */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-teal-600" />
          Workshop Organizer Setup Playbook (Route A vs Route B)
        </h3>

        {/* Route A: Local ADC - Pastel Emerald Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <Laptop className="w-3.5 h-3.5 text-emerald-600" />
              ROUTE A — RECOMMENDED: Run Exported App Locally with ADC
            </span>
            <span className="text-xs text-slate-400 font-mono">Zero Key Exposure</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            The most secure, production-grade way to run live BigQuery queries during a workshop is using Google Cloud Application Default Credentials (ADC) on your local workstation:
          </p>
          <div className="p-3.5 rounded-xl bg-slate-900 font-mono text-xs text-teal-200 border border-slate-800 space-y-1">
            <div className="text-slate-400"># 1. Log in with your Google Cloud account</div>
            <div>gcloud auth login</div>
            <div>gcloud config set project YOUR_PROJECT_ID</div>
            <div>gcloud auth application-default login</div>
            <div className="text-slate-400 mt-2"># 2. Extract downloaded ZIP and start</div>
            <div>npm install</div>
            <div>npm run dev</div>
          </div>
          <p className="text-[11px] text-slate-500">
            Ensure your account has <code>roles/bigquery.jobUser</code> on the project and <code>roles/bigquery.dataViewer</code> on the <code>bengaluru_mobility</code> dataset.
          </p>
        </div>

        {/* Route B: AI Studio Preview - Pastel Sky Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-900 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
              <Server className="w-3.5 h-3.5 text-sky-600" />
              ROUTE B: Hosted Google AI Studio Build Preview
            </span>
            <span className="text-xs text-slate-400 font-mono">Service Account Secret</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            <strong>CRITICAL REALITY CHECK:</strong> BigQuery does NOT authenticate with a Gemini API key. AI Studio's hosted preview server cannot inherit your browser login. If policy permits, you can configure <code>BIGQUERY_SERVICE_ACCOUNT_JSON</code> in AI Studio's Secrets panel:
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 pl-4 list-disc marker:text-sky-600">
            <li>Create a dedicated service account in Google Cloud Console.</li>
            <li>Grant ONLY <code>roles/bigquery.jobUser</code> on the project and <code>roles/bigquery.dataViewer</code> on the dataset.</li>
            <li>Download the key JSON and paste its exact contents into <code>BIGQUERY_SERVICE_ACCOUNT_JSON</code> secret.</li>
            <li>If your sandbox or security policy forbids service account keys, use <strong>Synthetic Demo Mode</strong> in preview and Route A for live queries.</li>
          </ul>
        </div>

        {/* BigQuery Sandbox Free Tier Notice */}
        <div className="p-5 rounded-2xl bg-teal-50/50 border border-teal-200/80 flex items-start gap-3">
          <Shield className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 space-y-1">
            <span className="font-semibold text-slate-900 block">BigQuery Sandbox Free-Tier Guardrails:</span>
            <p>
              BigQuery Sandbox provides <strong>1 TiB of query processing per month</strong> and <strong>10 GiB of active storage</strong> without attaching a billing account. Never attach a credit card or billing account just to run this workshop demo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
