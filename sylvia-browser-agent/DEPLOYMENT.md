# Sylvia Sidecar - Deployment Guide

Complete deployment instructions for getting Sylvia Sidecar running in production or development.

## 📦 What's Been Built

Sylvia Sidecar is a complete HARPA-style Chrome extension system with:

- ✅ **Core AI Engine** (`packages/core`)
  - TypeScript library with models, LLM client, command system
  - Template engine for dynamic prompts with `{{page}}`, `{{goal}}` variables
  - Built-in commands: summarize, tasks, concepts, chat

- ✅ **Backend API** (`apps/backend`)
  - Express server wrapping the core engine
  - OpenAI API integration (GPT-4o, GPT-4o-mini)
  - REST endpoints for all commands
  - Automation & scheduling system
  - Headless page fetcher for automations

- ✅ **Chrome Extension** (`apps/extension`)
  - Manifest V3 compliant
  - Side panel UI with glassmorphism design
  - Content script for page context extraction
  - Background service worker for messaging

## 🚀 Quick Deploy (5 minutes)

### 1. Prerequisites

```bash
# Check Node version (need 20+)
node --version

# Get OpenAI API key
# Visit: https://platform.openai.com/api-keys
```

### 2. Install & Build

```bash
cd sylvia-browser-agent

# Install all dependencies
npm install

# Build the core package (required first!)
npm run build:core

# Verify core built correctly
ls packages/core/dist/
# Should see: index.js, models.js, commands.js, etc.
```

### 3. Configure Backend

```bash
cd apps/backend

# Copy the example env file
cp .env.example .env

# Edit .env and add your REAL OpenAI API key
# OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
nano .env  # or use your preferred editor
```

### 4. Start Backend

```bash
# From apps/backend directory
npm run dev

# Or from root:
npm run dev:backend
```

Expected output:
```
Sylvia backend listening on http://localhost:4000
Health check: http://localhost:4000/health
Scheduler started - checking automations every 60 seconds
```

**Keep this terminal running!**

### 5. Test Backend

In a new terminal:

```bash
# Health check
curl http://localhost:4000/health
# → {"ok":true,"service":"sylvia-backend"}

# Test commands list
curl http://localhost:4000/api/commands
# → {"ok":true,"commands":[...]}
```

### 6. Load Extension

1. Open Chrome: `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Navigate to: `sylvia-browser-agent/apps/extension`
5. Click **Select Folder**

The extension should appear in your extensions list.

### 7. Use the Extension

1. Click the Sylvia Sidecar icon in Chrome toolbar
2. Side panel opens on the right
3. Navigate to any webpage (e.g., https://news.ycombinator.com)
4. Click **✨ Summarize** button
5. Watch Sylvia analyze the page!

## 🔧 Development Workflow

### Making Changes to Core

```bash
# Edit files in packages/core/src/

# Rebuild
npm run build:core

# Restart backend to pick up changes
# (If backend is using tsx, it may hot-reload automatically)
```

### Making Changes to Backend

```bash
# Edit files in apps/backend/src/

# If using tsx (dev mode), changes auto-reload
# If using node (production), restart:
npm run dev:backend
```

### Making Changes to Extension

```bash
# Edit files in apps/extension/

# In Chrome:
# 1. Go to chrome://extensions/
# 2. Click the reload icon ⟳ on Sylvia Sidecar card
# 3. Reopen the side panel
```

## 🏗️ Production Build

For production deployment:

```bash
# Build everything
npm run build

# Backend is now in apps/backend/dist/
# Start with:
cd apps/backend
PORT=4000 OPENAI_API_KEY=sk-xxx node dist/server.js
```

For the extension in production:
- Package the `apps/extension` folder as a `.zip`
- Submit to Chrome Web Store (requires developer account)
- Or distribute as unpacked extension internally

## 🔐 Environment Variables

### Backend (`apps/backend/.env`)

```bash
# Required
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Optional
PORT=4000
NODE_ENV=production
```

### Extension

The extension always connects to `http://localhost:4000` by default.

To change this for production:
- Edit `apps/extension/panel.js`
- Change `const API_BASE = "http://localhost:4000";`
- To your production backend URL

## 🧪 Testing

### Manual Testing

```bash
# Test summarize endpoint
curl -X POST http://localhost:4000/api/page/summary \
  -H "Content-Type: application/json" \
  -d '{
    "page": {
      "url": "https://example.com",
      "title": "Example Domain",
      "content": "This domain is for use in illustrative examples in documents."
    }
  }'

# Test task generation
curl -X POST http://localhost:4000/api/page/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "goal": {
      "id": "test-goal",
      "title": "Learn TypeScript",
      "timeboxDays": 30
    },
    "page": {
      "url": "https://www.typescriptlang.org/docs/",
      "title": "TypeScript Docs",
      "content": "TypeScript is a typed superset of JavaScript..."
    }
  }'
```

### Automated Testing

To add tests (future):

```bash
# In packages/core
npm install --save-dev jest @types/jest ts-jest

# Add test scripts to package.json
# Write tests in packages/core/src/__tests__/
```

## 📊 Monitoring

### Backend Logs

The backend logs all requests:
- Successful API calls
- Errors (with stack traces)
- Scheduler runs

Watch logs:
```bash
cd apps/backend
npm run dev | tee logs/backend.log
```

### Extension Console

To debug the extension:
1. Open side panel
2. Right-click in the panel → **Inspect**
3. DevTools opens for the side panel context
4. Check Console tab for errors

### Health Check Endpoint

```bash
# Automated health monitoring
curl http://localhost:4000/health

# Expected response (200 OK):
{"ok":true,"service":"sylvia-backend"}
```

## 🚨 Troubleshooting

### "OPENAI_API_KEY is required"

- Check `apps/backend/.env` exists
- Verify the key starts with `sk-`
- Make sure there are no quotes around the key in .env
- Restart the backend after changing .env

### "Backend error 401"

- Your OpenAI API key is invalid or expired
- Check your key at https://platform.openai.com/api-keys
- Verify you have credits available

### "Failed to read page"

- Content script only works on `http://https://` pages
- Won't work on `chrome://` or `about:` pages
- Try a normal website like `https://example.com`

### Extension won't load

- Make sure you selected the `apps/extension` folder, not the root
- Check for errors on `chrome://extensions/` page
- Click "Details" → "Errors" to see console errors

### Side panel is blank

- Check browser console: right-click panel → Inspect
- Verify backend is running: `curl http://localhost:4000/health`
- Check CORS settings in backend (currently allows all origins)

### Automations not running

- Check backend logs for scheduler errors
- Verify automation is enabled: `curl http://localhost:4000/api/automations`
- Make sure target URL is accessible from backend
- Check that `minutes` value in trigger is reasonable

## 🔒 Security Considerations

### For Development

- ✅ Backend runs on localhost only
- ✅ API key stored server-side (not in extension)
- ✅ CORS enabled for localhost

### For Production

If deploying the backend publicly:

1. **Enable HTTPS**
   ```bash
   # Use nginx or Caddy as reverse proxy
   # Get SSL cert from Let's Encrypt
   ```

2. **Restrict CORS**
   ```javascript
   // In apps/backend/src/server.ts
   app.use(cors({
     origin: ['https://yourdomain.com', 'chrome-extension://your-extension-id']
   }));
   ```

3. **Add Authentication**
   ```javascript
   // Add API key or JWT validation
   app.use((req, res, next) => {
     const token = req.headers['authorization'];
     // Validate token...
   });
   ```

4. **Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```

5. **Environment Secrets**
   - Use environment variable manager (Doppler, AWS Secrets Manager)
   - Never commit .env to git

## 📈 Scaling

### Backend Scaling

For high traffic:

```bash
# Use PM2 for process management
npm install -g pm2
pm2 start apps/backend/dist/server.js -i 4  # 4 instances

# Or Docker
cd apps/backend
docker build -t sylvia-backend .
docker run -p 4000:4000 -e OPENAI_API_KEY=sk-xxx sylvia-backend
```

### Database for Automations

Currently automations are in-memory. For persistence:

```typescript
// Replace automations.ts Map with:
// - PostgreSQL (pg)
// - MongoDB (mongoose)
// - SQLite (better-sqlite3)
```

### Caching

To reduce OpenAI API costs:

```bash
npm install redis
```

```typescript
// Cache summaries by URL hash for 1 hour
// Check cache before calling OpenAI
```

## 🎯 Next Steps

Now that everything is deployed:

1. **Customize Commands**
   - Edit `packages/core/src/defaultCommands.ts`
   - Add domain-specific commands

2. **Integrate with Polaris**
   - Import tasks into your Polaris backend
   - Sync concepts to your knowledge base

3. **Create Automations**
   - Set up daily summaries of key pages
   - Monitor competitor sites
   - Track changelog updates

4. **Extend the UI**
   - Add React components from Polaris
   - Build automation dashboard in panel
   - Add visualization for task effort/impact

## 📚 Additional Resources

- [README.md](README.md) - Full project documentation
- [QUICKSTART.md](QUICKSTART.md) - 5-minute setup guide
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/mv3/)

---

**You're all set!** 🎉 Sylvia Sidecar is now running and ready to augment your browsing.
