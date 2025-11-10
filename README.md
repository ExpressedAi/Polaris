<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Chat Platform Template

Northstar for Sylvia — a production-ready chat surface tuned for OpenRouter, Polaris Alpha, and brutalist context engineering. Threads, artifacts, and preferences live fully in the browser so every piece of intel stays local.

## Features

- ✅ **OpenRouter Native** - BYO OpenRouter key with Polaris Alpha (256k context, 128k max output) as the default stack
- ✅ **Workspace Views** - Dedicated Brand, Clients, People, Journal, Agenda, Calendar, Pomodoro, and Progress pages
- ✅ **Thread Management** - Create, switch, and delete conversation threads
- ✅ **IndexedDB Storage** - Persistent browser storage for threads, messages, settings, and workspace data
- ✅ **JIT Memory Capture** - Every message is chunked, tagged, and scored for later recall
- ✅ **Write-Anywhere Surfaces** - Register any editor so Sylvia can drop content via slash/right-click flows
- ✅ **Full-Page Control Room** - No modals; configure everything from the Settings view
- ✅ **Artifact Window** - Edit and save artifacts per thread with live Markdown preview
- ✅ **Gamified Progression** - Earn XP for meaningful actions and level up with Sylvia

## Run Locally

**Prerequisites:** Node.js 18+ and npm

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the app:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:3000`
4. Head to **Settings → Northstar Control Room** and paste your OpenRouter API key (stored locally in IndexedDB).

## Configuration

### Models

- **Main Model**: `openrouter/polaris-alpha` (default, 256k context / 128k output tokens)
- **Backup Model**: `x-ai/grok-4-fast` (auto fallback if the primary call fails)

Both can be updated live from the Settings view without touching environment variables.

### Storage

All data is stored locally in your browser using IndexedDB:
- Threads, messages, and artifact content
- JIT memory snippets with tags + relevance
- Journal entries, agenda items, calendar events, pomodoro sessions
- Brand, client, and people records
- User settings and OpenRouter preferences

### JIT Memory Northstar

Every utterance now writes a snippet containing tags, relevance, and timestamps. Retrieval currently relies on deterministic tag overlap scoring, and upcoming work will add advanced ranking plus pre-reasoning injection. The Control Room + workspace views are structured so future JIT pipelines can drop context directly into the correct destination.

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.
