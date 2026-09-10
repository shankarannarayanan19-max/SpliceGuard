import React, { useState } from 'react';
import { ConditionHistoryPoint } from '../types';
import { AlertCircle, TrendingDown, Info, Eye, Magnet } from 'lucide-react';

interface ConditionHistoryChartProps {
  history: ConditionHistoryPoint[];
  currentScore: number;
  spliceId: string;
}

export const ConditionHistoryChart: React.FC<ConditionHistoryChartProps> = ({
  history,
  currentScore,
  spliceId,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<ConditionHistoryPoint | null>(null);
  const [activeLayer, setActiveLayer] = useState<'all' | 'composite' | 'vision' | 'magnetic'>('all');

  if (!history || history.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
        No inspection history points recorded for {spliceId}.
      </div>
    );
  }

  // Chart dimensions
  const width = 800;
  const height = 300;
  const padding = { top: 30, right: 30, bottom: 45, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Scales
  const minScore = 50;
  const maxScore = 100;

  const getX = (index: number) => {
    if (history.length <= 1) return padding.left + chartW / 2;
    return padding.left + (index / (history.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    const clamped = Math.max(minScore, Math.min(maxScore, val));
    return padding.top + (1 - (clamped - minScore) / (maxScore - minScore)) * chartH;
  };

  // Generate SVG path strings
  const compositePoints = history.map((p, i) => `${getX(i)},${getY(p.score)}`).join(' ');
  const visionPoints = history.map((p, i) => `${getX(i)},${getY(p.visionScore)}`).join(' ');
  const magneticPoints = history.map((p, i) => `${getX(i)},${getY(p.magneticScore)}`).join(' ');

  // Area under composite curve
  const areaPath = `M${getX(0)},${getY(minScore)} L${history
    .map((p, i) => `${getX(i)},${getY(p.score)}`)
    .join(' L')} L${getX(history.length - 1)},${getY(minScore)} Z`;

  // Threshold lines
  const healthyThresholdY = getY(80);
  const warningThresholdY = getY(65);

  const isDeclining = currentScore < 80;

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      {/* Header with Trend Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-slate-900">Condition History & Deterioration Trend</h4>
            <span className="font-mono-tech text-xs text-slate-500">({history.length} Consecutive Passes)</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-pass longitudinal tracking showing dual-modality sensor evolution
          </p>
        </div>

        {/* Modality Filter Controls */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setActiveLayer('all')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeLayer === 'all' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Modalities
          </button>
          <button
            onClick={() => setActiveLayer('composite')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
              activeLayer === 'composite' ? 'bg-amber-100 text-amber-900 font-semibold border border-amber-300 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Composite
          </button>
          <button
            onClick={() => setActiveLayer('vision')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
              activeLayer === 'vision' ? 'bg-violet-100 text-violet-900 font-semibold border border-violet-300 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3 h-3 text-violet-600" />
            Vision
          </button>
          <button
            onClick={() => setActiveLayer('magnetic')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
              activeLayer === 'magnetic' ? 'bg-blue-100 text-blue-900 font-semibold border border-blue-300 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Magnet className="w-3 h-3 text-blue-600" />
            MFL Magnetic
          </button>
        </div>
      </div>

      {/* RUL & Technical Honesty Banner */}
      <div className="mb-4 px-3.5 py-2 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-800">FIELD-CALIBRATED RUL NOT AVAILABLE:</span>{' '}
          True industrial predictive life requires multi-month longitudinal physical calibration. SpliceGuard tracks relative condition decay trajectory and maintenance threshold proximity without asserting speculative rupture dates.
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-hidden select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            {/* Area gradient */}
            <linearGradient id="chartAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Zone Fills */}
          {/* Healthy Zone: 80 - 100 */}
          <rect
            x={padding.left}
            y={getY(100)}
            width={chartW}
            height={getY(80) - getY(100)}
            fill="#10b981"
            fillOpacity="0.05"
          />
          {/* Warning Zone: 65 - 80 */}
          <rect
            x={padding.left}
            y={getY(80)}
            width={chartW}
            height={getY(65) - getY(80)}
            fill="#f59e0b"
            fillOpacity="0.07"
          />
          {/* Critical Zone: 50 - 65 */}
          <rect
            x={padding.left}
            y={getY(65)}
            width={chartW}
            height={getY(50) - getY(65)}
            fill="#ef4444"
            fillOpacity="0.06"
          />

          {/* Grid lines and Y-axis labels */}
          {[100, 90, 80, 70, 60, 50].map((score) => {
            const y = getY(score);
            return (
              <g key={`y-grid-${score}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray={score === 80 || score === 65 ? 'none' : '4 4'}
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  fill={score === 80 ? '#059669' : score === 65 ? '#d97706' : '#64748b'}
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {score}
                </text>
              </g>
            );
          })}

          {/* Threshold marker annotations */}
          <g>
            <line
              x1={padding.left}
              y1={healthyThresholdY}
              x2={width - padding.right}
              y2={healthyThresholdY}
              stroke="#059669"
              strokeWidth="1.5"
              strokeDasharray="6 3"
            />
            <text
              x={width - padding.right - 8}
              y={healthyThresholdY - 4}
              fill="#059669"
              fontSize="9"
              fontFamily="monospace"
              textAnchor="end"
            >
              HEALTHY BASELINE (80)
            </text>

            <line
              x1={padding.left}
              y1={warningThresholdY}
              x2={width - padding.right}
              y2={warningThresholdY}
              stroke="#d97706"
              strokeWidth="1.8"
              strokeDasharray="6 3"
            />
            <text
              x={width - padding.right - 8}
              y={warningThresholdY - 4}
              fill="#d97706"
              fontSize="9"
              fontFamily="monospace"
              textAnchor="end"
              fontWeight="bold"
            >
              MAINTENANCE THRESHOLD (65)
            </text>
          </g>

          {/* Area fill for composite curve */}
          {(activeLayer === 'all' || activeLayer === 'composite') && (
            <path d={areaPath} fill="url(#chartAreaGrad)" />
          )}

          {/* Vision Line (Violet) */}
          {(activeLayer === 'all' || activeLayer === 'vision') && (
            <polyline
              points={visionPoints}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
          )}

          {/* Magnetic MFL Line (Blue) */}
          {(activeLayer === 'all' || activeLayer === 'magnetic') && (
            <polyline
              points={magneticPoints}
              fill="none"
              stroke="#0284c7"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          )}

          {/* Composite Condition Score Line (Amber/Emerald) */}
          {(activeLayer === 'all' || activeLayer === 'composite') && (
            <polyline
              points={compositePoints}
              fill="none"
              stroke="#d97706"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points on Composite Line */}
          {history.map((p, i) => {
            const x = getX(i);
            const y = getY(p.score);
            const isLatest = i === history.length - 1;
            const isHovered = hoveredPoint?.pass === p.pass;

            return (
              <g
                key={`pt-${p.pass}-${i}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Invisible hover hitbox */}
                <circle cx={x} cy={y} r="14" fill="transparent" />

                {isLatest && (
                  <circle cx={x} cy={y} r="10" fill="#f59e0b" opacity="0.3" className="animate-ping" />
                )}

                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : isLatest ? 5 : 3.5}
                  fill={p.score < 70 ? '#ea580c' : p.score < 80 ? '#d97706' : '#10b981'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />

                {/* X-axis Pass Number Labels */}
                <text
                  x={x}
                  y={height - 12}
                  fill={isLatest ? '#d97706' : '#64748b'}
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight={isLatest ? 'bold' : 'normal'}
                >
                  #{p.pass}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip on Hover */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none px-3 py-2 rounded-lg bg-white/95 border border-slate-300 shadow-xl text-xs backdrop-blur-md"
            style={{
              left: `${(getX(history.findIndex((h) => h.pass === hoveredPoint.pass)) / width) * 100}%`,
              top: '15%',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-1 mb-1">
              <span className="font-mono-tech font-bold text-amber-700">PASS #{hoveredPoint.pass}</span>
              <span className="text-slate-500 text-[10px]">{hoveredPoint.timestamp}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-500 block text-[10px]">Composite</span>
                <span className="font-mono-tech font-bold text-amber-700">{hoveredPoint.score}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Vision</span>
                <span className="font-mono-tech text-violet-700">{hoveredPoint.visionScore}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">MFL Flux</span>
                <span className="font-mono-tech text-cyan-800">{hoveredPoint.magneticScore}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-200 text-xs">
        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <TrendingDown className="w-4 h-4 text-amber-600" />
          <div>
            <div className="text-slate-500 text-[11px]">Trajectory</div>
            <div className="font-semibold text-amber-800">
              {isDeclining ? 'CONDITION DECLINING (-23 pts)' : 'CONDITION STABLE'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <div>
            <div className="text-slate-500 text-[11px]">Maintenance Proximity</div>
            <div className="font-semibold text-slate-800">3 pts to Maintenance Threshold (65)</div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="w-3 h-3 rounded-full bg-cyan-600 animate-pulse" />
          <div>
            <div className="text-slate-500 text-[11px]">Current Score / State</div>
            <div className="font-mono-tech font-bold text-cyan-800">
              {currentScore} / {currentScore < 80 ? 'WARNING' : 'HEALTHY'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
