import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Radio,
  Eye,
  Magnet,
  Activity,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

export const SystemHealthPage: React.FC = () => {
  const {
    sensorHealth,
    isCameraContaminated,
    toggleCameraContamination,
    conveyor,
    splices,
  } = useApp();

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Technical Integrity Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-600" />
            <span>Monitoring Infrastructure Health & Sensor Diagnostics</span>
          </h2>
          <p className="text-xs text-slate-500">
            Hardware telemetry, optical clean-room status, magnetic permeance, and encoder integrity
          </p>
        </div>

        {/* Interactive Sensor Degradation Simulation Toggle */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 p-2 rounded-xl shadow-2xs">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-900">Simulate Lens Dust Contamination</div>
            <div className="text-[10px] text-slate-500">Degrades camera confidence to 74%</div>
          </div>
          <button
            onClick={toggleCameraContamination}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              isCameraContaminated
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs font-bold'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            }`}
          >
            {isCameraContaminated ? 'Contamination Active' : 'Normal Clean Lens'}
          </button>
        </div>
      </div>

      {/* Critical Architecture Rule Callout: Decoupled Asset Condition vs Sensor Confidence */}
      <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 shadow-sm flex items-start gap-3 text-xs">
        <Info className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-cyan-900 text-sm">
            ARCHITECTURAL HONESTY: ASSET CONDITION IS STRICTLY DECOUPLED FROM SENSOR CONFIDENCE
          </div>
          <p className="text-slate-700 leading-relaxed">
            Industrial monitoring systems must never conflate degraded sensor visibility with actual conveyor belt degradation. In SpliceGuard, lens dust fines reduce <strong>Camera Data Confidence (74%)</strong>, but do NOT artificially downgrade the physical belt condition score of S03 (currently steady at <strong>{splices['S03']?.score}/100</strong>). Sensor diagnostics and structural asset passports remain separate domain models.
          </p>
        </div>
      </div>

      {/* Subsystem Health Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sensorHealth.map((sensor) => {
          const isDegraded = sensor.status === 'Degraded';
          const isNominal = sensor.status === 'Nominal';

          let icon = <Cpu className="w-5 h-5 text-cyan-600" />;
          if (sensor.category === 'Vision Camera') icon = <Eye className="w-5 h-5 text-violet-600" />;
          if (sensor.category === 'Magnetic / MFL') icon = <Magnet className="w-5 h-5 text-cyan-600" />;
          if (sensor.category === 'Rotary Encoder') icon = <Activity className="w-5 h-5 text-emerald-600" />;
          if (sensor.category === 'Reference Trigger') icon = <Radio className="w-5 h-5 text-amber-600" />;

          return (
            <div
              key={sensor.id}
              className={`p-5 rounded-2xl border transition-all ${
                isDegraded
                  ? 'bg-amber-50/60 border-amber-300 shadow-sm'
                  : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">{icon}</div>
                  <div>
                    <span className="text-[10px] font-mono-tech text-cyan-700 font-semibold">{sensor.id}</span>
                    <h3 className="font-bold text-slate-900 text-sm">{sensor.name}</h3>
                    <div className="text-[11px] text-slate-500">{sensor.category}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-mono-tech font-extrabold text-2xl ${
                      isDegraded ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {sensor.confidencePct}%
                  </div>
                  <div className="text-[9px] font-mono-tech text-slate-500 font-semibold">CONFIDENCE</div>
                </div>
              </div>

              {/* Status Badge & Diagnostic Message */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Subsystem State:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono-tech font-bold border ${
                      isDegraded
                        ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}
                  >
                    {sensor.status.toUpperCase()}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[11px] leading-relaxed">
                  {sensor.diagnostics}
                </div>

                {/* Subsystem Telemetry Parameters */}
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono-tech text-[11px]">
                  {Object.entries(sensor.metrics).map(([key, value]) => (
                    <div
                      key={key}
                      className="p-2 rounded-lg bg-white border border-slate-200 flex justify-between shadow-2xs"
                    >
                      <span className="text-slate-500">{key}:</span>
                      <span className="text-slate-900 font-semibold">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Firmware & Calibration info */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-200">
                  <span>Firmware: {sensor.firmware}</span>
                  <span>Calibrated: {sensor.lastCalibrated}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
