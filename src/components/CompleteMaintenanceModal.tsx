import React, { useState } from 'react';
import { MaintenanceTask, ObservedSeverity } from '../types';
import { useApp } from '../context/AppContext';
import { X, CheckCircle2, AlertTriangle, Wrench } from 'lucide-react';

interface CompleteMaintenanceModalProps {
  task: MaintenanceTask;
  onClose: () => void;
}

export const CompleteMaintenanceModal: React.FC<CompleteMaintenanceModalProps> = ({
  task,
  onClose,
}) => {
  const { completeTaskMaintenance } = useApp();

  const [actualDefect, setActualDefect] = useState<string>(
    'Longitudinal Surface Crack at Step-2 Vulcanization Seam'
  );
  const [observedSeverity, setObservedSeverity] = useState<ObservedSeverity>('Moderate');
  const [actionPerformed, setActionPerformed] = useState<string>(
    'Cold Vulcanizing Patch Applied & NDT Magnetic Rescan Verified'
  );
  const [falseAlarm, setFalseAlarm] = useState<boolean>(false);
  const [technicianNotes, setTechnicianNotes] = useState<string>(
    'Physical ultrasonic scan confirms 42mm surface fissure sealed with synthetic chloroprene cold compound. Internal steel cord strand discontinuity stabilized. S03 splice integrity cleared for regular operation.'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeTaskMaintenance(task.id, {
      actualDefect,
      observedSeverity,
      actionPerformed,
      falseAlarm,
      technicianNotes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-100 text-cyan-700 border border-cyan-200">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Technician Inspection & Closeout</h3>
              <p className="text-xs text-slate-500 font-mono-tech">
                Task {task.id} • Target Splice: {task.spliceId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Actual Defect */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Actual Observed Defect:
            </label>
            <select
              value={actualDefect}
              onChange={(e) => setActualDefect(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-cyan-500"
            >
              <option value="Longitudinal Surface Crack at Step-2 Vulcanization Seam">
                Longitudinal Surface Crack at Step-2 Vulcanization Seam
              </option>
              <option value="Internal Steel Cord Pitch Displacement / Micro-fracture">
                Internal Steel Cord Pitch Displacement / Micro-fracture
              </option>
              <option value="Superficial Rubber Skirt Board Scuff (Harmless)">
                Superficial Rubber Skirt Board Scuff (Harmless)
              </option>
              <option value="Edge Rubber Fraying / Cleavage">
                Edge Rubber Fraying / Cleavage
              </option>
              <option value="None (Normal Operational Wear)">
                None (Normal Operational Wear)
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Observed Severity */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Observed Severity:
              </label>
              <select
                value={observedSeverity}
                onChange={(e) => setObservedSeverity(e.target.value as ObservedSeverity)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-cyan-500"
              >
                <option value="Minor">Minor</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
                <option value="None (Normal Wear)">None (Normal Wear)</option>
              </select>
            </div>

            {/* False Alarm Toggle */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                False Alarm Classification:
              </label>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setFalseAlarm(false)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                    !falseAlarm
                      ? 'bg-amber-100 text-amber-900 border-amber-400'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  True Defect
                </button>
                <button
                  type="button"
                  onClick={() => setFalseAlarm(true)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                    falseAlarm
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  False Positive
                </button>
              </div>
            </div>
          </div>

          {/* Action Performed */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Action Performed by Technician:
            </label>
            <select
              value={actionPerformed}
              onChange={(e) => setActionPerformed(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-cyan-500"
            >
              <option value="Cold Vulcanizing Patch Applied & NDT Magnetic Rescan Verified">
                Cold Vulcanizing Patch Applied & NDT Magnetic Rescan Verified
              </option>
              <option value="Step Seam Sealant Infusion & Edge Trim">
                Step Seam Sealant Infusion & Edge Trim
              </option>
              <option value="Physical Ultrasonic & Magnetic Verification Survey Only">
                Physical Ultrasonic & Magnetic Verification Survey Only
              </option>
              <option value="Full Splice Re-vulcanization Scheduled">
                Full Splice Re-vulcanization Scheduled
              </option>
              <option value="Routine Cleaning & Calibration Only">
                Routine Cleaning & Calibration Only
              </option>
            </select>
          </div>

          {/* Technician Notes */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Technician Field Notes & Sign-off:
            </label>
            <textarea
              rows={3}
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-cyan-500 resize-none font-sans"
              placeholder="Enter technical findings, measurements, tool IDs, and signoff notes..."
            />
          </div>

          {/* Feedback note */}
          <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-900 text-[11px] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
            <div>
              Submitting this closeout report will update the <strong>{task.spliceId} Splice Passport</strong>, record this maintenance event, update technician availability in the <strong>Personnel directory</strong>, and recalculate condition status.
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete & Sign Off</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
