import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Code2,
  Copy,
  Check,
  ExternalLink,
  FileSpreadsheet,
  Layers,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { IncidentRecord } from '../shared/types.ts';

interface EvidenceViewProps {
  sourceMode: string;
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({ sourceMode }) => {
  const [activeSubTab, setActiveSubTab] = useState<'manifest' | 'schema' | 'raw_data' | 'caveats'>('manifest');
  const [rawIncidents, setRawIncidents] = useState<IncidentRecord[]>([]);
  const [loadingRaw, setLoadingRaw] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    if (activeSubTab === 'raw_data' && rawIncidents.length === 0) {
      setLoadingRaw(true);
      fetch('/api/raw-incidents?limit=100')
        .then((res) => res.json())
        .then((data) => {
          setRawIncidents(data.rows || []);
          setLoadingRaw(false);
        })
        .catch((err) => {
          console.error('Failed to load raw data:', err);
          setLoadingRaw(false);
        });
    }
  }, [activeSubTab]);

  const handleExportRawCsv = () => {
    if (rawIncidents.length === 0) return;
    const headers = Object.keys(rawIncidents[0]).join(',');
    const rows = rawIncidents.map((r) =>
      Object.values(r)
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bengaluru-incidents-raw-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRaw = rawIncidents.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.area.toLowerCase().includes(q) ||
      r.incident_id.toLowerCase().includes(q) ||
      (r.road_name && r.road_name.toLowerCase().includes(q)) ||
      r.severity.toLowerCase().includes(q) ||
      r.incident_type.toLowerCase().includes(q)
    );
  });

  const schemaDefinition = `CREATE TABLE \`PROJECT_ID.bengaluru_mobility.incidents\` (
  incident_id STRING NOT NULL OPTIONS(description="Unique deterministic incident identifier"),
  incident_date DATE NOT NULL OPTIONS(description="Calendar date of recorded incident (YYYY-MM-DD)"),
  area STRING NOT NULL OPTIONS(description="Standardized Bengaluru junction or locality name"),
  incident_type STRING NOT NULL OPTIONS(description="Classification: crash, violation, road_issue"),
  severity STRING NOT NULL OPTIONS(description="Severity grade: fatal, serious, minor, unknown"),
  source_name STRING NOT NULL OPTIONS(description="Originating dataset title or agency"),
  source_url STRING NOT NULL OPTIONS(description="Canonical documentation or download URL"),
  latitude FLOAT64 OPTIONS(description="WGS84 latitude coordinate"),
  longitude FLOAT64 OPTIONS(description="WGS84 longitude coordinate"),
  road_name STRING OPTIONS(description="Specific arterial, ring road, or junction name"),
  description STRING OPTIONS(description="Brief event description or police summary"),
  hour INT64 OPTIONS(description="Optional 24-hour timestamp (0-23) if recorded in source")
)
PARTITION BY incident_date
CLUSTER BY area, incident_type, severity;`;

  return (
    <div className="space-y-6">
      {/* Sub navigation - Minimal Light Panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" />
            Evidence, Provenance & Reproducibility Console
          </h2>
          <p className="text-xs text-slate-500">
            Verify data contracts, source manifests, SQL schemas, and scientific caveats
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
          {[
            { id: 'manifest', label: 'Source Manifest' },
            { id: 'schema', label: 'BigQuery DDL' },
            { id: 'raw_data', label: 'Raw Records' },
            { id: 'caveats', label: 'Mobility Caveats' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-white text-slate-900 border border-slate-200/90 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Source Manifest */}
      {activeSubTab === 'manifest' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-teal-600" />
                Data Provenance & Lineage
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                data/source-manifest.example.json
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">OpenCity Bengaluru Mobility Archive</h4>
                  <a
                    href="https://opencity.in/data/bengaluru-traffic-and-road-safety"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-teal-700 hover:underline flex items-center gap-1 font-medium"
                  >
                    opencity.in <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Canonical reference schema source for Bengaluru crash registries, blackspot audits, and BBMP municipal road repair reports.
                </p>
                <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-200/70 flex justify-between">
                  <span>License: ODbL / CC-BY 4.0</span>
                  <span>Jurisdiction: BBMP Metro</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">Bengaluru Traffic Police Safety Reports</h4>
                  <a
                    href="https://btp.gov.in/RoadSafety.aspx"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-teal-700 hover:underline flex items-center gap-1 font-medium"
                  >
                    btp.gov.in <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Public safety classifications for fatal, serious, and minor injuries across Outer Ring Road and central junctions.
                </p>
                <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-200/70 flex justify-between">
                  <span>Classification: Public Safety</span>
                  <span>Corridors: ORR, Hosur Rd, Ballari Rd</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Workshop Zero-Fabrication Guarantee
              </div>
              <p className="leading-relaxed">
                Every finding in this tool stems strictly from executed BigQuery queries or deterministically loaded records in <code>data/incidents-demo.csv</code>. No synthetic numbers are ever represented as official state statistics.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Schema */}
      {activeSubTab === 'schema' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-teal-600" />
                Canonical BigQuery DDL
              </h3>
              <p className="text-xs text-slate-500">
                Partitioned by incident_date · Clustered by area, incident_type, severity
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(schemaDefinition);
                setCopiedText(true);
                setTimeout(() => setCopiedText(false), 2000);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 border border-slate-200 flex items-center gap-1.5 font-mono cursor-pointer font-medium"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedText ? 'Copied' : 'Copy SQL'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-900 text-xs font-mono text-teal-200 overflow-x-auto border border-slate-800 leading-relaxed shadow-xs">
            {schemaDefinition}
          </pre>
        </div>
      )}

      {/* Tab 3: Raw Data */}
      {activeSubTab === 'raw_data' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by area, ID, road name, severity..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-mono"
              />
            </div>

            <button
              onClick={handleExportRawCsv}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export {filteredRaw.length} Records as CSV</span>
            </button>
          </div>

          {loadingRaw ? (
            <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
              Loading partition records...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="p-2.5 font-semibold">ID</th>
                    <th className="p-2.5 font-semibold">Date</th>
                    <th className="p-2.5 font-semibold">Area</th>
                    <th className="p-2.5 font-semibold">Road</th>
                    <th className="p-2.5 font-semibold">Type</th>
                    <th className="p-2.5 font-semibold">Severity</th>
                    <th className="p-2.5 font-semibold">Hour</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredRaw.map((row) => (
                    <tr key={row.incident_id} className="hover:bg-slate-50">
                      <td className="p-2.5 text-teal-700 font-semibold">{row.incident_id}</td>
                      <td className="p-2.5 text-slate-600">{row.incident_date}</td>
                      <td className="p-2.5 text-slate-900 font-medium">{row.area}</td>
                      <td className="p-2.5 text-slate-500">{row.road_name || '—'}</td>
                      <td className="p-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700 font-medium">
                          {row.incident_type}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            row.severity === 'fatal'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : row.severity === 'serious'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-teal-50 text-teal-800 border border-teal-200'
                          }`}
                        >
                          {row.severity}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-500">
                        {row.hour !== null ? `${row.hour}:00` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Caveats - Pastel Cards */}
      {activeSubTab === 'caveats' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-5 rounded-3xl bg-amber-50/60 border border-amber-200/70 space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Traffic Speed ≠ Road Safety Incidents
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-normal">
              Commuters often equate severe traffic with road crashes. In reality, bumper-to-bumper peak hour traffic at Silk Board or Hebbal often prevents fatal high-speed kinetic collisions, leading primarily to low-speed property-damage scrapes.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Catastrophic fatal collisions disproportionately surge late at night (22:00 to 05:00) when corridors are empty and vehicle speeds double.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-teal-50/60 border border-teal-200/70 space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-teal-950">
              <ShieldAlert className="w-4 h-4 text-teal-600" />
              Reporting & Citizen Density Biases
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-normal">
              Arterial corridors with high smartphone penetration and dense tech-worker populations (Outer Ring Road, Whitefield, Koramangala) generate significantly higher rates of citizen complaint filing than outer peri-urban zones.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Always evaluate findings as <em>reported indicators</em> rather than exhaustive, omniscient ground-truth measurements.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
