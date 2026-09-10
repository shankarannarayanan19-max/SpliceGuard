import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Splice, SpliceId } from '../types';
import { ConditionHistoryChart } from '../components/ConditionHistoryChart';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  TrendingDown,
  Wrench,
  Clock,
  Eye,
  Magnet,
  FileText,
  User,
  Download,
  PlusCircle,
  QrCode,
} from 'lucide-react';

export const SplicePassportsPage: React.FC = () => {
  const {
    splices,
    selectedSpliceId,
    setSelectedSpliceId,
    alerts,
    setActiveTab,
    createMaintenanceFromAlert,
  } = useApp();

  const [activeEvidenceTab, setActiveEvidenceTab] = useState<'all' | 'vision' | 'magnetic' | 'context'>('all');
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const currentSplice = splices[selectedSpliceId] || splices['S03'];
  const spliceAlerts = alerts.filter((a) => a.spliceId === currentSplice.id);

  const isWarning = currentSplice.condition === 'Warning';

  const handleDownloadPassport = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-600" />
            <span>Digital Splice Passport Asset Registry</span>
          </h2>
          <p className="text-xs text-slate-500">
            Persistent lifecycle identity, repeated inspection evidence history, and maintenance traceability
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPassport}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-600" />
            <span>{downloadSuccess ? 'Passport Exported (PDF)' : 'Export Digital Passport'}</span>
          </button>

          {isWarning && (
            <button
              onClick={() => {
                const openAlt = alerts.find((a) => a.spliceId === currentSplice.id && a.status === 'Open');
                if (openAlt) createMaintenanceFromAlert(openAlt.id);
                setActiveTab('maintenance');
              }}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Raise Maintenance Work Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Layout: Left Selector, Right Detailed Passport */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Splice Passport Selector Strip */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-bold text-slate-500 px-1">Registered Belt Splices:</div>
          <div className="space-y-2">
            {(Object.values(splices) as Splice[]).map((splice) => {
              const isSelected = selectedSpliceId === splice.id;
              const hasWarning = splice.condition === 'Warning';
              return (
                <div
                  key={splice.id}
                  onClick={() => setSelectedSpliceId(splice.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? hasWarning
                        ? 'bg-amber-50 border-amber-400 shadow-sm'
                        : 'bg-cyan-50 border-cyan-400 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono-tech font-bold text-sm text-slate-900">{splice.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        hasWarning
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {splice.condition}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Score:</span>
                    <span
                      className={`font-mono-tech font-bold ${
                        hasWarning ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {splice.score}/100
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>Datum: {splice.baselineCoordinate}m</span>
                    <span className="font-mono-tech">{splice.inspectionCount} scans</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Technical Honesty Notice */}
          <div className="p-3 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-500 space-y-1 shadow-2xs">
            <div className="font-semibold text-slate-800">Splice Identity Association:</div>
            <p>
              Identity association is computed via rotary encoder continuous displacement calibrated to master physical datum S01 (0m).
            </p>
          </div>
        </div>

        {/* Right 3 Columns: Complete Digital Passport Dossier */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Dossier Header Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shrink-0">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-slate-900 font-mono-tech">{currentSplice.id}</h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-mono-tech font-bold ${
                        isWarning
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {currentSplice.condition.toUpperCase()}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                      {currentSplice.maintenanceStatus}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{currentSplice.name}</div>
                </div>
              </div>

              {/* Digital Score Gauge & Identity QR mock */}
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div
                    className={`font-mono-tech font-extrabold text-3xl ${
                      isWarning ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                  >
                    {currentSplice.score}
                  </div>
                  <div className="text-[10px] font-mono-tech text-slate-500 tracking-wider">
                    HEALTH SCORE / 100
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hidden sm:block" title="Simulated QR Tag">
                  <QrCode className="w-8 h-8 text-slate-700" />
                  <div className="text-[8px] font-mono-tech text-center mt-0.5">PASSPORT ID</div>
                </div>
              </div>
            </div>

            {/* Splice Specifications Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Vulcanized Joint Type</span>
                <span className="font-semibold text-slate-800">{currentSplice.spliceType}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Steel Cord Specification</span>
                <span className="font-semibold text-slate-800">{currentSplice.cordType}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Belt Width / Thickness</span>
                <span className="font-mono-tech font-semibold text-slate-800">
                  {currentSplice.widthMm}mm / {currentSplice.thicknessMm}mm
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Install Date / Baseline</span>
                <span className="font-mono-tech font-semibold text-slate-800">
                  {currentSplice.installDate} ({currentSplice.baselineCoordinate}m)
                </span>
              </div>
            </div>

            {/* Recommendation note */}
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs flex items-start gap-2.5">
              {isWarning ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold text-amber-900">ENGINEERING RECOMMENDATION: </span>
                <span className="text-slate-700">{currentSplice.recommendation}</span>
              </div>
            </div>
          </div>

          {/* Core Visual Component: Longitudinal Condition History Chart (91 -> 68 for S03) */}
          <ConditionHistoryChart
            history={currentSplice.conditionHistory}
            currentScore={currentSplice.score}
            spliceId={currentSplice.id}
          />

          {/* Multi-Modal Evidence Dossier Section */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-600" />
                <span>Multi-Modal Inspection Evidence Dossier</span>
              </h4>
              <span className="text-xs text-slate-500 font-mono-tech">
                Last Capture: Pass #{currentSplice.lastInspectedPass}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vision Card */}
              <div className="p-4 rounded-xl bg-violet-50/60 border border-violet-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-violet-800 font-bold text-xs">
                    <Eye className="w-4 h-4 text-violet-600" />
                    <span>Line-Scan Vision System</span>
                  </div>
                  <span className="text-[10px] font-mono-tech text-slate-500">
                    Confidence: {currentSplice.evidence.vision.confidence}%
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {currentSplice.evidence.vision.description}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-violet-200 font-mono-tech text-slate-600">
                  <div>Surface Cut Depth: <span className="text-slate-900 font-bold">{currentSplice.evidence.vision.surfaceCutsMm} mm</span></div>
                  <div>Edge Wear Factor: <span className="text-slate-900 font-bold">{currentSplice.evidence.vision.edgeWearPct}%</span></div>
                </div>
              </div>

              {/* Magnetic MFL Card */}
              <div className="p-4 rounded-xl bg-cyan-50/60 border border-cyan-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-900 font-bold text-xs">
                    <Magnet className="w-4 h-4 text-cyan-600" />
                    <span>Steel Cord MFL Magnetic Scan</span>
                  </div>
                  <span className="text-[10px] font-mono-tech text-slate-500">
                    Confidence: {currentSplice.evidence.magnetic.confidence}%
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {currentSplice.evidence.magnetic.description}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-cyan-200 font-mono-tech text-slate-600">
                  <div>Flux Leakage Peak: <span className="text-cyan-800 font-bold">{currentSplice.evidence.magnetic.fluxLeakageGauss} G</span></div>
                  <div>Estimated Broken Cords: <span className="text-amber-800 font-bold">{currentSplice.evidence.magnetic.cordBreakagesEst}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Maintenance Traceability & Technician History */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-cyan-600" />
                <span>Physical Maintenance & Technician Feedback History</span>
              </h4>
              <span className="text-xs text-slate-500 font-mono-tech">
                {currentSplice.maintenanceHistory.length} Intervention(s) Recorded
              </span>
            </div>

            {currentSplice.maintenanceHistory.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                No past maintenance interventions recorded for this splice. Condition monitored through automated NDT passes.
              </div>
            ) : (
              <div className="space-y-3">
                {currentSplice.maintenanceHistory.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-tech font-bold text-cyan-700">{m.id}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-800 font-semibold">{m.actionTaken}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 font-mono-tech text-[11px]">
                        <span>Pass #{m.pass}</span>
                        <span>•</span>
                        <span>{m.timestamp}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                      <div>
                        <span>Inspector / Tech:</span>{' '}
                        <span className="text-slate-900 font-semibold">{m.technician}</span>
                      </div>
                      <div>
                        <span>Actual Defect:</span>{' '}
                        <span className="text-slate-900 font-semibold">{m.actualDefect}</span>
                      </div>
                      <div>
                        <span>Observed Severity:</span>{' '}
                        <span className="text-amber-800 font-semibold">{m.observedSeverity}</span>
                      </div>
                    </div>

                    <p className="text-slate-700 pt-1 text-[11px] italic bg-white p-2.5 rounded-lg border border-slate-200">
                      "{m.notes}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
