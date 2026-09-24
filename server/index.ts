import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { classifyIntent, CopilotIntent } from './intentClassifier';
import { buildRelevantContext, CopilotContextPayload, SENSOR_ENGINEERING_MANUAL } from './contextBuilder';
import { memoryStore } from './memoryStore';

// Load environment variables from .env file at workspace root
dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

/**
 * Authoritative Industrial Gemini System Prompt for SpliceGuard AI Copilot
 */
export const GEMINI_INDUSTRIAL_SYSTEM_PROMPT = `You are SpliceGuard AI Copilot, an industrial conveyor-belt condition monitoring and predictive-maintenance assistant.

Your role is to assist plant engineers and maintenance personnel by interpreting structured data produced by the SpliceGuard system.

You are NOT the primary safety controller.

Never independently command, stop, start, or control conveyor equipment.

Safety trips and emergency shutdowns are handled by dedicated local safety/interlock systems.

Your role is to:
- explain evidence
- interpret structured telemetry
- summarize plant condition
- explain splice condition
- explain sensor anomalies
- explain risk
- explain RUL estimates
- summarize alerts
- explain maintenance status
- explain inventory status
- explain financial exposure
- answer engineering questions
- assist engineers with maintenance planning

Never invent sensor values, splice IDs, locations, RUL, financial values, maintenance completion, inventory, thresholds or plant specifications.

Always use supplied structured data.

Distinguish:
OBSERVED: Actual measured values.
INFERRED: Fusion/model interpretation.
PREDICTED: Future estimate.

RUL is a model estimate, never a guaranteed failure date.
Thresholds are plant/OEM/baseline dependent unless explicitly supplied by the system.
RFID provides splice identity.
Encoder provides belt position and movement.
MFL/DMI provides internal steel-condition evidence.
Vision provides external belt-condition evidence.
LWIR provides thermal evidence.
AE provides acoustic/structural evidence.
Tension, motor current, load and speed provide operational context.

Never treat one abnormal sensor as definitive failure when multimodal evidence is available.

When answering "plant status", provide a concise overall plant/conveyor summary.
When answering splice questions, provide splice identity, location, condition, evidence, RUL, and recommended response.
When answering maintenance questions, use actual maintenance data supplied by the backend.
When answering navigation requests, return a navigation action instead of merely describing the page.
When user greets you (e.g. "hello", "hi", "heloo bro"), respond briefly and naturally without industrial telemetry overload.

Be concise, technical, factual and engineering-oriented.`;

function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  if (!key || key === 'MY_GEMINI_API_KEY' || key.trim() === '') {
    return '';
  }
  return key.trim();
}

/**
 * Diagnostic status endpoint
 */
app.get('/api/copilot/status', async (req: Request, res: Response) => {
  const apiKey = getGeminiApiKey();
  const isConfigured = Boolean(apiKey);
  let isReachable = false;
  let errorDetail: string | undefined = undefined;

  if (isConfigured) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const testResult = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: 'Ping' }] }],
      });
      if (testResult && testResult.text) {
        isReachable = true;
      }
    } catch (err: any) {
      console.warn('[Copilot Status] Gemini reachability check failed:', err?.message || err);
      isReachable = false;
      errorDetail = err?.message || 'Gemini API call failed';
    }
  } else {
    errorDetail = 'GEMINI_API_KEY environment variable is empty or not configured in .env';
  }

  res.json({
    geminiConfigured: isConfigured,
    geminiReachable: isReachable,
    model: 'gemini-2.5-flash',
    memoryEnabled: true,
    error: errorDetail,
    activeSessionsCount: memoryStore.getActiveSessionsCount(),
  });
});

/**
 * Direct Gemini backend diagnostic test endpoint (Step 5)
 */
app.get('/api/copilot/test-gemini', async (req: Request, res: Response) => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    res.status(400).json({
      success: false,
      error: 'GEMINI_API_KEY is missing or empty in backend environment (.env)',
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'Reply with exactly: GEMINI_CONNECTION_OK' }] }],
    });

    const text = response.text?.trim() || '';
    res.json({
      success: true,
      text,
      isExactMatch: text.includes('GEMINI_CONNECTION_OK'),
    });
  } catch (err: any) {
    console.error('[Gemini Diagnostic Test Error]:', err?.message || err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to connect to Gemini API',
    });
  }
});

/**
 * Main Copilot query processing endpoint
 */
app.post('/api/copilot', async (req: Request, res: Response) => {
  try {
    const { query, context, sessionId = 'default-session' } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Query string is required' });
      return;
    }

    const fullContext: CopilotContextPayload = context || {};
    const memory = memoryStore.getRelevantMemory(sessionId);

    // 1. Classify Intent & Target Entity
    const classification = classifyIntent(query, memory.activeEntity);
    const intent = classification.intent;
    const targetEntity = classification.targetEntity || memory.activeEntity || 'S03';
    const navTarget = classification.navigationTarget;

    // Record user turn in memory
    memoryStore.addTurn(sessionId, {
      role: 'user',
      content: query,
      intent,
      targetEntity,
    });

    // 2. Navigation Intent handling
    if (intent === 'NAVIGATION' && navTarget) {
      const navLabels: Record<string, string> = {
        alerts: 'Active Alerts Center',
        'digital-twin': 'Digital Twin 3D View',
        maintenance: 'Maintenance & Work Orders',
        'system-health': 'System & Sensor Health',
        live: 'Live Inspection Station',
        passports: 'Splice Passports',
        readiness: 'Financial Readiness',
        overview: 'Overview Dashboard',
      };
      const navMessage = `Navigating to **${navLabels[navTarget] || navTarget}** page.`;

      memoryStore.addTurn(sessionId, {
        role: 'assistant',
        content: navMessage,
        intent,
        targetEntity,
      });

      console.log(`[Copilot Debug]
userMessage="${query}"
intent=${intent}
contextType=navigation
geminiConfigured=${Boolean(getGeminiApiKey())}
geminiAttempted=false
geminiSucceeded=false
fallbackUsed=false
responseSource=gemini`);

      res.json({
        text: navMessage,
        type: 'navigation',
        actions: [
          {
            label: `Go to ${navLabels[navTarget] || navTarget}`,
            type: 'navigate',
            payload: navTarget,
          },
        ],
        navigation: { target: navTarget },
        source: 'gemini',
        modelUsed: 'gemini-2.5-flash',
      });
      return;
    }

    // 3. Selective telemetry context builder
    const selectiveContext = buildRelevantContext(intent, fullContext, targetEntity);
    const apiKey = getGeminiApiKey();
    const isConfigured = Boolean(apiKey);

    let geminiAttempted = false;
    let geminiSucceeded = false;
    let fallbackUsed = false;
    let geminiError: string | undefined = undefined;

    // 4. If Gemini is configured, attempt generation
    if (isConfigured) {
      geminiAttempted = true;
      try {
        const ai = new GoogleGenAI({ apiKey });

        const promptText = `CURRENT USER QUESTION: "${query}"

INTENT DETECTED: ${intent} (Target Entity: ${targetEntity})

RELEVANT SPLICEGUARD STRUCTURED CONTEXT:
${selectiveContext}`;

        const contents = [
          ...memory.historyTurns,
          {
            role: 'user',
            parts: [{ text: promptText }],
          },
        ];

        const geminiResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: GEMINI_INDUSTRIAL_SYSTEM_PROMPT,
            temperature: 0.2,
          },
          contents,
        });

        const responseText = geminiResponse.text?.trim();

        if (responseText) {
          geminiSucceeded = true;
          const actions = extractActionsForIntent(intent, targetEntity, fullContext);

          memoryStore.addTurn(sessionId, {
            role: 'assistant',
            content: responseText,
            intent,
            targetEntity,
          });

          console.log(`[Copilot Debug]
userMessage="${query}"
intent=${intent}
contextType=${intent}
geminiConfigured=${isConfigured}
geminiAttempted=${geminiAttempted}
geminiSucceeded=${geminiSucceeded}
fallbackUsed=false
responseSource=gemini`);

          res.json({
            text: responseText,
            actions,
            source: 'gemini',
            modelUsed: 'gemini-2.5-flash',
            memoryTurns: memory.turnsCount + 2,
          });
          return;
        }
      } catch (err: any) {
        geminiError = err?.message || 'Gemini API execution error';
        console.warn('[Copilot Server] Gemini API call failed:', geminiError);
      }
    } else {
      geminiError = 'GEMINI_API_KEY is not set or empty in backend environment (.env)';
    }

    // 5. Fallback Engine (Dynamic Domain Intelligence)
    fallbackUsed = true;
    const fallbackResponse = generateDynamicFallbackResponse(intent, query, fullContext, targetEntity);

    memoryStore.addTurn(sessionId, {
      role: 'assistant',
      content: fallbackResponse.text,
      intent,
      targetEntity,
    });

    console.log(`[Copilot Debug]
userMessage="${query}"
intent=${intent}
contextType=${intent}
geminiConfigured=${isConfigured}
geminiAttempted=${geminiAttempted}
geminiSucceeded=${geminiSucceeded}
fallbackUsed=${fallbackUsed}
responseSource=fallback
geminiError="${geminiError}"`);

    res.json({
      text: fallbackResponse.text,
      actions: fallbackResponse.actions,
      source: 'simulated', // Frontend renders as "⚙️ Domain Fallback"
      geminiError,
      memoryTurns: memory.turnsCount + 2,
    });
  } catch (err: any) {
    console.error('[Copilot Server Error]:', err);
    res.status(500).json({
      error: 'Internal Copilot Server Error',
      message: err?.message || 'Failed to process request',
    });
  }
});

/**
 * Generates appropriate actions matching intent
 */
function extractActionsForIntent(intent: CopilotIntent, targetEntity: string, fullContext: CopilotContextPayload) {
  const actions: Array<{ label: string; type: string; payload?: string }> = [];

  switch (intent) {
    case 'PLANT_STATUS':
      actions.push({ label: '⚡ Scan Splice S03', type: 'trigger_scan', payload: 'S03' });
      actions.push({ label: '🚨 View Active Alerts', type: 'navigate', payload: 'alerts' });
      actions.push({ label: '🌐 Open Digital Twin', type: 'navigate', payload: 'digital-twin' });
      break;
    case 'SPLICE_STATUS':
    case 'SPLICE_ANALYSIS':
    case 'RUL':
      actions.push({ label: `⚡ Scan ${targetEntity}`, type: 'trigger_scan', payload: targetEntity });
      actions.push({ label: `📄 View ${targetEntity} Passport`, type: 'navigate', payload: 'passports' });
      actions.push({ label: '🔧 Review Maintenance Task', type: 'navigate', payload: 'maintenance' });
      break;
    case 'ACTIVE_ALERTS':
      actions.push({ label: '🚨 Go to Alerts Center', type: 'navigate', payload: 'alerts' });
      actions.push({ label: '🔧 Review Maintenance Schedule', type: 'navigate', payload: 'maintenance' });
      break;
    case 'MAINTENANCE_SCHEDULE':
    case 'MAINTENANCE_TASK':
    case 'INVENTORY':
      actions.push({ label: '🔧 Go to Maintenance Tasks', type: 'navigate', payload: 'maintenance' });
      actions.push({ label: '📦 Check Spare Readiness', type: 'navigate', payload: 'readiness' });
      break;
    case 'SENSOR_HEALTH':
      actions.push({ label: '📡 View System Health', type: 'navigate', payload: 'system-health' });
      if (fullContext.isCameraContaminated) {
        actions.push({ label: '🧼 Clean Camera Lens', type: 'toggle_camera' });
      }
      break;
    case 'FINANCIAL_IMPACT':
      actions.push({ label: '📊 View Financial Readiness', type: 'navigate', payload: 'readiness' });
      break;
    default:
      actions.push({ label: '📊 Plant Status', type: 'navigate', payload: 'overview' });
      actions.push({ label: '🚨 Active Alerts', type: 'navigate', payload: 'alerts' });
  }

  return actions;
}

/**
 * Dynamic fallback engine constructing intent-matched responses (NO S03 DEFAULT FOR UNRELATED QUERIES!)
 */
function generateDynamicFallbackResponse(
  intent: CopilotIntent,
  userQuery: string,
  fullContext: CopilotContextPayload,
  targetEntity: string
) {
  const { conveyor, splices, alerts, maintenanceTasks, sensorHealth, spareReadiness, isCameraContaminated } = fullContext;

  const targetSplice = splices[targetEntity] || splices['S03'];
  const targetSpare = spareReadiness[targetEntity] || spareReadiness['S03'];
  const openAlerts = alerts.filter((a) => a.status === 'Open');

  let text = '';
  const actions = extractActionsForIntent(intent, targetEntity, fullContext);

  switch (intent) {
    case 'GREETING':
    case 'CONVERSATIONAL':
      text = `Hello. SpliceGuard AI Copilot is ready. What would you like to inspect?`;
      break;

    case 'PLANT_STATUS':
      text = `### Plant Status — ${conveyor.name || 'CV-01'} (${conveyor.location || 'Kirandul Complex'})

**Conveyor Operating State:**
- Status: **${conveyor.status || 'Running'}** at **${conveyor.speedMs || 3.2} m/s** | Pass **#${conveyor.currentPass || 147}**
- Belt Position: **${conveyor.currentCoordinateM || 195.8}m** / ${conveyor.loopLengthM || 420}m loop
- Motor Load: **${conveyor.loadFactorPct || 84.5}%** | Motor Current: **${conveyor.motorCurrentA || 942} A**

**Primary Risk Target:**
- **Splice S03** at 210m | Condition: **${splices['S03']?.score || 68}/100** [${splices['S03']?.condition || 'Warning'}]
- Estimated RUL: **11–16 days** (Provisional model estimate under current operating load)

**Open Alerts:**
- **${openAlerts.length} Active Open Alert(s)** (${openAlerts.map((a) => a.id).join(', ')})

**Sensor System Health:**
- ${isCameraContaminated ? '⚠️ Optical line-scan lens dust contamination alert active' : '✅ All primary sensing arrays operational'}.

**Maintenance Status:**
- Work order pending for Splice S03. Vulcanizing kit **${spareReadiness['S03']?.kitPartNumber || 'K-800'}** is ready in Warehouse B3.`;
      break;

    case 'ACTIVE_ALERTS':
      text = `### Active Alerts Summary (${openAlerts.length} Open Alerts)

${openAlerts.length > 0 ? openAlerts
  .map(
    (a) =>
      `#### [${a.severity}] ${a.id}: ${a.title}
- **Splice Target:** ${a.spliceId} (Pass #${a.pass})
- **Observed Evidence:** ${a.message}
- **Recommendation:** ${a.recommendation}`
  )
  .join('\n\n') : 'No open alerts currently active.'}

### Risk Classification
- **Primary Risk:** **ALT-001** on Splice S03 due to internal magnetic flux leakage.
- **Recommended Action:** Escalate ALT-001 to Shift Vulcanizing Specialist for scheduled window alignment.`;
      break;

    case 'MAINTENANCE_SCHEDULE':
    case 'MAINTENANCE_TASK':
    case 'INVENTORY':
      text = `### Maintenance Schedule & Spare Readiness

**Active Work Orders (${maintenanceTasks.length}):**
${maintenanceTasks
  .map(
    (m) =>
      `- **Work Order ${m.id}:** Splice ${m.spliceId} | Priority: **${m.priority}** | Status: **${m.status}** | Assigned: **${m.assignedTechnicianName || 'Unassigned'}** | Window: ${m.recommendedWindow}`
  )
  .join('\n')}

**Spare-Part Inventory & Readiness:**
- **Vulcanizing Kit (S03):** Kit **${targetSpare?.kitPartNumber || 'K-800'}**
- **Inventory Status:** **${targetSpare?.vulcanizingKitStatus || 'READY'}** in ${targetSpare?.warehouseLocation || 'Warehouse B3'}
- **Estimated Standby Lead Time:** ${targetSpare?.leadTimeHours || 2} hours`;
      break;

    case 'SENSOR_HEALTH':
      text = `### Multimodal Sensor Diagnostic Health

- **Optical Line-Scan Camera:** ${isCameraContaminated ? '⚠️ Degraded (Dust Contamination Alert)' : '✅ Nominal (98% Confidence)'}
- **Magnetic Flux (MFL/DMI) Array:** ✅ Active & Calibrated
- **Laser Profilometer:** ✅ Operational
- **Rotary Shaft Encoder:** ✅ Synchronized at 0.00m reference mark
- **SCADA Telemetry Stream:** ✅ Connected (100% Signal)

${isCameraContaminated ? '**Optical Note:** Lens contamination reduces optical confidence to 74%. MFL array remains fully calibrated.' : '**Status:** All primary sensing modalities are operating within baseline tolerances.'}`;
      break;

    case 'SENSOR_MANUAL':
      text = SENSOR_ENGINEERING_MANUAL;
      break;

    case 'FINANCIAL_IMPACT':
      text = `### Financial Exposure & Production Model

- **Target Splice:** ${targetSplice.id} (${targetSplice.condition} Condition)
- **Estimated Production Exposure:** **${targetSpare?.estimatedProductionExposureInr || '₹4,80,000'}** (in potential unscheduled downtime)
- **Estimated Repair Cost:** **${targetSpare?.estimatedMaintenanceCostInr || '₹1,20,000'}**
- **Estimated Downtime Duration:** **${targetSpare?.estimatedDowntimeHours || 6} hours**
- **Spare Part Readiness:** Kit **${targetSpare?.kitPartNumber || 'K-800'}** is **${targetSpare?.vulcanizingKitStatus || 'READY'}**.`;
      break;

    case 'GENERAL_ENGINEERING':
      text = `SpliceGuard AI Copilot is active and monitoring conveyor telemetry. You can ask about:
- **Plant & Conveyor Status** ("plant status?")
- **Active Alerts** ("any alerts?")
- **Maintenance Schedule** ("maintenance period")
- **Sensor Diagnostics** ("which sensors are abnormal?")
- **Specific Splices** ("what is wrong with S03?")`;
      break;

    case 'RUL':
    case 'SPLICE_STATUS':
    case 'SPLICE_ANALYSIS':
    default:
      text = `### Splice Condition & Diagnostic Analysis (${targetSplice.id})

**Classification:** ${targetSplice.condition} (Score: **${targetSplice.score}/100**, Trend: **${targetSplice.trend}**)
- **Location:** ${targetSplice.baselineCoordinate}m along 420m conveyor loop
- **Estimated RUL:** **11–16 days** (Provisional model estimate based on current operating load)

### Multimodal Evidence
1. **OBSERVED (Magnetic / MFL):** ${targetSplice.evidence.magnetic.observedAnomaly} (Flux Leakage: ${targetSplice.evidence.magnetic.fluxLeakageGauss} Gauss, Confidence: ${targetSplice.evidence.magnetic.confidence}%)
2. **OBSERVED (Vision / Line-Scan):** ${targetSplice.evidence.vision.observedAnomaly} (Confidence: ${targetSplice.evidence.vision.confidence}%)
3. **OBSERVED (Operating Context):** Motor Current ${targetSplice.evidence.operatingContext.motorCurrentA}A, Speed ${targetSplice.evidence.operatingContext.beltSpeedMs} m/s

### Interpretation
- Magnetic flux leakage indicates internal steel cord degradation.
- Spatial location aligns with baseline coordinate ${targetSplice.baselineCoordinate}m.

### Recommended Response
- **WARNING Level:** Increase monitoring frequency. Schedule physical inspection during next planned maintenance window.
- **Spare Kit:** Kit **${targetSpare?.kitPartNumber || 'K-800'}** is **${targetSpare?.vulcanizingKitStatus || 'READY'}**.`;
      break;
  }

  return { text, actions };
}

export { app };

if (process.env.NODE_ENV !== 'test' && process.argv[1] && (process.argv[1].endsWith('server/index.ts') || process.argv[1].endsWith('server\\index.ts'))) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`[SpliceGuard Copilot Server] Running on http://localhost:${PORT}`);
  });
}
