import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Alert, AlertStatus, AlertSeverity } from '../types';
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle2,
  Wrench,
  Eye,
  ArrowRight,
  Filter,
  ShieldCheck,
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const {
    alerts,
    acknowledgeAlert,
    createMaintenanceFromAlert,
    setSelectedSpliceId,
    setActiveTab,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | AlertStatus>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | AlertSeverity>('all');

  const filteredAlerts = alerts.filter((alert) => {
    if (statusFilter !== 'all' && alert.status !== statusFilter) return false;
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    return true;
  });

  const openCount = alerts.filter((a) => a.status === 'Open').length;
  const acknowledgedCount = alerts.filter((a) => a.status === 'Acknowledged').length;
  const resolvedCount = alerts.filter((a) => a.status === 'Resolved').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Alert Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-600" />
            <span>Operational Splice Alerts & Anomaly Triage</span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time multi-sensor threshold excursions and deterioration alarms
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1.5 font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>{openCount} Open Action Required</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            {acknowledgedCount} Acknowledged
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300">
            {resolvedCount} Resolved / Cleared
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600 font-medium">Filter Status:</span>
          <div className="flex items-center gap-1">
            {(['all', 'Open', 'Acknowledged', 'Maintenance_Created', 'Resolved'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer capitalize ${
                  statusFilter === st
                    ? 'bg-cyan-50 text-cyan-900 font-semibold border border-cyan-300 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-medium">Severity:</span>
          <div className="flex items-center gap-1">
            {(['all', 'Warning', 'Info'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer capitalize ${
                  severityFilter === sev
                    ? 'bg-slate-200 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Cards List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            No alerts match current filter criteria.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isWarning = alert.severity === 'Warning';
            const isOpen = alert.status === 'Open';
            const isMaintenanceCreated = alert.status === 'Maintenance_Created';
            const isResolved = alert.status === 'Resolved';

            return (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isOpen
                    ? 'bg-amber-50/70 border-amber-300 shadow-sm'
                    : isMaintenanceCreated
                    ? 'bg-white border-cyan-300 shadow-sm'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Alert Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isWarning
                          ? 'bg-amber-100 text-amber-700 border border-amber-300'
                          : 'bg-cyan-100 text-cyan-700 border border-cyan-300'
                      }`}
                    >
                      {isWarning ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-tech font-bold text-slate-900 text-sm">{alert.id}</span>
                        <span className="text-slate-400">•</span>
                        <span
                          className={`font-mono-tech font-bold text-xs px-2 py-0.5 rounded ${
                            isWarning ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          SPLICE {alert.spliceId}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                            isOpen
                              ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                              : isMaintenanceCreated
                              ? 'bg-cyan-100 text-cyan-900 border-cyan-300'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {alert.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mt-1">{alert.title}</h3>
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-500 font-mono-tech">
                    <div>Pass #{alert.pass}</div>
                    <div className="text-[11px] text-slate-400">{alert.timestamp}</div>
                  </div>
                </div>

                {/* Message Body */}
                <p className="text-xs text-slate-700 mb-3 leading-relaxed">
                  {alert.message}
                </p>

                {/* Corroborated Evidence & Recommended Action Boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-xs">
                  <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 block text-[10px] font-bold mb-1">
                      CORROBORATED MULTI-SENSOR EVIDENCE:
                    </span>
                    <span className="text-amber-800 font-medium">{alert.evidence}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 block text-[10px] font-bold mb-1">
                      RECOMMENDED ACTION:
                    </span>
                    <span className="text-cyan-800 font-medium">{alert.recommendation}</span>
                  </div>
                </div>

                {/* Resolution & Acknowledgment Notes */}
                {alert.acknowledgedBy && (
                  <div className="mb-3 text-[11px] text-slate-600 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Acknowledged / Verified by: <strong className="text-slate-900">{alert.acknowledgedBy}</strong></span>
                  </div>
                )}

                {alert.linkedMaintenanceTaskId && (
                  <div className="mb-3 text-[11px] text-cyan-800 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Linked Work Order: <strong className="font-mono-tech">{alert.linkedMaintenanceTaskId}</strong></span>
                  </div>
                )}

                {/* Operational Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedSpliceId(alert.spliceId);
                        setActiveTab('passports');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-300 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-violet-600" />
                      <span>Review Evidence Dossier</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedSpliceId(alert.spliceId);
                        setActiveTab('live');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-300 shadow-2xs"
                    >
                      <span>Inspect Live Gantry</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOpen && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="px-3 py-1.5 rounded-lg font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer border border-slate-300"
                      >
                        Acknowledge Alert
                      </button>
                    )}

                    {(isOpen || alert.status === 'Acknowledged') && (
                      <button
                        onClick={() => {
                          const task = createMaintenanceFromAlert(alert.id);
                          if (task) {
                            setSelectedSpliceId(alert.spliceId);
                            setActiveTab('maintenance');
                          }
                        }}
                        className="px-4 py-1.5 rounded-lg font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Create Maintenance Action</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isMaintenanceCreated && (
                      <button
                        onClick={() => setActiveTab('maintenance')}
                        className="px-3.5 py-1.5 rounded-lg font-semibold bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-300 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>View Work Order in Maintenance</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
