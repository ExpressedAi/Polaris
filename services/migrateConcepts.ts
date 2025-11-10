/**
 * Migration function to move non-people items from People section to Concepts section
 * This helps clean up data that was incorrectly classified as people
 */

import { entityStorage } from './storage';
import { PeopleRecord, ConceptRecord } from '../types';

// Indicators that suggest something is a concept, not a person
const conceptIndicators = [
  /\b(?:ai|artificial intelligence|machine learning|application|app|system|platform|tool|software|technology|concept|idea|model|framework|algorithm|method|approach|strategy|process|workflow|solution|product|service|feature|functionality)\b/i,
  /\b(?:the|a|an)\s+[A-Z][a-z]+ [A-Z][a-z]+/i, // "the AI Application" pattern
  /[A-Z][a-z]+ [A-Z][a-z]+ (?:is|are|works|does|can|will|should|has|have)/i, // "AI Application works"
];

// Indicators that suggest something IS a person
const personIndicators = [
  /\b(?:person|people|individual|human|contact|colleague|friend|partner|client|customer|user|they|them|their|he|she|his|her|him)\b/i,
  /\b(?:meet|met|talk|spoke|email|call|contact|know|works with|collaborates with)\b/i,
  /\b(?:@|email|phone|number|address)\b/i,
];

export async function migratePeopleToConcepts(): Promise<{
  migrated: number;
  kept: number;
  errors: string[];
}> {
  const result = {
    migrated: 0,
    kept: 0,
    errors: [] as string[],
  };

  try {
    const people = await entityStorage.getPeopleRecords();
    
    for (const person of people) {
      // Check if this looks like a concept
      const context = [
        person.name,
        person.role,
        person.company,
        person.profile,
        person.notes,
      ]
        .filter(Boolean)
        .join(' ');

      const isConcept = conceptIndicators.some(pattern => pattern.test(context));
      const isPerson = personIndicators.some(pattern => pattern.test(context));

      // If it has concept indicators and no person indicators, migrate it
      if (isConcept && !isPerson) {
        try {
          const concept: ConceptRecord = {
            id: `concept-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: person.name,
            description: person.profile || person.notes || undefined,
            category: person.company || person.role || undefined,
            tags: person.tags,
            notes: person.notes || undefined,
            createdAt: person.createdAt,
          };

          await entityStorage.saveConceptRecord(concept);
          await entityStorage.deletePeopleRecord(person.id);
          result.migrated++;
        } catch (error) {
          result.errors.push(`Failed to migrate ${person.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        result.kept++;
      }
    }
  } catch (error) {
    result.errors.push(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

