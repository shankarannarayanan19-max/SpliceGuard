import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Conveyor,
  Splice,
  SpliceId,
  Alert,
  MaintenanceTask,
  MaintenanceCompletionDetails,
  Technician,
  SensorHealth,
  InspectionEvent,
  SpareReadiness,
} from '../types';
import { mockService } from '../services/mockServices';
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

export type NavigationTab =
  | 'overview'
  | 'live'
  | 'digital-twin'
  | 'passports'
  | 'alerts'
  | 'maintenance'
  | 'personnel'
  | 'system-health'
  | 'readiness';

interface AppContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  selectedSpliceId: SpliceId;
  setSelectedSpliceId: (id: SpliceId) => void;
  
  conveyor: Conveyor;
  splices: Record<string, Splice>;
  alerts: Alert[];
  maintenanceTasks: MaintenanceTask[];
  technicians: Technician[];
  sensorHealth: SensorHealth[];
  inspectionEvents: InspectionEvent[];
  spareReadiness: Record<string, SpareReadiness>;

  // Inspection Station Simulation
  inspectionStatus: 'Idle' | 'Approaching' | 'In_Inspection_Zone' | 'Scanning' | 'Scan_Complete';
  approachingSplice: Splice | null;
  distanceToStation: number; // in meters
  currentInspectionEvent: InspectionEvent | null;

  // Demo Controls
  isDemoRunning: boolean;
  demoSpeedMultiplier: number;
  toggleDemoRunning: () => void;
  setDemoSpeedMultiplier: (mult: number) => void;
  resetSimulation: () => void;
  triggerScanSequence: (spliceId?: SpliceId) => void;

  // Workflow Actions
  acknowledgeAlert: (alertId: string) => void;
  createMaintenanceFromAlert: (alertId: string) => MaintenanceTask | null;
  assignTechnicianToTask: (taskId: string, techId: string) => void;
  startTaskInspection: (taskId: string) => void;
  completeTaskMaintenance: (taskId: string, details: MaintenanceCompletionDetails) => void;
  toggleCameraContamination: () => void;
  isCameraContaminated: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [selectedSpliceId, setSelectedSpliceId] = useState<SpliceId>('S03');

  const [conveyor, setConveyor] = useState<Conveyor>({ ...INITIAL_CONVEYOR });
  const [splices, setSplices] = useState<Record<string, Splice>>({ ...INITIAL_SPLICES });
  const [alerts, setAlerts] = useState<Alert[]>([...INITIAL_ALERTS]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([...INITIAL_MAINTENANCE_TASKS]);
  const [technicians, setTechnicians] = useState<Technician[]>([...INITIAL_TECHNICIANS]);
  const [sensorHealth, setSensorHealth] = useState<SensorHealth[]>([...INITIAL_SENSOR_HEALTH]);
  const [inspectionEvents, setInspectionEvents] = useState<InspectionEvent[]>([...INITIAL_INSPECTION_EVENTS]);
  const [spareReadiness, setSpareReadiness] = useState<Record<string, SpareReadiness>>({ ...INITIAL_SPARE_READINESS });

  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(true);
  const [demoSpeedMultiplier, setDemoSpeedMultiplier] = useState<number>(1);
  const [isCameraContaminated, setIsCameraContaminated] = useState<boolean>(false);

  // Live Inspection state
  const [inspectionStatus, setInspectionStatus] = useState<
    'Idle' | 'Approaching' | 'In_Inspection_Zone' | 'Scanning' | 'Scan_Complete'
  >('Approaching');
  const [approachingSplice, setApproachingSplice] = useState<Splice | null>(INITIAL_SPLICES['S03'] || null);
  const [distanceToStation, setDistanceToStation] = useState<number>(14.2);
  const [currentInspectionEvent, setCurrentInspectionEvent] = useState<InspectionEvent | null>(INITIAL_INSPECTION_EVENTS[0] || null);

  // Initialize data on mount
  useEffect(() => {
    mockService.getConveyor().then((c) => setConveyor(c));
    mockService.getSplices().then((list) => {
      const map: Record<string, Splice> = {};
      list.forEach((s) => (map[s.id] = s));
      setSplices(map);
      setApproachingSplice(map['S03'] || null);
    });
    mockService.getAlerts().then((a) => setAlerts(a));
    mockService.getMaintenanceTasks().then((m) => setMaintenanceTasks(m));
    mockService.getPersonnel().then((p) => setTechnicians(p));
    mockService.getSystemHealth().then((s) => setSensorHealth(s));
    mockService.getInspectionEvents().then((e) => {
      setInspectionEvents(e);
      if (e.length > 0) setCurrentInspectionEvent(e[0]);
    });
    mockService.getSpareReadiness().then((r) => setSpareReadiness(r));
  }, []);

  // Continuous physics simulation tick for conveyor & splice localization
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const scanLockRef = useRef<boolean>(false);

  const triggerScanSequence = useCallback((targetSpliceId: SpliceId = 'S03') => {
    const target = splices[targetSpliceId];
    if (!target) return;

    scanLockRef.current = true;
    setInspectionStatus('In_Inspection_Zone');

    setTimeout(() => {
      setInspectionStatus('Scanning');

      setTimeout(() => {
        setInspectionStatus('Scan_Complete');
        scanLockRef.current = false;

        const uniqueEventId = `EVT-${conveyor.currentPass}-${target.id}-${Date.now().toString(36).toUpperCase()}`;

        const newEvent: InspectionEvent = {
          id: uniqueEventId,
          pass: conveyor.currentPass,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          spliceId: target.id,
          beltCoordinateM: target.baselineCoordinate,
          status: 'Scan_Complete',
          visionSummary: target.evidence.vision.status === 'Nominal' ? 'Nominal baseline surface' : 'Minor surface fissure (42mm length)',
          magneticSummary: target.evidence.magnetic.status === 'Normal Flux' ? 'Normal flux permeance' : 'Elevated magnetic anomaly (1.85G flux leakage)',
          conditionResult: target.score,
          conditionState: target.condition,
          trend: target.trend,
          encoderTravelAtCapture: conveyor.currentPass * 420 + target.baselineCoordinate,
          rawConfidence: {
            visionConfidence: isCameraContaminated ? 74 : target.evidence.vision.confidence,
            magneticConfidence: target.evidence.magnetic.confidence,
            encoderConfidence: 99,
          },
        };

        const recorded = mockService.recordInspectionEvent(newEvent);
        setInspectionEvents((prev) => [recorded, ...prev.filter((e) => e.id !== recorded.id).slice(0, 19)]);
        setCurrentInspectionEvent(recorded);
      }, 2400); // 2.4s scanning sequence
    }, 1200);
  }, [conveyor.currentPass, splices, isCameraContaminated]);

  useEffect(() => {
    if (!isDemoRunning) return;

    const tick = (now: number) => {
      const dtSec = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (dtSec > 0 && dtSec < 0.5) {
        setConveyor((prev) => {
          const deltaDistance = prev.speedMs * dtSec * demoSpeedMultiplier;
          let nextCoord = prev.currentCoordinateM + deltaDistance;
          let nextPass = prev.currentPass;
          let nextRefState = prev.referenceState;

          // Loop boundary wrap at 420m
          if (nextCoord >= prev.loopLengthM) {
            nextCoord = nextCoord % prev.loopLengthM;
            nextPass += 1;
            nextRefState = 'Synchronized'; // Reference S01 detection trigger
          }

          // Compute distance to next approaching splice
          // Splices at: S01: 0m, S02: 105m, S03: 210m, S04: 315m
          // The inspection station is stationary at 0m (equivalent to belt coordinate passing by 0m)
          // or let's measure relative to station:
          // A splice at baselineCoordinate S reaches the station when nextCoord reaches S
          const spliceTargets: SpliceId[] = ['S01', 'S02', 'S03', 'S04'];
          const splicePositions: Record<SpliceId, number> = {
            S01: 0,
            S02: 105,
            S03: 210,
            S04: 315,
          };

          // Find which splice is approaching next
          let closestSpliceId: SpliceId = 'S03';
          let minDist = 999;

          for (const sId of spliceTargets) {
            let dist = splicePositions[sId] - nextCoord;
            if (dist < 0) dist += prev.loopLengthM; // wrap around distance
            if (dist < minDist) {
              minDist = dist;
              closestSpliceId = sId;
            }
          }

          setDistanceToStation(parseFloat(minDist.toFixed(1)));
          if (splices[closestSpliceId]) {
            setApproachingSplice(splices[closestSpliceId]);
          }

          // Check if entering inspection zone (< 2.0 meters)
          if (minDist <= 1.2 && !scanLockRef.current) {
            triggerScanSequence(closestSpliceId);
          } else if (minDist > 1.2 && !scanLockRef.current) {
            if (minDist < 20) {
              setInspectionStatus('Approaching');
            } else {
              setInspectionStatus('Idle');
            }
          }

          return {
            ...prev,
            currentCoordinateM: parseFloat(nextCoord.toFixed(2)),
            currentPass: nextPass,
            referenceState: nextRefState,
          };
        });
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isDemoRunning, demoSpeedMultiplier, splices, triggerScanSequence]);

  const toggleDemoRunning = () => {
    setIsDemoRunning((prev) => !prev);
    lastTimeRef.current = performance.now();
  };

  const resetSimulation = () => {
    mockService.resetAll();
    mockService.getConveyor().then((c) => setConveyor(c));
    mockService.getSplices().then((list) => {
      const map: Record<string, Splice> = {};
      list.forEach((s) => (map[s.id] = s));
      setSplices(map);
      setApproachingSplice(map['S03'] || null);
    });
    mockService.getAlerts().then((a) => setAlerts(a));
    mockService.getMaintenanceTasks().then((m) => setMaintenanceTasks(m));
    mockService.getPersonnel().then((p) => setTechnicians(p));
    mockService.getSystemHealth().then((s) => setSensorHealth(s));
    mockService.getInspectionEvents().then((e) => {
      setInspectionEvents(e);
      if (e.length > 0) setCurrentInspectionEvent(e[0]);
    });
    mockService.getSpareReadiness().then((r) => setSpareReadiness(r));
    setSelectedSpliceId('S03');
    setDistanceToStation(14.2);
    setInspectionStatus('Approaching');
    setIsCameraContaminated(false);
  };

  const acknowledgeAlert = (alertId: string) => {
    const updated = mockService.acknowledgeAlert(alertId, 'Field Supervisor (Shift A)');
    if (updated) {
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? updated : a)));
    }
  };

  const createMaintenanceFromAlert = (alertId: string) => {
    const task = mockService.createMaintenanceTaskFromAlert(alertId);
    if (task) {
      setMaintenanceTasks((prev) => [task, ...prev]);
      mockService.getAlerts().then((a) => setAlerts(a));
      mockService.getSplices().then((list) => {
        const map: Record<string, Splice> = {};
        list.forEach((s) => (map[s.id] = s));
        setSplices(map);
      });
      return task;
    }
    return null;
  };

  const assignTechnicianToTask = (taskId: string, techId: string) => {
    const result = mockService.assignTechnician(taskId, techId);
    if (result) {
      setMaintenanceTasks((prev) => prev.map((t) => (t.id === taskId ? result.task : t)));
      setTechnicians((prev) => prev.map((tech) => (tech.id === techId ? result.technician : tech)));
      mockService.getSplices().then((list) => {
        const map: Record<string, Splice> = {};
        list.forEach((s) => (map[s.id] = s));
        setSplices(map);
      });
    }
  };

  const startTaskInspection = (taskId: string) => {
    const updated = mockService.startInspection(taskId);
    if (updated) {
      setMaintenanceTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      mockService.getPersonnel().then((p) => setTechnicians(p));
    }
  };

  const completeTaskMaintenance = (taskId: string, details: MaintenanceCompletionDetails) => {
    const res = mockService.completeMaintenance(taskId, details);
    if (res) {
      setMaintenanceTasks((prev) => prev.map((t) => (t.id === taskId ? res.task : t)));
      setSplices((prev) => ({
        ...prev,
        [res.splice.id]: res.splice,
      }));
      mockService.getPersonnel().then((p) => setTechnicians(p));
    }
  };

  const toggleCameraContamination = () => {
    const nextState = !isCameraContaminated;
    setIsCameraContaminated(nextState);
    const updatedHealth = mockService.toggleCameraDegradation(nextState);
    setSensorHealth(updatedHealth);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedSpliceId,
        setSelectedSpliceId,
        conveyor,
        splices,
        alerts,
        maintenanceTasks,
        technicians,
        sensorHealth,
        inspectionEvents,
        spareReadiness,
        inspectionStatus,
        approachingSplice,
        distanceToStation,
        currentInspectionEvent,
        isDemoRunning,
        demoSpeedMultiplier,
        toggleDemoRunning,
        setDemoSpeedMultiplier,
        resetSimulation,
        triggerScanSequence,
        acknowledgeAlert,
        createMaintenanceFromAlert,
        assignTechnicianToTask,
        startTaskInspection,
        completeTaskMaintenance,
        toggleCameraContamination,
        isCameraContaminated,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
