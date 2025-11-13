# 🚀 START HERE - Sylvia Sidecar

**You asked for a Chrome extension that uses your OpenAI account to interact with webpages. You got it.**

This is your complete HARPA-style browser AI system, built from scratch, ready to use.

---

## ⚡ Get Running in 3 Minutes

### 1. Install Dependencies

```bash
cd /home/user/Polaris/sylvia-browser-agent
npm install
```

### 2. Build the Core

```bash
npm run build:core
```

### 3. Add Your OpenAI Key

```bash
cd apps/backend
cp .env.example .env
nano .env  # Add your OpenAI API key
```

Your `.env` should look like:
```
OPENAI_API_KEY=sk-proj-your-actual-key-here
PORT=4000
```

### 4. Start the Backend

```bash
npm run dev
```

**Keep this running!** You should see:
```
Sylvia backend listening on http://localhost:4000
Scheduler started - checking automations every 60 seconds
```

### 5. Load Extension in Chrome

1. Open Chrome
2. Go to `chrome://extensions/`
3. Toggle **Developer mode** ON (top right)
4. Click **Load unpacked**
5. Select: `/home/user/Polaris/sylvia-browser-agent/apps/extension`

### 6. Try It!

1. Click the Sylvia Sidecar icon in Chrome toolbar
2. Navigate to any website (e.g., https://news.ycombinator.com)
3. Click **✨ Summarize** in the side panel
4. Watch Sylvia analyze the page!

---

## 🎯 What You Can Do

### In the Side Panel

- **✨ Summarize** - Get 5-8 punchy bullets about the page
- **✓ Tasks** - Generate Polaris-style tasks with effort/impact
- **💡 Concept** - Extract one key idea to remember
- **Chat** - Ask Sylvia custom questions about the page

### Via API

Test endpoints directly:

```bash
# Health check
curl http://localhost:4000/health

# Summarize
curl -X POST http://localhost:4000/api/page/summary \
  -H "Content-Type: application/json" \
  -d '{"page":{"url":"https://example.com","title":"Test","content":"This is a test page."}}'

# List commands
curl http://localhost:4000/api/commands
```

---

## 📚 Documentation Files

- **[QUICKSTART.md](QUICKSTART.md)** - 5-minute setup (expanded version)
- **[README.md](README.md)** - Full documentation (features, API, architecture)
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - What was built, how it works
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide

Pick your learning style:
- **Just want it working?** Follow the 3-minute guide above
- **Want to understand it?** Read PROJECT_SUMMARY.md
- **Want full details?** Read README.md
- **Want to deploy it?** Read DEPLOYMENT.md

---

## 🔧 Project Structure

```
sylvia-browser-agent/
├── packages/core/          # Sylvia's AI brain (TypeScript library)
├── apps/backend/           # API server (Express + OpenAI)
├── apps/extension/         # Chrome extension (side panel)
└── docs/                   # You're reading them!
```

**Key files to know:**
- `packages/core/src/defaultCommands.ts` - Add/edit AI commands
- `apps/backend/src/server.ts` - API endpoints
- `apps/extension/panel.js` - Side panel logic
- `apps/backend/.env` - Your OpenAI key

---

## 🎨 Customizing Sylvia

### Change Her Voice

Edit `packages/core/src/commands.ts`:

```typescript
const SYSTEM_PROMPT = `
You are Sylvia — [your personality here]
`;
```

### Add New Commands

Edit `packages/core/src/defaultCommands.ts`:

```typescript
{
  id: "my-command",
  name: "My Custom Command",
  slug: "my-command",
  // ... (see file for examples)
}
```

Then: `npm run build:core` and restart backend.

### Style the Panel

Edit `apps/extension/panel.css` - change colors, fonts, layout.

---

## 🔗 Integration with Polaris

The models (`SylviaTask`, `SylviaGoal`, `Concept`) are designed to match your Polaris app.

When you generate tasks in the side panel, you can POST them to your Polaris backend:

```typescript
// In your Polaris app
const tasks = await fetch('http://localhost:4000/api/page/tasks', {
  method: 'POST',
  body: JSON.stringify({ goal: currentGoal, page: pageContext })
}).then(r => r.json());

// Save to Polaris
await saveTasksToPolaris(tasks.tasks);
```

Same for concepts and other data.

---

## 🐛 Troubleshooting

**"Backend error" in panel**
→ Make sure backend is running (`npm run dev:backend`)

**"OPENAI_API_KEY is required"**
→ Check `apps/backend/.env` has your key

**"Failed to read page"**
→ Content script only works on normal webpages (not chrome:// pages)

**Extension won't load**
→ Make sure you selected `apps/extension` folder, not the root

**More help:** See [DEPLOYMENT.md](DEPLOYMENT.md) troubleshooting section

---

## 💰 Cost

Using GPT-4o-mini (default):
- Summarize page: ~$0.0005
- Generate tasks: ~$0.001
- Chat message: ~$0.0003

**100 actions/day ≈ $1-2/month**

Upgrade to GPT-4o for smarter responses (10x cost, much better reasoning).

---

## 🚢 What's Next?

**Immediate next steps:**
1. ✅ Get it running (see 3-minute guide above)
2. ✅ Test all 4 commands
3. ✅ Try on different websites
4. ⬜ Create your first custom command
5. ⬜ Set up an automation
6. ⬜ Integrate with Polaris

**Future enhancements (you can build):**
- React-ify the side panel
- Add Polaris UI components
- Vision support (screenshot analysis)
- Automation dashboard
- Command library
- Cloud sync

See PROJECT_SUMMARY.md for the full roadmap.

---

## 💬 What You Got

✅ Complete Chrome extension with side panel
✅ HARPA-style command system
✅ Automation & scheduling engine
✅ Beautiful glassmorphism UI
✅ OpenAI API integration (official, no scraping)
✅ Polaris-compatible models
✅ Full documentation
✅ Production-ready architecture

**All in ~200KB of code. All yours. All working.**

---

## 🎉 Ready?

Run these 4 commands and you're live:

```bash
npm install
npm run build:core
cd apps/backend && cp .env.example .env
# Add your OpenAI key to .env, then:
npm run dev
```

Then load the extension in Chrome and start using it.

**Questions?** Read the docs. They're comprehensive.

**Want to extend it?** The code is clean, well-structured, and commented.

**Need inspiration?** Try summarizing a blog post, generating tasks from a tutorial, or capturing concepts from a research paper.

---

**Now go use your new superpower.** 🔥

Your AI-powered browser is waiting.
