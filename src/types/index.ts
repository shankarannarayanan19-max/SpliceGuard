// Central TypeScript definitions for SpliceGuard - SIH 2026 PS 26008
// Conveyor belt splice condition monitoring & predictive maintenance

export type SpliceId = 'S01' | 'S02' | 'S03' | 'S04';

export type ConditionState = 'Healthy' | 'Warning' | 'Critical';
export type TrendDirection = 'Stable' | 'Declining' | 'Rapid Degradation' | 'Improving';

export interface ConditionHistoryPoint {
  pass: number;
  timestamp: string;
  score: number;
  visionScore: number;
  magneticScore: number;
  anomalyMagnitude: number; // 0 - 100
}

export type ObservedSeverity = 'Minor' | 'Moderate' | 'Severe' | 'None (Normal Wear)';

export interface MaintenanceCompletionDetails {
  actualDefect: string;
  observedSeverity: ObservedSeverity;
  actionPerformed: string;
  falseAlarm: boolean;
  technicianNotes: string;
}

export interface MaintenanceRecord {
  id: string;
  timestamp: string;
  pass: number;
  technician: string;
  actionTaken: string;
  actualDefect: string;
  observedSeverity: ObservedSeverity;
  falseAlarm: boolean;
  notes: string;
  verifiedSpliceScoreAfter?: number;
}

export interface SpliceEvidence {
  vision: {
    status: 'Nominal' | 'Minor Surface Damage' | 'Severe Cracking' | 'Edge Cut';
    description: string;
    surfaceCutsMm?: number;
    edgeWearPct?: number;
    confidence: number; // e.g. 94%
    observedAnomaly: string;
  };
  magnetic: {
    status: 'Normal Flux' | 'Elevated Anomaly' | 'Cord Severance' | 'Corrosion Cluster';
    description: string;
    cordBreakagesEst: number;
    fluxLeakageGauss: number;
    confidence: number; // e.g. 91%
    observedAnomaly: string;
  };
  operatingContext: {
    loadFactorPct: number;
    beltSpeedMs: number;
    motorCurrentA: number;
    operatingHours: number;
    ambientTempC: number;
  };
}

export interface Splice {
  id: SpliceId;
  name: string;
  baselineCoordinate: number; // meters from reference: S01: 0m, S02: 105m, S03: 210m, S04: 315m
  condition: ConditionState;
  score: number; // 0 - 100
  trend: TrendDirection;
  installDate: string;
  spliceType: string; // e.g., "Finger Splice - 3 Stage Vulcanized"
  cordType: string;   // e.g., "Steel Cord ST-3150 / 64 Cords"
  widthMm: number;
  thicknessMm: number;
  inspectionCount: number;
  lastInspectedPass: number;
  maintenanceStatus: 'Operational' | 'Inspection Recommended' | 'Work Order Created' | 'Under Maintenance' | 'Inspected / Verified';
  conditionHistory: ConditionHistoryPoint[];
  evidence: SpliceEvidence;
  maintenanceHistory: MaintenanceRecord[];
  recommendation: string;
  notes: string[];
}

export interface Conveyor {
  id: string;
  name: string;
  location: string;
  status: 'Running' | 'Idle' | 'Maintenance Stop';
  speedMs: number; // e.g. 3.2 m/s
  loopLengthM: number; // 420 m
  currentPass: number; // 147
  currentCoordinateM: number; // 0 - 420 m
  referenceState: 'Synchronized' | 'Re-aligning' | 'Sensor Drift';
  referenceLastSyncPass: number;
  driveMotorKw: number;
  motorCurrentA: number;
  loadFactorPct: number;
  beltTensionKn: number;
  operatingHours: number;
  totalSplicesCount: number;
}

export interface InspectionEvent {
  id: string;
  pass: number;
  timestamp: string;
  spliceId: SpliceId;
  beltCoordinateM: number;
  status: 'Approaching' | 'In_Inspection_Zone' | 'Scanning' | 'Scan_Complete' | 'Passed';
  visionSummary: string;
  magneticSummary: string;
  conditionResult: number;
  conditionState: ConditionState;
  trend: TrendDirection;
  encoderTravelAtCapture: number;
  rawConfidence: {
    visionConfidence: number;
    magneticConfidence: number;
    encoderConfidence: number;
  };
}

export type AlertSeverity = 'Info' | 'Warning' | 'Critical';
export type AlertStatus = 'Open' | 'Acknowledged' | 'Maintenance_Created' | 'Resolved';

export interface Alert {
  id: string; // ALT-003
  spliceId: SpliceId;
  severity: AlertSeverity;
  title: string;
  message: string;
  evidence: string;
  recommendation: string;
  status: AlertStatus;
  timestamp: string;
  pass: number;
  acknowledgedBy?: string;
  linkedMaintenanceTaskId?: string;
}

export type MaintenancePriority = 'Planned / Medium' | 'Routine' | 'High' | 'Urgent / Interlock';
export type MaintenanceStatus = 'Pending' | 'Assigned' | 'In_Progress' | 'Completed';

export interface MaintenanceTask {
  id: string;
  spliceId: SpliceId;
  title: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  recommendedWindow: string;
  createdTimestamp: string;
  completedTimestamp?: string;
  completionDetails?: MaintenanceCompletionDetails;
}

export type TechnicianStatus = 'Available' | 'Assigned' | 'Inspection In Progress' | 'Completed' | 'Off Duty';

export interface Technician {
  id: string;
  name: string;
  role: string;
  shift: string;
  zone: string;
  availability: TechnicianStatus;
  certification: string;
  experienceYears: number;
  currentAssignmentId?: string;
  assignedSpliceId?: SpliceId;
  phone: string;
}

export interface SensorHealth {
  id: string;
  name: string;
  category: 'Vision Camera' | 'Magnetic / MFL' | 'Rotary Encoder' | 'Reference Trigger' | 'SCADA Telemetry';
  status: 'Nominal' | 'Degraded' | 'Offline';
  confidencePct: number;
  diagnostics: string;
  firmware: string;
  lastCalibrated: string;
  metrics: { [key: string]: string | number };
}

export interface SpareReadiness {
  spliceId: SpliceId;
  vulcanizingKitStatus: 'READY' | 'TIGHT' | 'NOT AVAILABLE';
  kitPartNumber: string;
  warehouseLocation: string;
  leadTimeHours: number;
  crewStandby: 'Normal' | 'Alert' | 'Mobilized';
  estimatedDowntimeHours: number;
  estimatedProductionExposureInr: string;
  estimatedMaintenanceCostInr: string;
}
