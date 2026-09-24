export interface MemoryTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  intent?: string;
  targetEntity?: string;
}

export interface SessionMemory {
  sessionId: string;
  turns: MemoryTurn[];
  activeTargetEntity?: string; // e.g., 'S03'
  lastIntent?: string;
  updatedAt: number;
}

class CopilotMemoryStore {
  private sessions: Map<string, SessionMemory> = new Map();
  private maxTurnsPerSession = 10;
  private sessionTtlMs = 30 * 60 * 1000; // 30 minutes

  public getOrCreateSession(sessionId: string = 'default-session'): SessionMemory {
    this.cleanExpiredSessions();
    let session = this.sessions.get(sessionId);

    if (!session) {
      session = {
        sessionId,
        turns: [],
        activeTargetEntity: 'S03',
        updatedAt: Date.now(),
      };
      this.sessions.set(sessionId, session);
    } else {
      session.updatedAt = Date.now();
    }

    return session;
  }

  public addTurn(
    sessionId: string,
    turn: { role: 'user' | 'assistant'; content: string; intent?: string; targetEntity?: string }
  ): SessionMemory {
    const session = this.getOrCreateSession(sessionId);

    if (turn.targetEntity) {
      session.activeTargetEntity = turn.targetEntity;
    }
    if (turn.intent) {
      session.lastIntent = turn.intent;
    }

    session.turns.push({
      ...turn,
      timestamp: new Date().toISOString(),
    });

    if (session.turns.length > this.maxTurnsPerSession) {
      session.turns = session.turns.slice(-this.maxTurnsPerSession);
    }

    session.updatedAt = Date.now();
    return session;
  }

  public getRelevantMemory(sessionId: string): {
    historyTurns: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
    activeEntity?: string;
    turnsCount: number;
  } {
    const session = this.getOrCreateSession(sessionId);

    const historyTurns = session.turns.slice(-6).map((t) => ({
      role: t.role === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: t.content }],
    }));

    return {
      historyTurns,
      activeEntity: session.activeTargetEntity,
      turnsCount: session.turns.length,
    };
  }

  private cleanExpiredSessions() {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.updatedAt > this.sessionTtlMs) {
        this.sessions.delete(id);
      }
    }
  }

  public getActiveSessionsCount(): number {
    return this.sessions.size;
  }
}

export const memoryStore = new CopilotMemoryStore();
