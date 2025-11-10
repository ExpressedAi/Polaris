export interface ActionConfig {
  id: string;
  label: string;
  handler: (payload?: string) => Promise<void> | void;
}

interface ActionResult {
  handled: boolean;
  message?: string;
}

const actions = new Map<string, ActionConfig>();
const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

export const registerAction = (config: ActionConfig): (() => void) => {
  actions.set(config.id, config);
  notify();
  return () => {
    actions.delete(config.id);
    notify();
  };
};

export const listActions = (): ActionConfig[] => Array.from(actions.values());

export const subscribeToActions = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const executeAction = async (id: string, payload?: string): Promise<ActionResult> => {
  const action = actions.get(id);
  if (!action) {
    return { handled: false, message: `Unknown action ${id}` };
  }
  
  // Log action execution for glass box
  const { logSylviaEvent } = await import('./sylviaLog');
  const actionKind = id.split('.')[0] as any;
  const event = logSylviaEvent({
    kind: actionKind || 'system',
    summary: `Executed: ${action.label}`,
    detail: payload ? `Payload: ${payload.substring(0, 200)}${payload.length > 200 ? '...' : ''}` : undefined,
    actionId: id,
    payload: payload,
  });
  
  try {
    await action.handler(payload);
    return { handled: true, message: `${action.label} completed` };
  } catch (error) {
    // Log error for glass box
    logSylviaEvent({
      kind: 'system',
      summary: `Error executing: ${action.label}`,
      detail: error instanceof Error ? error.message : String(error),
      actionId: id,
    });
    throw error;
  }
};

export const tryHandleActionCommand = async (input: string): Promise<ActionResult> => {
  if (!input.startsWith('/')) {
    return { handled: false };
  }
  const match = input.match(/^\/([\\w.:-]+)\\s*(.*)$/);
  if (!match) {
    return { handled: false };
  }
  const [, actionId, payload = ''] = match;
  return executeAction(actionId, payload.trim());
};
