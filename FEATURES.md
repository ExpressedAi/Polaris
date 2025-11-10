# Sylvia: Resonance Cockpit — Complete Feature Breakdown

## 🚀 **Overview**

Sylvia is a production-ready AI workspace that operates as a **context engineering platform** with **headless post-processing** and **automatic entity extraction**. Unlike traditional chat interfaces, Sylvia proactively organizes your entire digital workspace through natural conversation—no manual data entry required.

**The entire application is designed around a single principle: You talk, Sylvia organizes.**

---

## 🎯 **Core Philosophy: "Sylvia Owns"**

- **Zero manual entry forms** — Everything flows through conversation
- **Post-processing architecture** — AI analyzes and categorizes after the fact
- **Self-healing system** — Background agents catch missed extractions
- **Context engineering** — Weighted prompts allow dynamic priority adjustment
- **Transparent operation** — Glass box mode shows every action with rating system
- **Autonomous workflows** — Set up task sequences for Sylvia to execute independently

---

## ✨ **Novel Features**

### 1. **Headless Post-Processing System**

**What it does:**
Sylvia automatically extracts and categorizes entities from every conversation without being asked. Mention a person, client, meeting, or task—Sylvia adds it to the right workspace automatically.

**How it works:**
- Real-time analysis of every message (both user and AI)
- Pattern recognition for entities (people, clients, calendar events, etc.)
- Automatic categorization based on context
- Uses ACTION markers for explicit extraction: `[ACTION:people.add|Name|Role|Context]`
- Post-processes both AI responses and user messages

**Why it's novel:**
Most AI assistants require explicit commands. Sylvia operates like a background process that never misses details—everything mentioned gets organized automatically.

---

### 2. **Weighted Prompt System**

**What it does:**
Instead of a single system prompt, you can create multiple prompts with percentage weights that must sum to 100%. The AI dynamically prioritizes based on context.

**Example:**
- Prompt 1: "You are Sylvia..." (40% weight)
- Prompt 2: "Focus on entity extraction..." (35% weight)  
- Prompt 3: "Be concise and structured..." (25% weight)

**How it works:**
- Prompts are sorted by weight (highest first)
- Combined with clear labels: `[PRIMARY PROMPT - 40% WEIGHT]`
- AI understands priority hierarchy
- Auto-balance feature distributes weights evenly
- Full validation ensures weights sum to 100%

**Why it's novel:**
This is **compartmentalized context engineering**. You can separate concerns (personality, extraction rules, response style) and let the AI dynamically weight them based on the conversation context.

---

### 3. **Glass Box Mode (Post-Processing Visibility)**

**What it does:**
Toggle to see every action Sylvia takes in real-time, with a comprehensive rating system for reinforcement learning.

**Features:**
- Real-time action logging with timestamps
- Shows action ID, payload, and full context
- Dual rating system:
  - Quick feedback: Positive (+) / Negative (-) buttons
  - Detailed scoring: 1-100 numeric input for granular feedback
- Persistent storage of all ratings in IndexedDB
- Ready for reinforcement learning training
- Filterable event log with search

**Why it's novel:**
This is **transparent AI operation** with **human-in-the-loop feedback**. You can see exactly what Sylvia does and build a feedback dataset to improve her decision-making over time.

---

### 4. **Automatic Entity Extraction**

**What it extracts:**
- **People**: Full names, roles, relationships → People section with comprehensive profiles
- **Brand**: Voice notes, positioning, brand elements → Brand section with categories
- **Calendar**: Meetings, events → Calendar with parsed dates/times, locations, participants
- **Journal**: Reflections, insights → Journal entries with tags and grading
- **Agenda**: Tasks, commitments → Agenda items linked to deliverables
- **Polaris**: Strategic goals → Goals section (small goals vs big goals)

**How it works:**
- Pattern recognition for names, dates, business terms
- Context analysis (client vs. person vs. brand)
- Natural language date parsing ("tomorrow at 10:30am")
- Automatic categorization based on surrounding text
- Manual extraction fallback for journal entries

**Why it's novel:**
Everything happens **headlessly**. You don't think about where things go—you just talk, and Sylvia organizes.

---

### 5. **Autonomous & Semi-Autonomous Workflow Builder (Agenda)**

**What it does:**
Set up long strings of tasks for Sylvia to execute autonomously, or collaborate in a guided "jam session" mode.

**Three Session Modes:**

1. **Manual Mode**: Full manual control over tasks
2. **Semi-Auto Mode (Jam Session)**: Collaborative mode where Sylvia guides you through deliverables, asks questions, provides suggestions, and ensures completion
3. **Auto Mode (Autonomous)**: Fully autonomous agent that works independently, makes decisions, and completes tasks

**Features:**
- **Deliverables System**: Define outcomes with guardrails and success criteria
- **Task Sequencing**: Generate ordered workflows from deliverables
- **Autonomous Agent Configuration**: 
  - Personality settings (how the agent should act)
  - Decision style (how it makes decisions)
  - Communication style (how it communicates)
- **Progress Tracking**: Visual task sequence with current position
- **Session Goals**: Link sessions to Polaris goals for XP tracking
- **Live Notes/Transcript**: Real-time session documentation
- **Post-Mortem**: Summary, grading (1-5 stars), XP calculation
- **Session History**: View past sessions with outcomes and learnings

**Why it's novel:**
This is a **workflow automation system** where you can configure an agent to act like you, work through complex task sequences, and learn from outcomes. The semi-autonomous mode creates a collaborative "jam session" experience.

---

### 6. **Polaris: Goal-Driven Task Generation**

**What it does:**
Define small goals and big goals, then have Sylvia generate 10-12 high-impact, low-effort tasks to achieve them.

**Features:**
- **Goal Types**: Small goals (quick wins) vs Big goals (strategic, long-term)
- **Context-Aware Task Generation**: Sylvia analyzes all available context (people, brand, calendar, journal, agenda) to create relevant tasks
- **Task Attributes**:
  - Estimated effort (very-low to high)
  - Estimated impact (very-low to very-high)
  - Rationale (why this task helps the goal)
- **Granular Feedback System**:
  - Completion notes (what happened)
  - Outcome (exceeded/met/below/missed)
  - Outcome details
  - 5-point rating system (1-100 each):
    - Task Quality
    - Effort Accuracy
    - Impact Accuracy
    - Clarity
    - Helpfulness
  - Learning data (what worked, what didn't, suggestions)
- **Learning Loop**: All feedback stored to improve future task generation

**Why it's novel:**
This creates a **self-improving goal achievement system**. Sylvia learns from every task outcome to generate better tasks over time. The granular feedback system captures every angle of what makes a good task.

---

### 7. **Comprehensive People Profiling**

**What it does:**
Track people with extensive profiling, attributes, connections, and relationship mapping.

**Features:**
- **Rich Profiles**: Name, role, company, location, email, phone
- **Attributes**: Decision-maker, technical, gatekeeper, influencer, etc.
- **Connections System**: 
  - Link people to other people
  - Relationship types (reports to, collaborates with, mentor, peer)
  - Relationship strength (weak/moderate/strong)
  - Connection notes
- **Tags**: Custom categorization
- **Profile Notes**: Rich text profiles and context
- **Stats Dashboard**: Total people, connections, unique attributes, decision makers
- **Search & Filter**: By name, attributes, tags

**Why it's novel:**
This is **relationship intelligence**. The connection system creates a network graph of relationships, making it easy to understand how people connect to each other—critical for context engineering.

---

### 8. **Enhanced Calendar System**

**What it does:**
Comprehensive calendar with rich event details, recurrence, reminders, and participants.

**Features:**
- **Event Types**: Meeting, call, appointment, deadline, etc.
- **Rich Details**: Location, meeting links, description
- **Participants**: Link to people in your network
- **Tags & Colors**: Visual organization
- **Recurrence**: Recurring event support
- **Reminders**: Configurable reminder minutes
- **Stats Dashboard**: Total events, upcoming, this week, today
- **Month Grid View**: Visual calendar with event counts
- **Upcoming Events Sidebar**: Quick access to what's next

**Why it's novel:**
This goes beyond basic calendar functionality—it's integrated with your people network, brand system, and provides rich context for every event.

---

### 9. **Brand Management System**

**What it does:**
Organize brand elements by category with visual cards and comprehensive editing.

**Features:**
- **Categories**: Voice, Visual, Positioning, Messaging, etc.
- **Visual Card Layout**: Beautiful card-based organization
- **Search & Filter**: Find brand elements quickly
- **Stats Dashboard**: Total elements, by category, recent additions
- **Rich Editing**: Full markdown support, tags, category assignment

**Why it's novel:**
Brand elements are automatically extracted from conversations and organized by category, making it easy to maintain brand consistency.

---

### 10. **Journal with Stats & Suggestions**

**What it does:**
Long-form reflections with stats, search, filtering, and Sylvia suggestions.

**Features:**
- **Stats Dashboard**: Total entries, this week, this month, by grade
- **Search & Filter**: By text, tags, grade
- **Enhanced Entry Cards**: Better date formatting, grade visualization with stars
- **Sylvia Suggestions**: Collapsible panel with AI-generated insights
- **Manual Entity Extraction**: Double-double fail-safe button to extract entities from individual entries
- **Tag System**: Organize entries with tags
- **Grading System**: Rate entries for importance

**Why it's novel:**
The journal feeds everything else—it's the source of truth, and Sylvia automatically extracts entities from it. The manual extraction provides a fail-safe for missed entities.

---

### 11. **Pomodoro Timer with Gamification**

**What it does:**
Functional Pomodoro timer with session tracking, stats, and XP rewards.

**Features:**
- **Circular Timer UI**: Beautiful visual countdown
- **Preset Durations**: Quick selection for common lengths
- **Session Tracking**: Log all Pomodoro sessions
- **Stats Dashboard**: Total sessions, total time, streaks, average session length
- **Browser Notifications**: Get notified when timer completes
- **XP Integration**: Earn XP for completed sessions

**Why it's novel:**
Integrated with the gamification system—every Pomodoro session contributes to your overall progress.

---

### 12. **Gamification & Progress System**

**What it does:**
Comprehensive XP system with levels, achievements, and detailed progress tracking.

**Features:**
- **22 Unique Levels**: Each with a name, description, and icon (e.g., Seedling, User, Radio, Network, Building, etc.)
- **Level-Up Notifications**: Animated notifications when you level up
- **Achievements System**: Unlock achievements for milestones
- **Stats Dashboard**: 
  - Journal entries, agenda items, pomodoros
  - Calendar events, people, brand elements
  - XP breakdown by category
  - Top activities
- **Recent Activity Feed**: See what earned you XP
- **Progress Visualization**: See your path to the next level

**Why it's novel:**
This makes productivity fun and tracks granular progress across all workspace activities. Every action contributes to your overall level.

---

### 13. **Memory Search (JIT Memory System)**

**What it does:**
Cross-surface memory retrieval from all conversations and workspace data.

**Features:**
- **Unified Search**: Search across threads, journal, agenda, calendar, people, brand
- **Tag-Based Relevance**: Automatic tagging and scoring
- **Thread-Aware**: Context from conversation threads
- **Cross-Reference**: Link related snippets

**Why it's novel:**
Everything you've ever mentioned is searchable. The JIT memory system creates a searchable knowledge base from all conversations.

---

### 14. **Preflection: Dynamic Instruction Generation & Parameter Optimization**

**What it does:**
A revolutionary context engineering system that analyzes each query and dynamically generates optimized system instructions and inference parameters on a per-query basis.

**Three Phases:**

**Phase 1: Dynamic Instruction Generation**
- Analyzes conversation thread context (length, complexity, topic coherence)
- Evaluates user query semantics and intent (factual, technical, creative, exploratory, mixed)
- Reviews available memory systems and historical data
- Detects active entity context (what the user is currently viewing/working on)
- Generates query-specific system instructions optimized for the incoming query
- Calculates instruction weight based on context complexity and relevance

**Phase 2: Dynamic Inference Parameter Selection**
- **Temperature Optimization**: 
  - Factual queries: 0.3 (precision)
  - Technical queries: 0.4 (accuracy)
  - Creative queries: 1.2 (exploration)
  - Exploratory queries: 0.9 (balanced reasoning)
- **Top-p (Nucleus Sampling)**: Narrowed for precision (0.85) or widened for exploration (0.95)
- **Top-k**: Limited to 40 for precise token selection when needed
- **Frequency Penalty**: Applied based on thread complexity, memory count, and topic coherence
- **Presence Penalty**: Encourages new concepts for exploratory/creative queries
- **Repetition Penalty**: Prevents circular reasoning in long conversations
- **Min-p**: Set for technical precision when needed
- All parameters adapt based on topic coherence, memory relevance, and thread complexity

**Phase 3: Advanced Context Analysis**
- **Thread Complexity Analysis**: Categorizes threads as simple, moderate, complex, or very-complex
- **Topic Coherence Detection**: Calculates 0-1 score of how related recent messages are
- **Topic Shift Detection**: Identifies when conversation topics change significantly
- **Memory Relevance Scoring**: Evaluates how relevant available memories are to the current query
- **Adaptive Instruction Weighting**: Determines priority of dynamic instructions (0-1 scale)

**How it works:**
1. **Context Analysis**: Analyzes thread, query type, memory relevance, active entity
2. **Dynamic Instruction Generation**: AI generates tailored instructions for the specific query
3. **Cognitive Priming**: Fires blank prompt to prime agent with augmented instruction set
4. **Parameter Optimization**: Selects optimal inference parameters based on query characteristics
5. **Response Execution**: Processes query with enhanced instructions and optimized parameters
6. **State Reset**: Removes dynamic instructions after completion (temporary augmentation)
7. **Transparency**: All analysis, reasoning, and parameter selections stored in thread artifacts

**Features:**
- **Toggleable**: Can be enabled/disabled in settings
- **Transparent**: All reasoning displayed in markdown panels within thread artifacts
- **Adaptive**: Learns from context complexity, topic shifts, and memory relevance
- **Non-invasive**: Temporary instruction augmentation doesn't affect base system prompts
- **Meta-reasoning**: Performs reasoning about reasoning parameters

**Why it's novel:**
This is **meta-cognitive AI**—the system reasons about how to reason. Instead of static parameters, Preflection dynamically optimizes both instructions and inference parameters based on deep context analysis. It's like having an AI that adapts its thinking style to match the type of question being asked.

---

### 15. **Multi-Modality Support**

**What it does:**
Support for image generation, web search, and audio/video understanding through OpenRouter API integration.

**Features:**
- **Image Generation**: 
  - Models: `google/gemini-2.5-flash-image`, `openai/gpt-5-image`, `openai/gpt-5-image-mini`
  - Toggle in chat interface
  - Generates images based on conversation context
- **Web Search**:
  - Model: `openai/gpt-4o-mini-search-preview`
  - Real-time web search capabilities
  - Toggle in chat interface
- **Audio/Video Understanding**:
  - Model: `google/gemini-2.5-flash-preview-09-2025`
  - Audio support: WAV, MP3 (base64 encoded)
  - Video support: MP4, MPEG, MOV, WEBM (URL or base64)
  - File upload interface in chat panel
  - Automatic format detection and encoding

**How it works:**
- UI toggles for image generation and web search
- File input fields for audio and video uploads
- Automatic base64 encoding for audio/video files
- Model selection based on selected modalities
- Multimodal content sent to OpenRouter API in proper format

**Why it's novel:**
Seamless integration of multiple AI capabilities in a single interface. You can generate images, search the web, and analyze audio/video all within the same conversation context.

---

### 16. **Full-Page Entity Detail Views**

**What it does:**
Click any entity card (People, Brand, Concepts) to open a full-page detail view with complete information—no truncation, no modals.

**Features:**
- **Clickable Cards**: All entity cards navigate to full-page views
- **Complete Information**: All fields displayed without truncation
- **Context Awareness**: Detail views automatically set `activeEntity` for Sylvia
- **Back Navigation**: Returns to correct list view
- **Rich Display**: 
  - People: Role, company, location, email, phone, attributes, tags, profile, notes, connections
  - Brand: Category, content, description, notes, tags
  - Concepts: Category, description, notes, tags
- **Proper Markdown Rendering**: Full markdown support for descriptions/profiles/notes
- **Visual Hierarchy**: Organized sections with clear labels

**How it works:**
- `entityDetailView` state in AppContext tracks active detail view
- `App.tsx` checks for active detail view and renders `EntityDetailPage`
- Cards set both `entityDetailView` and `activeEntity` when clicked
- Back button navigates to correct list view and clears detail state

**Why it's novel:**
No more truncated cards or cramped modals. Every entity gets a full page to display all its information, and Sylvia is always aware of what you're viewing for enhanced context.

---

### 17. **Context Awareness System**

**What it does:**
Sylvia is aware of what entity you're currently viewing or working on, injecting relevant context into every conversation.

**Features:**
- **Active Entity Tracking**: Tracks currently selected entity (goal, task, person, journal, calendar, agenda, deliverable, brand, concept)
- **Context Injection**: Entity context automatically added to API calls
- **Entity-Specific Prompts**: Different context messages for different entity types
- **Seamless Integration**: Works with Preflection, weighted prompts, and all features
- **Visual Feedback**: Cards highlight when selected

**How it works:**
- `activeEntity` state in AppContext tracks current entity
- `buildEntityContextMessage` generates entity-specific context
- Context injected into `sendMessage` API calls
- Preflection uses active entity in its analysis
- Automatically set when viewing detail pages or selecting cards

**Why it's novel:**
Sylvia doesn't just respond—she understands what you're working on. If you're viewing a person's profile, she knows. If you're working on a goal, she knows. This creates a truly context-aware conversation experience.

---

### 18. **Concepts Section**

**What it does:**
Separate section for ideas, concepts, AI applications, technologies, systems, platforms, tools, models, frameworks, and algorithms—distinct from People.

**Features:**
- **Automatic Extraction**: Sylvia distinguishes between people and concepts
- **Rich Profiles**: Name, description, category, tags, notes
- **Category System**: AI Application, Technology, Framework, etc.
- **Search & Filter**: By name, category, tags
- **Stats Dashboard**: Total concepts, by category, popular tags
- **Full-Page Detail Views**: Click any concept card for complete information
- **Migration Tool**: "Clean Up People Section" button to migrate misclassified entries

**How it works:**
- Pattern recognition distinguishes concepts from people
- Concept indicators: AI, application, system, platform, tool, technology, etc.
- Person indicators: names, roles, relationships, contact info
- Automatic categorization based on keywords
- Manual migration tool for cleanup

**Why it's novel:**
Most systems conflate people and concepts. Sylvia intelligently distinguishes between actual humans and abstract concepts/technologies, organizing them separately for better context engineering.

---

## 🏗️ **Workspace Views**

### **Memory Search**
- Cross-surface memory retrieval
- Unified search across all data
- Tag-based relevance scoring

### **Journal**
- Long-form reflections
- Stats dashboard (total, this week, this month)
- Search & filter (text, tags, grade)
- Manual entity extraction fallback
- Sylvia suggestions panel
- Enhanced entry cards with date formatting

### **Agenda**
- Autonomous & semi-autonomous workflow builder
- Deliverables system (guardrails, success criteria)
- Task management (todo → in-progress → done)
- Session management (manual/semi-auto/auto)
- Task sequencing and progress tracking
- Post-mortem system with grading
- XP integration

### **Calendar**
- Rich event details (location, meeting links, participants)
- Event types, tags, colors
- Recurrence and reminders
- Month grid view
- Upcoming events sidebar
- Stats dashboard

### **Pomodoro**
- Functional timer with circular UI
- Session tracking and stats
- Browser notifications
- XP rewards

### **Polaris**
- Small goals vs Big goals
- Context-aware task generation (10-12 tasks per goal)
- Granular feedback system (5-point ratings + learning data)
- Task attributes (effort, impact, rationale)
- Learning loop for continuous improvement
- Stats dashboard

### **Progress (Gamification)**
- 22 unique levels with names and descriptions
- Level-up notifications
- Achievements system
- Comprehensive stats dashboard
- XP breakdown by category
- Recent activity feed

### **Brand**
- Category-based organization (Voice, Visual, Positioning, etc.)
- Visual card layout
- Search & filter
- Stats dashboard
- Rich editing with markdown

### **People**
- Comprehensive profiling (contact info, attributes, connections)
- Connection system (people → people relationships)
- Relationship strength and notes
- Tags and custom attributes
- Stats dashboard (total, connections, decision makers)
- Search & filter (attributes, tags)
- Full-page detail views with complete information
- Context awareness (Sylvia knows when you're viewing a person)

### **Concepts**
- Separate section for ideas, technologies, applications
- Automatic distinction from People
- Rich profiles (name, description, category, tags, notes)
- Category system (AI Application, Technology, Framework, etc.)
- Search & filter (name, category, tags)
- Stats dashboard (total, by category, popular tags)
- Full-page detail views
- Migration tool for cleanup

### **Settings**
- API key management (primary, secondary, audit)
- Model selection
- Weighted prompt system (multiple prompts with percentage weights)
- **Preflection toggle**: Enable/disable dynamic instruction generation
- Audit agent configuration (currently disabled)
- Clear all data (Danger Zone)
- All settings stored in IndexedDB

---

## 🎨 **UI/UX Design**

### **Glass Morphism Aesthetic**
- Frosted glass panels throughout
- Subtle borders and shadows
- Modern, clean design
- Consistent visual language

### **Lucide Icons**
- Professional icon system (no emojis)
- Consistent iconography across all pages
- Beautiful, classy visual design

### **Invisible Scrollbars**
- Middle content areas use invisible scrollbars
- Scroll works, but no visual clutter
- Cross-browser support (Firefox + Chrome/Safari)

### **No Modals**
- Full-page views for everything
- Entity detail pages (not modals)
- Settings in dedicated view
- Clean, distraction-free interface

### **Resizable Chat Panel**
- Custom left-side resize handle
- Smooth dragging experience
- Minimum width: 320px
- Maximum width: 800px
- Visual feedback on hover/active drag

### **Stats Dashboards**
- Every major page has a stats dashboard
- Visual cards with gradients
- Quick overview of key metrics

### **Search & Filter**
- Consistent search bars across pages
- Filter buttons for quick filtering
- Clear filters functionality

---

## 🔥 **What Makes This Special**

1. **"Sylvia Owns" Philosophy**: Zero manual entry—everything flows through conversation
2. **Post-Processing Architecture**: AI analyzes and organizes after the fact, not during
3. **Preflection System**: Meta-cognitive AI that reasons about how to reason—dynamically optimizes instructions and parameters
4. **Autonomous Workflows**: Configure agents to work independently or guide you through sessions
5. **Granular Learning**: Polaris feedback system captures every angle of task quality
6. **Context Engineering**: Weighted prompts + Preflection + active entity awareness = true context intelligence
7. **Transparent Operation**: Glass box mode shows every action with rating system
8. **Automatic Extraction**: Pattern recognition + context analysis = zero effort organization
9. **Relationship Intelligence**: People connections create a network graph
10. **Self-Improving Goals**: Polaris learns from every task outcome
11. **Multi-Modality**: Image generation, web search, audio/video understanding in one interface
12. **Context Awareness**: Sylvia knows what you're viewing/working on at all times
13. **Full-Page Detail Views**: No truncation, no modals—every entity gets a full page
14. **Gamification**: Makes productivity fun with levels, achievements, and XP

---

## 🚀 **Use Cases**

- **Knowledge Workers**: Automatic organization of meetings, contacts, tasks
- **Consultants**: Client relationship tracking through conversation
- **Entrepreneurs**: Brand voice and positioning captured automatically
- **Researchers**: Journal entries with automatic entity extraction
- **Project Managers**: Deliverables and agenda items from natural conversation
- **Goal Achievers**: High-impact, low-effort task generation for strategic goals
- **Autonomous Workers**: Set up workflows for AI agents to execute independently

---

## 💡 **The Vision**

Sylvia represents a new paradigm: **AI as background infrastructure** rather than a tool you interact with. You don't "use" Sylvia—you talk naturally, and she handles the organization invisibly. It's context engineering meets post-processing meets self-healing systems meets autonomous workflows.

**This isn't just a chat interface. It's a context-aware workspace that organizes itself, learns from feedback, and can work autonomously.**

---

## 📊 **Technical Architecture**

### **Storage**
- **IndexedDB**: All data stored locally in browser
- **No backend required**: Fully client-side
- **Persistent**: Survives browser restarts
- **Private**: Your data never leaves your machine

### **AI Integration**
- **OpenRouter API**: BYO key, supports any model
- **Multi-model support**: Primary + backup models
- **Free audit model**: Uses `openrouter/polaris-alpha` for background tasks (currently disabled)
- **Weighted prompts**: Dynamic context engineering
- **Preflection**: Dynamic instruction generation + parameter optimization
- **Multi-modality**: Image generation, web search, audio/video understanding
- **Context awareness**: Active entity injection into all API calls

### **Post-Processing Pipeline**
1. User sends message
2. AI responds
3. Post-processor extracts ACTION markers
4. Pattern matching for implicit entities
5. Automatic categorization
6. Manual extraction fallback available

### **Action System**
- **Action Registry**: Centralized action system
- **ACTION Markers**: `[ACTION:actionId|payload1|payload2|...]`
- **Automatic Execution**: Actions execute automatically from post-processing
- **Glass Box Logging**: All actions logged for visibility

---

## 📈 **Stats**

- **10 Workspace Views**: Memory, Journal, Agenda, Calendar, Pomodoro, Polaris, Progress, Brand, People, Concepts
- **9+ Entity Types**: Auto-extracted and categorized (People, Concepts, Brand, Calendar, Journal, Agenda, Goals, Tasks, Deliverables)
- **3 API Keys**: Primary, secondary, and audit (free model)
- **Unlimited Prompts**: Weighted system with 100% validation
- **Preflection Phases**: 3 phases (Dynamic Instructions, Parameter Optimization, Advanced Context Analysis)
- **Real-time Actions**: Glass box shows everything
- **Persistent Ratings**: Ready for RL training
- **Zero Manual Entry**: Everything through conversation
- **22 Levels**: Unique level names and descriptions
- **Autonomous Modes**: Manual, Semi-Auto, Auto workflows
- **Granular Feedback**: 5-point rating system for tasks
- **Multi-Modality**: 3 modes (Image Generation, Web Search, Audio/Video)
- **Context Awareness**: 9 entity types tracked
- **Full-Page Views**: All entities get dedicated detail pages

---

*Built with React, TypeScript, IndexedDB, and OpenRouter API. Fully client-side. Your data stays yours.*
