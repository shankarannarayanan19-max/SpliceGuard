import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MaintenanceTask, Technician } from '../types';
import { CompleteMaintenanceModal } from '../components/CompleteMaintenanceModal';
import {
  Wrench,
  UserCheck,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserPlus,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

export const MaintenancePage: React.FC = () => {
  const {
    maintenanceTasks,
    technicians,
    assignTechnicianToTask,
    startTaskInspection,
    setSelectedSpliceId,
    setActiveTab,
  } = useApp();

  const [activeModalTask, setActiveModalTask] = useState<MaintenanceTask | null>(null);
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<string>('');

  const pendingCount = maintenanceTasks.filter((t) => t.status === 'Pending').length;
  const assignedCount = maintenanceTasks.filter((t) => t.status === 'Assigned').length;
  const inProgressCount = maintenanceTasks.filter((t) => t.status === 'In_Progress').length;
  const completedCount = maintenanceTasks.filter((t) => t.status === 'Completed').length;

  const handleAssign = (taskId: string) => {
    if (!selectedTechId) return;
    assignTechnicianToTask(taskId, selectedTechId);
    setAssigningTaskId(null);
    setSelectedTechId('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-600" />
            <span>Conveyor Maintenance Work Orders & Field Dispatch</span>
          </h2>
          <p className="text-xs text-slate-500">
            Lifecycle workflow from predictive alert detection through physical NDT inspection and closeout
          </p>
        </div>

        {/* Workflow KPI Strip */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 font-semibold shadow-2xs">
            {pendingCount} Pending Dispatch
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-900 border border-cyan-300">
            {assignedCount} Assigned
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-violet-50 text-violet-900 border border-violet-300 animate-pulse">
            {inProgressCount} In Progress
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-300">
            {completedCount} Completed
          </div>
        </div>
      </div>

      {/* Work Orders List */}
      <div className="space-y-4">
        {maintenanceTasks.map((task) => {
          const isPending = task.status === 'Pending';
          const isAssigned = task.status === 'Assigned';
          const isInProgress = task.status === 'In_Progress';
          const isCompleted = task.status === 'Completed';

          return (
            <div
              key={task.id}
              className={`p-5 rounded-2xl border transition-all ${
                isPending
                  ? 'bg-white border-amber-300 shadow-sm'
                  : isInProgress
                  ? 'bg-white border-violet-300 shadow-sm'
                  : isAssigned
                  ? 'bg-white border-cyan-300 shadow-sm'
                  : 'bg-white border-slate-200'
              }`}
            >
              {/* Task Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono-tech font-bold text-slate-900 text-sm">{task.id}</span>
                    <span className="text-slate-400">•</span>
                    <button
                      onClick={() => {
                        setSelectedSpliceId(task.spliceId);
                        setActiveTab('passports');
                      }}
                      className="px-2 py-0.5 rounded font-mono-tech font-bold text-xs bg-cyan-50 text-cyan-900 hover:bg-cyan-100 transition-colors cursor-pointer border border-cyan-300"
                    >
                      SPLICE {task.spliceId}
                    </button>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {task.priority}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        isPending
                          ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                          : isAssigned
                          ? 'bg-cyan-100 text-cyan-900 border-cyan-300'
                          : isInProgress
                          ? 'bg-violet-100 text-violet-900 border-violet-300 animate-pulse'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mt-1">{task.title}</h3>
                </div>

                <div className="text-right text-xs text-slate-500 font-mono-tech">
                  <div>Created: {task.createdTimestamp}</div>
                  {task.completedTimestamp && (
                    <div className="text-emerald-700">Completed: {task.completedTimestamp}</div>
                  )}
                </div>
              </div>

              {/* Window & Assignment Context */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold mb-1">
                    RECOMMENDED MAINTENANCE WINDOW:
                  </span>
                  <span className="text-slate-800">{task.recommendedWindow}</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold mb-1">
                    ASSIGNED TECHNICIAN:
                  </span>
                  <span className="font-semibold text-cyan-800">
                    {task.assignedTechnicianName || 'Unassigned (Awaiting Dispatch)'}
                  </span>
                </div>
              </div>

              {/* Completion Dossier Details if already completed */}
              {isCompleted && task.completionDetails && (
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-2 mb-4">
                  <div className="flex items-center justify-between text-emerald-900 font-bold border-b border-emerald-200 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Verified Field Closeout & Inspection Outcome</span>
                    </span>
                    <span className="text-[11px] font-mono-tech">
                      {task.completionDetails.falseAlarm ? 'FALSE ALARM CLEARED' : 'CORRECTIVE REPAIR CONFIRMED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-700 pt-1">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Actual Defect:</span>
                      <span className="font-semibold">{task.completionDetails.actualDefect}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Observed Severity:</span>
                      <span className="font-semibold text-amber-800">{task.completionDetails.observedSeverity}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Action Performed:</span>
                      <span className="font-semibold">{task.completionDetails.actionPerformed}</span>
                    </div>
                  </div>

                  <p className="text-slate-600 italic text-[11px] pt-1">
                    "{task.completionDetails.technicianNotes}"
                  </p>
                </div>
              )}

              {/* Assignment Form Popup Drawer */}
              {assigningTaskId === task.id && (
                <div className="p-4 rounded-xl bg-white border border-cyan-300 text-xs space-y-3 mb-4 shadow-sm animate-fade-in">
                  <div className="font-semibold text-cyan-900 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4" />
                    <span>Select Technician for Dispatch to Splice {task.spliceId}:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {technicians.map((tech) => (
                      <div
                        key={tech.id}
                        onClick={() => setSelectedTechId(tech.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          selectedTechId === tech.id
                            ? 'bg-cyan-50 border-cyan-400 text-cyan-950'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>{tech.name}</span>
                          <span className="text-[10px] font-mono-tech text-emerald-700 font-semibold">{tech.availability}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">{tech.role}</div>
                        <div className="text-[10px] text-slate-400">{tech.shift}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => {
                        setAssigningTaskId(null);
                        setSelectedTechId('');
                      }}
                      className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!selectedTechId}
                      onClick={() => handleAssign(task.id)}
                      className="px-4 py-1.5 rounded-lg font-semibold bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50 cursor-pointer"
                    >
                      Confirm Assignment
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedSpliceId(task.spliceId);
                      setActiveTab('passports');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white text-slate-700 hover:text-slate-900 transition-colors border border-slate-300 shadow-2xs cursor-pointer"
                  >
                    View Splice Passport
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {isPending && (
                    <button
                      onClick={() => setAssigningTaskId(task.id)}
                      className="px-4 py-1.5 rounded-lg font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Assign Technician</span>
                    </button>
                  )}

                  {isAssigned && (
                    <button
                      onClick={() => startTaskInspection(task.id)}
                      className="px-4 py-1.5 rounded-lg font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Start Physical Inspection</span>
                    </button>
                  )}

                  {isInProgress && (
                    <button
                      onClick={() => setActiveModalTask(task)}
                      className="px-4 py-1.5 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete Inspection & Signoff</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for inspection closeout */}
      {activeModalTask && (
        <CompleteMaintenanceModal
          task={activeModalTask}
          onClose={() => setActiveModalTask(null)}
        />
      )}
    </div>
  );
};
