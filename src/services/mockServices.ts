import {
  Conveyor,
  Splice,
  Alert,
  MaintenanceTask,
  MaintenanceCompletionDetails,
  Technician,
  SensorHealth,
  InspectionEvent,
  SpliceId,
  SpareReadiness,
} from '../types';
import {
  INITIAL_CONVEYOR,
  INITIAL_SPLICES,
  INITIAL_ALERTS,
  INITIAL_MAINTENANCE_TASKS,
  INITIAL_TECHNICIANS,
  INITIAL_SENSOR_HEALTH,
  INITIAL_INSPECTION_EVENTS,
  INITIAL_SPARE_READINESS,
} from '../data/mockData';

// In-memory data store for the prototype demo session
let currentConveyor: Conveyor = { ...INITIAL_CONVEYOR };
let currentSplices: Record<string, Splice> = JSON.parse(JSON.stringify(INITIAL_SPLICES));
let currentAlerts: Alert[] = JSON.parse(JSON.stringify(INITIAL_ALERTS));
let currentMaintenanceTasks: MaintenanceTask[] = JSON.parse(JSON.stringify(INITIAL_MAINTENANCE_TASKS));
let currentTechnicians: Technician[] = JSON.parse(JSON.stringify(INITIAL_TECHNICIANS));
let currentSensorHealth: SensorHealth[] = JSON.parse(JSON.stringify(INITIAL_SENSOR_HEALTH));
let currentInspectionEvents: InspectionEvent[] = JSON.parse(JSON.stringify(INITIAL_INSPECTION_EVENTS));
let currentSpareReadiness: Record<string, SpareReadiness> = JSON.parse(JSON.stringify(INITIAL_SPARE_READINESS));

export const mockService = {
  // Conveyor Telemetry
  getConveyor(): Promise<Conveyor> {
    return Promise.resolve({ ...currentConveyor });
  },
  updateConveyor(partial: Partial<Conveyor>): Conveyor {
    currentConveyor = { ...currentConveyor, ...partial };
    return currentConveyor;
  },

  // Splices
  getSplices(): Promise<Splice[]> {
    return Promise.resolve(Object.values(currentSplices));
  },
  getSpliceById(id: SpliceId): Promise<Splice | null> {
    return Promise.resolve(currentSplices[id] ? { ...currentSplices[id] } : null);
  },
  updateSplice(id: SpliceId, partial: Partial<Splice>): Splice {
    if (currentSplices[id]) {
      currentSplices[id] = { ...currentSplices[id], ...partial };
    }
    return currentSplices[id];
  },

  // Alerts
  getAlerts(): Promise<Alert[]> {
    return Promise.resolve([...currentAlerts]);
  },
  acknowledgeAlert(alertId: string, technicianName = 'Field Supervisor'): Alert | null {
    const alert = currentAlerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = 'Acknowledged';
      alert.acknowledgedBy = technicianName;
      return { ...alert };
    }
    return null;
  },

  // Maintenance Tasks
  getMaintenanceTasks(): Promise<MaintenanceTask[]> {
    return Promise.resolve([...currentMaintenanceTasks]);
  },
  createMaintenanceTaskFromAlert(alertId: string): MaintenanceTask | null {
    const alert = currentAlerts.find((a) => a.id === alertId);
    if (!alert) return null;

    const newTask: MaintenanceTask = {
      id: `MNT-2026-${Math.floor(100 + Math.random() * 900)}`,
      spliceId: alert.spliceId,
      title: `Corrective Action for ${alert.spliceId}: ${alert.title}`,
      priority: alert.severity === 'Critical' ? 'Urgent / Interlock' : 'Planned / Medium',
      status: 'Pending',
      recommendedWindow: 'Next planned maintenance stop (within 24 hrs)',
      createdTimestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    currentMaintenanceTasks = [newTask, ...currentMaintenanceTasks];
    alert.status = 'Maintenance_Created';
    alert.linkedMaintenanceTaskId = newTask.id;

    if (currentSplices[alert.spliceId]) {
      currentSplices[alert.spliceId].maintenanceStatus = 'Work Order Created';
    }

    return newTask;
  },
  assignTechnician(taskId: string, technicianId: string): { task: MaintenanceTask; technician: Technician } | null {
    const task = currentMaintenanceTasks.find((t) => t.id === taskId);
    const tech = currentTechnicians.find((t) => t.id === technicianId);
    if (!task || !tech) return null;

    task.status = 'Assigned';
    task.assignedTechnicianId = tech.id;
    task.assignedTechnicianName = tech.name;

    tech.availability = 'Assigned';
    tech.currentAssignmentId = task.id;
    tech.assignedSpliceId = task.spliceId;

    if (currentSplices[task.spliceId]) {
      currentSplices[task.spliceId].maintenanceStatus = 'Under Maintenance';
    }

    return { task: { ...task }, technician: { ...tech } };
  },
  startInspection(taskId: string): MaintenanceTask | null {
    const task = currentMaintenanceTasks.find((t) => t.id === taskId);
    if (!task) return null;

    task.status = 'In_Progress';
    if (task.assignedTechnicianId) {
      const tech = currentTechnicians.find((t) => t.id === task.assignedTechnicianId);
      if (tech) {
        tech.availability = 'Inspection In Progress';
      }
    }
    return { ...task };
  },
  completeMaintenance(
    taskId: string,
    details: MaintenanceCompletionDetails
  ): { task: MaintenanceTask; splice: Splice } | null {
    const task = currentMaintenanceTasks.find((t) => t.id === taskId);
    if (!task) return null;

    task.status = 'Completed';
    task.completedTimestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    task.completionDetails = details;

    // Free the technician
    if (task.assignedTechnicianId) {
      const tech = currentTechnicians.find((t) => t.id === task.assignedTechnicianId);
      if (tech) {
        tech.availability = 'Completed';
      }
    }

    // Update the splice passport & history
    const splice = currentSplices[task.spliceId];
    if (splice) {
      splice.maintenanceStatus = 'Inspected / Verified';
      const newRecord = {
        id: task.id,
        timestamp: task.completedTimestamp,
        pass: currentConveyor.currentPass,
        technician: task.assignedTechnicianName || 'Field Technician',
        actionTaken: details.actionPerformed,
        actualDefect: details.actualDefect,
        observedSeverity: details.observedSeverity,
        falseAlarm: details.falseAlarm,
        notes: details.technicianNotes,
        verifiedSpliceScoreAfter: details.falseAlarm ? 92 : Math.min(100, splice.score + 10),
      };
      splice.maintenanceHistory = [newRecord, ...splice.maintenanceHistory];

      // If action was performed (e.g. cold vulcanizing patch applied or false alarm cleared), condition improves
      if (details.actionPerformed.includes('Patch') || details.actionPerformed.includes('Vulcanized') || details.actionPerformed.includes('Reinforced')) {
        splice.condition = 'Healthy';
        splice.score = Math.min(94, splice.score + 18);
        splice.trend = 'Improving';
        splice.recommendation = 'Splice reinforced and verified by physical NDT survey. Continue regular monitoring.';
      } else {
        splice.recommendation = `Physical inspection completed: ${details.actualDefect} verified. Maintain accelerated monitoring.`;
      }
    }

    return { task: { ...task }, splice: { ...splice } };
  },

  // Personnel
  getPersonnel(): Promise<Technician[]> {
    return Promise.resolve([...currentTechnicians]);
  },

  // System Health
  getSystemHealth(): Promise<SensorHealth[]> {
    return Promise.resolve([...currentSensorHealth]);
  },
  toggleCameraDegradation(degraded: boolean): SensorHealth[] {
    const cam = currentSensorHealth.find((s) => s.category === 'Vision Camera');
    if (cam) {
      if (degraded) {
        cam.status = 'Degraded';
        cam.confidencePct = 74;
        cam.diagnostics = 'OPTICAL LENS CONTAMINATION: Iron-ore dust fines accumulation on optical protective quartz window. Camera confidence reduced to 74%. Asset condition remains independent.';
        cam.metrics['Strobe Lux'] = '9,800 lx (Attenuated)';
        cam.metrics['Frame Dropped'] = '0.04%';
      } else {
        cam.status = 'Nominal';
        cam.confidencePct = 94;
        cam.diagnostics = 'Lens clean. Illumination strobe array calibrated. Dual CMOS sensors synchronizing at 12,000 lines/sec.';
        cam.metrics['Strobe Lux'] = '18,400 lx';
        cam.metrics['Frame Dropped'] = '0.00%';
      }
    }
    return [...currentSensorHealth];
  },

  // Inspection Events
  getInspectionEvents(): Promise<InspectionEvent[]> {
    return Promise.resolve([...currentInspectionEvents]);
  },
  recordInspectionEvent(event: InspectionEvent): InspectionEvent {
    currentInspectionEvents = [event, ...currentInspectionEvents.filter((e) => e.id !== event.id).slice(0, 19)];
    return event;
  },

  // Spare Readiness
  getSpareReadiness(): Promise<Record<string, SpareReadiness>> {
    return Promise.resolve({ ...currentSpareReadiness });
  },

  // Reset demo state
  resetAll(): void {
    currentConveyor = { ...INITIAL_CONVEYOR };
    currentSplices = JSON.parse(JSON.stringify(INITIAL_SPLICES));
    currentAlerts = JSON.parse(JSON.stringify(INITIAL_ALERTS));
    currentMaintenanceTasks = JSON.parse(JSON.stringify(INITIAL_MAINTENANCE_TASKS));
    currentTechnicians = JSON.parse(JSON.stringify(INITIAL_TECHNICIANS));
    currentSensorHealth = JSON.parse(JSON.stringify(INITIAL_SENSOR_HEALTH));
    currentInspectionEvents = JSON.parse(JSON.stringify(INITIAL_INSPECTION_EVENTS));
    currentSpareReadiness = JSON.parse(JSON.stringify(INITIAL_SPARE_READINESS));
  },
};
