import { GoogleGenAI } from '@google/genai';
import { Conveyor, Splice, Alert, MaintenanceTask, SensorHealth, InspectionEvent, SpliceId } from '../types';

export interface CopilotContext {
  conveyor: Conveyor;
  splices: Record<string, Splice>;
  alerts: Alert[];
  maintenanceTasks: MaintenanceTask[];
  sensorHealth: SensorHealth[];
  inspectionEvents: InspectionEvent[];
  activeTab: string;
  selectedSpliceId: string;
  isCameraContaminated: boolean;
}

export interface CopilotAction {
  label: string;
  type: 'navigate' | 'select_splice' | 'trigger_scan' | 'acknowledge_alert' | 'toggle_camera';
  payload?: string;
}

export interface CopilotResponse {
  text: string;
  actions?: CopilotAction[];
  source: 'gemini' | 'simulated';
  modelUsed?: string;
}

/**
 * Constructs a comprehensive system context prompt based on live telemetry
 */
export function buildSystemContextPrompt(context: CopilotContext): string {
  const {
    conveyor,
    splices,
    alerts,
    maintenanceTasks,
    sensorHealth,
    activeTab,
    selectedSpliceId,
    isCameraContaminated,
  } = context;

  const activeAlertsStr = alerts
    .filter((a) => a.status === 'Open')
    .map(
      (a) =>
        `- [${a.severity}] ${a.id}: ${a.title} (Splice: ${a.spliceId}, Belt Pos: ${splices[a.spliceId]?.baselineCoordinate || 0}m) - ${a.message}`
    )
    .join('\n') || 'None';

  const splicesStr = Object.values(splices)
    .map(
      (s) =>
        `- ${s.id} (${s.spliceType}): Condition Score ${s.score}/100 [${s.condition}], Baseline: ${s.baselineCoordinate}m, Wear Trend: ${s.trend}, Vision: ${s.evidence.vision.status}, Magnetic: ${s.evidence.magnetic.status}`
    )
    .join('\n');

  const maintenanceStr = maintenanceTasks
    .map(
      (m) =>
        `- Task ${m.id} (${m.spliceId}): Status '${m.status}', Priority '${m.priority}', Assigned: ${m.assignedTechnicianName || m.assignedTechnicianId || 'Unassigned'}`
    )
    .join('\n') || 'None';

  const sensorsStr = sensorHealth
    .map((s) => `- ${s.name} (${s.category}): ${s.status} (Quality: ${s.confidencePct}%)`)
    .join('\n');

  return `You are "SpliceGuard AI Copilot", an expert AI assistant for Smart Heavy-Duty Conveyor Belt Inspection & Health Monitoring Systems (SIH 2026 Problem Statement 26008 for Ministry of Steel / NMDC Mining).

SYSTEM TELEMETRY CONTEXT:
- Conveyor ID: ${conveyor.id} (Location: ${conveyor.location})
- Conveyor Status: ${conveyor.status}, Speed: ${conveyor.speedMs} m/s, Pass Count: #${conveyor.currentPass}, Encoder Pos: ${conveyor.currentCoordinateM}m / ${conveyor.loopLengthM}m
- Active Dashboard View: ${activeTab}
- Currently Selected Splice in UI: ${selectedSpliceId}
- Camera Lens Contamination: ${isCameraContaminated ? 'ALERT: Contaminated/Degraded' : 'Nominal'}

SPLICE HEALTH MATRIX:
${splicesStr}

ACTIVE OPEN ALERTS:
${activeAlertsStr}

MAINTENANCE WORK ORDERS:
${maintenanceStr}

SENSOR SYSTEM HEALTH:
${sensorsStr}

INSTRUCTIONS:
1. Provide concise, expert engineering and operational insights.
2. Structure output using markdown formatting, bullet points, and key metrics.
3. Suggest concrete actions when applicable (e.g. suggesting maintenance schedules, recommending scan triggers, or advising technician assignment).
4. If asked to navigate or perform actions, explain what action is recommended.`;
}

/**
 * Main query entry point for SpliceGuard Copilot
 */
export async function queryCopilot(
  userQuery: string,
  context: CopilotContext,
  apiKeyOverride?: string
): Promise<CopilotResponse> {
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY || '';
  const apiKey = apiKeyOverride || envKey;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemPrompt = buildSystemContextPrompt(context);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Question: ${userQuery}` }] },
        ],
      });

      const responseText = response.text || 'No response text received from Gemini AI.';
      const actions = extractActionsFromQueryAndContext(userQuery, responseText, context);

      return {
        text: responseText,
        actions,
        source: 'gemini',
        modelUsed: 'gemini-2.5-flash',
      };
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to domain intelligence engine:', err);
      // Fall through to domain fallback engine below
    }
  }

  // Domain Intelligence Fallback Engine
  return generateDomainFallbackResponse(userQuery, context);
}

/**
 * Extracts executable dashboard actions from query context
 */
function extractActionsFromQueryAndContext(
  query: string,
  responseText: string,
  context: CopilotContext
): CopilotAction[] {
  const actions: CopilotAction[] = [];
  const q = (query + ' ' + responseText).toLowerCase();

  if (q.includes('live inspection') || q.includes('live scan') || q.includes('camera view')) {
    actions.push({ label: '📡 Open Live Inspection', type: 'navigate', payload: 'live' });
  }

  if (q.includes('digital twin') || q.includes('3d model') || q.includes('3d view')) {
    actions.push({ label: '🌐 Open Digital Twin', type: 'navigate', payload: 'digital-twin' });
  }

  if (q.includes('passport') || q.includes('splice s03') || q.includes('s03 history')) {
    actions.push({ label: '📄 View Splice S03 Passport', type: 'navigate', payload: 'passports' });
    actions.push({ label: '🔍 Select Splice S03', type: 'select_splice', payload: 'S03' });
  }

  if (q.includes('alert') || q.includes('high severity') || q.includes('critical') || q.includes('alt-001')) {
    actions.push({ label: '🚨 Open Alerts Center', type: 'navigate', payload: 'alerts' });
  }

  if (q.includes('maintenance') || q.includes('work order') || q.includes('technician')) {
    actions.push({ label: '🔧 Open Maintenance Page', type: 'navigate', payload: 'maintenance' });
  }

  if (q.includes('scan') || q.includes('trigger scan') || q.includes('inspect s03')) {
    actions.push({ label: '⚡ Trigger High-Res Scan S03', type: 'trigger_scan', payload: 'S03' });
  }

  return actions;
}

/**
 * High-quality context-aware fallback response generator
 */
function generateDomainFallbackResponse(userQuery: string, context: CopilotContext): CopilotResponse {
  const q = userQuery.toLowerCase();
  const { splices, alerts, maintenanceTasks, conveyor, isCameraContaminated } = context;

  const s03 = splices['S03'];
  const openAlerts = alerts.filter((a) => a.status === 'Open');

  let text = '';
  const actions: CopilotAction[] = [];

  if (q.includes('s03') || q.includes('anomaly') || q.includes('magnetic') || q.includes('degradation')) {
    text = `### 🔍 Splice S03 Diagnostics Summary

**Current State:** Condition Score **${s03?.score || 68}/100** (${s03?.condition || 'Warning'})
- **Location:** ${s03?.baselineCoordinate || 210}m along conveyor loop
- **Magnetic Anomaly:** 1.85 Gauss Flux Leakage detected near steel cable cord #7-9
- **Vision Scan:** Minor surface micro-cracking (42mm propagation length)
- **Wear Velocity:** +1.4% degradation rate per 1,000 passes

#### 💡 Recommended Engineering Actions:
1. Perform high-frequency magnetic flux re-scan during Pass #${conveyor.currentPass + 1}.
2. Verify vulcanizing spare kit availability (**K-800 High Tension Rubber Kit**).
3. Schedule visual inspection prior to next 2,000t ore loading cycle.`;

    actions.push({ label: '⚡ Trigger Scan on S03', type: 'trigger_scan', payload: 'S03' });
    actions.push({ label: '📄 View S03 Passport', type: 'navigate', payload: 'passports' });
    actions.push({ label: '🔧 Go to Maintenance Tasks', type: 'navigate', payload: 'maintenance' });
  } else if (q.includes('alert') || q.includes('high priority') || q.includes('critical') || q.includes('warning')) {
    text = `### 🚨 Active Alerts Summary (${openAlerts.length} Open Alerts)

${openAlerts
  .map(
    (a) =>
      `- **[${a.severity}] ${a.id}**: ${a.title}\n  *Splice:* ${a.spliceId} at ${splices[a.spliceId]?.baselineCoordinate || 0}m | *Triggered:* ${a.timestamp}`
  )
  .join('\n\n')}

#### ⚙️ Suggested Mitigation:
- Prioritize **ALT-001** (S03 Magnetic Anomaly) as it presents the primary failure risk.
- Ensure Technician **Ramesh Kumar** is dispatched with magnetic flux validation equipment.`;

    actions.push({ label: '🚨 Open Alerts Center', type: 'navigate', payload: 'alerts' });
    actions.push({ label: '🔧 Review Maintenance Schedule', type: 'navigate', payload: 'maintenance' });
  } else if (q.includes('maintenance') || q.includes('schedule') || q.includes('repair') || q.includes('technician')) {
    text = `### 🔧 Maintenance & Work Order Status

- **Pending/Active Tasks:** ${maintenanceTasks.length} Work Orders
- **Critical Task:** Maintenance task for Splice S03 (Priority: Urgent / Interlock)
- **Assigned Technician:** Ramesh Kumar (Level 3 Vulcanizing Specialist)
- **Estimated Repair Window:** 45 minutes shutdown required

#### 📦 Spare Parts Readiness:
- **Kit K-800 (Heavy Vulcanizing):** 2 units available in Kirandul Warehouse Section B3 (Ready for immediate dispatch).`;

    actions.push({ label: '🔧 Go to Maintenance', type: 'navigate', payload: 'maintenance' });
    actions.push({ label: '📦 View Spares & Financials', type: 'navigate', payload: 'readiness' });
  } else if (q.includes('health') || q.includes('camera') || q.includes('sensor') || q.includes('status')) {
    text = `### 📡 System Health & Telemetry Status

- **Conveyor Belt:** Operational (${conveyor.speedMs} m/s | Pass #${conveyor.currentPass})
- **Optical Vision System:** ${isCameraContaminated ? '⚠️ Degraded (Dust Contamination Detected)' : '✅ Nominal'}
- **Magnetic Flux Sensor Array:** ✅ Active & Calibrated
- **Laser Profilometer:** ✅ Operational
- **Rotary Shaft Encoder:** ✅ Synchronized at 0.00m reference mark`;

    if (isCameraContaminated) {
      actions.push({ label: '🧼 Simulate Lens Cleaning', type: 'toggle_camera' });
    }
    actions.push({ label: '📡 View System Health Page', type: 'navigate', payload: 'system-health' });
  } else {
    text = `### 🤖 SpliceGuard Cyber-Industrial Copilot

I have analyzed the current live telemetry for **Kirandul Complex CV-01**:

- **System Status:** ${conveyor.status} | Speed: ${conveyor.speedMs} m/s
- **Primary Attention Area:** **Splice S03** (Condition Score: ${s03?.score}/100, Elevated Magnetic Leakage)
- **Active Open Alerts:** ${openAlerts.length} total alerts (${openAlerts.filter((a) => a.severity === 'Critical' || a.severity === 'Warning').length} Critical/Warning)

#### How can I assist you right now?
- Analyze degradation trend for Splice S03
- Generate preventative maintenance schedule for Shift B
- Check spare part inventory and financial readiness
- Trigger immediate scan sequence on upcoming splice`;

    actions.push({ label: '⚡ Scan Splice S03', type: 'trigger_scan', payload: 'S03' });
    actions.push({ label: '🌐 Open Digital Twin', type: 'navigate', payload: 'digital-twin' });
    actions.push({ label: '🚨 View Active Alerts', type: 'navigate', payload: 'alerts' });
  }

  return {
    text,
    actions,
    source: 'simulated',
  };
}
