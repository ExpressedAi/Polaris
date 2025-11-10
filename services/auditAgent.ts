import { entityStorage } from './storage';
import { JournalEntry } from '../types';
import { executeAction } from './actionRegistry';
import { sendMessage } from './api';

const AUDIT_MODEL = 'openrouter/polaris-alpha';

interface AuditResult {
  journalId: string;
  extracted: string[];
  errors: string[];
}

/**
 * Audit agent that checks journal entries for missed entity extractions
 * Uses the free Polaris Alpha model to analyze and extract entities
 */
export async function runAudit(apiKey: string): Promise<AuditResult[]> {
  const results: AuditResult[] = [];
  
  // Get all journal entries
  const entries = await entityStorage.getJournalEntries();
  
  // Get existing entities to check what's already been extracted
  const [existingPeople, existingClients, existingBrand, existingCalendar, existingAgenda, existingGoals] = await Promise.all([
    entityStorage.getPeopleRecords(),
    entityStorage.getClientRecords(),
    entityStorage.getBrandRecords(),
    entityStorage.getCalendarEvents(),
    entityStorage.getAgendaItems(),
    entityStorage.getGoals(),
  ]);
  
  const existingPeopleNames = new Set(existingPeople.map(p => p.name.toLowerCase()));
  const existingClientNames = new Set(existingClients.map(c => c.name.toLowerCase()));
  const existingBrandNames = new Set(existingBrand.map(b => b.name.toLowerCase()));
  
  // Create sets for calendar, agenda, and goals to check duplicates
  // Calendar: check by title + start time (normalized)
  const existingCalendarKeys = new Set(
    existingCalendar.map(e => `${e.title.toLowerCase().trim()}|${e.startAt}`)
  );
  
  // Agenda: check by title (normalized)
  const existingAgendaTitles = new Set(
    existingAgenda.map(a => a.title.toLowerCase().trim())
  );
  
  // Goals: check by title (normalized)
  const existingGoalTitles = new Set(
    existingGoals.map(g => g.title.toLowerCase().trim())
  );
  
  // Audit each journal entry
  for (const entry of entries) {
    const result: AuditResult = {
      journalId: entry.id,
      extracted: [],
      errors: [],
    };
    
    try {
      // Create audit prompt
      const auditPrompt = `You are an audit agent checking if entities were properly extracted from this journal entry.

Journal Entry:
Title: ${entry.title}
Content: ${entry.content}

Existing entities already in the system:
- People: ${Array.from(existingPeopleNames).join(', ') || 'None'}
- Clients: ${Array.from(existingClientNames).join(', ') || 'None'}
- Brand: ${Array.from(existingBrandNames).join(', ') || 'None'}

Analyze this journal entry and identify any entities that SHOULD have been extracted but might have been missed:
1. PEOPLE: Any person mentioned (names, roles, relationships)
2. CLIENTS: Any client, customer, or business relationship
3. BRAND: Any brand element, voice note, positioning
4. CALENDAR: Any meeting, event, appointment, or time-bound commitment
5. AGENDA/DELIVERABLES: Any tasks, commitments, or work items
6. POLARIS/GOALS: Strategic goals, objectives, or high-leverage moves

For each missing entity, respond with an ACTION marker in this format:
[ACTION:actionId|payload1|payload2|...]

Example:
[ACTION:people.add|John Smith|Engineer|Key contact for project]
[ACTION:client.add|Acme Corp|Website redesign project]
[ACTION:calendar.add|Meeting with John|2025-11-10T14:00|2025-11-10T15:00|Discuss project]

Only include entities that are clearly mentioned and should be tracked. Be conservative - only extract if it's unambiguous.

Your response:`;

      // Call the free model
      const response = await sendMessage(
        [
          {
            role: 'system',
            content: 'You are an audit agent. Analyze journal entries and identify missing entity extractions. Respond only with ACTION markers for entities that should have been extracted.',
          },
          {
            role: 'user',
            content: auditPrompt,
          },
        ],
        {
          apiKey,
          mainModel: AUDIT_MODEL,
          temperature: 0.3, // Lower temperature for more consistent extraction
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
            existingCalendarKeys,
            existingAgendaTitles,
            existingGoalTitles,
          });
          
          if (!shouldSkip) {
            await executeAction(actionId, payload);
            result.extracted.push(`${actionId}: ${payload.substring(0, 50)}`);
            
            // Update the sets to prevent duplicates within the same audit run
            const payloadParts = payload.split('|');
            if (actionId === 'calendar.add' && payloadParts.length >= 2) {
              const title = payloadParts[0]?.trim().toLowerCase();
              const startAt = payloadParts[1]?.trim();
              if (title && startAt) {
                existingCalendarKeys.add(`${title}|${startAt}`);
              }
            } else if (actionId === 'agenda.add' && payloadParts.length >= 1) {
              const title = payloadParts[0]?.trim().toLowerCase();
              if (title) {
                existingAgendaTitles.add(title);
              }
            } else if (actionId === 'deliverable.add' && payloadParts.length >= 1) {
              const title = payloadParts[0]?.trim().toLowerCase();
              if (title) {
                existingAgendaTitles.add(title); // Deliverables can be treated similarly
              }
            } else if (actionId === 'polaris.goal' && payloadParts.length >= 1) {
              const title = payloadParts[0]?.trim().toLowerCase();
              if (title) {
                existingGoalTitles.add(title);
              }
            }
          }
        } catch (error) {
          result.errors.push(`Failed to execute ${actionId}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } catch (error) {
      result.errors.push(`Audit failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    if (result.extracted.length > 0 || result.errors.length > 0) {
      results.push(result);
    }
  }
  
  return results;
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
    existingCalendarKeys: Set<string>;
    existingAgendaTitles: Set<string>;
    existingGoalTitles: Set<string>;
  }
): Promise<boolean> {
  const parts = payload.split('|');
  const firstPart = parts[0]?.trim().toLowerCase();
  
  if (!firstPart) return false;
  
  // Check people
  if (actionId === 'people.add') {
    return existing.existingPeopleNames.has(firstPart);
  }
  
  // Check clients
  if (actionId === 'client.add') {
    return existing.existingClientNames.has(firstPart);
  }
  
  // Check brand
  if (actionId === 'brand.add') {
    return existing.existingBrandNames.has(firstPart);
  }
  
  // Check calendar events - use title + start time as unique key
  if (actionId === 'calendar.add' && parts.length >= 2) {
    const title = firstPart;
    const startAt = parts[1]?.trim();
    if (title && startAt) {
      return existing.existingCalendarKeys.has(`${title}|${startAt}`);
    }
  }
  
  // Check agenda items - use title as unique key
  if (actionId === 'agenda.add' && parts.length >= 1) {
    return existing.existingAgendaTitles.has(firstPart);
  }
  
  // Check deliverables - use title as unique key
  if (actionId === 'deliverable.add' && parts.length >= 1) {
    return existing.existingAgendaTitles.has(firstPart);
  }
  
  // Check goals - use title as unique key
  if (actionId === 'polaris.goal' && parts.length >= 1) {
    return existing.existingGoalTitles.has(firstPart);
  }
  
  // If we don't recognize the action type, be conservative and skip it
  return true;
}

/**
 * Schedule periodic audits
 */
let auditInterval: number | null = null;

export function startAuditSchedule(
  apiKey: string,
  intervalMinutes: number = 60,
  onComplete?: (results: AuditResult[]) => void
): void {
  // Clear existing interval
  if (auditInterval !== null) {
    clearInterval(auditInterval);
  }
  
  // Run immediately, then on interval
  runAudit(apiKey)
    .then(results => {
      if (onComplete) onComplete(results);
    })
    .catch(console.error);
  
  auditInterval = window.setInterval(() => {
    runAudit(apiKey)
      .then(results => {
        if (onComplete) onComplete(results);
      })
      .catch(console.error);
  }, intervalMinutes * 60 * 1000);
}

export function stopAuditSchedule(): void {
  if (auditInterval !== null) {
    clearInterval(auditInterval);
    auditInterval = null;
  }
}

