import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  queryCopilot,
  checkCopilotBackendStatus,
  CopilotResponse,
  CopilotAction,
  CopilotBackendStatus,
} from '../services/copilotService';
import {
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  timestamp: string;
  actions?: CopilotAction[];
  source?: 'gemini' | 'simulated';
}

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({ isOpen, onClose }) => {
  const {
    activeTab,
    setActiveTab,
    selectedSpliceId,
    setSelectedSpliceId,
    conveyor,
    splices,
    alerts,
    maintenanceTasks,
    sensorHealth,
    inspectionEvents,
    spareReadiness,
    isCameraContaminated,
    triggerScanSequence,
    toggleCameraContamination,
    acknowledgeAlert,
  } = useApp();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [backendStatus, setBackendStatus] = useState<CopilotBackendStatus | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'copilot',
      text: `### 👋 Welcome to SpliceGuard AI Copilot!

I am your real-time **Industrial AI Assistant** for conveyor condition monitoring and maintenance intelligence.

- **Conveyor Status:** ${conveyor.status} (${conveyor.speedMs} m/s)
- **Primary Risk Target:** **Splice S03** (Condition Score: 68/100, Warning)
- **Active Open Alerts:** ${alerts.filter((a) => a.status === 'Open').length} Alerts

Select a quick action below or ask me anything about live telemetry, splice failure risks, or maintenance tasks!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'simulated',
      actions: [
        { label: '⚡ Trigger Scan on S03', type: 'trigger_scan', payload: 'S03' },
        { label: '🚨 View Active Alerts', type: 'navigate', payload: 'alerts' },
        { label: '🌐 Open Digital Twin', type: 'navigate', payload: 'digital-twin' },
      ],
    },
  ]);

  const quickPrompts = [
    '📊 Plant Status',
    '🚨 View Active Alerts',
    '🌐 Open Digital Twin',
    '🔧 Maintenance',
    '🔍 Analyze Splice S03',
  ];

  // Fetch backend status when drawer opens
  useEffect(() => {
    if (isOpen) {
      checkCopilotBackendStatus().then((status) => {
        setBackendStatus(status);
      });
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setIsLoading(true);

    try {
      const copilotCtx = {
        conveyor,
        splices,
        alerts,
        maintenanceTasks,
        sensorHealth,
        inspectionEvents,
        spareReadiness,
        activeTab,
        selectedSpliceId,
        isCameraContaminated,
      };

      const historyTurns = messages.map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
        timestamp: m.timestamp,
      }));

      const response: CopilotResponse = await queryCopilot(textToSend, copilotCtx, historyTurns);

      // Automatically execute navigation if returned by backend
      if (response.actions) {
        const navAction = response.actions.find((a) => a.type === 'navigate' && a.payload);
        if (navAction && navAction.payload) {
          handleActionClick(navAction);
        }
      }

      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'copilot',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: response.actions,
        source: response.source,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'copilot',
          text: '⚠️ An error occurred while communicating with the AI Copilot service. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'simulated',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: CopilotAction) => {
    switch (action.type) {
      case 'navigate':
        if (action.payload) setActiveTab(action.payload as any);
        break;
      case 'select_splice':
        if (action.payload) setSelectedSpliceId(action.payload as any);
        break;
      case 'trigger_scan':
        triggerScanSequence((action.payload as any) || 'S03');
        break;
      case 'toggle_camera':
        toggleCameraContamination();
        break;
      case 'acknowledge_alert':
        if (action.payload) acknowledgeAlert(action.payload);
        break;
    }
  };

  if (!isOpen) return null;

  const isGeminiConnected = backendStatus?.geminiConfigured && backendStatus?.geminiReachable;

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isMinimized
          ? 'bottom-6 right-6 w-80 h-14 bg-slate-900 border border-cyan-500/40 rounded-xl shadow-2xl overflow-hidden'
          : 'bottom-6 right-4 sm:right-6 w-full max-w-lg h-[620px] max-h-[85vh] bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col backdrop-blur-xl overflow-hidden'
      }`}
    >
      {/* Header Bar */}
      <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                <Bot className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <span
              className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-slate-950 ${
                isGeminiConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display-tech font-bold text-sm text-white tracking-wide">
                SpliceGuard <span className="text-cyan-400">AI Copilot</span>
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono-tech">
              {isGeminiConnected ? (
                <>
                  <span className="text-emerald-400 font-semibold">● Gemini Connected</span>
                  <span className="text-slate-600">•</span>
                  <span>Memory: {messages.length} turns</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-cyan-300">Live Context</span>
                </>
              ) : (
                <>
                  <span className="text-amber-400 font-semibold">⚙️ Domain Fallback</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-500">Gemini: Not Connected</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close Copilot"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-900/60 no-scrollbar text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'copilot' && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                )}

                <div className={`max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3.5 rounded-xl text-slate-200 leading-relaxed font-sans shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-cyan-600 text-white rounded-br-none'
                        : 'bg-slate-800/90 border border-slate-700/80 rounded-bl-none'
                    }`}
                  >
                    {/* Render markdown format */}
                    <div className="space-y-2 whitespace-pre-wrap">
                      {msg.text.split('\n').map((line, idx) => {
                        if (line.startsWith('### ')) {
                          return (
                            <h4 key={idx} className="font-bold text-sm text-cyan-300 border-b border-slate-700/50 pb-1 mt-1">
                              {line.replace('### ', '')}
                            </h4>
                          );
                        }
                        if (line.startsWith('#### ')) {
                          return (
                            <h5 key={idx} className="font-semibold text-xs text-cyan-200 mt-2">
                              {line.replace('#### ', '')}
                            </h5>
                          );
                        }
                        if (line.startsWith('- ')) {
                          return (
                            <div key={idx} className="flex items-start gap-1.5 ml-1">
                              <span className="text-cyan-400 mt-1">•</span>
                              <span>{line.replace('- ', '')}</span>
                            </div>
                          );
                        }
                        return <p key={idx}>{line}</p>;
                      })}
                    </div>

                    {/* Action Buttons */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex flex-wrap gap-1.5">
                        {msg.actions.map((act, i) => (
                          <button
                            key={i}
                            onClick={() => handleActionClick(act)}
                            className="px-2.5 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/50 text-cyan-300 font-mono-tech text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            <span>{act.label}</span>
                            <ChevronRight className="w-3 h-3 text-cyan-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-2 px-1 text-[9px] font-mono-tech text-slate-500">
                    <span>{msg.timestamp}</span>
                    {msg.source && (
                      <span className="text-slate-400">
                        {msg.source === 'gemini' ? '🧠 Gemini AI' : '⚙️ Domain Fallback'}
                      </span>
                    )}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center shrink-0 mt-0.5 text-white font-bold text-xs shadow-sm">
                    U
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 items-center text-cyan-400 font-mono-tech text-xs animate-pulse">
                <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                </div>
                <span>Analyzing telemetry & computing response...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions Bar */}
          <div className="px-3 py-2 bg-slate-950/70 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-700 text-[10px] whitespace-nowrap transition-colors cursor-pointer shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Copilot about plant status, alerts, maintenance..."
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-sans"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};
