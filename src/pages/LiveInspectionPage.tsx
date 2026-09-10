import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ScanLine,
  Zap,
  Eye,
  Magnet,
  Radio,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const LiveInspectionPage: React.FC = () => {
  const {
    conveyor,
    splices,
    inspectionStatus,
    approachingSplice,
    distanceToStation,
    currentInspectionEvent,
    inspectionEvents,
    triggerScanSequence,
    setSelectedSpliceId,
    setActiveTab,
    isCameraContaminated,
  } = useApp();

  const isScanning = inspectionStatus === 'Scanning';
  const isComplete = inspectionStatus === 'Scan_Complete';
  const isInZone = inspectionStatus === 'In_Inspection_Zone' || isScanning;

  const targetSplice = approachingSplice || splices['S03'];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Real-time Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-cyan-600" />
            <span>Station #01 Gantry Live Telemetry & Inspection Stream</span>
          </h2>
          <p className="text-xs text-slate-500">
            High-speed dual-modality acquisition (Optical Line-Scan + 64-Channel Steel-Cord MFL)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span className="text-slate-500">Reference Datum:</span>
            <span className="font-mono-tech font-bold text-emerald-700">S01 SYNCHRONIZED</span>
          </div>

          <button
            onClick={() => triggerScanSequence(targetSplice?.id || 'S03')}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Zap className="w-4 h-4" />
            <span>Force Trigger Scan</span>
          </button>
        </div>
      </div>

      {/* Main Inspection Stage Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Inspection Gantry HUD Viewport */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden relative">
          {/* Top HUD telemetry row */}
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-mono-tech">
            <div className="flex items-center gap-3">
              <span className="text-cyan-800 font-bold">GANTRY-01 [KM 0+210]</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-700">VELOCITY: {(conveyor?.speedMs ?? 0).toFixed(1)} m/s</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-500">BELT POS: {(conveyor?.currentCoordinateM ?? 0).toFixed(1)}m</span>
              <span className="text-amber-800 font-bold">PASS #{conveyor?.currentPass ?? 0}</span>
            </div>
          </div>

          {/* Center Visual Stage */}
          <div className="relative h-72 w-full bg-slate-900 flex items-center justify-center p-6 select-none overflow-hidden">
            {/* Background Grid and laser lines */}
            <div className="absolute inset-0 bg-grid-tech opacity-30" />

            {/* Scanning Laser Beam Effect */}
            {isScanning && (
              <div className="absolute inset-x-0 top-0 h-full pointer-events-none">
                <div className="w-full h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-violet-500 shadow-[0_0_20px_#38bdf8] animate-scanline" />
                <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-[1px] animate-pulse" />
              </div>
            )}

            {/* Moving Belt Cross Section Graphic */}
            <div className="relative z-10 w-full max-w-lg">
              {/* Belt carcass */}
              <div className="relative h-16 w-full rounded-lg bg-slate-800 border-2 border-slate-700 shadow-inner overflow-hidden flex items-center">
                {/* Moving texture lines */}
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] bg-[length:40px_100%] animate-conveyor-stripes" />

                {/* Splice representation in viewport */}
                <div
                  className={`relative mx-auto w-40 h-full flex flex-col justify-center items-center px-3 border-x-2 transition-all duration-300 ${
                    isInZone
                      ? 'border-amber-400 bg-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.4)]'
                      : 'border-slate-600 bg-slate-800/40'
                  }`}
                >
                  <div className="text-[10px] font-mono-tech text-amber-300 font-bold tracking-widest">
                    VULCANIZED SEAM
                  </div>
                  <div className="font-mono-tech font-extrabold text-lg text-slate-100">
                    {targetSplice?.id}
                  </div>
                  {isInZone && targetSplice?.id === 'S03' && (
                    <div className="text-[9px] font-mono-tech text-red-400 animate-pulse font-bold">
                      ANOMALY DETECTED
                    </div>
                  )}
                </div>
              </div>

              {/* Overhead Line-Scan Camera Optic Simulation */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <div
                  className={`px-3 py-1 rounded text-[10px] font-mono-tech font-bold flex items-center gap-1.5 border shadow-sm ${
                    isCameraContaminated
                      ? 'bg-amber-950/90 text-amber-200 border-amber-500'
                      : 'bg-violet-950/90 text-violet-200 border-violet-500/60'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>LINE-SCAN CAMERA {isCameraContaminated ? '(DUST ATTENUATED)' : '(12,000 FPS)'}</span>
                </div>
              </div>

              {/* Bottom MFL Sensor Head Simulation */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <div className="px-3 py-1 rounded text-[10px] font-mono-tech font-bold bg-blue-950/90 text-blue-200 border border-blue-500/60 flex items-center gap-1.5 shadow-sm">
                  <Magnet className="w-3.5 h-3.5" />
                  <span>64-CH MFL MAGNETIC FLUX COILS (1.4T)</span>
                </div>
              </div>
            </div>

            {/* Central Stage Overlay Status HUD */}
            <div className="absolute top-4 left-4 z-20">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    isScanning
                      ? 'bg-cyan-400 animate-ping'
                      : isComplete
                      ? 'bg-emerald-400'
                      : 'bg-amber-400 animate-pulse'
                  }`}
                />
                <span className="font-mono-tech font-bold text-sm text-slate-100">
                  {inspectionStatus === 'Approaching' && `APPROACHING: ${(distanceToStation ?? 0).toFixed(1)} m`}
                  {inspectionStatus === 'In_Inspection_Zone' && 'INSPECTION ZONE ENTERED'}
                  {inspectionStatus === 'Scanning' && 'ACTIVE MULTI-MODAL SCAN IN PROGRESS'}
                  {inspectionStatus === 'Scan_Complete' && 'INSPECTION COMPLETE • EVIDENCE READY'}
                  {inspectionStatus === 'Idle' && 'MONITORING STANDBY'}
                </span>
              </div>
            </div>

            {/* Encoder Travel Progression Bar at bottom of stage */}
            <div className="absolute bottom-2 inset-x-4 flex items-center justify-between text-[10px] font-mono-tech text-slate-400">
              <span>Station Reference: 210.0 m</span>
              <span>Encoder Resolution: 0.042 mm/pulse</span>
            </div>
          </div>

          {/* Sequential Step Progress Bar */}
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div
                className={`p-2 rounded-lg border ${
                  conveyor.referenceState === 'Synchronized'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-mono-tech">STEP 1</div>
                <div className="truncate">Reference Verified</div>
              </div>

              <div
                className={`p-2 rounded-lg border ${
                  distanceToStation < 20
                    ? 'bg-cyan-50 border-cyan-300 text-cyan-800 font-semibold'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-mono-tech">STEP 2</div>
                <div className="truncate">Splice Approaching</div>
              </div>

              <div
                className={`p-2 rounded-lg border ${
                  isInZone
                    ? 'bg-violet-50 border-violet-300 text-violet-800 font-semibold'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-mono-tech">STEP 3</div>
                <div className="truncate">Active Scanning</div>
              </div>

              <div
                className={`p-2 rounded-lg border ${
                  isComplete
                    ? 'bg-amber-50 border-amber-300 text-amber-800 font-semibold'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-mono-tech">STEP 4</div>
                <div className="truncate">Evidence Bound</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Real-time Multi-Modal Evidence & Condition Verdict */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-600" />
                  <span>Associated Evidence: {targetSplice?.id}</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-mono-tech">
                  Pass #{conveyor.currentPass} Captured Data
                </span>
              </div>

              <div className="text-right">
                <div
                  className={`font-mono-tech font-extrabold text-2xl ${
                    targetSplice?.condition === 'Warning' ? 'text-amber-600' : 'text-emerald-600'
                  }`}
                >
                  {targetSplice?.score}
                </div>
                <div className="text-[10px] font-mono-tech text-slate-500">CONDITION</div>
              </div>
            </div>

            {/* Modality A: Vision Line-Scan Evidence Card */}
            <div className="p-3.5 rounded-xl bg-violet-50/60 border border-violet-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-violet-800">
                  <Eye className="w-4 h-4 text-violet-600" />
                  <span>Modality A: Vision Line-Scan</span>
                </div>
                <span className="text-[10px] font-mono-tech text-slate-500">
                  Confidence: {isCameraContaminated ? '74% (Contaminated)' : `${targetSplice?.evidence.vision.confidence}%`}
                </span>
              </div>

              <p className="text-xs text-slate-700">
                {targetSplice?.evidence.vision.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-violet-200 text-slate-600 font-mono-tech">
                <div>Surface Cut: <span className="text-slate-900 font-semibold">{targetSplice?.evidence.vision.surfaceCutsMm} mm</span></div>
                <div>Edge Wear: <span className="text-slate-900 font-semibold">{targetSplice?.evidence.vision.edgeWearPct}%</span></div>
              </div>
            </div>

            {/* Modality B: Magnetic MFL Evidence Card */}
            <div className="p-3.5 rounded-xl bg-cyan-50/60 border border-cyan-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-900">
                  <Magnet className="w-4 h-4 text-cyan-600" />
                  <span>Modality B: Magnetic MFL (Steel Cords)</span>
                </div>
                <span className="text-[10px] font-mono-tech text-slate-500">
                  Confidence: {targetSplice?.evidence.magnetic.confidence}%
                </span>
              </div>

              <p className="text-xs text-slate-700">
                {targetSplice?.evidence.magnetic.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-cyan-200 text-slate-600 font-mono-tech">
                <div>Flux Leakage: <span className="text-cyan-800 font-semibold">{targetSplice?.evidence.magnetic.fluxLeakageGauss} G</span></div>
                <div>Broken Cords: <span className="text-amber-700 font-semibold">~{targetSplice?.evidence.magnetic.cordBreakagesEst}</span></div>
              </div>
            </div>

            {/* Condition Verdict & Trend */}
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">VERDICT:</span>
                <span className="font-bold text-amber-900">
                  {targetSplice?.condition.toUpperCase()} ({targetSplice?.score}/100)
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px]">TREND:</span>
                <span className="font-semibold text-amber-700 flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>{targetSplice?.trend}</span>
                </span>
              </div>
            </div>

            {/* Open Passport Button */}
            <button
              onClick={() => {
                if (targetSplice) setSelectedSpliceId(targetSplice.id);
                setActiveTab('passports');
              }}
              className="w-full py-2.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View Full Passport for {targetSplice?.id}</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Inspection Passes Timeline Strip */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-600" />
            <h3 className="font-bold text-slate-900 text-sm">Recent Longitudinal Inspection Passes</h3>
          </div>
          <span className="text-xs text-slate-500">Timestamped multi-modal pass log</span>
        </div>

        <div className="divide-y divide-slate-100">
          {inspectionEvents.map((event, idx) => {
            const isWarning = event.conditionState === 'Warning';
            return (
              <div
                key={`${event.id}-${idx}`}
                className="py-3 flex flex-wrap items-center justify-between gap-4 text-xs hover:bg-slate-50 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono-tech font-bold text-cyan-700 min-w-[70px]">
                    PASS #{event.pass}
                  </span>
                  <div
                    className={`px-2 py-0.5 rounded font-mono-tech font-bold text-[11px] ${
                      isWarning
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {event.spliceId}
                  </div>
                  <span className="text-slate-500 font-mono-tech text-[11px]">
                    {event.timestamp}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-slate-600 truncate max-w-md hidden sm:block">
                    <span className="text-slate-500">Vision:</span> {event.visionSummary} •{' '}
                    <span className="text-slate-500">MFL:</span> {event.magneticSummary}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono-tech font-bold ${
                        isWarning ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {event.conditionResult} / 100
                    </span>
                    <button
                      onClick={() => {
                        setSelectedSpliceId(event.spliceId);
                        setActiveTab('passports');
                      }}
                      className="p-1 rounded text-cyan-700 hover:text-cyan-900 hover:bg-cyan-50 transition-colors cursor-pointer"
                      title="Open Passport"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
