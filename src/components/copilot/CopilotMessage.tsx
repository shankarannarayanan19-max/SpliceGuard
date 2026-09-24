/**
 * CopilotMessage — renders a single chat turn in the SpliceGuard AI Copilot.
 *
 * User messages: right-aligned, cyan bubble, clean.
 * Copilot messages: left-aligned, dark card with AI icon, rendered markdown,
 *   source indicator, and action buttons.
 */

import React from 'react';
import { Sparkles, ChevronRight, User } from 'lucide-react';
import { CopilotMarkdown } from './CopilotMarkdown';
import { CopilotAction } from '../../services/copilotService';

interface CopilotMessageProps {
  sender: 'user' | 'copilot';
  text: string;
  timestamp: string;
  actions?: CopilotAction[];
  source?: 'gemini' | 'simulated';
  onAction: (action: CopilotAction) => void;
}

// ---------------------------------------------------------------------------
// Source badge
// ---------------------------------------------------------------------------
function SourceBadge({ source }: { source: 'gemini' | 'simulated' }) {
  if (source === 'gemini') {
    return (
      <span className="flex items-center gap-1 text-emerald-400">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>Gemini</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-amber-400/80">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
      <span>Domain Fallback</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Action button strip
// ---------------------------------------------------------------------------
function ActionButtons({
  actions,
  onAction,
}: {
  actions: CopilotAction[];
  onAction: (a: CopilotAction) => void;
}) {
  if (!actions.length) return null;
  return (
    <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex flex-wrap gap-1.5">
      {actions.map((act, i) => (
        <button
          key={i}
          onClick={() => onAction(act)}
          className="
            inline-flex items-center gap-1
            px-2.5 py-1
            rounded
            bg-slate-900/80 hover:bg-cyan-950
            border border-slate-600/60 hover:border-cyan-600/60
            text-slate-300 hover:text-cyan-300
            font-mono-tech text-[10px]
            transition-all duration-150
            cursor-pointer active:scale-95
            shadow-sm
          "
        >
          <span>{act.label}</span>
          <ChevronRight className="w-3 h-3 shrink-0 text-cyan-500" />
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export const CopilotMessage: React.FC<CopilotMessageProps> = ({
  sender,
  text,
  timestamp,
  actions,
  source,
  onAction,
}) => {
  // ---- USER message ----
  if (sender === 'user') {
    return (
      <div className="flex justify-end gap-2 items-end">
        {/* Bubble */}
        <div className="max-w-[80%]">
          <div className="bg-cyan-600/90 text-white text-[11px] leading-relaxed px-3 py-2 rounded-xl rounded-br-none shadow-md">
            {text}
          </div>
          <div className="mt-0.5 text-right pr-1 text-[9px] font-mono-tech text-slate-500">
            {timestamp}
          </div>
        </div>

        {/* Avatar */}
        <div className="shrink-0 w-6 h-6 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center mb-[18px]">
          <User className="w-3 h-3 text-slate-300" />
        </div>
      </div>
    );
  }

  // ---- COPILOT message ----
  return (
    <div className="flex justify-start gap-2 items-start">
      {/* Avatar */}
      <div className="shrink-0 w-6 h-6 rounded-lg bg-cyan-950/80 border border-cyan-800/50 flex items-center justify-center mt-0.5 shadow-sm">
        <Sparkles className="w-3 h-3 text-cyan-400" />
      </div>

      {/* Card */}
      <div className="max-w-[92%] flex-1 min-w-0">
        <div
          className="
            bg-slate-800/90 border border-slate-700/70
            rounded-xl rounded-tl-none
            px-3 py-2.5
            shadow-md
          "
        >
          {/* Rendered markdown content */}
          <CopilotMarkdown text={text} compact />

          {/* Action buttons */}
          {actions && actions.length > 0 && (
            <ActionButtons actions={actions} onAction={onAction} />
          )}
        </div>

        {/* Footer: timestamp + source */}
        <div className="mt-0.5 flex items-center gap-2 pl-1 text-[9px] font-mono-tech text-slate-500">
          <span>{timestamp}</span>
          {source && (
            <>
              <span className="text-slate-700">·</span>
              <SourceBadge source={source} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
