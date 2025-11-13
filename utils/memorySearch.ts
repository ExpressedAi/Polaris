/**
 * Memory Search Utilities
 * Comprehensive search, filtering, and analysis utilities for memory search
 */

export interface MemoryResult {
  id: string;
  type: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt?: number;
  tags?: string[];
  status?: string;
  priority?: string;
  sentiment?: string;
  metadata?: Record<string, any>;
  // For relationship tracking
  relatedIds?: string[];
  entityData?: any; // Full entity data
}

export type SortField = 'relevance' | 'date-desc' | 'date-asc' | 'title' | 'type';
export type GroupBy = 'none' | 'type' | 'date' | 'tags' | 'status' | 'priority';
export type ViewMode = 'list' | 'grid' | 'timeline' | 'compact';

export interface SearchFilters {
  query: string;
  types: string[];
  tags: string[];
  dateFrom?: number;
  dateTo?: number;
  searchIn: 'all' | 'title' | 'content';
  excludeTypes?: string[];
  status?: string[];
  priority?: string[];
  sentiment?: string[];
  hasRelationships?: boolean;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  sort: SortField;
  groupBy: GroupBy;
  createdAt: number;
}

/**
 * Fuzzy search with typo tolerance (Levenshtein distance)
 */
export function fuzzyMatch(search: string, target: string, threshold = 0.7): boolean {
  const searchLower = search.toLowerCase();
  const targetLower = target.toLowerCase();

  // Exact match
  if (targetLower.includes(searchLower)) return true;

  // Calculate similarity
  const similarity = calculateSimilarity(searchLower, targetLower);
  return similarity >= threshold;
}

function calculateSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * Boolean search parser (supports AND, OR, NOT, quotes)
 */
export function parseBooleanSearch(query: string): {
  required: string[];
  optional: string[];
  excluded: string[];
  exact: string[];
} {
  const required: string[] = [];
  const optional: string[] = [];
  const excluded: string[] = [];
  const exact: string[] = [];

  // Extract quoted phrases
  const quoteRegex = /"([^"]+)"/g;
  let match;
  while ((match = quoteRegex.exec(query)) !== null) {
    exact.push(match[1]);
    query = query.replace(match[0], '');
  }

  // Split by spaces and process operators
  const terms = query.split(/\s+/).filter(t => t.trim());

  for (let i = 0; i < terms.length; i++) {
    const term = terms[i];
    const nextTerm = terms[i + 1];

    if (term === 'AND' || term === 'OR' || term === 'NOT') {
      // Operator - skip, we'll handle the operand
      continue;
    }

    const prevOperator = i > 0 ? terms[i - 1] : null;

    if (prevOperator === 'NOT' || term.startsWith('-')) {
      excluded.push(term.replace(/^-/, '').toLowerCase());
    } else if (prevOperator === 'AND' || term.startsWith('+')) {
      required.push(term.replace(/^\+/, '').toLowerCase());
    } else if (prevOperator === 'OR') {
      optional.push(term.toLowerCase());
    } else {
      // Default: treat as optional (OR)
      optional.push(term.toLowerCase());
    }
  }

  return { required, optional, excluded, exact };
}

/**
 * Advanced filtering with boolean search support
 */
export function filterMemories(
  memories: MemoryResult[],
  filters: SearchFilters,
  useFuzzy = true
): MemoryResult[] {
  let results = [...memories];

  // Filter by types
  if (filters.types.length > 0) {
    results = results.filter(m => filters.types.includes(m.type));
  }

  // Exclude types
  if (filters.excludeTypes && filters.excludeTypes.length > 0) {
    results = results.filter(m => !filters.excludeTypes!.includes(m.type));
  }

  // Filter by tags
  if (filters.tags.length > 0) {
    results = results.filter(m =>
      m.tags && m.tags.some(tag => filters.tags.includes(tag))
    );
  }

  // Filter by date range
  if (filters.dateFrom) {
    results = results.filter(m => m.createdAt >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    results = results.filter(m => m.createdAt <= filters.dateTo!);
  }

  // Filter by status
  if (filters.status && filters.status.length > 0) {
    results = results.filter(m => m.status && filters.status!.includes(m.status));
  }

  // Filter by priority
  if (filters.priority && filters.priority.length > 0) {
    results = results.filter(m => m.priority && filters.priority!.includes(m.priority));
  }

  // Filter by sentiment
  if (filters.sentiment && filters.sentiment.length > 0) {
    results = results.filter(m => m.sentiment && filters.sentiment!.includes(m.sentiment));
  }

  // Filter by relationships
  if (filters.hasRelationships !== undefined) {
    results = results.filter(m =>
      filters.hasRelationships ?
        (m.relatedIds && m.relatedIds.length > 0) :
        (!m.relatedIds || m.relatedIds.length === 0)
    );
  }

  // Text search with boolean operators
  if (filters.query.trim()) {
    const booleanQuery = parseBooleanSearch(filters.query);

    results = results.filter(m => {
      const searchText = filters.searchIn === 'title' ? m.title :
                        filters.searchIn === 'content' ? m.content :
                        `${m.title} ${m.content} ${m.type} ${(m.tags || []).join(' ')}`;

      const searchLower = searchText.toLowerCase();

      // Check exact phrases
      if (booleanQuery.exact.length > 0) {
        const hasAllExact = booleanQuery.exact.every(phrase =>
          searchLower.includes(phrase.toLowerCase())
        );
        if (!hasAllExact) return false;
      }

      // Check required terms
      if (booleanQuery.required.length > 0) {
        const hasAllRequired = booleanQuery.required.every(term =>
          useFuzzy ? fuzzyMatch(term, searchText) : searchLower.includes(term)
        );
        if (!hasAllRequired) return false;
      }

      // Check excluded terms
      if (booleanQuery.excluded.length > 0) {
        const hasExcluded = booleanQuery.excluded.some(term =>
          searchLower.includes(term)
        );
        if (hasExcluded) return false;
      }

      // Check optional terms (at least one must match)
      if (booleanQuery.optional.length > 0) {
        const hasOptional = booleanQuery.optional.some(term =>
          useFuzzy ? fuzzyMatch(term, searchText) : searchLower.includes(term)
        );
        return hasOptional;
      }

      return true;
    });
  }

  return results;
}

/**
 * Sort memories by various criteria
 */
export function sortMemories(
  memories: MemoryResult[],
  sortBy: SortField,
  searchQuery?: string
): MemoryResult[] {
  const sorted = [...memories];

  switch (sortBy) {
    case 'relevance':
      // Calculate relevance score based on query match
      if (searchQuery && searchQuery.trim()) {
        return sorted.sort((a, b) => {
          const scoreA = calculateRelevanceScore(a, searchQuery);
          const scoreB = calculateRelevanceScore(b, searchQuery);
          return scoreB - scoreA;
        });
      }
      // Fall back to date if no query
      return sorted.sort((a, b) => b.createdAt - a.createdAt);

    case 'date-desc':
      return sorted.sort((a, b) => b.createdAt - a.createdAt);

    case 'date-asc':
      return sorted.sort((a, b) => a.createdAt - b.createdAt);

    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));

    case 'type':
      return sorted.sort((a, b) => {
        const typeCompare = a.type.localeCompare(b.type);
        return typeCompare !== 0 ? typeCompare : b.createdAt - a.createdAt;
      });

    default:
      return sorted;
  }
}

function calculateRelevanceScore(memory: MemoryResult, query: string): number {
  let score = 0;
  const queryLower = query.toLowerCase();
  const titleLower = memory.title.toLowerCase();
  const contentLower = memory.content.toLowerCase();

  // Exact title match = high score
  if (titleLower === queryLower) score += 100;
  else if (titleLower.includes(queryLower)) score += 50;

  // Content matches
  const contentMatches = (contentLower.match(new RegExp(queryLower, 'g')) || []).length;
  score += contentMatches * 5;

  // Tag matches
  if (memory.tags) {
    const tagMatches = memory.tags.filter(tag =>
      tag.toLowerCase().includes(queryLower)
    ).length;
    score += tagMatches * 10;
  }

  // Type match
  if (memory.type.toLowerCase().includes(queryLower)) score += 15;

  // Recency bonus (newer = slightly better)
  const ageInDays = (Date.now() - memory.createdAt) / (1000 * 60 * 60 * 24);
  if (ageInDays < 7) score += 10;
  else if (ageInDays < 30) score += 5;

  return score;
}

/**
 * Group memories by various criteria
 */
export function groupMemories(
  memories: MemoryResult[],
  groupBy: GroupBy
): Map<string, MemoryResult[]> {
  const groups = new Map<string, MemoryResult[]>();

  if (groupBy === 'none') {
    groups.set('All Results', memories);
    return groups;
  }

  memories.forEach(memory => {
    let groupKey: string;

    switch (groupBy) {
      case 'type':
        groupKey = memory.type;
        break;

      case 'date':
        groupKey = formatDateGroup(memory.createdAt);
        break;

      case 'tags':
        if (memory.tags && memory.tags.length > 0) {
          // Add to each tag group
          memory.tags.forEach(tag => {
            if (!groups.has(tag)) groups.set(tag, []);
            groups.get(tag)!.push(memory);
          });
          return; // Skip the default add below
        } else {
          groupKey = 'Untagged';
        }
        break;

      case 'status':
        groupKey = memory.status || 'No Status';
        break;

      case 'priority':
        groupKey = memory.priority || 'No Priority';
        break;

      default:
        groupKey = 'Other';
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(memory);
  });

  return groups;
}

function formatDateGroup(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return 'This Week';
  if (days < 30) return 'This Month';
  if (days < 90) return 'Last 3 Months';
  if (days < 365) return 'This Year';

  const date = new Date(timestamp);
  return date.getFullYear().toString();
}

/**
 * Highlight search terms in text
 */
export function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;

  const booleanQuery = parseBooleanSearch(query);
  const allTerms = [
    ...booleanQuery.required,
    ...booleanQuery.optional,
    ...booleanQuery.exact,
  ];

  let result = text;
  allTerms.forEach(term => {
    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
    result = result.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-700">$1</mark>');
  });

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Calculate memory statistics
 */
export interface MemoryStats {
  total: number;
  byType: Record<string, number>;
  byTimeRange: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
  };
  byTag: Record<string, number>;
  averagePerDay: number;
  mostActiveDay: string;
  oldestMemory: number;
  newestMemory: number;
}

export function calculateMemoryStats(memories: MemoryResult[]): MemoryStats {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;

  const stats: MemoryStats = {
    total: memories.length,
    byType: {},
    byTimeRange: {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      thisYear: 0,
    },
    byTag: {},
    averagePerDay: 0,
    mostActiveDay: '',
    oldestMemory: 0,
    newestMemory: 0,
  };

  if (memories.length === 0) return stats;

  const dayActivity: Record<string, number> = {};
  let oldestTimestamp = Infinity;
  let newestTimestamp = 0;

  memories.forEach(memory => {
    // By type
    stats.byType[memory.type] = (stats.byType[memory.type] || 0) + 1;

    // By time range
    if (memory.createdAt >= oneDayAgo) stats.byTimeRange.today++;
    if (memory.createdAt >= oneWeekAgo) stats.byTimeRange.thisWeek++;
    if (memory.createdAt >= oneMonthAgo) stats.byTimeRange.thisMonth++;
    if (memory.createdAt >= oneYearAgo) stats.byTimeRange.thisYear++;

    // By tag
    if (memory.tags) {
      memory.tags.forEach(tag => {
        stats.byTag[tag] = (stats.byTag[tag] || 0) + 1;
      });
    }

    // Day activity
    const dayKey = new Date(memory.createdAt).toLocaleDateString();
    dayActivity[dayKey] = (dayActivity[dayKey] || 0) + 1;

    // Oldest/newest
    if (memory.createdAt < oldestTimestamp) oldestTimestamp = memory.createdAt;
    if (memory.createdAt > newestTimestamp) newestTimestamp = memory.createdAt;
  });

  stats.oldestMemory = oldestTimestamp;
  stats.newestMemory = newestTimestamp;

  // Calculate average per day
  const daySpan = Math.max(1, Math.floor((now - oldestTimestamp) / (1000 * 60 * 60 * 24)));
  stats.averagePerDay = Number((memories.length / daySpan).toFixed(2));

  // Find most active day
  const mostActive = Object.entries(dayActivity).sort((a, b) => b[1] - a[1])[0];
  if (mostActive) {
    stats.mostActiveDay = mostActive[0];
  }

  return stats;
}

/**
 * Detect potential duplicate memories
 */
export function findDuplicates(
  memories: MemoryResult[],
  similarityThreshold = 0.85
): Array<{ memory: MemoryResult; duplicates: MemoryResult[] }> {
  const duplicates: Array<{ memory: MemoryResult; duplicates: MemoryResult[] }> = [];
  const processed = new Set<string>();

  for (let i = 0; i < memories.length; i++) {
    if (processed.has(memories[i].id)) continue;

    const similar: MemoryResult[] = [];

    for (let j = i + 1; j < memories.length; j++) {
      if (processed.has(memories[j].id)) continue;

      const similarity = calculateSimilarity(
        memories[i].title.toLowerCase(),
        memories[j].title.toLowerCase()
      );

      if (similarity >= similarityThreshold) {
        similar.push(memories[j]);
        processed.add(memories[j].id);
      }
    }

    if (similar.length > 0) {
      duplicates.push({
        memory: memories[i],
        duplicates: similar,
      });
      processed.add(memories[i].id);
    }
  }

  return duplicates;
}
