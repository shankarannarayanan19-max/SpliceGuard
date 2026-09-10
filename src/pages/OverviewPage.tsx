import React from 'react';
import { useApp } from '../context/AppContext';
import { Splice } from '../types';
import { ConveyorVisualization } from '../components/ConveyorVisualization';
import {
  AlertTriangle,
  CheckCircle,
  Activity,
  Radio,
  Eye,
  Magnet,
  ArrowRight,
  TrendingDown,
  Gauge,
  Thermometer,
  Zap,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const {
    conveyor,
    splices,
    selectedSpliceId,
    setSelectedSpliceId,
    alerts,
    setActiveTab,
    triggerScanSequence,
    distanceToStation,
    approachingSplice,
  } = useApp();

  const openAlert = alerts.find((a) => a.id === 'ALT-003' && a.status === 'Open') || alerts[0];

  return (
    <div className="space-y-6 pb-12">
      {/* High-Impact Operational Status Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Machine State</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
          </div>
          <div className="font-mono-tech font-bold text-lg text-emerald-700 flex items-center gap-1.5">
            <span>{conveyor.status}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{conveyor.id} • Kirandul Ore Line</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Belt Velocity</span>
            <Gauge className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <div className="font-mono-tech font-bold text-lg text-cyan-800">
            {(conveyor?.speedMs ?? 0).toFixed(1)} <span className="text-xs font-normal text-slate-500">m/s</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Quadrature wheel sync</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Current Revolution</span>
            <Activity className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="font-mono-tech font-bold text-lg text-amber-800">
            #{conveyor.currentPass}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Loop Length: 420 m</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Position Datum</span>
            <Radio className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="font-mono-tech font-bold text-lg text-emerald-700">
            {conveyor.referenceState}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">S01 Master Datum @ 0.0m</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Splice Monitored</span>
            <span className="text-slate-500 font-mono-tech">4 Units</span>
          </div>
          <div className="font-mono-tech font-bold text-lg text-slate-900 flex items-center gap-1.5">
            <span>4</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
              1 Alert
            </span>
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-0.5">S03 requires inspection</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Gantry Station</span>
            <Zap className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <div className="font-mono-tech font-bold text-sm text-cyan-800 truncate">
            {approachingSplice ? `${approachingSplice.id} (${distanceToStation}m)` : 'Standby'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Vision + MFL 64-ch</div>
        </div>
      </div>

      {/* Primary Centerpiece: Industrial Conveyor & Digital Telemetry Visualization */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Overland Conveyor CV-01 Digital Twin & Real-time Splice Tracking</span>
            </h2>
            <p className="text-xs text-slate-500">
              Rotary encoder belt travel synchronized with master datum S01 • Continuous splice localization
            </p>
          </div>
          <button
            onClick={() => triggerScanSequence('S03')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Simulate S03 Gantry Scan</span>
          </button>
        </div>

        <ConveyorVisualization interactive={true} />
      </div>

      {/* Four Splice Status Cards Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-900">Continuous Splice Condition Registry</h3>
          <span className="text-xs text-slate-500">Select any splice to inspect history & passport</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {(Object.values(splices) as Splice[]).map((splice) => {
            const isSelected = selectedSpliceId === splice.id;
            const isWarning = splice.condition === 'Warning';
            return (
              <div
                key={splice.id}
                onClick={() => {
                  setSelectedSpliceId(splice.id);
                  setActiveTab('passports');
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? isWarning
                      ? 'bg-amber-50 border-amber-400 shadow-md ring-2 ring-amber-400/30'
                      : 'bg-cyan-50 border-cyan-400 shadow-md ring-2 ring-cyan-400/30'
                    : isWarning
                    ? 'bg-white border-amber-300 hover:border-amber-400 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {/* Splice Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tech font-bold text-base text-slate-900">{splice.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isWarning
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {splice.condition.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono-tech mt-0.5">
                      Baseline: {splice.baselineCoordinate} m datum
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-mono-tech font-extrabold text-2xl ${
                        isWarning ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {splice.score}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono-tech">SCORE / 100</div>
                  </div>
                </div>

                {/* Trend & Multi-Modal Mini Status */}
                <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Degradation Trend:</span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        splice.trend === 'Declining' ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {splice.trend === 'Declining' && <TrendingDown className="w-3.5 h-3.5" />}
                      <span>{splice.trend}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-violet-600" />
                      <span>Vision Line-Scan:</span>
                    </span>
                    <span className="font-medium text-slate-700 truncate max-w-[130px]" title={splice.evidence.vision.status}>
                      {splice.evidence.vision.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Magnet className="w-3 h-3 text-cyan-600" />
                      <span>MFL Magnetic:</span>
                    </span>
                    <span className="font-medium text-slate-700 truncate max-w-[130px]" title={splice.evidence.magnetic.status}>
                      {splice.evidence.magnetic.status}
                    </span>
                  </div>
                </div>

                {/* Action footer link */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-cyan-700 font-semibold group-hover:text-cyan-800">
                  <span>Open Splice Passport</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active High-Priority Decision Support & Alert Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Active Alert & Maintenance Decision */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-amber-50/60 border border-amber-300 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Active Operational Maintenance Decision: Splice {openAlert?.spliceId}
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono-tech font-bold bg-amber-100 text-amber-900 border border-amber-300">
              {openAlert?.id} • {openAlert?.severity.toUpperCase()}
            </span>
          </div>

          <p className="text-xs text-slate-700 mb-3">
            {openAlert?.message}
          </p>

          <div className="p-3 rounded-lg bg-white border border-amber-200 mb-4 space-y-1.5 text-xs shadow-2xs">
            <div className="flex items-start gap-2">
              <span className="text-slate-600 font-semibold shrink-0">Corroborated Evidence:</span>
              <span className="text-amber-900 font-medium">{openAlert?.evidence}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-slate-600 font-semibold shrink-0">Recommended Action:</span>
              <span className="text-cyan-800 font-medium">{openAlert?.recommendation}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500">
              Reported on Pass <span className="font-mono-tech text-slate-800 font-semibold">#{openAlert?.pass}</span> at{' '}
              <span className="font-mono-tech text-slate-800">{openAlert?.timestamp}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('alerts')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer border border-slate-300 shadow-2xs"
              >
                Review Alert Record
              </button>
              <button
                onClick={() => {
                  setSelectedSpliceId('S03');
                  setActiveTab('maintenance');
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs transition-all cursor-pointer flex items-center gap-1.5 font-bold"
              >
                <span>Dispatch Maintenance</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Operational Telemetry Context */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-600" />
              <span>Drive & SCADA Telemetry</span>
            </h3>
            <span className="text-[10px] font-mono-tech text-slate-500 font-semibold">OPC-UA LIVE</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-slate-600">Drive Motor Power</span>
              <span className="font-mono-tech font-bold text-slate-900">{conveyor.driveMotorKw} kW</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-slate-600">Motor Stator Current</span>
              <span className="font-mono-tech font-bold text-cyan-700">{conveyor.motorCurrentA} A</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-slate-600">Takeup Loop Tension</span>
              <span className="font-mono-tech font-bold text-slate-900">{conveyor.beltTensionKn} kN</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-slate-600">Ore Burden Load Factor</span>
              <span className="font-mono-tech font-bold text-amber-700">{conveyor.loadFactorPct}%</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-slate-600">Cumulative Run Hours</span>
              <span className="font-mono-tech text-slate-800">{conveyor.operatingHours} hrs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
