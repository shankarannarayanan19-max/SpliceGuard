export type CopilotIntent =
  | 'GREETING'
  | 'PLANT_STATUS'
  | 'SPLICE_STATUS'
  | 'SPLICE_ANALYSIS'
  | 'ACTIVE_ALERTS'
  | 'MAINTENANCE_SCHEDULE'
  | 'MAINTENANCE_TASK'
  | 'SENSOR_HEALTH'
  | 'SENSOR_MANUAL'
  | 'DIGITAL_TWIN'
  | 'RUL'
  | 'FINANCIAL_IMPACT'
  | 'INVENTORY'
  | 'NAVIGATION'
  | 'GENERAL_ENGINEERING'
  | 'CONVERSATIONAL';

export interface ClassificationResult {
  intent: CopilotIntent;
  targetEntity?: string; // e.g., 'S03', 'S01'
  navigationTarget?: string; // e.g., 'alerts', 'digital-twin', 'maintenance', 'system-health', 'live', 'passports', 'readiness', 'overview'
  confidence: number;
}

/**
 * Robust intent classifier with fuzzy/typo matching and strict intent prioritization
 */
export function classifyIntent(query: string, previousEntity?: string): ClassificationResult {
  const q = query.trim().toLowerCase();

  // 1. Explicit Navigation intent ("open X", "go to X", "show X page")
  if (
    q.includes('open alert') ||
    q.includes('show alert tab') ||
    q.includes('show alerts page') ||
    q.includes('go to alert')
  ) {
    return { intent: 'NAVIGATION', navigationTarget: 'alerts', confidence: 0.95 };
  }

  if (
    q === 'digital twin' ||
    q.includes('open digital twin') ||
    q.includes('show digital twin') ||
    q.includes('inspect 3d model') ||
    q.includes('3d view')
  ) {
    return { intent: 'NAVIGATION', navigationTarget: 'digital-twin', confidence: 0.95 };
  }

  if (
    q.includes('open maintenance') ||
    q.includes('show maintenance page') ||
    q.includes('go to maintenance')
  ) {
    return { intent: 'NAVIGATION', navigationTarget: 'maintenance', confidence: 0.95 };
  }

  if (
    q.includes('open system health') ||
    q.includes('show sensor health page') ||
    q.includes('go to system health')
  ) {
    return { intent: 'NAVIGATION', navigationTarget: 'system-health', confidence: 0.95 };
  }

  if (
    q.includes('open live inspection') ||
    q.includes('show live scan') ||
    q.includes('go to live')
  ) {
    return { intent: 'NAVIGATION', navigationTarget: 'live', confidence: 0.95 };
  }

  if (
    q.includes('open passport') ||
    q.includes('show splice passport') ||
    q.includes('go to passport')
  ) {
    return { intent: 'NAVIGATION', navigationTarget: 'passports', confidence: 0.95 };
  }

  if (
    q.includes('open readiness') ||
    q.includes('show financial readiness') ||
    q.includes('go to readiness')
  ) {
    return { intent: 'NAVIGATION', navigationTarget: 'readiness', confidence: 0.95 };
  }

  // 2. Greetings & Conversational (including typos like "heloo", "hy", "hi", "hello bro")
  if (
    /^(hi|hello|heloo|hy|hey|greetings|good morning|good afternoon|howdy|sup|heloo bro|hi bro|hello bro|how are you)/i.test(q) ||
    (q.length < 15 && (q.includes('hello') || q.includes('heloo') || q.includes('hi') || q.includes('hey') || q.includes('bro')))
  ) {
    return { intent: 'GREETING', confidence: 0.99 };
  }

  // Extract explicit splice entity in current query (e.g. S01, S02, S03, S04)
  let explicitEntity: string | undefined = undefined;
  const spliceMatch = q.match(/s0[1-4]|splice\s*0?[1-4]/i);
  if (spliceMatch) {
    const raw = spliceMatch[0].toUpperCase().replace(/\s+/, '');
    if (raw.length === 2) explicitEntity = raw;
    else explicitEntity = 'S0' + raw.slice(-1);
  }

  // 3. Active Alerts (Matches "any alerts?", "alerts?", "show alerts", "open alerts list", "alert summary")
  if (
    q.includes('alert') ||
    q.includes('alerts') ||
    q === 'any alerts?' ||
    q === 'any alerts'
  ) {
    return { intent: 'ACTIVE_ALERTS', targetEntity: explicitEntity, confidence: 0.95 };
  }

  // 4. Plant Status (Matches "plant status", "currrent status", "current status", "status", "conveyor status")
  if (
    q.includes('plant status') ||
    q.includes('status of the plant') ||
    q.includes('conveyor status') ||
    q.includes('currrent status') ||
    q.includes('current status') ||
    q.includes('conveyor doing') ||
    q.includes('plant condition') ||
    q.includes('overall status') ||
    q === 'status?' ||
    q === 'status'
  ) {
    return { intent: 'PLANT_STATUS', targetEntity: explicitEntity, confidence: 0.95 };
  }

  // 5. Maintenance Schedule (Matches "maintance period", "maintenance period", "when is maintenance", "scheduled maintenance", "work orders")
  if (
    q.includes('maintance') ||
    q.includes('maintenance') ||
    q.includes('work order') ||
    q.includes('repair schedule') ||
    q.includes('technician')
  ) {
    return { intent: 'MAINTENANCE_SCHEDULE', targetEntity: explicitEntity, confidence: 0.9 };
  }

  // 6. Sensor Manual & Engineering definitions
  if (
    q.includes('mfl') ||
    q.includes('dmi') ||
    q.includes('lwir') ||
    q.includes('acoustic emission') ||
    q.includes('how does mfl') ||
    q.includes('how does dmi') ||
    q.includes('what is normal for encoder')
  ) {
    return { intent: 'SENSOR_MANUAL', targetEntity: explicitEntity, confidence: 0.9 };
  }

  // 7. Sensor Health
  if (
    q.includes('sensor health') ||
    q.includes('camera health') ||
    q.includes('which sensors') ||
    q.includes('sensor status')
  ) {
    return { intent: 'SENSOR_HEALTH', targetEntity: explicitEntity, confidence: 0.9 };
  }

  // 8. Financial Impact
  if (
    q.includes('financial') ||
    q.includes('loss') ||
    q.includes('cost exposure') ||
    q.includes('how much loss')
  ) {
    return { intent: 'FINANCIAL_IMPACT', targetEntity: explicitEntity || previousEntity || 'S03', confidence: 0.9 };
  }

  // 9. RUL / Remaining Useful Life
  if (
    q.includes('rul') ||
    q.includes('remaining useful life') ||
    q.includes('when should we repair') ||
    q.includes('when will it fail')
  ) {
    return { intent: 'RUL', targetEntity: explicitEntity || previousEntity || 'S03', confidence: 0.9 };
  }

  // 10. Specific Splice Status / Analysis (ONLY when splice or anomaly is explicitly mentioned!)
  if (explicitEntity || q.includes('wrong with s') || q.includes('why is s') || q.includes('inspection history')) {
    const target = explicitEntity || previousEntity || 'S03';
    if (q.includes('history') || q.includes('inspection')) {
      return { intent: 'SPLICE_ANALYSIS', targetEntity: target, confidence: 0.9 };
    }
    return { intent: 'SPLICE_STATUS', targetEntity: target, confidence: 0.85 };
  }

  // 11. Explicit Follow-up questions using memory context (e.g. "why?", "what about today?", "explain more")
  if (previousEntity && (q === 'why?' || q === 'why' || q.includes('what about') || q.includes('tell me more'))) {
    return { intent: 'SPLICE_STATUS', targetEntity: previousEntity, confidence: 0.8 };
  }

  // 12. Default for unclassified engineering or general queries (Gemini should interpret!)
  return { intent: 'GENERAL_ENGINEERING', confidence: 0.5 };
}
