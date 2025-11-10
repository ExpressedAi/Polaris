import { executeAction } from './actionRegistry';
import { sendMessage } from './api';
import { entityStorage } from './storage';

interface ExtractedAction {
  actionId: string;
  payload: string;
}

/**
 * Post-processes AI responses and user messages to extract entities
 * and automatically trigger appropriate actions
 */
export async function postProcessMessage(text: string): Promise<void> {
  // Look for ACTION markers in the format: [ACTION:actionId|payload1|payload2|...]
  const actionPattern = /\[ACTION:([^\]]+)\]/g;
  const matches = [...text.matchAll(actionPattern)];
  
  if (matches.length === 0) return;
  
  for (const match of matches) {
    const actionString = match[1];
    const parts = actionString.split('|');
    
    if (parts.length < 1) continue;
    
    const actionId = parts[0].trim();
    const payload = parts.slice(1).join('|').trim();
    
    if (!actionId) continue;
    
    try {
      await executeAction(actionId, payload);
    } catch (error) {
      console.error(`Failed to execute post-processed action ${actionId}:`, error);
    }
  }
}

/**
 * Parses natural language date/time into ISO format
 */
function parseNaturalDate(dateStr: string, timeStr?: string): string {
  const now = new Date();
  const lowerDate = dateStr.toLowerCase().trim();
  
  // Handle "tomorrow"
  if (lowerDate.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16);
  }
  
  // Handle "today"
  if (lowerDate.includes('today')) {
    return now.toISOString().slice(0, 16);
  }
  
  // Try to parse as date string
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 16);
    }
  } catch {}
  
  return '';
}

/**
 * Parses time string like "10:30 am" or "10:30am"
 */
function parseTime(timeStr: string): string {
  const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
  if (!match) return '';
  
  let hours = parseInt(match[1]);
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const ampm = match[3].toLowerCase();
  
  if (ampm === 'pm' && hours !== 12) hours += 12;
  if (ampm === 'am' && hours === 12) hours = 0;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Analyzes user message for implicit entities using AI classification
 * This uses AI to intelligently distinguish between people and concepts
 */
export async function extractEntitiesFromUserMessage(text: string): Promise<void> {
  // Get API key and settings for AI classification
  const { getSetting } = await import('./storage');
  const apiKey = await getSetting('apiKey') || await getSetting('secondaryApiKey');
  const mainModel = await getSetting('mainModel', 'openrouter/polaris-alpha');
  
  if (!apiKey) {
    console.warn('No API key available for entity extraction');
    return;
  }
  
  // Calendar event patterns - look for meeting/appointment language (keep this as pattern matching is reliable)
  const hasCalendarKeywords = /(?:meeting|call|appointment|event|schedule|meet|call with)/i.test(text);
  const hasDateReference = /(?:tomorrow|today|november|december|january|february|march|april|may|june|july|august|september|october|\d{1,2}\/\d{1,2}|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))/i.test(text);
  const hasTimeReference = /(?:at|@|\d{1,2}):?\d{0,2}\s*(?:am|pm)/i.test(text);
  
  if (hasCalendarKeywords && (hasDateReference || hasTimeReference)) {
    // Extract date/time info
    const dateMatch = text.match(/(?:tomorrow|today|november \d{1,2}|\d{1,2}\/\d{1,2}|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))/i);
    const timeMatch = text.match(/(?:at|@)\s*(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
    
    if (dateMatch || timeMatch) {
      // Extract title (usually the first part before date/time)
      const titleMatch = text.match(/(?:meeting|call|appointment|event|schedule|meet)\s+(?:with\s+)?([^,\.]+?)(?:\s+(?:tomorrow|today|at|@|on))/i);
      const title = titleMatch ? titleMatch[1].trim() : text.split(/\s+(?:tomorrow|today|at|@|on)/i)[0]?.trim() || 'Event';
      
      const dateStr = dateMatch ? dateMatch[0] : '';
      const timeStr = timeMatch ? timeMatch[0] : '';
      
      // Parse dates
      const startDate = parseNaturalDate(dateStr, timeStr);
      const startTime = timeMatch ? parseTime(timeMatch[0]) : '';
      
      // Create ISO datetime strings
      let startIso = '';
      let endIso = '';
      
      if (startDate) {
        if (startTime) {
          startIso = `${startDate.split('T')[0]}T${startTime}`;
          // Default 1 hour duration
          const endDate = new Date(startIso);
          endDate.setHours(endDate.getHours() + 1);
          endIso = endDate.toISOString().slice(0, 16);
        } else {
          startIso = `${startDate}T10:00`;
          endIso = `${startDate}T11:00`;
        }
      }
      
      if (startIso) {
        await executeAction('calendar.add', `${title}|${startIso}|${endIso}|${text}`).catch(() => {});
      }
    }
  }
  
  // Use AI to intelligently classify entities (not pattern matching)
  try {
    // Get existing entities to avoid duplicates
    const [existingPeople, existingConcepts] = await Promise.all([
      entityStorage.getPeopleRecords(),
      entityStorage.getConceptRecords(),
    ]);
    const existingPeopleNames = new Set(existingPeople.map(p => p.name.toLowerCase()));
    const existingConceptNames = new Set(existingConcepts.map(c => c.name.toLowerCase()));
    
    const classificationPrompt = `You are an entity classification agent. Analyze this message and identify entities that should be extracted. CRITICALLY IMPORTANT: You must distinguish between PEOPLE (actual humans) and CONCEPTS (ideas, technologies, applications).

Message to analyze:
"${text}"

Existing entities (do not duplicate):
- People: ${Array.from(existingPeopleNames).slice(0, 20).join(', ') || 'None'}
- Concepts: ${Array.from(existingConceptNames).slice(0, 20).join(', ') || 'None'}

CRITICAL DISTINCTION RULES:
- **PEOPLE**: Actual humans with names (e.g., "John Smith", "Sarah Johnson", "Blair Hallett") - real people you can meet, email, call
- **CONCEPTS**: Ideas, applications, technologies, systems (e.g., "Resonance Cockpit", "Preflection", "AI Application", "Machine Learning Model", "Weighted Prompt System") - abstract concepts, not humans

If something is ambiguous, ask yourself: "Can I meet this person? Can I email them? Is this a real human?" If NO, it's a CONCEPT.

For each entity you identify, respond ONLY with ACTION markers in this exact format:
[ACTION:entityType.add|payload1|payload2|...]

Entity types:
- people.add|Name|Role|Company|Location|Email|Phone|Attributes|Profile|Notes|Tags
- concept.add|Name|Description|Category|Tags|Notes
- brand.add|Name|Description
- calendar.add|Title|StartTime|EndTime|Description|Location|MeetingLink|EventType|Participants|Tags
- agenda.add|Title|Description|DueDate|EstimatedTime|Priority|Tags|DeliverableId
- deliverable.add|Title|Description|Scope|Guardrails|SuccessCriteria|Tags
- polaris.goal|Title|Description|GoalType|Scope|Priority|Metrics
- polaris.task|GoalId|Title|Description|Rationale|EstimatedEffort|EstimatedImpact

IMPORTANT:
- Only extract entities that are CLEARLY mentioned
- Do NOT extract entities that already exist
- When in doubt between PEOPLE and CONCEPTS, choose CONCEPTS (better to miss a person than misclassify a concept as a person)
- Be conservative - only extract if you're confident

Your response (ONLY ACTION markers, no other text):`;

    const { sendMessage: apiSendMessage } = await import('./api');
    const response = await apiSendMessage(
      [
        {
          role: 'system',
          content: 'You are an entity extraction agent. Analyze messages and extract entities. Respond ONLY with ACTION markers. Be extremely careful to distinguish PEOPLE (actual humans) from CONCEPTS (ideas, technologies, applications).',
        },
        {
          role: 'user',
          content: classificationPrompt,
        },
      ],
      {
        apiKey,
        mainModel,
        temperature: 0.3, // Low temperature for accurate classification
        maxTokens: 2000,
      }
    );
    
    // Parse ACTION markers from AI response
    const actionPattern = /\[ACTION:([^\]]+)\]/g;
    const matches = [...response.matchAll(actionPattern)];
    
    for (const match of matches) {
      const actionString = match[1];
      const parts = actionString.split('|');
      
      if (parts.length < 1) continue;
      
      const actionId = parts[0].trim();
      const payload = parts.slice(1).join('|').trim();
      
      if (!actionId) continue;
      
      // Double-check: if it's a people.add action, verify it's not actually a concept
      if (actionId === 'people.add') {
        const entityName = payload.split('|')[0]?.trim();
        if (entityName) {
          // Quick validation: if name contains concept-like words, skip
          const conceptKeywords = ['system', 'application', 'platform', 'tool', 'technology', 'concept', 'idea', 'model', 'framework', 'algorithm', 'method', 'process', 'workflow', 'solution', 'product', 'service', 'feature'];
          const lowerName = entityName.toLowerCase();
          if (conceptKeywords.some(keyword => lowerName.includes(keyword))) {
            console.log(`Skipping ${entityName} - looks like a concept, not a person`);
            continue;
          }
        }
      }
      
      try {
        await executeAction(actionId, payload);
      } catch (error) {
        console.error(`Failed to execute extracted action ${actionId}:`, error);
      }
    }
  } catch (error) {
    console.error('AI-based entity extraction failed:', error);
    // Fallback: don't extract anything if AI fails (better to miss than misclassify)
  }
}

/**
 * Manually extract entities from a single journal entry using AI
 * This is a fail-safe for when automatic post-processing misses something
 */
export async function extractEntitiesFromJournalEntry(
  entryId: string,
  apiKey: string
): Promise<{ extracted: string[]; errors: string[] }> {
  const result = { extracted: [] as string[], errors: [] as string[] };
  
  try {
    const entry = (await entityStorage.getJournalEntries()).find(e => e.id === entryId);
    if (!entry) {
      result.errors.push('Journal entry not found');
      return result;
    }

    // Get existing entities to avoid duplicates
    const [existingPeople, existingClients, existingBrand] = await Promise.all([
      entityStorage.getPeopleRecords(),
      entityStorage.getClientRecords(),
      entityStorage.getBrandRecords(),
    ]);

    const existingPeopleNames = new Set(existingPeople.map(p => p.name.toLowerCase()));
    const existingClientNames = new Set(existingClients.map(c => c.name.toLowerCase()));
    const existingBrandNames = new Set(existingBrand.map(b => b.name.toLowerCase()));

    // Create extraction prompt
    const extractionPrompt = `You are an entity extraction agent. Analyze this journal entry and identify all entities that should be extracted:

Journal Entry:
Title: ${entry.title}
Content: ${entry.content}

Existing entities already in the system:
- People: ${Array.from(existingPeopleNames).join(', ') || 'None'}
- Clients: ${Array.from(existingClientNames).join(', ') || 'None'}
- Brand: ${Array.from(existingBrandNames).join(', ') || 'None'}

Extract the following entity types:
1. PEOPLE: Any actual person mentioned (names, roles, relationships) - NOT concepts, ideas, or applications
2. CONCEPTS: Ideas, concepts, AI applications, technologies, systems, platforms, tools, models, frameworks, algorithms, methods, strategies, processes, workflows, solutions, products, services, features
3. CLIENTS: Any client, customer, or business relationship
4. BRAND: Any brand element, voice note, positioning
5. CALENDAR: Any meeting, event, appointment, or time-bound commitment
6. AGENDA/DELIVERABLES: Any tasks, commitments, or work items
7. POLARIS/GOALS: Strategic goals, objectives, or high-leverage moves

IMPORTANT: Distinguish between PEOPLE and CONCEPTS:
- PEOPLE: Actual humans with names (e.g., "John Smith", "Sarah Johnson")
- CONCEPTS: Ideas, applications, technologies (e.g., "AI Application", "Machine Learning Model", "Resonance Cockpit")

For each entity, respond with an ACTION marker in this format:
[ACTION:actionId|payload1|payload2|...]

Example:
[ACTION:people.add|John Smith|Engineer|Key contact for project]
[ACTION:client.add|Acme Corp|Website redesign project]
[ACTION:calendar.add|Meeting with John|2025-11-10T14:00|2025-11-10T15:00|Discuss project]

Only include entities that are clearly mentioned and should be tracked. Skip entities that already exist in the system.

Your response:`;

    // Call the AI model
    const response = await sendMessage(
      [
        {
          role: 'system',
          content: 'You are an entity extraction agent. Analyze journal entries and extract entities. Respond only with ACTION markers for entities that should be extracted.',
        },
        {
          role: 'user',
          content: extractionPrompt,
        },
      ],
      {
        apiKey,
        mainModel: 'openrouter/polaris-alpha',
        temperature: 0.3,
        maxTokens: 2000,
      }
    );

    // Parse ACTION markers from response
    const actionPattern = /\[ACTION:([^\]]+)\]/g;
    const matches = [...response.matchAll(actionPattern)];

    for (const match of matches) {
      const actionString = match[1];
      const parts = actionString.split('|');

      if (parts.length < 1) continue;

      const actionId = parts[0].trim();
      const payload = parts.slice(1).join('|').trim();

      if (!actionId) continue;

      try {
        // Check if entity already exists before adding
        const shouldSkip = await checkIfEntityExists(actionId, payload, {
          existingPeopleNames,
          existingClientNames,
          existingBrandNames,
        });

        if (!shouldSkip) {
          await executeAction(actionId, payload);
          result.extracted.push(`${actionId}: ${payload.substring(0, 50)}${payload.length > 50 ? '...' : ''}`);
        }
      } catch (error) {
        result.errors.push(`Failed to execute ${actionId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  } catch (error) {
    result.errors.push(`Extraction failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

/**
 * Check if an entity already exists to avoid duplicates
 */
async function checkIfEntityExists(
  actionId: string,
  payload: string,
  existing: {
    existingPeopleNames: Set<string>;
    existingClientNames: Set<string>;
    existingBrandNames: Set<string>;
  }
): Promise<boolean> {
  const parts = payload.split('|');
  const name = parts[0]?.trim().toLowerCase();

  if (!name) return false;

  if (actionId === 'people.add') {
    return existing.existingPeopleNames.has(name);
  }

  if (actionId === 'client.add') {
    return existing.existingClientNames.has(name);
  }

  if (actionId === 'brand.add') {
    return existing.existingBrandNames.has(name);
  }

  // For calendar, agenda, goals - we need to fetch and check actual records
  // This is a simplified check - for manual extraction, we'll be more lenient
  // The audit agent has more comprehensive checking
  return false;
}

