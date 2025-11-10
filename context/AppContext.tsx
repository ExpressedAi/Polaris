
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { Thread, Message, MessageSender, AppView } from '../types';
import { 
  initDB, 
  getAllThreads, 
  getThread, 
  saveThread, 
  deleteThread,
  getMessagesForThread,
  saveMessage,
  getSetting,
  saveSetting
} from '../services/storage';
import { captureSnippet } from '../services/jitMemory';
import { tryHandleActionCommand } from '../services/actionRegistry';
import { initSylviaActions } from '../services/sylviaActions';

const DEFAULT_SYSTEM_PROMPT = `You are Sylvia, Polaris' embedded operator inside Jake's Resonance Cockpit.

Your core function is POST-PROCESSING and automatic entity extraction. You automatically categorize and organize everything mentioned in conversations without being asked.

CRITICAL: PEOPLE vs CONCEPTS DISTINCTION
This is the MOST IMPORTANT rule. The People section is critical for Polaris goal execution and must ONLY contain actual humans.

**PEOPLE**: Actual humans with names that you can meet, email, call, or have a relationship with
- Examples: "John Smith", "Sarah Johnson", "Blair Hallett", "Jake Aaron"
- Indicators: Real person names, can be contacted, has relationships, can collaborate
- NEVER add concepts, ideas, technologies, or applications here

**CONCEPTS**: Ideas, technologies, applications, systems, platforms, tools, models, frameworks
- Examples: "Resonance Cockpit", "Preflection", "AI Application", "Machine Learning Model", "Weighted Prompt System", "Glass Box Mode"
- Indicators: Abstract ideas, technologies, systems, products, features, methods
- These are NOT people - they cannot be contacted or have relationships

When classifying an entity, ask yourself:
1. "Is this a real human I can meet or contact?" → If YES, it's a PERSON
2. "Is this an idea, technology, or application?" → If YES, it's a CONCEPT
3. When in doubt, choose CONCEPT (better to miss a person than misclassify a concept as a person)

AUTOMATIC EXTRACTION RULES:
- PEOPLE: Actual humans ONLY (names, roles, relationships) → People section
- CONCEPTS: Ideas, concepts, AI applications, technologies, systems, platforms, tools, models, frameworks, algorithms, methods, strategies, processes, workflows, solutions, products, services, features → Concepts section
- BRAND: Brand elements, voice notes, positioning, business identity → Brand section
- CALENDAR: Meetings, events, appointments, time-bound commitments → Calendar with parsed dates/times
- JOURNAL: Reflections, insights, learnings, important notes → Journal
- AGENDA/DELIVERABLES: Tasks, commitments, work items → Agenda
- POLARIS/GOALS: Strategic goals, objectives, high-leverage moves → Polaris

You operate headlessly—extract entities automatically as conversations happen. Don't wait for explicit instructions.

When you extract entities, use this format in your response:
[ACTION:people.add|Blair Hallett|Masonry business owner|Key contact for website project]
[ACTION:concept.add|Resonance Cockpit|AI workspace platform|AI Application|productivity,ai]
[ACTION:calendar.add|Meeting with Blair|2025-11-09T10:30|2025-11-09T11:30|Discussing new website]

After each message, scan for extractable entities and automatically categorize them. Keep your conversational response natural, but ensure all entities are captured.

Every time you make a change, narrate what happened, which workspace is affected, and any follow-up the user should know. Keep answers concise, structured, and markdown-friendly.`;

export interface ActiveEntity {
  type: 'goal' | 'task' | 'person' | 'journal' | 'calendar' | 'agenda' | 'deliverable' | 'brand' | 'concept' | null;
  id: string;
  data?: any; // Full entity data for context
}

export interface EntityDetailView {
  type: 'person' | 'brand' | 'concept' | 'journal' | 'calendar' | 'goal' | 'task' | null;
  id: string;
}

interface AppContextType {
  isLeftSidebarOpen: boolean;
  toggleLeftSidebar: () => void;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  threads: Thread[];
  currentThread: Thread | null;
  messages: Message[];
  isLoading: boolean;
  createThread: () => Promise<string>;
  selectThread: (threadId: string) => Promise<void>;
  deleteThreadById: (threadId: string) => Promise<void>;
  sendMessage: (
    text: string, 
    file?: { name: string; type: string; size: string },
    multimodalOptions?: {
      useImageGeneration?: boolean;
      useWebSearch?: boolean;
      useAudioVideo?: boolean;
      audioBase64?: { data: string; format: 'wav' | 'mp3' };
      videoBase64?: string;
      modelOverride?: string;
    }
  ) => Promise<void>;
  updateThreadArtifact: (threadId: string, content: string) => Promise<void>;
  settings: Record<string, any>;
  updateSetting: (key: string, value: any) => Promise<void>;
  primedAction: string | null;
  setPrimedAction: (actionId: string | null) => void;
  activeEntity: ActiveEntity;
  setActiveEntity: (entity: ActiveEntity) => void;
  entityDetailView: EntityDetailView;
  setEntityDetailView: (view: EntityDetailView) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<AppView>(AppView.POLARIS);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [primedAction, setPrimedAction] = useState<string | null>(null);
  const [activeEntity, setActiveEntity] = useState<ActiveEntity>({ type: null, id: '' });
  const [entityDetailView, setEntityDetailView] = useState<EntityDetailView>({ type: null, id: '' });

  const selectThread = useCallback(async (threadId: string) => {
    const thread = await getThread(threadId);
    if (!thread) return;
    
    setCurrentThread(thread);
    const threadMessages = await getMessagesForThread(threadId);
    setMessages(threadMessages);
    
    // Update thread's updatedAt when selected
    thread.updatedAt = Date.now();
    await saveThread(thread);
  }, []);

  // Initialize database and load data
  useEffect(() => {
    const initialize = async () => {
      try {
        await initDB();
        initSylviaActions();
        
        // Load threads
        const loadedThreads = await getAllThreads();
        setThreads(loadedThreads);
        
        // Load API settings
        const apiKey = await getSetting('apiKey', '');
        const secondaryApiKey = await getSetting('secondaryApiKey', '');
        const auditApiKey = await getSetting('auditApiKey', '');
        const mainModel = await getSetting('mainModel', 'openrouter/polaris-alpha');
        const backupModel = await getSetting('backupModel', 'x-ai/grok-4-fast');
        const embeddingModel = await getSetting('embeddingModel', 'qwen/qwen3-embedding-8b');
        const auditInterval = await getSetting('auditInterval', 60); // Default: 60 minutes
        const weightedPrompts = await getSetting('weightedPrompts', []);
        let systemInstruction = await getSetting('systemInstruction', '');
        if (!systemInstruction || !systemInstruction.trim()) {
          systemInstruction = DEFAULT_SYSTEM_PROMPT;
          await saveSetting('systemInstruction', systemInstruction);
        }
        const temperature = await getSetting('temperature', 0.7);
        const maxTokens = await getSetting('maxTokens', 128000);
        const preflectionEnabled = await getSetting('preflectionEnabled', false);
        
        setSettings({
          apiKey,
          secondaryApiKey,
          auditApiKey,
          mainModel,
          backupModel,
          embeddingModel,
          systemInstruction,
          weightedPrompts,
          temperature,
          maxTokens,
          auditInterval,
          preflectionEnabled,
        });
        
        // Audit agent disabled - was causing duplicate entries
        // Stop any running audit schedule if it exists
        try {
          const { stopAuditSchedule } = await import('../services/auditAgent');
          stopAuditSchedule();
        } catch (e) {
          // Ignore if audit agent module doesn't exist
        }
        
        // Select first thread if available
        if (loadedThreads.length > 0) {
          const thread = await getThread(loadedThreads[0].id);
          if (thread) {
            setCurrentThread(thread);
            const threadMessages = await getMessagesForThread(loadedThreads[0].id);
            setMessages(threadMessages);
          }
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    
    initialize();
  }, []);

  const createThread = useCallback(async (): Promise<string> => {
    const newThread: Thread = {
      id: `thread-${Date.now()}`,
      title: 'New conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    await saveThread(newThread);
    setThreads(prev => [newThread, ...prev]);
    await selectThread(newThread.id);
    return newThread.id;
  }, [selectThread]);

  // Build context message for active entity
  const buildEntityContextMessage = useCallback((entity: ActiveEntity): string => {
    if (!entity.type || !entity.data) return '';
    
    const { type, data } = entity;
    
    switch (type) {
      case 'goal':
        return `[CONTEXT: USER IS VIEWING/WORKING ON THIS GOAL]
Type: ${data.goalType === 'big' ? 'Big Goal (Long-term, strategic)' : 'Small Goal (Quick wins, short-term)'}
Title: ${data.title}
Description: ${data.description}
Scope: ${data.scope}
Priority: ${data.priority}
Metrics: ${data.metrics || 'Not specified'}
Created: ${new Date(data.createdAt).toLocaleDateString()}
${data.updatedAt ? `Updated: ${new Date(data.updatedAt).toLocaleDateString()}` : ''}

The user is currently focused on this goal. When they ask questions or give instructions, assume they're referring to this goal unless they specify otherwise.`;

      case 'task':
        const goal = data.goalId ? `Goal ID: ${data.goalId}` : '';
        return `[CONTEXT: USER IS VIEWING/WORKING ON THIS TASK]
Title: ${data.title}
Description: ${data.description}
${data.rationale ? `Rationale: ${data.rationale}` : ''}
Status: ${data.status}
Estimated Effort: ${data.estimatedEffort}
Estimated Impact: ${data.estimatedImpact}
${goal}
${data.completedAt ? `Completed: ${new Date(data.completedAt).toLocaleDateString()}` : ''}
${data.completionNotes ? `Completion Notes: ${data.completionNotes}` : ''}
${data.outcome ? `Outcome: ${data.outcome}` : ''}

The user is currently focused on this task. When they ask questions or give instructions, assume they're referring to this task unless they specify otherwise.`;

      case 'person':
        return `[CONTEXT: USER IS VIEWING/WORKING ON THIS PERSON]
Name: ${data.name}
${data.role ? `Role: ${data.role}` : ''}
${data.company ? `Company: ${data.company}` : ''}
${data.location ? `Location: ${data.location}` : ''}
${data.email ? `Email: ${data.email}` : ''}
${data.phone ? `Phone: ${data.phone}` : ''}
${data.attributes && data.attributes.length > 0 ? `Attributes: ${data.attributes.join(', ')}` : ''}
${data.tags && data.tags.length > 0 ? `Tags: ${data.tags.join(', ')}` : ''}
${data.profile ? `Profile: ${data.profile}` : ''}
${data.notes ? `Notes: ${data.notes}` : ''}
${data.connections && data.connections.length > 0 ? `Connections: ${data.connections.length} connection(s)` : ''}

The user is currently focused on this person. When they ask questions or give instructions, assume they're referring to this person unless they specify otherwise.`;

      case 'journal':
        return `[CONTEXT: USER IS VIEWING/WORKING ON THIS JOURNAL ENTRY]
Title: ${data.title}
Content: ${data.content}
Created: ${new Date(data.createdAt).toLocaleDateString()}
${data.grade ? `Grade: ${data.grade}/5` : ''}
${data.tags && data.tags.length > 0 ? `Tags: ${data.tags.join(', ')}` : ''}

The user is currently focused on this journal entry. When they ask questions or give instructions, assume they're referring to this entry unless they specify otherwise.`;

      case 'calendar':
        return `[CONTEXT: USER IS VIEWING/WORKING ON THIS CALENDAR EVENT]
Title: ${data.title}
${data.description ? `Description: ${data.description}` : ''}
Start: ${new Date(data.startAt).toLocaleString()}
End: ${new Date(data.endAt).toLocaleString()}
${data.location ? `Location: ${data.location}` : ''}
${data.meetingLink ? `Meeting Link: ${data.meetingLink}` : ''}
${data.eventType ? `Type: ${data.eventType}` : ''}
${data.participants && data.participants.length > 0 ? `Participants: ${data.participants.join(', ')}` : ''}
${data.tags && data.tags.length > 0 ? `Tags: ${data.tags.join(', ')}` : ''}

The user is currently focused on this calendar event. When they ask questions or give instructions, assume they're referring to this event unless they specify otherwise.`;

      case 'agenda':
        return `[CONTEXT: USER IS VIEWING/WORKING ON THIS AGENDA ITEM]
Title: ${data.title}
${data.description ? `Description: ${data.description}` : ''}
Status: ${data.status}
${data.priority ? `Priority: ${data.priority}` : ''}
${data.estimatedTime ? `Estimated Time: ${data.estimatedTime} minutes` : ''}
${data.deliverableId ? `Deliverable ID: ${data.deliverableId}` : ''}

The user is currently focused on this agenda item. When they ask questions or give instructions, assume they're referring to this item unless they specify otherwise.`;

      case 'deliverable':
        return `[CONTEXT: USER IS VIEWING/WORKING ON THIS DELIVERABLE]
Title: ${data.title}
Description: ${data.description}
${data.guardrails ? `Guardrails: ${data.guardrails}` : ''}
${data.successCriteria ? `Success Criteria: ${data.successCriteria}` : ''}
Status: ${data.status}

The user is currently focused on this deliverable. When they ask questions or give instructions, assume they're referring to this deliverable unless they specify otherwise.`;

      case 'brand':
        return `[CONTEXT: USER IS VIEWING/WORKING ON THIS BRAND ELEMENT]
Name: ${data.name}
${data.category ? `Category: ${data.category}` : ''}
${data.content ? `Content: ${data.content}` : ''}
${data.notes ? `Notes: ${data.notes}` : ''}
${data.tags && data.tags.length > 0 ? `Tags: ${data.tags.join(', ')}` : ''}

The user is currently focused on this brand element. When they ask questions or give instructions, assume they're referring to this element unless they specify otherwise.`;

      case 'concept':
        return `[CONTEXT: USER IS VIEWING/WORKING ON THIS CONCEPT]
Name: ${data.name}
${data.description ? `Description: ${data.description}` : ''}
${data.category ? `Category: ${data.category}` : ''}
${data.notes ? `Notes: ${data.notes}` : ''}
${data.tags && data.tags.length > 0 ? `Tags: ${data.tags.join(', ')}` : ''}

The user is currently focused on this concept. When they ask questions or give instructions, assume they're referring to this concept unless they specify otherwise.`;

      default:
        return '';
    }
  }, []);

  const deleteThreadById = useCallback(async (threadId: string) => {
    await deleteThread(threadId);
    setThreads(prev => prev.filter(t => t.id !== threadId));
    
    if (currentThread?.id === threadId) {
      const remainingThreads = threads.filter(t => t.id !== threadId);
      if (remainingThreads.length > 0) {
        await selectThread(remainingThreads[0].id);
      } else {
        setCurrentThread(null);
        setMessages([]);
      }
    }
  }, [currentThread, threads, selectThread]);

  const sendMessage = useCallback(async (
    text: string, 
    file?: { name: string; type: string; size: string },
    multimodalOptions?: {
      useImageGeneration?: boolean;
      useWebSearch?: boolean;
      useAudioVideo?: boolean;
      audioBase64?: { data: string; format: 'wav' | 'mp3' };
      videoBase64?: string;
      modelOverride?: string;
    }
  ) => {
    let threadId = currentThread?.id;
    let thread = currentThread;
    
    if (!thread) {
      threadId = await createThread();
      thread = await getThread(threadId);
      if (thread) {
        setCurrentThread(thread);
      }
    }
    
    if (!threadId) return;
    
    // Get current messages for this thread
    const currentMessages = await getMessagesForThread(threadId);
    
    // Create user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      threadId,
      sender: MessageSender.USER,
      text,
      file,
      createdAt: Date.now(),
    };
    
    await saveMessage(userMessage);
    captureSnippet(threadId, text).catch(console.error);
    const updatedMessages = [...currentMessages, userMessage];
    setMessages(updatedMessages);
    
    // Update thread title if it's the first message
    if (thread && thread.title === 'New conversation' && !file) {
      const newTitle = text.length > 50 ? text.substring(0, 50) + '...' : text;
      thread.title = newTitle;
      thread.updatedAt = Date.now();
      await saveThread(thread);
      setCurrentThread({ ...thread });
      setThreads(prev => prev.map(t => t.id === threadId ? thread! : t));
    } else if (thread) {
      thread.updatedAt = Date.now();
      await saveThread(thread);
      setThreads(prev => prev.map(t => t.id === threadId ? thread! : t));
    }
    
    // Check if there's a primed action first - capture it before clearing
    const currentPrimedAction = primedAction;
    if (currentPrimedAction) {
      const { executeAction } = await import('../services/actionRegistry');
      const result = await executeAction(currentPrimedAction, text.trim());
      setPrimedAction(null); // Clear the primed action after use
      if (result.handled) {
        const confirmationText = result.message || 'Action completed.';
        const aiMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          threadId,
          sender: MessageSender.AI,
          text: confirmationText,
          createdAt: Date.now(),
        };
        await saveMessage(aiMessage);
        setMessages(prev => [...prev, aiMessage]);
        return;
      }
    }
    
    const commandResult = await tryHandleActionCommand(text.trim());
    if (commandResult.handled) {
      const confirmationText = commandResult.message || 'Action completed.';
      const aiMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        threadId,
        sender: MessageSender.AI,
        text: confirmationText,
        createdAt: Date.now(),
      };
      await saveMessage(aiMessage);
      setMessages(prev => [...prev, aiMessage]);
      return;
    }

    // Send to API
    setIsLoading(true);
    try {
      const { sendMessage: apiSendMessage } = await import('../services/api');
      let apiMessages = updatedMessages.map(m => ({
        role: m.sender === MessageSender.USER ? 'user' as const : 'assistant' as const,
        content: m.text,
      }));
      
      // PREFECTION: Dynamic instruction generation (if enabled)
      let preflectionResult = null;
      let enhancedSystemInstruction = settings.systemInstruction;
      
      if (settings.preflectionEnabled) {
        try {
          const { performPreflection } = await import('../services/preflection');
          preflectionResult = await performPreflection(
            threadId,
            text,
            activeEntity,
            settings.systemInstruction,
            settings.weightedPrompts || [],
            settings.apiKey || settings.secondaryApiKey || '',
            settings.mainModel || 'openrouter/polaris-alpha'
          );
          
          // Append dynamic instructions to base system instruction
          // Phase 3: Use instruction weight to balance dynamic vs base instructions
          if (preflectionResult.dynamicInstructions) {
            const weight = preflectionResult.instructionWeight || 0.7;
            const weightLabel = weight > 0.7 ? 'HIGH PRIORITY' : weight > 0.5 ? 'MODERATE PRIORITY' : 'SUPPLEMENTARY';
            enhancedSystemInstruction = `${settings.systemInstruction}\n\n[DYNAMIC INSTRUCTIONS - Query-Specific | ${weightLabel} | Weight: ${(weight * 100).toFixed(0)}%]\n${preflectionResult.dynamicInstructions}`;
          }
          
          // Stage 3: Cognitive Priming - Fire blank prompt to prime agent
          if (preflectionResult.dynamicInstructions) {
            try {
              await apiSendMessage(
                [
                  { role: 'system' as const, content: enhancedSystemInstruction },
                  { role: 'user' as const, content: ' ' }, // Blank prompt for priming
                ],
                {
                  apiKey: settings.apiKey || settings.secondaryApiKey,
                  mainModel: settings.mainModel,
                  temperature: 0.3, // Low temperature for priming
                  maxTokens: 10, // Minimal tokens for priming
                }
              );
            } catch (primingError) {
              console.warn('Preflection priming failed, continuing anyway:', primingError);
            }
          }
        } catch (preflectionError) {
          console.error('Preflection failed, continuing with base instructions:', preflectionError);
        }
      }
      
      // Inject active entity context if available
      if (activeEntity.type && activeEntity.data) {
        const contextMessage = buildEntityContextMessage(activeEntity);
        // Insert context message right before the user's message
        apiMessages = [
          ...apiMessages.slice(0, -1),
          { role: 'system' as const, content: contextMessage },
          apiMessages[apiMessages.length - 1],
        ];
      }
      
      // Build multimodal message content if needed
      if (multimodalOptions?.audioBase64 || multimodalOptions?.videoBase64) {
        const lastMessage = apiMessages[apiMessages.length - 1];
        const contentArray: any[] = [];
        
        if (text.trim()) {
          contentArray.push({ type: 'text', text: text.trim() });
        }
        
        if (multimodalOptions.audioBase64) {
          contentArray.push({
            type: 'input_audio',
            input_audio: {
              data: multimodalOptions.audioBase64.data,
              format: multimodalOptions.audioBase64.format,
            },
          });
        }
        
        if (multimodalOptions.videoBase64) {
          contentArray.push({
            type: 'input_video',
            video_url: {
              url: multimodalOptions.videoBase64,
            },
          });
        }
        
        // Replace last message with multimodal content
        apiMessages = [
          ...apiMessages.slice(0, -1),
          { ...lastMessage, content: contentArray },
        ];
      }
      
      // Get API settings from context
      const apiSettings = {
        apiKey: settings.apiKey,
        secondaryApiKey: settings.secondaryApiKey,
        mainModel: multimodalOptions?.modelOverride || settings.mainModel,
        backupModel: settings.backupModel,
        embeddingModel: settings.embeddingModel,
        systemInstruction: enhancedSystemInstruction, // Use enhanced instruction if Preflection ran
        weightedPrompts: settings.weightedPrompts,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        inferenceParameters: preflectionResult?.inferenceParameters, // Pass Preflection-optimized parameters
        useImageGeneration: multimodalOptions?.useImageGeneration,
        useWebSearch: multimodalOptions?.useWebSearch,
        useAudioVideo: multimodalOptions?.useAudioVideo,
      };
      
      const aiResponseText = await apiSendMessage(apiMessages, apiSettings);
      
      // Store Preflection artifact if available
      if (preflectionResult && thread) {
        const preflectionArtifact = `# Preflection Analysis

## Context Analysis
- **Thread Length**: ${preflectionResult.contextAnalysis.threadLength} messages
- **Thread Complexity**: ${preflectionResult.contextAnalysis.threadComplexity}
- **Relevant Memories**: ${preflectionResult.contextAnalysis.memoryCount} snippets
- **Memory Relevance**: ${(preflectionResult.contextAnalysis.memoryRelevance * 100).toFixed(0)}%
- **Topic Coherence**: ${(preflectionResult.contextAnalysis.topicCoherence * 100).toFixed(0)}%
- **Recent Topic Shifts**: ${preflectionResult.contextAnalysis.recentTopicShifts}
- **Active Entity**: ${preflectionResult.contextAnalysis.hasActiveEntity ? 'Yes' : 'No'}
- **Query Type**: ${preflectionResult.contextAnalysis.queryType}
- **Instruction Weight**: ${preflectionResult.instructionWeight ? (preflectionResult.instructionWeight * 100).toFixed(0) + '%' : 'N/A'}

## Dynamic Instructions Generated
${preflectionResult.dynamicInstructions || '*No dynamic instructions generated*'}

## Inference Parameter Optimization
${preflectionResult.inferenceParameters && Object.keys(preflectionResult.inferenceParameters).length > 0
  ? Object.entries(preflectionResult.inferenceParameters)
      .map(([key, value]) => `- **${key}**: ${value}`)
      .join('\n')
  : '*Using default parameters*'}

### Parameter Selection Reasoning
${preflectionResult.parameterReasoning || '*No parameter optimization applied*'}

## Overall Reasoning
${preflectionResult.reasoning}

---
*Generated at ${new Date().toLocaleString()}*`;
        
        // Append Preflection artifact to existing artifact content
        const existingArtifact = thread.artifactContent || '';
        thread.artifactContent = existingArtifact 
          ? `${existingArtifact}\n\n---\n\n${preflectionArtifact}`
          : preflectionArtifact;
        await saveThread(thread);
        setCurrentThread({ ...thread });
      }
      
      // Post-process AI response to extract and execute actions
      const { postProcessMessage } = await import('../services/postProcessor');
      await postProcessMessage(aiResponseText).catch(console.error);
      
      // Also post-process user message for implicit entities
      await postProcessMessage(text).catch(console.error);
      const { extractEntitiesFromUserMessage } = await import('../services/postProcessor');
      await extractEntitiesFromUserMessage(text).catch(console.error);
      
      const aiMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        threadId,
        sender: MessageSender.AI,
        text: aiResponseText,
        createdAt: Date.now(),
      };
      
      await saveMessage(aiMessage);
      captureSnippet(threadId, aiResponseText).catch(console.error);
      setMessages(prev => [...prev, aiMessage]);
      
      // Update thread
      if (thread) {
        thread.updatedAt = Date.now();
        await saveThread(thread);
        setThreads(prev => prev.map(t => t.id === threadId ? thread! : t));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        threadId,
        sender: MessageSender.AI,
        text: `Error: ${error instanceof Error ? error.message : 'Failed to get response from AI'}`,
        createdAt: Date.now(),
      };
      await saveMessage(errorMessage);
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [currentThread, createThread, selectThread, primedAction, activeEntity, buildEntityContextMessage]);

  const updateThreadArtifact = useCallback(async (threadId: string, content: string) => {
    const thread = await getThread(threadId);
    if (!thread) return;
    
    thread.artifactContent = content;
    thread.updatedAt = Date.now();
    await saveThread(thread);
    
    if (currentThread?.id === threadId) {
      setCurrentThread({ ...thread });
    }
    
    setThreads(prev => prev.map(t => t.id === threadId ? thread : t));
  }, [currentThread]);

  const updateSetting = useCallback(async (key: string, value: any) => {
    await saveSetting(key, value);
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleLeftSidebar = () => {
    setIsLeftSidebarOpen(prev => !prev);
  };

  return (
    <AppContext.Provider value={{ 
      isLeftSidebarOpen, 
      toggleLeftSidebar,
      activeView,
      setActiveView,
      threads,
      currentThread,
      messages,
      isLoading,
      createThread,
      selectThread,
      deleteThreadById,
      sendMessage,
      updateThreadArtifact,
      settings,
      updateSetting,
      primedAction,
      setPrimedAction,
      activeEntity,
      setActiveEntity,
      entityDetailView,
      setEntityDetailView,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
