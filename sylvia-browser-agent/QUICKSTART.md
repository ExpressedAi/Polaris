# Sylvia Sidecar - Quick Start Guide

Get Sylvia Sidecar running in 5 minutes.

## Step 1: Install Dependencies

```bash
cd sylvia-browser-agent
npm install
```

This installs all dependencies for the monorepo (core package, backend, everything).

## Step 2: Configure OpenAI API Key

```bash
cd apps/backend
cp .env.example .env
```

Edit `apps/backend/.env` and add your OpenAI API key:

```
OPENAI_API_KEY=sk-your-actual-key-here
PORT=4000
```

Get an API key at: https://platform.openai.com/api-keys

## Step 3: Build the Core Package

```bash
# From the root of sylvia-browser-agent
npm run build:core
```

This compiles the TypeScript in `packages/core` to JavaScript.

## Step 4: Start the Backend

```bash
npm run dev:backend
```

You should see:
```
Sylvia backend listening on http://localhost:4000
Health check: http://localhost:4000/health
Scheduler started - checking automations every 60 seconds
```

Test it:
```bash
curl http://localhost:4000/health
# Should return: {"ok":true,"service":"sylvia-backend"}
```

**Leave this terminal running!**

## Step 5: Load the Extension in Chrome

1. Open Chrome
2. Navigate to `chrome://extensions/`
3. Toggle **Developer mode** ON (top right corner)
4. Click **Load unpacked**
5. Navigate to and select: `sylvia-browser-agent/apps/extension`
6. You should see "Sylvia Sidecar" appear in your extensions

## Step 6: Open the Side Panel

1. Click the Sylvia Sidecar extension icon in your Chrome toolbar
2. The side panel should open on the right side
3. Navigate to any webpage (try https://news.ycombinator.com)
4. Click **✨ Summarize** in the side panel

You should see Sylvia analyze the page and return a summary!

## Troubleshooting

### "Backend error" in the panel

- Make sure the backend is running (`npm run dev:backend`)
- Check that `http://localhost:4000/health` returns `{"ok":true}`
- Look at the backend terminal for error logs

### "Failed to read page"

- Make sure you're on an actual webpage (not `chrome://` pages)
- The content script needs a real HTML page to extract content from

### "LLM error 401" or API key errors

- Double-check your `apps/backend/.env` file
- Make sure `OPENAI_API_KEY` is set correctly
- Verify your API key is active at https://platform.openai.com/api-keys

### Extension not loading

- Make sure you selected the `apps/extension` folder (not the root)
- Check Chrome's extension page for error messages
- Try clicking "Reload" on the extension card

## Next Steps

Once everything is working:

- Try the **✓ Tasks** button to generate Polaris-style tasks
- Try **💡 Concept** to extract key ideas
- Use the **chat input** to ask custom questions about the page
- Check out the full [README.md](README.md) for automation & advanced features

## Quick Test Commands

```bash
# Test summarize endpoint directly
curl -X POST http://localhost:4000/api/page/summary \
  -H "Content-Type: application/json" \
  -d '{
    "page": {
      "url": "https://example.com",
      "title": "Example",
      "content": "This is a test page about web development best practices."
    }
  }'

# Test chat endpoint
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the key takeaways?",
    "page": {
      "url": "https://example.com",
      "content": "Article about TypeScript benefits..."
    }
  }'
```

## All Set! 🎉

You now have:
- ✅ Sylvia's AI brain running locally
- ✅ A Chrome extension side panel
- ✅ Page-aware AI commands
- ✅ The foundation for automations

Go build something awesome with it!
