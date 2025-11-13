export type EffortLevel = "very low" | "low" | "medium" | "high";
export type ImpactLevel = "low" | "medium" | "high" | "very high";

export interface SylviaGoal {
  id: string;
  title: string;
  description?: string;
  targetMetric?: string;
  targetValue?: number;
  timeboxDays?: number;
}

export interface SylviaTask {
  id: string;
  goalId?: string;
  title: string;
  description?: string;
  whyThisTask?: string;
  effort: EffortLevel;
  impact: ImpactLevel;
  status: "pending" | "in_progress" | "completed" | "skipped" | "failed";
}

export interface PageContext {
  url: string;
  title?: string;
  content: string;
  selection?: string;
}

export interface Concept {
  id: string;
  title: string;
  category?: string;
  notes?: string;
  sourceUrl?: string;
}

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface SylviaChatRequest {
  message: string;
  goal?: SylviaGoal;
  page?: PageContext;
  history?: LlmMessage[];
}
