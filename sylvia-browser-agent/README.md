# Sylvia Sidecar 🚀

**A Chrome Extension side panel powered by OpenAI that brings Polaris-style AI intelligence to every webpage.**

Sylvia Sidecar lets you:
- 📄 **Summarize** any webpage with punchy bullets
- ✅ **Generate tasks** from page content aligned with your goals
- 💡 **Capture concepts** worth remembering
- 💬 **Chat** with Sylvia about the current page
- ⚡ **Automate** recurring page analysis with scheduling

Built with glassmorphism UI, powered by OpenAI API, and designed to integrate seamlessly with your existing Polaris workflow.

---

## 🏗️ Architecture

This is a monorepo containing:

- **`packages/core`** - Sylvia brain (TypeScript library)
  - Models, LLM client, command system, template engine
- **`apps/backend`** - Express API server
  - Wraps `@sylvia/core`, handles OpenAI API calls
  - Automation & scheduling engine
- **`apps/extension`** - Chrome Extension (Manifest V3)
  - Side panel UI with glassmorphism design
  - Content script for page context extraction

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- Chrome or Chromium-based browser

### 1. Clone & Install

```bash
cd sylvia-browser-agent
npm install
```

### 2. Configure Backend

```bash
cd apps/backend
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### 3. Build Core Package

```bash
npm run build:core
```

### 4. Start Backend Server

```bash
npm run dev:backend
```

The server will start on `http://localhost:4000`.

### 5. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `apps/extension` directory
5. Click the Sylvia Sidecar extension icon to open the side panel

---

## 📖 Usage

### Side Panel Views

The side panel has two tabs:

#### Chat View
- **✨ Summarize** - Get a concise, actionable summary of the current page
- **✓ Tasks** - Generate Polaris-style tasks from page content
- **💡 Concept** - Extract one key concept worth remembering
- **Chat input** - Ask Sylvia custom questions about the page

#### Automations View
- **View automations** - See all your scheduled automations
- **Create automation** - Set up recurring page analysis
  - Name your automation
  - Choose a command (Summarize, Tasks, Concept)
  - Set interval in minutes
  - Target URL (defaults to current page)
- **Toggle enabled/disabled** - Pause automations without deleting
- **View status** - See when automations last ran and if they succeeded
- **Delete automations** - Remove automations you no longer need

### Commands

The system uses a **command architecture** (HARPA-style) with template rendering:

Each command has:
- **System prompt** - Sylvia's persona and instructions
- **User template** - With `{{page.url}}`, `{{page.content}}`, `{{goal}}` variables
- **Parameters** - Required inputs like `page`, `goal`, `selection`

See `packages/core/src/defaultCommands.ts` for built-in commands.

### Automations (Advanced)

You can schedule commands to run automatically:

```bash
# Via API
curl -X POST http://localhost:4000/api/automations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily summary",
    "commandSlug": "summarize-page",
    "targetUrl": "https://news.ycombinator.com",
    "trigger": { "type": "interval", "minutes": 1440 },
    "enabled": true
  }'
```

The scheduler runs in the backend and executes automations based on their triggers.

---

## 🧠 Integration with Polaris

This extension is designed to complement your existing Polaris app:

### Shared Models

The `SylviaTask`, `SylviaGoal`, and `Concept` models in `packages/core/src/models.ts` align with Polaris types.

### Task Import

When you generate tasks in the side panel, you can POST them to your Polaris backend:

```typescript
// In your Polaris app
import { SylviaTask } from '@sylvia/core';

async function importTasksFromSidecar(tasks: SylviaTask[]) {
  // Save to your Polaris task store
  await saveTasks(tasks);
}
```

### Concept Storage

Similarly, captured concepts can flow into your Concepts store.

---

## 🛠️ Development

### Project Structure

```
sylvia-browser-agent/
├── packages/
│   └── core/              # Sylvia brain (TS library)
│       ├── src/
│       │   ├── models.ts           # Data models
│       │   ├── llmClient.ts        # OpenAI API wrapper
│       │   ├── commandSchema.ts    # Command type definitions
│       │   ├── commandRunner.ts    # Command executor
│       │   ├── defaultCommands.ts  # Built-in commands
│       │   ├── commands.ts         # Helper functions
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── apps/
│   ├── backend/           # Express API
│   │   ├── src/
│   │   │   ├── server.ts           # Main server + endpoints
│   │   │   ├── automations.ts      # Automation model
│   │   │   ├── scheduler.ts        # Scheduling engine
│   │   │   ├── commandApi.ts       # Command helpers
│   │   │   └── pageFetcher.ts      # Headless page fetcher
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── extension/         # Chrome Extension
│       ├── manifest.json           # MV3 manifest
│       ├── background.js           # Service worker
│       ├── contentScript.js        # Page context extractor
│       ├── panel.html              # Side panel UI
│       ├── panel.css               # Glassmorphism styles
│       └── panel.js                # Panel logic
├── package.json           # Root workspace config
├── .gitignore
└── README.md
```

### Available Scripts

From the root:

```bash
# Install all dependencies
npm install

# Build core package
npm run build:core

# Run backend in dev mode (with hot reload)
npm run dev:backend

# Build everything
npm run build
```

### Adding Custom Commands

1. Define your command in `packages/core/src/defaultCommands.ts`:

```typescript
{
  id: "my-command",
  name: "My Custom Command",
  slug: "my-command",
  kind: "chat",
  params: [
    { name: "page", label: "Page", type: "page", required: true }
  ],
  systemPrompt: "You are Sylvia...",
  userTemplate: `Do something with {{page.url}}...`
}
```

2. Rebuild core: `npm run build:core`
3. Restart backend
4. Call via API: `POST /api/commands/my-command/run`

---

## 🎨 Design Philosophy

### Glassmorphism

The side panel uses a glassmorphism design:
- Translucent backgrounds with backdrop blur
- Soft borders and subtle shadows
- High-contrast text on dark background
- Smooth animations and hover states

### Sylvia's Voice

Sylvia is:
- **High-energy** - Direct, fast, no fluff
- **Sharp** - Gets to the point with TL;DR + bullets
- **Action-oriented** - Focuses on what's actionable
- **Jake-focused** - Talks to the user (Jake) directly

---

## 🔒 Security & Privacy

- **No ChatGPT web scraping** - Uses official OpenAI API only
- **Page content stays local** - Only sent to your backend (localhost)
- **API key stored server-side** - Never exposed to extension
- **No telemetry** - All data stays in your environment

---

## 🚧 Roadmap

### MVP ✅
- [x] Chrome MV3 extension with side panel
- [x] Page context extraction (url, title, content, selection)
- [x] Core commands (summarize, tasks, concept, chat)
- [x] Backend API with OpenAI integration
- [x] Automations & scheduling
- [x] Glassmorphism UI

### Phase 2 🔨
- [ ] React-ify the side panel UI
- [ ] Import Polaris components (TaskCard, GoalHeader, etc.)
- [ ] Element grabber (`{{grab h1}}` style)
- [ ] Vision support (screenshot → OpenAI vision models)
- [ ] Command library UI (browse & run custom commands)
- [ ] Automation dashboard in panel
- [ ] Cloud sync for commands & automations

### Phase 3 🌟
- [ ] Multi-page GRID automations
- [ ] Webhook integrations (Zapier, Make.com)
- [ ] Team spaces & command sharing
- [ ] Journal / event log with filtering
- [ ] Hotkey shortcuts (Alt+A to invoke)
- [ ] Context menu integration

---

## 📚 API Reference

### Backend Endpoints

#### `GET /health`
Health check.

**Response:**
```json
{ "ok": true, "service": "sylvia-backend" }
```

---

#### `POST /api/chat`
General chat with Sylvia.

**Body:**
```typescript
{
  message: string;
  page?: PageContext;
  goal?: SylviaGoal;
  history?: LlmMessage[];
}
```

**Response:**
```json
{ "ok": true, "reply": "..." }
```

---

#### `POST /api/page/summary`
Summarize a page.

**Body:**
```typescript
{ page: PageContext }
```

**Response:**
```json
{ "ok": true, "summary": "..." }
```

---

#### `POST /api/page/tasks`
Generate tasks from a page.

**Body:**
```typescript
{
  goal: SylviaGoal;
  page: PageContext;
}
```

**Response:**
```json
{ "ok": true, "tasks": SylviaTask[] }
```

---

#### `POST /api/page/concept`
Extract a concept from a page.

**Body:**
```typescript
{ page: PageContext }
```

**Response:**
```json
{ "ok": true, "concept": Concept }
```

---

#### `GET /api/commands`
List all available commands.

**Response:**
```json
{ "ok": true, "commands": SylviaCommand[] }
```

---

#### `POST /api/commands/:slug/run`
Run a command by slug.

**Body:**
```typescript
{ values: Record<string, any> }
```

**Response:**
```json
{ "ok": true, "result": "..." }
```

---

#### `GET /api/automations`
List all automations.

---

#### `POST /api/automations`
Create or update an automation.

**Body:**
```typescript
{
  id?: string;
  name: string;
  commandSlug: string;
  targetUrl: string;
  trigger: AutomationTrigger;
  enabled: boolean;
}
```

---

#### `DELETE /api/automations/:id`
Delete an automation.

---

## 🤝 Contributing

This is a personal project built for Jake's workflow, but contributions are welcome:

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a PR with a clear description

---

## 📄 License

MIT License - see LICENSE file for details.

---

## 🙏 Acknowledgments

- Inspired by **HARPA** browser extension architecture
- Built with **OpenAI GPT-4o** and GPT-4o-mini
- Designed to complement the **Polaris** goal management system

---

**Built with 🔥 by Jake. Powered by Sylvia. Let's ship it.**
