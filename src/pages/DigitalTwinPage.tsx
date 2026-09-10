import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Splice, SpliceId } from '../types';
import { createFallbackSplice } from '../data/mockData';
import {
  Cpu,
  Radio,
  Activity,
  Layers,
  Zap,
  Gauge,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Maximize2,
  Sliders,
  Shield,
} from 'lucide-react';

export const DigitalTwinPage: React.FC = () => {
  const {
    conveyor,
    splices,
    selectedSpliceId,
    setSelectedSpliceId,
    setActiveTab,
    distanceToStation,
  } = useApp();

  const [viewMode, setViewMode] = useState<'loop' | 'seam_macro' | 'gantry'>('loop');

  const selectedSplice: Splice =
    splices[selectedSpliceId] ||
    splices['S03'] ||
    createFallbackSplice(selectedSpliceId);

  // Calculate position of selected splice on loop
  const loopLength = conveyor?.loopLengthM || 420;
  const currentCoord = conveyor?.currentCoordinateM || 0;
  const speed = conveyor?.speedMs || 3.2;
  const currentSplicePos = (selectedSplice.baselineCoordinate + currentCoord) % loopLength;
  const loopFraction = currentSplicePos / loopLength;

  return (
    <div className="space-y-6 pb-12">
      {/* Title & View Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-600" />
            <span>2D Operational Digital Twin • Conveyor CV-01</span>
          </h2>
          <p className="text-xs text-slate-500">
            Kinematic belt loop coordinate model, splice step geography, and live spatial tracking
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setViewMode('loop')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'loop'
                ? 'bg-white text-cyan-900 font-semibold border border-cyan-300 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Full 420m Loop</span>
          </button>
          <button
            onClick={() => setViewMode('seam_macro')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'seam_macro'
                ? 'bg-white text-cyan-900 font-semibold border border-cyan-300 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Splice Seam Macro</span>
          </button>
          <button
            onClick={() => setViewMode('gantry')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'gantry'
                ? 'bg-white text-cyan-900 font-semibold border border-cyan-300 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Gantry Zone (210m)</span>
          </button>
        </div>
      </div>

      {/* Main 2D Loop Canvas View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Operational Diagram */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-3">
            <div className="flex items-center gap-3">
              <span className="font-mono-tech font-bold text-slate-800">
                BELT LENGTH: 420.0 m
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 font-mono-tech">
                CURRENT TRAVEL: {(conveyor.currentPass * 420 + conveyor.currentCoordinateM).toLocaleString(undefined, { maximumFractionDigits: 1 })} m
              </span>
            </div>
            <div className="flex items-center gap-2 text-cyan-700 font-mono-tech">
              <span>SYNC: {conveyor.referenceState}</span>
            </div>
          </div>

          {/* 2D Oval Loop SVG Representation */}
          <div className="relative w-full bg-slate-50 rounded-xl border border-slate-200 p-4 select-none">
            <svg viewBox="0 0 800 320" className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="tw-belt-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
              </defs>

              {/* Belt Outer Track (Troughing loop path: 200px width radius corners) */}
              {/* Outer boundary */}
              <rect
                x="120"
                y="50"
                width="560"
                height="200"
                rx="100"
                ry="100"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="28"
              />
              {/* Core Steel-Cord Path */}
              <rect
                x="120"
                y="50"
                width="560"
                height="200"
                rx="100"
                ry="100"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="14"
              />
              {/* Center Travel Dash Line with dynamic dashoffset */}
              <rect
                x="120"
                y="50"
                width="560"
                height="200"
                rx="100"
                ry="100"
                fill="none"
                stroke="#0284c7"
                strokeWidth="2"
                strokeDasharray="12 8"
                opacity="0.85"
              />

              {/* Key Station Landmarks on the loop */}
              {/* Tail Pulley & Reference 0m (Leftmost, x=120, y=150) */}
              <g transform="translate(120, 150)">
                <circle cx="0" cy="0" r="28" fill="#ffffff" stroke="#10b981" strokeWidth="2.5" />
                <circle cx="0" cy="0" r="10" fill="#10b981" opacity="0.3" className="animate-ping" />
                <text x="0" y="4" fill="#059669" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  0m
                </text>
                <text x="-40" y="45" fill="#059669" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                  TAIL PULLEY / REF DATUM
                </text>
              </g>

              {/* Head Pulley & Drive 210m (Rightmost, x=680, y=150) */}
              <g transform="translate(680, 150)">
                <circle cx="0" cy="0" r="28" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
                <text x="0" y="4" fill="#0284c7" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  850kW
                </text>
                <text x="40" y="45" fill="#0284c7" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                  HEAD DRIVE PULLEY
                </text>
              </g>

              {/* Inspection Gantry Landmark (Top run at center, x=400, y=50) */}
              <g transform="translate(400, 50)">
                <rect x="-35" y="-18" width="70" height="36" rx="4" fill="#f5f3ff" stroke="#8b5cf6" strokeWidth="2" />
                <text x="0" y="-3" fill="#6b21a8" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  INSPECTION
                </text>
                <text x="0" y="9" fill="#7c3aed" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  KM 0+210
                </text>
                <polygon points="-6,18 6,18 0,26" fill="#8b5cf6" />
              </g>

              {/* Return Idler Station Landmark (Bottom run at center, x=400, y=250) */}
              <g transform="translate(400, 250)">
                <rect x="-25" y="-12" width="50" height="24" rx="3" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
                <text x="0" y="4" fill="#475569" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  RETURN
                </text>
              </g>

              {/* Moving Splices on the 2D Oval Loop */}
              {(Object.values(splices) as Splice[]).map((splice) => {
                const currentDist = (splice.baselineCoordinate + conveyor.currentCoordinateM) % conveyor.loopLengthM;
                const ratio = currentDist / conveyor.loopLengthM;

                let px = 400;
                let py = 50;
                if (ratio < 0.35) {
                  px = 220 + (ratio / 0.35) * 360;
                  py = 50;
                } else if (ratio < 0.5) {
                  const t = ((ratio - 0.35) / 0.15) * Math.PI - Math.PI / 2;
                  px = 580 + 100 * Math.cos(t);
                  py = 150 + 100 * Math.sin(t);
                } else if (ratio < 0.85) {
                  px = 580 - ((ratio - 0.5) / 0.35) * 360;
                  py = 250;
                } else {
                  const t = Math.PI / 2 + ((ratio - 0.85) / 0.15) * Math.PI;
                  px = 220 + 100 * Math.cos(t);
                  py = 150 + 100 * Math.sin(t);
                }

                const isSelected = selectedSpliceId === splice.id;
                const isWarning = splice.condition === 'Warning';
                const col = isWarning ? '#f59e0b' : '#10b981';

                return (
                  <g
                    key={`twin-splice-${splice.id}`}
                    transform={`translate(${px}, ${py})`}
                    className="cursor-pointer transition-all hover:scale-125"
                    onClick={() => setSelectedSpliceId(splice.id)}
                  >
                    {isWarning && (
                      <circle cx="0" cy="0" r="16" fill="#f59e0b" opacity="0.3" className="animate-ping" />
                    )}
                    {isSelected && (
                      <circle cx="0" cy="0" r="18" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeDasharray="3 3" />
                    )}
                    <circle cx="0" cy="0" r="8" fill={col} stroke="#ffffff" strokeWidth="2" />
                    <rect x="-14" y="-22" width="28" height="14" rx="3" fill="#ffffff" stroke={col} strokeWidth="1.5" />
                    <text x="0" y="-12" fill="#0f172a" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      {splice.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Quick Selection Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Target Splice Focus:</span>
              <div className="flex items-center gap-1.5">
                {(Object.values(splices) as Splice[]).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSpliceId(s.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono-tech font-bold cursor-pointer transition-colors ${
                      selectedSpliceId === s.id
                        ? s.condition === 'Warning'
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'bg-cyan-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {s.id} ({s.score})
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500 font-mono-tech">
              Selected: <span className="text-cyan-800 font-bold">{selectedSplice.name}</span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Selected Splice Structural & Telemetry Detail */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-mono-tech text-cyan-700 font-bold">STRUCTURAL COMPONENT</span>
                <h3 className="font-bold text-slate-900 text-base">{selectedSplice.name}</h3>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-mono-tech font-bold ${
                  selectedSplice.condition === 'Warning'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {selectedSplice.condition.toUpperCase()} ({selectedSplice.score}/100)
              </span>
            </div>

            {/* Vulcanized Joint Anatomy Diagram */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Joint Anatomy:</span>
                <span className="font-mono-tech text-slate-800 font-semibold">3-Stage Finger Splice</span>
              </div>

              {/* Cross-section illustration */}
              <div className="relative h-16 w-full bg-white rounded-lg p-2 border border-slate-200 flex flex-col justify-between shadow-2xs">
                <div className="text-[9px] text-slate-500 font-mono-tech flex justify-between">
                  <span>Top Cover Rubber: {selectedSplice.thicknessMm}mm</span>
                  <span>Width: {selectedSplice.widthMm}mm</span>
                </div>
                {/* Visual cords */}
                <div className="flex items-center justify-between gap-1 py-1">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2.5 w-1.5 rounded-full ${
                        selectedSplice.id === 'S03' && i >= 6 && i <= 8
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-cyan-600'
                      }`}
                      title={`Cord Channel #${i * 4 + 1}`}
                    />
                  ))}
                </div>
                <div className="text-[9px] text-slate-500 font-mono-tech flex justify-between">
                  <span>Cord Spec: {selectedSplice.cordType.split('(')[0]}</span>
                  {selectedSplice.id === 'S03' && (
                    <span className="text-amber-700 font-bold">Cords #28-#31 Anomaly</span>
                  )}
                </div>
              </div>
            </div>

            {/* Real-time Kinematic Telemetry */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Baseline Coordinate:</span>
                <span className="font-mono-tech font-bold text-slate-800">{selectedSplice.baselineCoordinate} m</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Installation Date:</span>
                <span className="font-mono-tech text-slate-700">{selectedSplice.installDate}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Total Passes Inspected:</span>
                <span className="font-mono-tech text-cyan-800 font-bold">{selectedSplice.inspectionCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Next Gantry Arrival In:</span>
                <span className="font-mono-tech text-amber-800 font-bold">
                  {(
                    ((210 - ((selectedSplice.baselineCoordinate + currentCoord) % loopLength) + loopLength) % loopLength) /
                    (speed > 0 ? speed : 3.2)
                  ).toFixed(0)}{' '}
                  seconds
                </span>
              </div>
            </div>

            {/* Recommendation pill */}
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs">
              <span className="text-amber-900 block text-[10px] font-bold mb-1">OPERATIONAL RECOMMENDATION:</span>
              <p className="text-slate-700">{selectedSplice.recommendation}</p>
            </div>

            <button
              onClick={() => setActiveTab('passports')}
              className="w-full py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Open Passport & History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
