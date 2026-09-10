import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Splice, SpliceId } from '../types';
import { AlertTriangle, CheckCircle, ShieldAlert, Radio, Eye, Magnet, Activity } from 'lucide-react';

interface ConveyorVisualizationProps {
  interactive?: boolean;
  compact?: boolean;
  showOverlayStats?: boolean;
}

export const ConveyorVisualization: React.FC<ConveyorVisualizationProps> = ({
  interactive = true,
  compact = false,
  showOverlayStats = true,
}) => {
  const {
    conveyor,
    splices,
    selectedSpliceId,
    setSelectedSpliceId,
    inspectionStatus,
    distanceToStation,
    approachingSplice,
    isCameraContaminated,
  } = useApp();

  const [hoveredSplice, setHoveredSplice] = useState<Splice | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Geometry configuration
  // SVG coordinate space: 1000 x 280
  const LEFT_X = 140;
  const RIGHT_X = 860;
  const TOP_Y = 62;
  const BOTTOM_Y = 142;
  const PULLEY_RADIUS = (BOTTOM_Y - TOP_Y) / 2; // 40
  const TOP_LENGTH = RIGHT_X - LEFT_X; // 720
  const BOTTOM_LENGTH = TOP_LENGTH;
  const CURVE_LENGTH = Math.PI * PULLEY_RADIUS; // ~125.66
  const TOTAL_PATH_LENGTH = 2 * TOP_LENGTH + 2 * CURVE_LENGTH; // ~1691.3px

  // Convert belt travel (0 - 420m) into position along SVG perimeter
  const getSpliceTrackPosition = (baselineMeters: number) => {
    // Current belt position of this splice:
    const distanceM = (baselineMeters + conveyor.currentCoordinateM) % conveyor.loopLengthM;
    const fraction = distanceM / conveyor.loopLengthM;
    const pathDist = fraction * TOTAL_PATH_LENGTH;

    // Segment 1: Top run (left to right, carrying ore)
    if (pathDist <= TOP_LENGTH) {
      const x = LEFT_X + pathDist;
      const y = TOP_Y;
      return { x, y, angle: 0, run: 'top' };
    }
    // Segment 2: Head pulley curve (right side, downward)
    else if (pathDist <= TOP_LENGTH + CURVE_LENGTH) {
      const curveDist = pathDist - TOP_LENGTH;
      const theta = (curveDist / CURVE_LENGTH) * Math.PI - Math.PI / 2;
      const x = RIGHT_X + PULLEY_RADIUS * Math.cos(theta);
      const y = TOP_Y + PULLEY_RADIUS + PULLEY_RADIUS * Math.sin(theta);
      return { x, y, angle: (theta + Math.PI / 2) * (180 / Math.PI), run: 'head' };
    }
    // Segment 3: Bottom return run (right to left)
    else if (pathDist <= 2 * TOP_LENGTH + CURVE_LENGTH) {
      const returnDist = pathDist - (TOP_LENGTH + CURVE_LENGTH);
      const x = RIGHT_X - returnDist;
      const y = BOTTOM_Y;
      return { x, y, angle: 180, run: 'bottom' };
    }
    // Segment 4: Tail pulley curve (left side, upward back to 0m)
    else {
      const curveDist = pathDist - (2 * TOP_LENGTH + CURVE_LENGTH);
      const theta = Math.PI / 2 + (curveDist / CURVE_LENGTH) * Math.PI;
      const x = LEFT_X + PULLEY_RADIUS * Math.cos(theta);
      const y = TOP_Y + PULLEY_RADIUS + PULLEY_RADIUS * Math.sin(theta);
      return { x, y, angle: (theta + Math.PI / 2) * (180 / Math.PI), run: 'tail' };
    }
  };

  const idlerSpacing = 65;
  const topIdlers = [];
  for (let x = LEFT_X + 45; x < RIGHT_X; x += idlerSpacing) {
    topIdlers.push(x);
  }

  const returnIdlers = [];
  for (let x = LEFT_X + 70; x < RIGHT_X - 40; x += 130) {
    returnIdlers.push(x);
  }

  const isScanningActive = inspectionStatus === 'Scanning';
  const isStationActive = inspectionStatus === 'In_Inspection_Zone' || inspectionStatus === 'Scanning';

  return (
    <div className="relative w-full rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      {/* Background ambient lighting fields */}
      <div className="absolute inset-0 bg-grid-tech opacity-60 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-48 bg-cyan-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-80 h-40 bg-amber-500/5 blur-3xl pointer-events-none" />

      {/* Top Floating Telemetry Overlay Bar */}
      {showOverlayStats && (
        <div className="relative z-10 px-5 pt-4 pb-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/90 backdrop-blur-md text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-600"></span>
              </span>
              <span className="font-mono-tech font-bold text-slate-800 tracking-wider">
                {conveyor.id}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                {conveyor.status.toUpperCase()}
              </span>
            </div>

            <div className="h-4 w-px bg-slate-300" />

            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="text-slate-500">Belt Speed:</span>
              <span className="font-mono-tech font-bold text-cyan-700">{(conveyor?.speedMs ?? 0).toFixed(1)} m/s</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-slate-700">
              <span className="text-slate-500">Loop:</span>
              <span className="font-mono-tech text-slate-800">{conveyor?.loopLengthM ?? 420} m</span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 text-slate-700">
              <span className="text-slate-500">Pass:</span>
              <span className="font-mono-tech font-semibold text-amber-700">#{conveyor?.currentPass ?? 0}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Encoder belt coordinate readout */}
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-md border border-slate-300 shadow-2xs">
              <Activity className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
              <span className="text-slate-500">Coord:</span>
              <span className="font-mono-tech font-bold text-cyan-800">
                {(conveyor?.currentCoordinateM ?? 0).toFixed(1)} m
              </span>
            </div>

            {/* Reference State */}
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
              <Radio className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px]">REF S01: {conveyor.referenceState}</span>
            </div>

            {/* Approaching Splice Countdown */}
            {approachingSplice && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-[11px] font-semibold transition-colors ${
                  approachingSplice.id === 'S03'
                    ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>Approaching:</span>
                <span className="font-mono-tech font-bold">{approachingSplice.id}</span>
                <span className="font-mono-tech text-cyan-700">({distanceToStation}m)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main SVG Conveyor Mechanical & Digital Twin Graphic */}
      <div className="relative w-full p-2 sm:p-4 select-none">
        <svg
          viewBox="0 0 1000 240"
          className="w-full h-auto overflow-visible"
          style={{ minHeight: compact ? '160px' : '200px' }}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="beltRubberGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            <linearGradient id="oreBurdenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#854d0e" />
              <stop offset="40%" stopColor="#713f12" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>

            <linearGradient id="pulleySteelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="50%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="stationScanBeam" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
            </linearGradient>

            <linearGradient id="mflFieldGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>

            {/* Splice warning glow filters */}
            <filter id="glowOrange" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glowCyan" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* STRUCTURAL SUPPORT FRAMES & TRUSSES */}
          <g id="structural-framework" opacity="0.45">
            {/* Ground line / Foundation concrete pad */}
            <line x1="80" y1="210" x2="920" y2="210" stroke="#334155" strokeWidth="3" strokeDasharray="6 4" />
            
            {/* Foundation pillars */}
            <rect x="120" y="170" width="40" height="40" fill="#1e293b" rx="2" />
            <rect x="360" y="170" width="30" height="40" fill="#1e293b" rx="2" />
            <rect x="580" y="170" width="30" height="40" fill="#1e293b" rx="2" />
            <rect x="840" y="170" width="40" height="40" fill="#1e293b" rx="2" />

            {/* Diagonal steel truss members */}
            <path
              d="M140,165 L220,95 L300,165 L380,95 L460,165 L540,95 L620,165 L700,95 L780,165 L860,95"
              stroke="#1e293b"
              strokeWidth="2"
              fill="none"
            />
            {/* Main horizontal stringer beams */}
            <line x1="110" y1="95" x2="890" y2="95" stroke="#334155" strokeWidth="4" />
            <line x1="110" y1="165" x2="890" y2="165" stroke="#334155" strokeWidth="3" />
          </g>

          {/* CARRYING IDLERS (Top run trough rollers) */}
          <g id="carrying-idlers">
            {topIdlers.map((x, i) => (
              <g key={`idler-${i}`} transform={`translate(${x}, ${TOP_Y + 7})`}>
                {/* Center flat roller */}
                <rect x="-8" y="0" width="16" height="5" rx="2" fill="#64748b" stroke="#0f172a" strokeWidth="0.8" />
                {/* Left wing trough roller angled 35° */}
                <line x1="-8" y1="3" x2="-18" y2="-4" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
                {/* Right wing trough roller angled 35° */}
                <line x1="8" y1="3" x2="18" y2="-4" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
                {/* Idler bracket stool */}
                <path d="M-12,5 L-6,20 L6,20 L12,5 Z" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
              </g>
            ))}
          </g>

          {/* RETURN IDLERS (Bottom run flat rollers) */}
          <g id="return-idlers">
            {returnIdlers.map((x, i) => (
              <g key={`ret-idler-${i}`} transform={`translate(${x}, ${BOTTOM_Y - 5})`}>
                <rect x="-15" y="0" width="30" height="6" rx="2" fill="#475569" stroke="#0f172a" strokeWidth="0.8" />
                <line x1="0" y1="6" x2="0" y2="16" stroke="#334155" strokeWidth="2.5" />
              </g>
            ))}
          </g>

          {/* TAIL PULLEY ASSEMBLY (Left, x=140, y=102, r=40) */}
          <g id="tail-pulley" transform={`translate(${LEFT_X}, ${TOP_Y + PULLEY_RADIUS})`}>
            {/* Take-up tension rails */}
            <rect x="-55" y="-12" width="25" height="24" fill="#0f172a" stroke="#334155" strokeWidth="1.5" rx="2" />
            <text x="-43" y="4" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="middle">TAKEUP</text>
            
            {/* Outer rim */}
            <circle cx="0" cy="0" r={PULLEY_RADIUS} fill="url(#pulleySteelGrad)" stroke="#64748b" strokeWidth="3" />
            {/* Hub and rotating spokes suggestion */}
            <circle cx="0" cy="0" r="16" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="6" fill="#38bdf8" />
            {/* Rotation direction arrow */}
            <path
              d="M-22,-10 A25,25 0 0,0 -22,10"
              stroke="#38bdf8"
              strokeWidth="2"
              fill="none"
              strokeDasharray="4 2"
            />
          </g>

          {/* HEAD DRIVE PULLEY ASSEMBLY (Right, x=860, y=102, r=40) */}
          <g id="head-pulley" transform={`translate(${RIGHT_X}, ${TOP_Y + PULLEY_RADIUS})`}>
            {/* Drive motor gearbox outline */}
            <rect x="42" y="-30" width="45" height="60" rx="4" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />
            <text x="64" y="-14" fill="#38bdf8" fontSize="7" fontFamily="monospace" textAnchor="middle">850 kW</text>
            <text x="64" y="-3" fill="#94a3b8" fontSize="7" fontFamily="monospace" textAnchor="middle">DRIVE</text>
            <rect x="52" y="10" width="24" height="12" rx="2" fill="#0284c7" />
            <text x="64" y="19" fill="#ffffff" fontSize="7" fontFamily="monospace" textAnchor="middle">942A</text>

            {/* Pulley drum with ceramic lagging texture */}
            <circle cx="0" cy="0" r={PULLEY_RADIUS} fill="url(#pulleySteelGrad)" stroke="#38bdf8" strokeWidth="3" />
            <circle cx="0" cy="0" r="18" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="7" fill="#06b6d4" />
          </g>

          {/* BOTTOM RETURN BELT STRAND */}
          <path
            d={`M${RIGHT_X},${BOTTOM_Y} L${LEFT_X},${BOTTOM_Y}`}
            stroke="#1e293b"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            d={`M${RIGHT_X},${BOTTOM_Y} L${LEFT_X},${BOTTOM_Y}`}
            stroke="#334155"
            strokeWidth="4"
            strokeDasharray="30 15"
          />

          {/* TAIL & HEAD PULLEY BELT WRAPS */}
          <path
            d={`M${LEFT_X},${BOTTOM_Y} A${PULLEY_RADIUS},${PULLEY_RADIUS} 0 0,1 ${LEFT_X},${TOP_Y}`}
            stroke="#1e293b"
            strokeWidth="9"
            fill="none"
          />
          <path
            d={`M${RIGHT_X},${TOP_Y} A${PULLEY_RADIUS},${PULLEY_RADIUS} 0 0,1 ${RIGHT_X},${BOTTOM_Y}`}
            stroke="#1e293b"
            strokeWidth="9"
            fill="none"
          />

          {/* TOP CARRYING BELT STRAND */}
          <path
            d={`M${LEFT_X},${TOP_Y} L${RIGHT_X},${TOP_Y}`}
            stroke="#1e293b"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Iron ore burden material contour on carrying belt */}
          <path
            d={`M${LEFT_X + 15},${TOP_Y - 4} Q${LEFT_X + 200},${TOP_Y - 14} ${LEFT_X + 380},${TOP_Y - 11} T${RIGHT_X - 25},${TOP_Y - 4} L${RIGHT_X - 25},${TOP_Y} L${LEFT_X + 15},${TOP_Y} Z`}
            fill="url(#oreBurdenGrad)"
            opacity="0.85"
          />
          {/* Flow motion particles on ore surface */}
          <path
            d={`M${LEFT_X + 40},${TOP_Y - 6} L${RIGHT_X - 60},${TOP_Y - 6}`}
            stroke="#b45309"
            strokeWidth="2"
            strokeDasharray="18 24"
            opacity="0.6"
          />

          {/* INSPECTION STATION GANTRY (Located at x=500 along top carrying run) */}
          <g id="inspection-station" transform="translate(500, 0)">
            {/* Overhead Gantry Frame Pillars */}
            <rect x="-35" y="12" width="70" height="6" rx="2" fill="#1e293b" stroke="#8b5cf6" strokeWidth="1.2" />
            <line x1="-30" y1="18" x2="-30" y2={TOP_Y - 18} stroke="#475569" strokeWidth="3" />
            <line x1="30" y1="18" x2="30" y2={TOP_Y - 18} stroke="#475569" strokeWidth="3" />

            {/* Vision Enclosure & High-Speed Camera Lenses */}
            <rect
              x="-24"
              y={TOP_Y - 36}
              width="48"
              height="18"
              rx="3"
              fill={isCameraContaminated ? '#451a03' : '#1e1b4b'}
              stroke={isCameraContaminated ? '#f59e0b' : '#a855f7'}
              strokeWidth="1.8"
            />
            {/* Camera optics */}
            <circle cx="-10" cy={TOP_Y - 27} r="4" fill="#0f172a" stroke="#a855f7" strokeWidth="1.2" />
            <circle cx="10" cy={TOP_Y - 27} r="4" fill="#0f172a" stroke="#a855f7" strokeWidth="1.2" />
            {/* Camera status LED */}
            <circle
              cx="0"
              cy={TOP_Y - 32}
              r="2"
              fill={isCameraContaminated ? '#f59e0b' : '#10b981'}
              className="animate-pulse"
            />

            {/* Active Vision Scanning Laser Fan Beam */}
            {isStationActive && (
              <polygon
                points="-16,36 16,36 32,62 -32,62"
                fill="url(#stationScanBeam)"
                className={isScanningActive ? 'animate-pulse' : ''}
              />
            )}

            {/* Magnetic MFL Scanner Under-Belt Gantry (y=75 to 110) */}
            <rect x="-26" y={TOP_Y + 12} width="52" height="18" rx="3" fill="#082f49" stroke="#0284c7" strokeWidth="1.8" />
            <text x="0" y={TOP_Y + 24} fill="#38bdf8" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              MFL 64-CH
            </text>
            {/* Magnetic Flux Field Lines */}
            {isStationActive && (
              <g opacity={isScanningActive ? 0.9 : 0.4}>
                <path d="M-18,74 C-18,65 -8,65 -8,74" stroke="#38bdf8" strokeWidth="1.2" fill="none" strokeDasharray="3 2" />
                <path d="M-6,74 C-6,63 6,63 6,74" stroke="#06b6d4" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
                <path d="M8,74 C8,65 18,65 18,74" stroke="#38bdf8" strokeWidth="1.2" fill="none" strokeDasharray="3 2" />
              </g>
            )}

            {/* Gantry Label */}
            <rect x="-42" y="2" width="84" height="13" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="0" y="11" fill="#c084fc" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              STATION #01 [210m]
            </text>
          </g>

          {/* ROTARY ENCODER WHEEL (Installed at x=430 on return edge) */}
          <g id="rotary-encoder" transform={`translate(435, ${TOP_Y + 5})`}>
            <circle cx="0" cy="0" r="10" fill="#1e293b" stroke="#06b6d4" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="3" fill="#38bdf8" />
            {/* Pulse tick marks */}
            <line x1="-7" y1="0" x2="7" y2="0" stroke="#06b6d4" strokeWidth="1" />
            <line x1="0" y1="-7" x2="0" y2="7" stroke="#06b6d4" strokeWidth="1" />
            <text x="0" y="20" fill="#38bdf8" fontSize="7" fontFamily="monospace" textAnchor="middle">
              ENC-01
            </text>
          </g>

          {/* MASTER REFERENCE BEACON DETECTOR (Tail pulley 0m datum at x=140) */}
          <g id="reference-detector" transform={`translate(${LEFT_X}, ${TOP_Y - 24})`}>
            <polygon points="-8,0 8,0 0,10" fill="#10b981" stroke="#059669" strokeWidth="1" />
            <rect x="-24" y="-12" width="48" height="12" rx="2" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
            <text x="0" y="-4" fill="#a7f3d0" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              DATUM 0m
            </text>
          </g>

          {/* DYNAMIC SPLICE MARKERS TRAVELING ON BELT (S01, S02, S03, S04) */}
          {(Object.values(splices) as Splice[]).map((splice) => {
            const pos = getSpliceTrackPosition(splice.baselineCoordinate);
            const isSelected = selectedSpliceId === splice.id;
            const isS03 = splice.id === 'S03';
            const isWarning = splice.condition === 'Warning';
            const isCritical = splice.condition === 'Critical';

            // Distinct marker colors
            let markerColor = '#10b981'; // emerald Healthy
            let filterId = 'none';
            if (isWarning) {
              markerColor = '#f59e0b'; // amber Warning
              filterId = 'url(#glowOrange)';
            } else if (isCritical) {
              markerColor = '#ef4444';
            }

            return (
              <g
                key={splice.id}
                transform={`translate(${pos.x}, ${pos.y}) rotate(${pos.angle})`}
                className="cursor-pointer transition-transform duration-75 hover:scale-125"
                onClick={() => {
                  if (interactive) setSelectedSpliceId(splice.id);
                }}
                onMouseEnter={(e) => {
                  setHoveredSplice(splice);
                  setTooltipPos({ x: pos.x, y: pos.y });
                }}
                onMouseLeave={() => setHoveredSplice(null)}
              >
                {/* Warning aura pulse for S03 */}
                {isS03 && (
                  <circle
                    cx="0"
                    cy="0"
                    r={isSelected ? 18 : 13}
                    fill="#f59e0b"
                    opacity="0.25"
                    className="animate-ping"
                  />
                )}

                {/* Selection ring */}
                {isSelected && (
                  <circle
                    cx="0"
                    cy="0"
                    r="15"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    className="animate-spin-slow"
                  />
                )}

                {/* Splice transverse vulcanized seam representation */}
                <line
                  x1="-3"
                  y1="-10"
                  x2="3"
                  y2="10"
                  stroke={markerColor}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  filter={filterId}
                />
                <circle cx="0" cy="0" r="5" fill={markerColor} stroke="#0f172a" strokeWidth="1.5" />

                {/* Splice ID badge floating above or beside */}
                <g transform="translate(0, -18) rotate(0)">
                  <rect
                    x="-14"
                    y="-8"
                    width="28"
                    height="14"
                    rx="3"
                    fill="#0f172a"
                    stroke={isSelected ? '#38bdf8' : markerColor}
                    strokeWidth={isSelected ? '2' : '1.2'}
                  />
                  <text
                    x="0"
                    y="2"
                    fill="#ffffff"
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {splice.id}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredSplice && (
          <div
            className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 rounded-lg bg-white/95 border border-slate-300 shadow-xl backdrop-blur-md text-xs min-w-[170px]"
            style={{
              left: `${(tooltipPos.x / 1000) * 100}%`,
              top: `${(tooltipPos.y / 240) * 100}%`,
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1 mb-1">
              <span className="font-mono-tech font-bold text-slate-900">{hoveredSplice.id}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  hoveredSplice.condition === 'Warning'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {hoveredSplice.condition}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-700 py-0.5">
              <span>Condition Score:</span>
              <span className="font-mono-tech font-bold text-cyan-700">{hoveredSplice.score}/100</span>
            </div>
            <div className="flex items-center justify-between text-slate-700 py-0.5">
              <span>Trend:</span>
              <span
                className={`font-semibold ${
                  hoveredSplice.trend === 'Declining' ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                {hoveredSplice.trend}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1">
              <span>Baseline Datum:</span>
              <span className="font-mono-tech">{hoveredSplice.baselineCoordinate} m</span>
            </div>
            <div className="text-[10px] text-cyan-700 mt-1 italic text-center">
              Click to inspect passport
            </div>
          </div>
        )}
      </div>

      {/* Splice Quick Select Strip at Bottom */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-medium">Monitored Splices:</span>
          <div className="flex items-center gap-1.5">
            {(Object.values(splices) as Splice[]).map((s) => {
              const isSelected = selectedSpliceId === s.id;
              const isWarning = s.condition === 'Warning';
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSpliceId(s.id)}
                  className={`px-2.5 py-1 rounded-md font-mono-tech text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? isWarning
                        ? 'bg-amber-100 text-amber-900 border border-amber-400 shadow-2xs font-bold'
                        : 'bg-cyan-100 text-cyan-900 border border-cyan-400 shadow-2xs font-bold'
                      : isWarning
                      ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isWarning ? (
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                  ) : (
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                  )}
                  <span>{s.id}</span>
                  <span className="text-[10px] opacity-75">({s.score})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Healthy (80-100)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Warning (60-79)</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-violet-700 font-medium">
            <Eye className="w-3 h-3 text-violet-600" />
            <span>Vision Line-Scan</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-cyan-800 font-medium">
            <Magnet className="w-3 h-3 text-cyan-600" />
            <span>MFL 64-Cord</span>
          </div>
        </div>
      </div>
    </div>
  );
};
