import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import MarkdownBlock from './MarkdownBlock';
import ActionAdmonition from './ActionAdmonition';
import { SylviaEvent, drainSylviaEventQueue } from '../services/sylviaLog';
import { Image, Search, Mic, Video, X, ChevronDown, Loader2 } from 'lucide-react';

const SylviaPanel: React.FC = () => {
  const { currentThread, messages, sendMessage, updateThreadArtifact, activeView, primedAction, setPrimedAction, activeEntity, isLoading } = useAppContext();
  const [input, setInput] = useState('');
  const [artifactContent, setArtifactContent] = useState('');
  const [events, setEvents] = useState<SylviaEvent[]>([]);
  
  // Resize state
  const [panelWidth, setPanelWidth] = useState(360);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Chat scroll state
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  // Multi-modality state
  const [useImageGen, setUseImageGen] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentThread?.artifactContent) {
      setArtifactContent(currentThread.artifactContent);
    } else {
      setArtifactContent('');
    }
  }, [currentThread]);

  const threadMessages = useMemo(() => messages.slice(-20), [messages]);

  useEffect(() => {
    const loadRatings = async () => {
      const { getSetting } = await import('../services/storage');
      const ratings = await getSetting<Record<string, number>>('sylvia_action_ratings', {});
      return ratings;
    };
    
    const initialize = async () => {
      const pending = drainSylviaEventQueue();
      const ratings = await loadRatings();
      
      if (pending.length) {
        const eventsWithRatings = pending.reverse().map(event => ({
          ...event,
          rating: ratings[event.id],
        }));
        setEvents(prev => [...eventsWithRatings, ...prev].slice(0, 50));
      }
      
      (window as any).__SYLVIA_LOG__ = async (event: SylviaEvent) => {
        const ratings = await loadRatings();
        setEvents(prev => [{ ...event, rating: ratings[event.id] }, ...prev].slice(0, 50));
      };
    };
    
    initialize();
    
    return () => {
      delete (window as any).__SYLVIA_LOG__;
    };
  }, []);

  const handleRateEvent = async (id: string, rating: number) => {
    setEvents(prev => prev.map(event => event.id === id ? { ...event, rating } : event));
    // Store rating persistently
    const { saveSetting, getSetting } = await import('../services/storage');
    const ratings = await getSetting<Record<string, number>>('sylvia_action_ratings', {});
    ratings[id] = rating;
    await saveSetting('sylvia_action_ratings', ratings);
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      setVideoFile(null);
    }
    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setAudioFile(null);
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !audioFile && !videoFile) return;
    
    // Handle multimodal content
    let fileAttachment: { name: string; type: string; size: string } | undefined;
    let audioBase64: string | undefined;
    let videoBase64: string | undefined;
    
    if (audioFile) {
      // Convert audio to base64
      const arrayBuffer = await audioFile.arrayBuffer();
      audioBase64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      fileAttachment = {
        name: audioFile.name,
        type: audioFile.type,
        size: `${(audioFile.size / 1024).toFixed(1)} KB`,
      };
    } else if (videoFile) {
      // Convert video to base64 data URL
      const arrayBuffer = await videoFile.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const mimeType = videoFile.type || 'video/mp4';
      videoBase64 = `data:${mimeType};base64,${base64}`;
      fileAttachment = {
        name: videoFile.name,
        type: videoFile.type,
        size: `${(videoFile.size / 1024).toFixed(1)} KB`,
      };
    }
    
    // Determine model based on modality
    const { getSetting } = await import('../services/storage');
    let modelOverride: string | undefined;
    
    if (useImageGen) {
      modelOverride = await getSetting('imageGenModel', 'google/gemini-2.5-flash-image');
    } else if (useWebSearch) {
      modelOverride = await getSetting('webSearchModel', 'openai/gpt-4o-mini-search-preview');
    } else if (audioFile || videoFile) {
      modelOverride = await getSetting('audioVideoModel', 'google/gemini-2.5-flash-preview-09-2025');
    }
    
    // Clear input immediately for better UX
    const messageText = input.trim();
    setInput('');
    setAudioFile(null);
    setVideoFile(null);
    setUseImageGen(false);
    setUseWebSearch(false);
    
    // Send message (input already cleared)
    await sendMessage(messageText, fileAttachment, {
      useImageGeneration: useImageGen,
      useWebSearch,
      useAudioVideo: !!(audioFile || videoFile),
      audioBase64: audioFile ? {
        data: audioBase64!,
        format: audioFile.name.endsWith('.mp3') ? 'mp3' : 'wav',
      } : undefined,
      videoBase64,
      modelOverride,
    });
  };

  const handleArtifactChange = (value: string) => {
    setArtifactContent(value);
    if (currentThread) {
      updateThreadArtifact(currentThread.id, value);
    }
  };

  // Resize handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;
      
      const rect = panelRef.current.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;
      const clampedWidth = Math.max(320, Math.min(800, newWidth));
      setPanelWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0) {
      const container = chatContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages]);

  // Check if scroll button should be visible
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const checkScroll = () => {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      setShowScrollButton(!isNearBottom && container.scrollHeight > container.clientHeight);
    };

    container.addEventListener('scroll', checkScroll);
    checkScroll(); // Initial check

    return () => container.removeEventListener('scroll', checkScroll);
  }, [messages]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setShowScrollButton(false);
    }
  };

  return (
    <aside 
      ref={panelRef}
      className="glass-panel resizable-panel flex-shrink-0 rounded-[32px] flex flex-col border border-white/70 shadow-xl overflow-hidden"
      style={{ width: `${panelWidth}px`, minWidth: '320px', maxWidth: '800px' }}
    >
      <div 
        className="resize-handle"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
      />
      <div className="flex flex-col border-b border-white/70">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-secondary-light">Sylvia</p>
            <h2 className="text-xl font-semibold">{currentThread?.title || 'Polaris Console'}</h2>
            <p className="text-xs text-secondary-light">{currentThread ? 'Thread intelligence' : `Ready for ${activeView}`}</p>
          </div>
        </div>
        {/* Active Entity Indicator */}
        {activeEntity && activeEntity.type && activeEntity.id && (
          <div className="px-5 pb-3">
            <div className="glass-panel rounded-2xl border border-white/70 bg-white/60 px-3 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-light">Focused on</p>
                <p className="text-xs font-medium text-primary-light truncate">
                  {activeEntity.type === 'person' && 'Person'}
                  {activeEntity.type === 'brand' && 'Brand Element'}
                  {activeEntity.type === 'concept' && 'Concept'}
                  {activeEntity.type === 'journal' && 'Journal Entry'}
                  {activeEntity.type === 'calendar' && 'Calendar Event'}
                  {activeEntity.type === 'goal' && 'Goal'}
                  {activeEntity.type === 'task' && 'Task'}
                  {activeEntity.type === 'agenda' && 'Agenda Item'}
                  {activeEntity.type === 'deliverable' && 'Deliverable'}
                  {activeEntity.data?.name && `: ${activeEntity.data.name}`}
                  {activeEntity.data?.title && `: ${activeEntity.data.title}`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div 
            ref={chatContainerRef}
            className="flex-1 min-h-0 overflow-y-auto invisible-scrollbar px-5 py-4 space-y-3 relative"
          >
            {threadMessages.length === 0 ? (
              <p className="text-sm text-secondary-light">No conversation yet. Start by giving Sylvia instructions.</p>
            ) : (
              <>
                {threadMessages.map((message, index) => {
                  // Find events that occurred after this AI message but before the next user message
                  const nextUserMessageIndex = threadMessages.findIndex((m, i) => i > index && m.sender === 'user');
                  const nextUserMessage = nextUserMessageIndex !== -1 ? threadMessages[nextUserMessageIndex] : null;
                  
                  let messageEvents: SylviaEvent[] = [];
                  if (message.sender === 'ai') {
                    // Show events that occurred after this AI message
                    const messageTime = message.createdAt;
                    // If this is the last message, use current time; otherwise use next user message time
                    const isLastMessage = index === threadMessages.length - 1;
                    const cutoffTime = isLastMessage ? Date.now() : (nextUserMessage?.createdAt || Date.now());
                    
                    messageEvents = events.filter(event => {
                      const eventTime = event.timestamp;
                      return eventTime >= messageTime && eventTime < cutoffTime;
                    });
                    // Sort by timestamp to show in order
                    messageEvents.sort((a, b) => a.timestamp - b.timestamp);
                  }

                  return (
                    <React.Fragment key={message.id}>
                      <div
                        className={`rounded-3xl border px-3 py-3 text-sm ${
                          message.sender === 'user'
                            ? 'bg-white text-primary-light border-white/80 ml-auto'
                            : 'bg-[#F4F7FF] text-primary-light border-[#C7D8FF] mr-auto'
                        }`}
                        style={{ maxWidth: '90%' }}
                      >
                        <p className="text-[10px] uppercase tracking-[0.3em] text-secondary-light mb-2">
                          {message.sender === 'user' ? 'You' : 'Sylvia'}
                        </p>
                        {message.sender === 'user' ? (
                          <MarkdownBlock content={message.text} />
                        ) : (
                          <div className="sylvia-markdown-panel">
                            <MarkdownBlock content={message.text} />
                          </div>
                        )}
                      </div>
                      {/* Show action admonitions sequentially after AI messages */}
                      {message.sender === 'ai' && messageEvents.map(event => (
                        <ActionAdmonition
                          key={event.id}
                          event={event}
                          onRate={handleRateEvent}
                        />
                      ))}
                    </React.Fragment>
                  );
                })}
                {/* Thinking indicator */}
                {isLoading && (
                  <div className="rounded-3xl border px-4 py-4 text-sm bg-[#F4F7FF] text-primary-light border-[#C7D8FF] mr-auto animate-pulse" style={{ maxWidth: '90%' }}>
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                      <div className="flex-1">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-secondary-light mb-2">Sylvia</p>
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            {/* Scroll to bottom button */}
            {showScrollButton && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-6 right-6 p-2 rounded-full bg-white/90 border border-white/70 shadow-lg hover:bg-white transition-all hover:scale-110 z-10"
                title="Scroll to bottom"
              >
                <ChevronDown className="w-5 h-5 text-primary-light" />
              </button>
            )}
          </div>
          <div className="flex-shrink-0 px-5 py-4 border-t border-white/70 bg-white/80">
            {primedAction && (
              <div className="mb-2 px-3 py-2 rounded-2xl bg-black text-white text-xs flex items-center justify-between">
                <span className="uppercase tracking-[0.2em]">
                  Primed: {primedAction.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <button
                  onClick={() => setPrimedAction(null)}
                  className="ml-2 px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-xs"
                  title="Cancel priming"
                >
                  ✕
                </button>
              </div>
            )}
            
            {/* Multi-modality toggles */}
            <div className="mb-2 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setUseImageGen(!useImageGen)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
                  useImageGen
                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                    : 'bg-white/80 border border-white/70 text-secondary-light hover:bg-white'
                }`}
                title="Image Generation"
              >
                <Image className="w-3.5 h-3.5" />
                Image
              </button>
              <button
                onClick={() => setUseWebSearch(!useWebSearch)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
                  useWebSearch
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-white/80 border border-white/70 text-secondary-light hover:bg-white'
                }`}
                title="Web Search"
              >
                <Search className="w-3.5 h-3.5" />
                Search
              </button>
              <label className="px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 bg-white/80 border border-white/70 text-secondary-light hover:bg-white cursor-pointer">
                <Mic className="w-3.5 h-3.5" />
                Audio
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/wav,audio/mp3,audio/*"
                  onChange={handleAudioSelect}
                  className="hidden"
                />
              </label>
              <label className="px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 bg-white/80 border border-white/70 text-secondary-light hover:bg-white cursor-pointer">
                <Video className="w-3.5 h-3.5" />
                Video
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/mpeg,video/mov,video/webm,video/*"
                  onChange={handleVideoSelect}
                  className="hidden"
                />
              </label>
              {(audioFile || videoFile) && (
                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-gray-100 text-xs">
                  <span className="text-secondary-light">
                    {audioFile?.name || videoFile?.name}
                  </span>
                  <button
                    onClick={() => {
                      setAudioFile(null);
                      setVideoFile(null);
                    }}
                    className="text-secondary-light hover:text-primary-light"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="rounded-3xl border border-white/80 bg-white flex items-end gap-2 px-4 py-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={primedAction ? "Type your message here (will be sent as primed action)..." : "Send context or directives"}
                className="flex-1 resize-none bg-transparent outline-none text-sm"
                rows={2}
              />
              <button
                onClick={handleSend}
                className="px-4 py-2 rounded-2xl bg-[#111827] text-white text-sm disabled:bg-gray-400"
                disabled={!input.trim() && !audioFile && !videoFile}
              >
                Send
              </button>
            </div>
          </div>
        </div>
    </aside>
  );
};

export default SylviaPanel;
