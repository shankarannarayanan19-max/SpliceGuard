import React, { useState } from 'react';
import { useApp, NavigationTab } from '../context/AppContext';
import {
  Compass,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  X,
  ExternalLink,
} from 'lucide-react';

interface Step {
  num: number;
  title: string;
  desc: string;
  tab: NavigationTab;
  action?: string;
}

const DEMO_STEPS: Step[] = [
  {
    num: 1,
    title: 'Operational Overview',
    desc: 'Conveyor CV-01 visibly running at 3.2 m/s with 4 moving splices (S01-S04).',
    tab: 'overview',
  },
  {
    num: 2,
    title: 'Splice Localization & Datum',
    desc: 'Rotary encoder tracks coordinate advance calibrated to reference S01 (0m).',
    tab: 'overview',
  },
  {
    num: 3,
    title: 'Warning Splice Identified',
    desc: 'S01, S02, S04 Healthy (94, 90, 92); S03 flagged Warning (Condition 68).',
    tab: 'overview',
  },
  {
    num: 4,
    title: 'Live Inspection Station Approaching',
    desc: 'Observe live distance countdown (14.2m → 10.3m → 3.5m) as S03 nears gantry.',
    tab: 'live',
  },
  {
    num: 5,
    title: 'Multi-Modal Gantry Scan Active',
    desc: 'Laser line-scan and 64-channel MFL scanning animation trigger on arrival.',
    tab: 'live',
    action: 'trigger_scan',
  },
  {
    num: 6,
    title: 'Corroborated Evidence Capture',
    desc: 'Vision detects 42mm surface crack; MFL detects 1.85G flux leakage on cords #28-#31.',
    tab: 'live',
  },
  {
    num: 7,
    title: 'Splice Passport History (91 → 68)',
    desc: 'Longitudinal chart shows repeated deterioration across 12 consecutive passes.',
    tab: 'passports',
  },
  {
    num: 8,
    title: 'Review Alert ALT-003',
    desc: 'Inspect automated alert detailing multi-sensor corroboration & recommendations.',
    tab: 'alerts',
  },
  {
    num: 9,
    title: 'Dispatch Maintenance Work Order',
    desc: 'Convert ALT-003 into work order MNT-2026-088 for physical verification.',
    tab: 'maintenance',
  },
  {
    num: 10,
    title: 'Assign Certified Field Technician',
    desc: 'Assign NDT specialist (Ramesh Kumar / Sunita Rao) from shift roster.',
    tab: 'personnel',
  },
  {
    num: 11,
    title: 'Execute Field Inspection & Signoff',
    desc: 'Technician files actual defect observed, severity, corrective patch, and notes.',
    tab: 'maintenance',
  },
  {
    num: 12,
    title: 'Updated Lifecycle Traceability',
    desc: 'Splice Passport reflects completed maintenance record and verified score.',
    tab: 'passports',
  },
  {
    num: 13,
    title: '2D Digital Twin Verification',
    desc: 'Operational loop reflects verified healthy state and next inspection schedule.',
    tab: 'digital-twin',
  },
];

export const DemoGuideBar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedSpliceId,
    setSelectedSpliceId,
    triggerScanSequence,
    resetSimulation,
  } = useApp();

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const step = DEMO_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < DEMO_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const nextStep = DEMO_STEPS[nextIdx];
      setActiveTab(nextStep.tab);
      if (nextStep.action === 'trigger_scan') {
        triggerScanSequence('S03');
      }
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      setActiveTab(DEMO_STEPS[prevIdx].tab);
    }
  };

  const handleJumpToStep = (idx: number) => {
    setCurrentStepIndex(idx);
    setActiveTab(DEMO_STEPS[idx].tab);
    if (DEMO_STEPS[idx].action === 'trigger_scan') {
      triggerScanSequence('S03');
    }
  };

  return (
    <div className="fixed bottom-3 inset-x-4 max-w-5xl mx-auto z-40">
      <div className="rounded-2xl bg-slate-950/95 border border-cyan-500/40 shadow-2xl backdrop-blur-md overflow-hidden text-xs">
        {/* Toggle header bar */}
        <div className="px-4 py-2 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-100 font-display-tech tracking-wide">
              SIH 2026 DEMO STORY WALKTHROUGH
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono-tech border border-cyan-500/30">
              STEP {step.num} OF {DEMO_STEPS.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                resetSimulation();
                setCurrentStepIndex(0);
                setActiveTab('overview');
              }}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer mr-2"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Flow</span>
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-slate-400 hover:text-slate-100 cursor-pointer"
            >
              {isExpanded ? 'Minimize' : 'Expand'}
            </button>
          </div>
        </div>

        {/* Expanded walkthrough content */}
        {isExpanded && (
          <div className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-slate-100 text-sm">{step.title}</span>
                <span className="text-[10px] font-mono-tech text-cyan-400">
                  Target Tab: [{step.tab.toUpperCase()}]
                </span>
              </div>
              <p className="text-slate-300 text-xs">{step.desc}</p>
            </div>

            {/* Stepper controls */}
            <div className="flex items-center gap-2">
              <button
                disabled={currentStepIndex === 0}
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <button
                onClick={handleNext}
                disabled={currentStepIndex === DEMO_STEPS.length - 1}
                className="px-4 py-1.5 rounded-lg font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1 glow-cyan"
              >
                <span>Advance Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
