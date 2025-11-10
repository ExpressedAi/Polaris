export type SylviaEventKind =
  | 'journal'
  | 'agenda'
  | 'deliverable'
  | 'calendar'
  | 'pomodoro'
  | 'brand'
  | 'client'
  | 'people'
  | 'concept'
  | 'goal'
  | 'task'
  | 'system';

export interface SylviaEvent {
  id: string;
  timestamp: number;
  summary: string;
  detail?: string;
  link?: string;
  kind: SylviaEventKind;
  rating?: number; // 1-100 scale or -1 (negative) / 1 (positive)
  actionId?: string; // Track which action was executed
  payload?: string; // Store the payload for context
}

export type SylviaEventInput = Omit<SylviaEvent, 'id' | 'timestamp'> & {
  id?: string;
  timestamp?: number;
  actionId?: string;
  payload?: string;
};

const LOG_HOOK_KEY = '__SYLVIA_LOG__';
const EVENT_QUEUE_KEY = '__SYLVIA_EVENT_QUEUE__';

const getWindow = (): any | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return window as any;
};

export const logSylviaEvent = (event: SylviaEventInput): SylviaEvent => {
  const payload: SylviaEvent = {
    id: event.id || `sylvia-event-${Date.now()}`,
    timestamp: event.timestamp || Date.now(),
    summary: event.summary,
    detail: event.detail,
    link: event.link,
    kind: event.kind,
    rating: event.rating,
    actionId: event.actionId,
    payload: event.payload,
  };

  const w = getWindow();
  if (!w) {
    return payload;
  }

  if (typeof w[LOG_HOOK_KEY] === 'function') {
    w[LOG_HOOK_KEY](payload);
  } else {
    const queue: SylviaEvent[] = w[EVENT_QUEUE_KEY] || [];
    queue.push(payload);
    w[EVENT_QUEUE_KEY] = queue;
  }
  return payload;
};

export const drainSylviaEventQueue = (): SylviaEvent[] => {
  const w = getWindow();
  if (!w || !Array.isArray(w[EVENT_QUEUE_KEY])) {
    return [];
  }
  const queue: SylviaEvent[] = w[EVENT_QUEUE_KEY];
  w[EVENT_QUEUE_KEY] = [];
  return queue;
};
