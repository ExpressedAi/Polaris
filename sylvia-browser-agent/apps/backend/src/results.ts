export interface AutomationResult {
  id: string;
  automationId: string;
  automationName: string;
  commandSlug: string;
  timestamp: string;
  success: boolean;
  input?: {
    url?: string;
    page?: {
      title?: string;
      url?: string;
    };
  };
  output?: any;
  error?: string;
  durationMs?: number;
}

// In-memory storage (could be replaced with database later)
const results: AutomationResult[] = [];
const MAX_RESULTS = 1000; // Keep last 1000 results

export function saveResult(result: AutomationResult): void {
  results.unshift(result); // Add to beginning (newest first)

  // Trim to max size
  if (results.length > MAX_RESULTS) {
    results.length = MAX_RESULTS;
  }
}

export interface GetResultsOptions {
  limit?: number;
  offset?: number;
  automationId?: string;
}

export function getResults(options: GetResultsOptions = {}): {
  results: AutomationResult[];
  total: number;
  hasMore: boolean;
} {
  const { limit = 50, offset = 0, automationId } = options;

  let filtered = results;

  // Filter by automation ID if specified
  if (automationId) {
    filtered = results.filter(r => r.automationId === automationId);
  }

  const total = filtered.length;
  const slice = filtered.slice(offset, offset + limit);
  const hasMore = offset + limit < total;

  return {
    results: slice,
    total,
    hasMore
  };
}

export function clearResults(automationId?: string): void {
  if (automationId) {
    const filtered = results.filter(r => r.automationId !== automationId);
    results.length = 0;
    results.push(...filtered);
  } else {
    results.length = 0;
  }
}

export function getResultById(id: string): AutomationResult | undefined {
  return results.find(r => r.id === id);
}
