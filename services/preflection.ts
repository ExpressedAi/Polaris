import { getMessagesForThread } from './storage';
import { recallSnippets } from './jitMemory';
import { sendMessage } from './api';
import { ActiveEntity } from '../context/AppContext';

export interface InferenceParameters {
  temperature?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  repetitionPenalty?: number;
  minP?: number;
}

export interface PreflectionResult {
  dynamicInstructions: string;
  reasoning: string;
  contextAnalysis: {
    threadLength: number;
    memoryCount: number;
    hasActiveEntity: boolean;
    queryType: 'factual' | 'technical' | 'creative' | 'exploratory' | 'mixed';
    threadComplexity: 'simple' | 'moderate' | 'complex' | 'very-complex';
    topicCoherence: number; // 0-1 score
    recentTopicShifts: number;
    memoryRelevance: number; // 0-1 score
  };
  inferenceParameters?: InferenceParameters;
  parameterReasoning?: string;
  instructionWeight?: number; // How much to weight dynamic instructions (0-1)
}

/**
 * Preflection: Dynamic instruction generation based on context analysis
 * 
 * Stage 1: Context Analysis
 * - Analyzes conversation thread context
 * - Evaluates user query semantics and intent
 * - Reviews available memory systems and historical data
 * 
 * Stage 2: Dynamic Instruction Generation
 * - Generates tailored system instructions optimized for the incoming query
 * 
 * Stage 3: Cognitive Priming (handled in AppContext)
 * - Fires blank prompt to prime agent with augmented instruction set
 * 
 * Stage 4: Response Execution (handled in AppContext)
 * - Processes query with enhanced instruction set
 * 
 * Stage 5: State Reset (handled in AppContext)
 * - Removes dynamic instructions after completion
 */
export async function performPreflection(
  threadId: string,
  userQuery: string,
  activeEntity: ActiveEntity | null,
  baseSystemInstruction: string,
  weightedPrompts: Array<{ id: string; content: string; weight: number }>,
  apiKey: string,
  mainModel: string
): Promise<PreflectionResult> {
  // Stage 1: Context Analysis
  const threadMessages = await getMessagesForThread(threadId);
  const threadLength = threadMessages.length;
  
  // Get relevant memory snippets
  const memorySnippets = await recallSnippets(userQuery, 5);
  const memoryCount = memorySnippets.length;
  
  // Analyze query type
  const queryType = analyzeQueryType(userQuery);
  
  // Check for active entity context
  const hasActiveEntity = activeEntity?.type !== null && activeEntity?.data !== undefined;
  
  // Phase 3: Advanced Context Analysis
  const threadComplexity = analyzeThreadComplexity(threadMessages, threadLength);
  const { topicCoherence, recentTopicShifts } = analyzeTopicCoherence(threadMessages, userQuery);
  const memoryRelevance = calculateMemoryRelevance(memorySnippets, userQuery);
  const instructionWeight = calculateInstructionWeight(
    threadComplexity,
    topicCoherence,
    memoryRelevance,
    hasActiveEntity
  );
  
  const contextAnalysis = {
    threadLength,
    memoryCount,
    hasActiveEntity,
    queryType,
    threadComplexity,
    topicCoherence,
    recentTopicShifts,
    memoryRelevance,
  };
  
  // Stage 2: Dynamic Instruction Generation
  const analysisPrompt = `You are a context engineering system performing Preflection - dynamic instruction generation for an AI agent.

CONTEXT ANALYSIS:
- Thread Length: ${threadLength} messages
- Thread Complexity: ${threadComplexity}
- Relevant Memories: ${memoryCount} snippets available (Relevance: ${(memoryRelevance * 100).toFixed(0)}%)
- Topic Coherence: ${(topicCoherence * 100).toFixed(0)}%
- Recent Topic Shifts: ${recentTopicShifts}
- Active Entity: ${hasActiveEntity ? `User is viewing/working on: ${activeEntity.type}` : 'None'}
- Query Type: ${queryType}
- Instruction Weight: ${(instructionWeight * 100).toFixed(0)}% (${instructionWeight > 0.7 ? 'HIGH PRIORITY' : instructionWeight > 0.5 ? 'MODERATE PRIORITY' : 'SUPPLEMENTARY'})
- Base System Instructions: ${baseSystemInstruction.substring(0, 500)}${baseSystemInstruction.length > 500 ? '...' : ''}
${weightedPrompts.length > 0 ? `- Weighted Prompts: ${weightedPrompts.length} prompts configured` : ''}

USER QUERY:
"${userQuery}"

AVAILABLE MEMORY CONTEXT:
${memorySnippets.length > 0 
  ? memorySnippets.map((s, i) => `${i + 1}. ${s.text.substring(0, 200)}${s.text.length > 200 ? '...' : ''}`).join('\n')
  : 'No relevant memories found'}

TASK:
Generate dynamic, query-specific system instructions that will be temporarily appended to the agent's base instruction set. These instructions should:

1. Address the specific requirements of this query
2. Leverage available context (thread history, memories, active entity)
3. Optimize for the detected query type (${queryType})
4. Provide enhanced guidance without contradicting base instructions
5. Be concise but comprehensive (aim for 2-4 sentences)

${threadLength > 20 ? 'NOTE: This is a long conversation. Focus on preventing repetition and maintaining coherence.' : ''}
${threadComplexity === 'very-complex' ? 'NOTE: This is a very complex conversation. Provide clear, structured guidance to maintain coherence.' : ''}
${topicCoherence < 0.5 ? `NOTE: Topic coherence is low (${(topicCoherence * 100).toFixed(0)}%). Recent topic shifts detected. Help maintain focus and clarity.` : ''}
${recentTopicShifts > 2 ? `NOTE: ${recentTopicShifts} topic shifts detected in recent messages. Help bridge context and maintain continuity.` : ''}
${memoryCount > 0 ? `NOTE: Leverage the available memory context (relevance: ${(memoryRelevance * 100).toFixed(0)}%) to provide more relevant responses.` : ''}
${hasActiveEntity ? 'NOTE: The user is currently focused on a specific entity. Tailor instructions to work with that context.' : ''}
${instructionWeight > 0.7 ? `NOTE: Dynamic instructions have HIGH PRIORITY (weight: ${(instructionWeight * 100).toFixed(0)}%). These instructions should strongly influence the response.` : ''}

Respond ONLY with the dynamic instructions to append. Do not include explanations or meta-commentary. Just the instructions themselves.`;

  try {
    const dynamicInstructions = await sendMessage(
      [
        {
          role: 'system',
          content: 'You are a context engineering system. Generate dynamic instructions for AI agents based on query analysis. Respond only with the instructions, no explanations.',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      {
        apiKey,
        mainModel,
        temperature: 0.5, // Lower temperature for more focused instruction generation
        maxTokens: 500,
      }
    );
    
    const reasoning = `Generated dynamic instructions for ${queryType} query. Thread: ${threadLength} messages, ${memoryCount} relevant memories${hasActiveEntity ? `, active entity: ${activeEntity.type}` : ''}.`;
    
    // Stage 2.5: Analyze and optimize inference parameters
    const { inferenceParameters, parameterReasoning } = analyzeInferenceParameters(
      queryType,
      threadLength,
      memoryCount,
      contextAnalysis
    );
    
    return {
      dynamicInstructions: dynamicInstructions.trim(),
      reasoning,
      contextAnalysis,
      inferenceParameters,
      parameterReasoning,
      instructionWeight,
    };
  } catch (error) {
    // Fallback: return minimal instructions if Preflection fails
    console.error('Preflection failed:', error);
    return {
      dynamicInstructions: '',
      reasoning: `Preflection analysis failed: ${error instanceof Error ? error.message : String(error)}`,
      contextAnalysis,
      instructionWeight: 0.5, // Default weight on failure
    };
  }
}

/**
 * Analyze query type based on keywords and patterns
 */
function analyzeQueryType(query: string): 'factual' | 'technical' | 'creative' | 'exploratory' | 'mixed' {
  const lowerQuery = query.toLowerCase();
  
  const factualKeywords = ['what', 'when', 'where', 'who', 'how many', 'list', 'tell me', 'explain', 'define'];
  const technicalKeywords = ['code', 'function', 'api', 'implementation', 'debug', 'error', 'bug', 'technical', 'algorithm', 'architecture'];
  const creativeKeywords = ['create', 'design', 'imagine', 'brainstorm', 'idea', 'concept', 'write', 'story', 'generate'];
  const exploratoryKeywords = ['explore', 'analyze', 'investigate', 'research', 'compare', 'evaluate', 'consider', 'think about'];
  
  const factualScore = factualKeywords.filter(kw => lowerQuery.includes(kw)).length;
  const technicalScore = technicalKeywords.filter(kw => lowerQuery.includes(kw)).length;
  const creativeScore = creativeKeywords.filter(kw => lowerQuery.includes(kw)).length;
  const exploratoryScore = exploratoryKeywords.filter(kw => lowerQuery.includes(kw)).length;
  
  const scores = [
    { type: 'factual' as const, score: factualScore },
    { type: 'technical' as const, score: technicalScore },
    { type: 'creative' as const, score: creativeScore },
    { type: 'exploratory' as const, score: exploratoryScore },
  ];
  
  const maxScore = Math.max(...scores.map(s => s.score));
  
  if (maxScore === 0) return 'mixed';
  
  const dominantType = scores.find(s => s.score === maxScore)?.type || 'mixed';
  
  // If multiple types have similar scores, return mixed
  const similarScores = scores.filter(s => s.score >= maxScore - 1 && s.type !== dominantType);
  if (similarScores.length > 0) return 'mixed';
  
  return dominantType;
}

/**
 * Analyze and optimize inference parameters based on query characteristics
 * 
 * Performs meta-reasoning about reasoning parameters, selecting optimal
 * settings on a per-query basis.
 */
function analyzeInferenceParameters(
  queryType: 'factual' | 'technical' | 'creative' | 'exploratory' | 'mixed',
  threadLength: number,
  memoryCount: number,
  contextAnalysis: PreflectionResult['contextAnalysis']
): { inferenceParameters: InferenceParameters; parameterReasoning: string } {
  const parameters: InferenceParameters = {};
  const reasoning: string[] = [];
  
  // Temperature: Ranges from 0.3 (factual/technical precision) to 1.2 (creative exploration)
  switch (queryType) {
    case 'factual':
      parameters.temperature = 0.3;
      reasoning.push('Temperature set to 0.3 for factual precision');
      break;
    case 'technical':
      parameters.temperature = 0.4;
      reasoning.push('Temperature set to 0.4 for technical accuracy');
      break;
    case 'creative':
      parameters.temperature = 1.2;
      reasoning.push('Temperature set to 1.2 for creative exploration');
      break;
    case 'exploratory':
      parameters.temperature = 0.9;
      reasoning.push('Temperature set to 0.9 for exploratory reasoning');
      break;
    case 'mixed':
      parameters.temperature = 0.7;
      reasoning.push('Temperature set to 0.7 for balanced mixed query');
      break;
  }
  
  // Top-p (nucleus sampling): Narrowed for precision, widened for exploration
  if (queryType === 'factual' || queryType === 'technical') {
    parameters.topP = 0.85;
    reasoning.push('Top-p narrowed to 0.85 for precise token selection');
  } else if (queryType === 'creative' || queryType === 'exploratory') {
    parameters.topP = 0.95;
    reasoning.push('Top-p widened to 0.95 for exploratory reasoning');
  } else {
    parameters.topP = 0.9;
    reasoning.push('Top-p set to 0.9 for balanced sampling');
  }
  
  // Top-k: Limited for precise token selection when needed
  if (queryType === 'factual' || queryType === 'technical') {
    parameters.topK = 40;
    reasoning.push('Top-k limited to 40 for precise token selection');
  }
  
  // Frequency penalty: Applied in longer threads, when many memories present, or low topic coherence
  if (threadLength > 15 || memoryCount > 3 || topicCoherence < 0.5) {
    let penalty = 0.2;
    if (threadComplexity === 'very-complex') penalty = 0.35;
    else if (threadComplexity === 'complex') penalty = 0.3;
    else if (threadLength > 30) penalty = 0.25;
    
    parameters.frequencyPenalty = penalty;
    reasoning.push(`Frequency penalty set to ${penalty} to reduce repetition (complexity: ${threadComplexity}, coherence: ${(topicCoherence * 100).toFixed(0)}%, ${threadLength} messages, ${memoryCount} memories)`);
  }
  
  // Presence penalty: Encourages introduction of new concepts
  if (queryType === 'exploratory' || queryType === 'creative') {
    parameters.presencePenalty = 0.2;
    reasoning.push('Presence penalty set to 0.2 to encourage new concepts');
  }
  
  // Repetition penalty: Applied for very long conversations or high topic shifts
  if (threadLength > 40 || recentTopicShifts > 2) {
    const penalty = threadComplexity === 'very-complex' ? 1.15 : 1.1;
    parameters.repetitionPenalty = penalty;
    reasoning.push(`Repetition penalty set to ${penalty} to prevent circular reasoning (complexity: ${threadComplexity}, ${recentTopicShifts} topic shifts)`);
  }
  
  // Adjust temperature based on topic coherence
  if (topicCoherence < 0.4 && queryType !== 'creative') {
    // Lower temperature when topic shifts significantly (more focused)
    if (parameters.temperature && parameters.temperature > 0.5) {
      parameters.temperature = Math.max(0.4, parameters.temperature - 0.1);
      reasoning.push(`Temperature adjusted to ${parameters.temperature} due to low topic coherence (${(topicCoherence * 100).toFixed(0)}%)`);
    }
  }
  
  // Adjust for high memory relevance
  if (memoryRelevance > 0.7 && (queryType === 'factual' || queryType === 'technical')) {
    // Slightly lower temperature when highly relevant memories are available
    if (parameters.temperature && parameters.temperature > 0.3) {
      parameters.temperature = Math.max(0.3, parameters.temperature - 0.05);
      reasoning.push(`Temperature adjusted to ${parameters.temperature} due to high memory relevance (${(memoryRelevance * 100).toFixed(0)}%)`);
    }
  }
  
  // Min-p: Set for technical precision when needed
  if (queryType === 'technical') {
    parameters.minP = 0.05;
    reasoning.push('Min-p set to 0.05 for technical precision');
  }
  
  return {
    inferenceParameters: parameters,
    parameterReasoning: reasoning.length > 0 
      ? reasoning.join('\n')
      : 'Using default parameters (no optimization applied)',
  };
}

/**
 * Phase 3: Analyze thread complexity based on message patterns
 */
function analyzeThreadComplexity(
  messages: Array<{ text: string; sender: string }>,
  threadLength: number
): 'simple' | 'moderate' | 'complex' | 'very-complex' {
  if (threadLength <= 5) return 'simple';
  if (threadLength <= 15) return 'moderate';
  if (threadLength <= 40) return 'complex';
  return 'very-complex';
}

/**
 * Phase 3: Analyze topic coherence and detect topic shifts
 */
function analyzeTopicCoherence(
  messages: Array<{ text: string }>,
  currentQuery: string
): { topicCoherence: number; recentTopicShifts: number } {
  if (messages.length < 3) {
    return { topicCoherence: 1.0, recentTopicShifts: 0 };
  }
  
  // Extract keywords from recent messages (last 5)
  const recentMessages = messages.slice(-5);
  const allKeywords = new Set<string>();
  
  recentMessages.forEach(msg => {
    const words = msg.text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    words.forEach(word => allKeywords.add(word));
  });
  
  // Check current query keywords
  const queryWords = new Set(
    currentQuery.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
  );
  
  // Calculate overlap
  const overlap = Array.from(queryWords).filter(w => allKeywords.has(w)).length;
  const topicCoherence = queryWords.size > 0 ? overlap / queryWords.size : 0.5;
  
  // Detect topic shifts by comparing recent messages
  let topicShifts = 0;
  for (let i = 1; i < recentMessages.length; i++) {
    const prevWords = new Set(
      recentMessages[i - 1].text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
    );
    const currWords = new Set(
      recentMessages[i].text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
    );
    
    const prevOverlap = Array.from(currWords).filter(w => prevWords.has(w)).length;
    const shiftRatio = prevWords.size > 0 ? 1 - (prevOverlap / prevWords.size) : 0;
    
    if (shiftRatio > 0.6) topicShifts++;
  }
  
  return {
    topicCoherence: Math.min(1.0, Math.max(0, topicCoherence)),
    recentTopicShifts: topicShifts,
  };
}

/**
 * Phase 3: Calculate memory relevance score
 */
function calculateMemoryRelevance(
  memorySnippets: Array<{ text: string; relevance?: number }>,
  query: string
): number {
  if (memorySnippets.length === 0) return 0;
  
  const queryWords = new Set(
    query.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
  );
  
  let totalRelevance = 0;
  memorySnippets.forEach(snippet => {
    const snippetWords = new Set(
      snippet.text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
    );
    const overlap = Array.from(queryWords).filter(w => snippetWords.has(w)).length;
    const relevance = queryWords.size > 0 ? overlap / queryWords.size : 0;
    totalRelevance += snippet.relevance !== undefined 
      ? (relevance * snippet.relevance) 
      : relevance;
  });
  
  return Math.min(1.0, totalRelevance / memorySnippets.length);
}

/**
 * Phase 3: Calculate instruction weight based on context
 * 
 * Determines how much to weight dynamic instructions vs base instructions.
 * Higher weight (closer to 1.0) = dynamic instructions are more important.
 * Lower weight (closer to 0.0) = rely more on base instructions.
 */
function calculateInstructionWeight(
  threadComplexity: 'simple' | 'moderate' | 'complex' | 'very-complex',
  topicCoherence: number,
  memoryRelevance: number,
  hasActiveEntity: boolean
): number {
  let weight = 0.5; // Base weight
  
  // Increase weight for complex threads (need more guidance)
  switch (threadComplexity) {
    case 'very-complex':
      weight += 0.2;
      break;
    case 'complex':
      weight += 0.15;
      break;
    case 'moderate':
      weight += 0.1;
      break;
    case 'simple':
      weight += 0.05;
      break;
  }
  
  // Increase weight when topic coherence is low (topic shift detected)
  if (topicCoherence < 0.5) {
    weight += 0.15;
  }
  
  // Increase weight when highly relevant memories are available
  if (memoryRelevance > 0.7) {
    weight += 0.1;
  }
  
  // Increase weight when active entity is present (focused context)
  if (hasActiveEntity) {
    weight += 0.1;
  }
  
  // Clamp between 0.3 and 0.9
  return Math.min(0.9, Math.max(0.3, weight));
}

