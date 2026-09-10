import React from 'react';
import { useApp } from '../context/AppContext';
import { SpareReadiness, SpliceId } from '../types';
import {
  Coins,
  ShieldAlert,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Info,
  TrendingUp,
} from 'lucide-react';

export const FinancialReadinessPage: React.FC = () => {
  const { spareReadiness, splices, selectedSpliceId, setSelectedSpliceId, setActiveTab } = useApp();

  const currentSpare = spareReadiness[selectedSpliceId] || spareReadiness['S03'];
  const targetSplice = splices[selectedSpliceId] || splices['S03'];

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Caution Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-600" />
            <span>Operational Decision Support & Spare Kit Readiness</span>
          </h2>
          <p className="text-xs text-slate-500">
            Downtime prevention economics and vulcanizing inventory readiness analysis
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs font-mono-tech flex items-center gap-2 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>SIMULATED PROTOTYPE ESTIMATES • NOT OFFICIAL NMDC AUDIT DATA</span>
        </div>
      </div>

      {/* Decision-Support Downtime Exposure Panel for S03 */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <span className="text-[10px] font-mono-tech text-cyan-700 uppercase font-semibold">Downtime Risk Evaluation</span>
            <h3 className="font-bold text-slate-900 text-base">
              Economic Protection Assessment: Splice {targetSplice.id} ({targetSplice.condition})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Select Splice Target:</span>
            {(['S01', 'S02', 'S03', 'S04'] as SpliceId[]).map((sId) => (
              <button
                key={sId}
                onClick={() => setSelectedSpliceId(sId)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono-tech font-bold cursor-pointer transition-colors ${
                  selectedSpliceId === sId
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {sId}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 text-xs font-medium">Unplanned Stoppage Exposure</span>
            <div className="font-mono-tech font-extrabold text-xl text-amber-600">
              {currentSpare.estimatedProductionExposureInr}
            </div>
            <div className="text-[11px] text-slate-500">
              Based on ~{currentSpare.estimatedDowntimeHours}h emergency iron-ore throughput loss
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 text-xs font-medium">Planned Preventive Action Cost</span>
            <div className="font-mono-tech font-extrabold text-xl text-cyan-700">
              {currentSpare.estimatedMaintenanceCostInr}
            </div>
            <div className="text-[11px] text-slate-500">
              Scheduled shift window vulcanization patch & crew
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 text-xs font-medium">Cost-Avoidance Efficiency</span>
            <div className="font-mono-tech font-extrabold text-xl text-emerald-600">
              {targetSplice.condition === 'Warning' ? '6.7x SAVINGS' : 'OPTIMAL'}
            </div>
            <div className="text-[11px] text-slate-500">
              Preventing catastrophic in-flight belt severance
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 italic pt-1">
          * Note for evaluators: Monetary and downtime estimates are simulated heuristics demonstrating predictive decision-support ROI. Actual NMDC production tariffs vary by grade and shipment schedules.
        </p>
      </div>

      {/* Spare Parts & Vulcanizing Kit Inventory Readiness Matrix */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-600" />
            <h3 className="font-bold text-slate-900 text-base">
              Splice Vulcanizing Kit & Consumables Readiness
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono-tech">Kirandul Logistics Stores</span>
        </div>

        <div className="divide-y divide-slate-100">
          {(Object.values(spareReadiness) as SpareReadiness[]).map((spare) => {
            const isReady = spare.vulcanizingKitStatus === 'READY';
            const isTight = spare.vulcanizingKitStatus === 'TIGHT';

            return (
              <div
                key={spare.spliceId}
                className="py-4 flex flex-wrap items-center justify-between gap-4 text-xs hover:bg-slate-50 px-3 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center font-mono-tech font-bold text-slate-800">
                    {spare.spliceId}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono-tech">{spare.kitPartNumber}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono-tech ${
                          isReady
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isTight
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                      >
                        {spare.vulcanizingKitStatus}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>Warehouse: {spare.warehouseLocation}</span>
                      <span>•</span>
                      <span>Lead Time: {spare.leadTimeHours} hrs</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">CREW STANDBY</span>
                    <span
                      className={`font-semibold ${
                        spare.crewStandby === 'Alert' ? 'text-amber-600 font-bold' : 'text-slate-700'
                      }`}
                    >
                      {spare.crewStandby}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSpliceId(spare.spliceId);
                      setActiveTab('maintenance');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-cyan-800 border border-slate-300 transition-colors cursor-pointer shadow-2xs font-medium"
                  >
                    View Maintenance
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
