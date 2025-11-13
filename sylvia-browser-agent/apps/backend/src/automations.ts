export type AutomationTrigger =
  | { type: "interval"; minutes: number }
  | { type: "cron"; expression: string }
  | { type: "manual" };

export interface Automation {
  id: string;
  name: string;
  description?: string;
  commandSlug: string;
  trigger: AutomationTrigger;
  enabled: boolean;
  lastRunAt?: string;
  lastStatus?: "ok" | "error";
  lastError?: string | null;
  targetUrl: string;
}

const automations = new Map<string, Automation>();

export function listAutomations(): Automation[] {
  return Array.from(automations.values());
}

export function saveAutomation(a: Automation) {
  automations.set(a.id, a);
}

export function getAutomation(id: string) {
  return automations.get(id);
}

export function deleteAutomation(id: string) {
  automations.delete(id);
}
