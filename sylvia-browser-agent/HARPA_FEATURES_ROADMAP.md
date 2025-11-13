# Harpa AI Feature Parity Roadmap

## ✅ Current State (What We Have)

### Extension Architecture
- ✅ Chrome Manifest V3 extension with side panel
- ✅ **Standalone mode - NO BACKEND REQUIRED!**
- ✅ ChatGPT Pro web interface integration (uses your subscription)
- ✅ Chrome storage (chrome.storage.local) for persistence
- ✅ Chrome alarms API for scheduling
- ✅ Glassmorphism UI design

### Basic Features
- ✅ Chat with AI about current page
- ✅ Summarize page
- ✅ Extract tasks from page
- ✅ Capture concepts from page
- ✅ Text selection quick actions (HARPA-style floating button)
- ✅ Context menu integration ("Ask Sylvia about...")
- ✅ Keyboard shortcut (Ctrl+Shift+Y)

### Automation Features
- ✅ Create scheduled automations
- ✅ Automation result history
- ✅ Custom commands with templates
- ✅ Command editor UI
- ✅ Basic parameter substitution ({{page.title}}, {{page.url}}, {{page.text}})

### Integrations
- ✅ Polaris integration (Send to Polaris buttons)
- ✅ Vision capture placeholder

---

## 🎯 Harpa Feature Parity (What We Need)

### 1. Rich Parameter System
**Priority: HIGH** | **Effort: Medium**

Harpa supports extensive parameter interpolation. We need:

#### Page Parameters
- ✅ `{{page}}` - Web page text content (we have this)
- ✅ `{{title}}` - Web page title (we have this)
- ✅ `{{url}}` - Web page URL (we have this)
- ⬜ `{{page url}}` - Retrieve content from specified URL
- ⬜ `{{page query}}` - Semantic search within page content
- ⬜ `{{page limit=500}}` - Token/percentage limits
- ⬜ `{{selection}}` - Selected text (we have in quick actions, need in commands)
- ⬜ `{{desc}}` - Web page meta description
- ⬜ `{{domain}}` - Web page domain
- ⬜ `{{language}}` - User's preferred language

#### Media Parameters
- ⬜ `{{transcript}}` - YouTube video transcript with timestamps
- ⬜ `{{transcriptPlain}}` - YouTube transcript without timestamps
- ⬜ `{{view}}` - Screenshot of opened page (vision)

#### Context Parameters
- ⬜ `{{email}}` - Parse email content (Gmail, Outlook, Protonmail, Fastmail)
- ⬜ `{{thread}}` - Parse messages/comments (WhatsApp, Telegram, Discord, Reddit, Facebook, YouTube, X)
- ⬜ `{{message x}}` - Reference previous chat messages
- ⬜ `{{serp term}}` - Web search results (top 10 links)
- ⬜ `{{gpt}}` - Last GPT response (for chaining)
- ⬜ `{{cost}}` / `{{cost last}}` - Token cost tracking

#### Extraction Parameters
- ⬜ `{{grab}}` - Extract HTML element values
  - CSS selectors: `{{grab h1}}`
  - XPath: `{{grab //h1}}`
  - Text: `{{grab "Bring AI to your browser"}}`
  - Attributes: `{{grab h1 take=innerText}}`
  - Positioning: `{{grab a take=href at=first}}`

#### Global Parameters
- ⬜ `{{g.param}}` - Global parameters across commands
- ⬜ Dot notation: `{{users.0.name.toUpperCase}}`
- ⬜ Escape interpolation: `{{\p1}}`

**Implementation:**
- Create parameter resolution engine
- Add parameter tester (Alt+Enter to echo)
- Add semantic search for `{{page query}}`
- Add YouTube transcript extraction
- Add email/thread parsers for popular platforms

---

### 2. Visual Command Editor
**Priority: HIGH** | **Effort: High**

Harpa has a full visual workflow builder. We need:

- ⬜ Drag-and-drop step builder
- ⬜ "ADD STEP" button with step type picker
- ⬜ Step reordering
- ⬜ Step duplication
- ⬜ Label assignment for steps
- ⬜ Condition editor for steps
- ⬜ Silent mode toggle for steps
- ⬜ Visual step indicators (icons, colors)
- ⬜ "EDIT STEPS" button for GROUP/LOOP drill-down
- ⬜ Real-time YAML preview
- ⬜ Import/export ChatML YAML
- ⬜ Command marketplace/sharing

**Implementation:**
- Build step library UI component
- Create step configuration panels
- Add YAML parser/serializer
- Create visual workflow canvas

---

### 3. Automation Steps
**Priority: HIGH** | **Effort: High**

#### Basic Steps (✅ Partial, ⬜ Complete)
- ✅ **SAY** - Print message to chat (we have via UI, need in commands)
- ✅ **ASK** - Ask user for parameter value (we have via prompts, need in commands)
- ✅ **GPT** - Send prompt to AI (we have via ChatGPT client)
- ⬜ **ASK with options** - Multiple choice dialogs
- ⬜ **ASK with default** - Default fallback values

#### Navigation Steps
- ⬜ **NAVIGATE** - Navigate to URL
  - Support parameter interpolation in URLs
  - Support relative paths
  - Support page reload (empty URL)
  - `waitForIdle` option

#### Waiting Steps
- ⬜ **WAIT** - Multiple wait modes:
  - `for: idle` - Wait for page to stop updating
  - `for: custom-delay` - Fixed delay in ms
  - `for: random-delay` - Random delay between min/max
  - `for: text-to-appear` - Wait for text on page
  - `for: text-to-disappear` - Wait for text to disappear
  - `for: element-to-appear` - Wait for element (with AI selectors)
  - `for: element-to-disappear` - Wait for element to disappear
  - `for: js-function` - Wait for JS function to return true
  - Timeout support

#### Interaction Steps
- ⬜ **CLICK** - Click page elements
  - AI element selectors
  - "Grab" button to select elements
  - `onFailure: skip` option
  - `waitForIdle` option
- ⬜ **PASTE** - Insert text into inputs
  - Auto-detect largest input
  - Manual target selection
  - `close: false` option
- ⬜ **SCROLL** - Scroll page (via RUN JS initially)
  - Scroll one viewport
  - Scroll to top/bottom
  - Scroll to specific position

#### Data Steps
- ⬜ **EXTRACT** - Extract data from page elements
  - AI element selectors
  - "Grab" button
  - Store in parameter
  - Default value fallback
- ⬜ **REQUEST** - HTTP requests
  - GET/POST methods
  - Headers customization
  - Body parameter interpolation
  - Auth support (username/password)
  - Response stored in `{{response}}`
  - Webhook integration (Zapier, Make.com, Discord, Telegram)

#### Scripting Steps
- ⬜ **RUN JS** - Execute JavaScript in page context
  - Access parameters via `args` object
  - `$harpa` API access:
    - `$harpa.page.click` - Click elements
    - `$harpa.page.scroll` - Scroll page
    - `$harpa.page.parse` - Parse data
    - `$harpa.page.query` - Query elements
    - `$harpa.page.fetch` - HTTP requests
    - `$harpa.page.idle` - Wait for idle
    - `$harpa.inspector.*` - Inspect nodes
  - Async/await support
  - 15 second timeout
  - Store result in parameter

#### Control Flow Steps
- ⬜ **GROUP** - Combine steps together
  - Conditional execution
  - Label support
  - Nested groups
- ⬜ **LOOP** - Iterate over arrays
  - Default `{{list}}` parameter
  - Access items via `{{item}}`
  - Dot notation for properties
  - "EDIT STEPS" drill-down
  - Loop over URLs, data, contacts, etc.
- ⬜ **JUMP** - Goto labeled step
  - Label resolution
  - Conditional jumps
  - Warning for infinite loops
- ⬜ **COMMAND** - Call other commands
  - Pass inputs
  - Null for user prompt
  - Build higher-order commands
- ⬜ **CALC** - Set/modify parameters
  - Arithmetic operations
  - String manipulation (regex)
  - List merging
  - Data extraction
- ⬜ **STOP** - Exit current group/command
- ⬜ **CLEAR** - Erase chat history

**Implementation:**
- Create step execution engine
- Implement each step type
- Add AI element selector system
- Build $harpa API
- Add condition evaluation

---

### 4. AI Element Selectors
**Priority: MEDIUM** | **Effort: High**

Harpa uses AI-powered element selection. We need:

- ⬜ Visual "Grab" button to select elements
- ⬜ Multi-criteria matching:
  - `$tag` - HTML tag name
  - `$role` - ARIA role
  - `$class` - CSS classes
  - `$id` - Element ID
  - `$attribute` - Element attributes
  - `$style` - Font/style properties
  - `$content` - Text content
  - `$text` - Text matching
  - `$anchor` - Anchor positioning
  - `$matches` - Combined criteria
  - `$size` - Result set size
- ⬜ Traversal support (`traverse: '0:1:0'`)
- ⬜ Shift positioning (`shift: '17:36'`)
- ⬜ Score-based matching (`min: 9`)
- ⬜ Element highlighting during selection
- ⬜ Selector robustness (multiple fallbacks)

**Implementation:**
- Build visual element picker
- Create element scoring algorithm
- Add traversal path calculation
- Generate multi-criteria selectors

---

### 5. ChatML YAML Format
**Priority: MEDIUM** | **Effort: Medium**

Harpa uses ChatML YAML for command serialization. We need:

- ⬜ Full ChatML parser
- ⬜ Command metadata (`meta` section)
  - `title`, `description`, `category`, `name`
- ⬜ Steps array (`steps` section)
- ⬜ Version tracking
- ⬜ Short syntax support (e.g., `- say: Hello`)
- ⬜ Full syntax support (e.g., `- type: say\n  message: Hello`)
- ⬜ Import/export UI
- ⬜ Command validation
- ⬜ Error reporting

**Implementation:**
- Add YAML parser library
- Create ChatML schema validator
- Build import/export UI
- Add command migration system

---

### 6. Advanced Features
**Priority: LOW** | **Effort: Varies**

#### Conditions
- ⬜ Step-level conditions (`condition: '{{change}} = refine'`)
- ⬜ Group-level conditions
- ⬜ Comparison operators (=, !=, <, >, etc.)
- ⬜ Logical operators (AND, OR, NOT)

#### Command Marketplace
- ⬜ Browse community commands
- ⬜ One-click install
- ⬜ Command ratings/reviews
- ⬜ Share custom commands

#### Multi-Model Support
- ✅ ChatGPT (web interface)
- ⬜ OpenAI API (with key)
- ⬜ Gemini (web + API)
- ⬜ Claude (web + API)
- ⬜ OpenRouter (API)
- ⬜ Model switcher per command

#### Advanced Automation
- ⬜ Cron expressions for scheduling
- ⬜ Multi-page workflows (navigate between pages)
- ⬜ Data pipelines (EXTRACT → LOOP → REQUEST)
- ⬜ Error handling strategies
- ⬜ Retry logic
- ⬜ Rate limiting

---

## 📋 Implementation Phases

### Phase 1: Rich Parameters (2-3 weeks)
1. Implement parameter resolution engine
2. Add basic parameters (selection, domain, desc)
3. Add YouTube transcript extraction
4. Add semantic page search
5. Add global parameters (g. prefix)
6. Add dot notation support

### Phase 2: Visual Command Editor (3-4 weeks)
1. Design step library UI
2. Build drag-and-drop canvas
3. Create step configuration panels
4. Add YAML import/export
5. Add real-time preview

### Phase 3: Core Automation Steps (4-5 weeks)
1. Implement SAY, ASK, GPT steps
2. Add NAVIGATE step
3. Add WAIT step (all modes)
4. Add CLICK step (basic element selection)
5. Add PASTE step
6. Add EXTRACT step
7. Add REQUEST step (webhooks)

### Phase 4: AI Element Selectors (2-3 weeks)
1. Build visual element picker
2. Implement scoring algorithm
3. Add multi-criteria matching
4. Add traversal support
5. Add robustness features

### Phase 5: Advanced Steps (3-4 weeks)
1. Add RUN JS step with $harpa API
2. Add COMMAND step
3. Add GROUP step
4. Add LOOP step
5. Add JUMP step
6. Add CALC step

### Phase 6: Polish & Testing (2-3 weeks)
1. Add comprehensive error handling
2. Build test suite
3. Performance optimization
4. Documentation
5. User onboarding flow

---

## 🎯 Quick Wins (Can implement now)

1. **{{selection}} parameter** - Already have selection in quick actions, just need to pass to commands
2. **{{domain}} parameter** - Extract from {{url}}
3. **{{desc}} parameter** - Parse meta description tag
4. **SAY step** - Add to command executor
5. **ASK step** - Use browser prompt()
6. **Global parameters** - Store in chrome.storage with g. prefix

---

## 📊 Estimated Total Effort

- **Rich Parameters**: 2-3 weeks
- **Visual Editor**: 3-4 weeks
- **Core Steps**: 4-5 weeks
- **AI Selectors**: 2-3 weeks
- **Advanced Steps**: 3-4 weeks
- **Polish**: 2-3 weeks

**Total: 16-22 weeks (4-5.5 months)** for full Harpa feature parity

---

## 🚀 Recommended Approach

Start with **Phase 1 (Rich Parameters)** to unlock immediate value:
- Quick wins can be done in 1-2 days
- Core parameters in 1-2 weeks
- Provides foundation for all other features

Then tackle **Phase 3 (Core Automation Steps)** to enable basic workflows without needing the full visual editor yet.

The visual editor (Phase 2) can be built in parallel or deferred until the command execution engine is solid.

---

## 📝 Notes

- Harpa has been in development for years with a large team
- We should prioritize the 20% of features that provide 80% of value
- Can release incrementally rather than waiting for full parity
- Focus on making existing features rock-solid first
- Consider building Harpa-compatible command import (ChatML format)
