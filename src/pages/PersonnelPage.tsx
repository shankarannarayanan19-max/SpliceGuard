import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Technician, TechnicianStatus } from '../types';
import {
  Users,
  UserCheck,
  Award,
  Clock,
  MapPin,
  Phone,
  Wrench,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Shield,
} from 'lucide-react';

export const PersonnelPage: React.FC = () => {
  const {
    technicians,
    maintenanceTasks,
    assignTechnicianToTask,
    setSelectedSpliceId,
    setActiveTab,
  } = useApp();

  const [filterStatus, setFilterStatus] = useState<'all' | TechnicianStatus>('all');

  const pendingS03Task = maintenanceTasks.find(
    (t) => t.spliceId === 'S03' && t.status === 'Pending'
  );

  const filteredTechnicians = technicians.filter((tech) => {
    if (filterStatus !== 'all' && tech.availability !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-600" />
            <span>Field Maintenance Personnel & Shift Operations</span>
          </h2>
          <p className="text-xs text-slate-500">
            Conveyor NDT specialists, certified vulcanizing masters, and real-time dispatch status
          </p>
        </div>

        {/* Quick S03 Dispatch Prompt Banner if task is pending */}
        {pendingS03Task && (
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-300 flex items-center gap-2 text-xs text-amber-900 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>S03 Inspection Task pending assignment. Select an available specialist below.</span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs">
        <span className="text-slate-500 font-medium">Filter Availability:</span>
        {(['all', 'Available', 'Assigned', 'Inspection In Progress', 'Completed'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              filterStatus === st
                ? 'bg-violet-100 text-violet-900 font-semibold border border-violet-300 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Technicians Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTechnicians.map((tech) => {
          const isAvailable = tech.availability === 'Available';
          const isAssigned = tech.availability === 'Assigned';
          const isInProgress = tech.availability === 'Inspection In Progress';
          const isCompleted = tech.availability === 'Completed';

          let statusBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
          if (isAssigned) statusBadgeClass = 'bg-cyan-100 text-cyan-800 border-cyan-300';
          if (isInProgress) statusBadgeClass = 'bg-violet-100 text-violet-900 border-violet-300 animate-pulse';
          if (isCompleted) statusBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';

          return (
            <div
              key={tech.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header with Name & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{tech.name}</h3>
                    <div className="text-xs text-cyan-700 font-medium">{tech.role}</div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border font-mono-tech ${statusBadgeClass}`}>
                    {tech.availability}
                  </span>
                </div>

                {/* Info Items */}
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{tech.shift}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{tech.zone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono-tech">{tech.phone}</span>
                  </div>
                </div>

                {/* Certification Badge */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-800 font-semibold mb-0.5">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>NDT Qualifications:</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{tech.certification}</p>
                </div>

                {/* Current Active Assignment */}
                {tech.assignedSpliceId && (
                  <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-cyan-900 font-semibold">
                      <span>Assigned Target:</span>
                      <button
                        onClick={() => {
                          setSelectedSpliceId(tech.assignedSpliceId!);
                          setActiveTab('passports');
                        }}
                        className="font-mono-tech px-2 py-0.5 rounded bg-white text-cyan-800 hover:text-cyan-950 border border-cyan-300 transition-colors shadow-2xs"
                      >
                        {tech.assignedSpliceId} PASSPORT
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Work Order: <span className="font-mono-tech text-slate-800 font-medium">{tech.currentAssignmentId}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                {isAvailable && pendingS03Task ? (
                  <button
                    onClick={() => {
                      assignTechnicianToTask(pendingS03Task.id, tech.id);
                      setActiveTab('maintenance');
                    }}
                    className="w-full py-2 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Dispatch to Splice S03</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('maintenance')}
                    className="w-full py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>View Work Order Queue</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
