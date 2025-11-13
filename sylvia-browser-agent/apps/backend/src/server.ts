import "dotenv/config";
import express from "express";
import cors from "cors";
import {
  summarizePage,
  tasksFromPage,
  conceptFromPage,
  chatWithSylvia,
  SylviaGoal,
  PageContext,
  SylviaChatRequest,
  DEFAULT_COMMANDS
} from "@sylvia/core";
import {
  listAutomations,
  saveAutomation,
  deleteAutomation,
  Automation
} from "./automations";
import { runCommandBySlug } from "./commandApi";
import { startScheduler } from "./scheduler";
import { getLlmConfig, updateLlmConfig } from "./config";
import { getResults, clearResults, getResultById } from "./results";
import {
  listCustomCommands,
  getCustomCommand,
  saveCustomCommand,
  deleteCustomCommand,
  commandExists,
  CustomCommand
} from "./customCommands";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "sylvia-backend" });
});

// LLM Configuration
app.get("/api/config/llm", (_req, res) => {
  res.json({ ok: true, config: getLlmConfig() });
});

app.post("/api/config/llm", (req, res) => {
  const { model, temperature } = req.body || {};
  const config = updateLlmConfig({ model, temperature });
  res.json({ ok: true, config });
});

// Basic chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const payload = req.body as SylviaChatRequest;
    const reply = await chatWithSylvia(payload);
    res.json({ ok: true, reply });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message ?? "Unknown error" });
  }
});

// Summarize page
app.post("/api/page/summary", async (req, res) => {
  try {
    const page = req.body.page as PageContext;
    const summary = await summarizePage(page);
    res.json({ ok: true, summary });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message ?? "Unknown error" });
  }
});

// Tasks from page
app.post("/api/page/tasks", async (req, res) => {
  try {
    const goal = req.body.goal as SylviaGoal;
    const page = req.body.page as PageContext;
    const tasks = await tasksFromPage(goal, page);
    res.json({ ok: true, tasks });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message ?? "Unknown error" });
  }
});

// Concept from page
app.post("/api/page/concept", async (req, res) => {
  try {
    const page = req.body.page as PageContext;
    const concept = await conceptFromPage(page);
    res.json({ ok: true, concept });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message ?? "Unknown error" });
  }
});

// List commands (default + custom)
app.get("/api/commands", (_req, res) => {
  const allCommands = [...DEFAULT_COMMANDS, ...listCustomCommands()];
  res.json({ ok: true, commands: allCommands });
});

// Run command by slug
app.post("/api/commands/:slug/run", async (req, res) => {
  try {
    const slug = req.params.slug;
    const values = req.body.values || {};
    const result = await runCommandBySlug(slug, values);
    res.json({ ok: true, result });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message ?? "Unknown error" });
  }
});

// Custom command endpoints
app.get("/api/commands/custom", (_req, res) => {
  res.json({ ok: true, commands: listCustomCommands() });
});

app.post("/api/commands/custom", (req, res) => {
  try {
    const command = req.body as CustomCommand;

    // Validation
    if (!command.slug || !command.name || !command.template) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields: slug, name, template"
      });
    }

    // Prevent overriding default commands
    const isDefaultCommand = DEFAULT_COMMANDS.some(c => c.slug === command.slug);
    if (isDefaultCommand) {
      return res.status(400).json({
        ok: false,
        error: "Cannot override default commands. Choose a different slug."
      });
    }

    saveCustomCommand(command);
    res.json({ ok: true, command });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message ?? "Unknown error" });
  }
});

app.delete("/api/commands/custom/:slug", (req, res) => {
  const slug = req.params.slug;
  const deleted = deleteCustomCommand(slug);

  if (!deleted) {
    return res.status(404).json({ ok: false, error: "Command not found" });
  }

  res.json({ ok: true });
});

// Automation endpoints
app.get("/api/automations", (_req, res) => {
  res.json({ ok: true, automations: listAutomations() });
});

app.post("/api/automations", (req, res) => {
  const body = req.body as Automation;
  if (!body.id) {
    body.id = "auto-" + Date.now();
  }
  body.enabled = body.enabled ?? true;
  saveAutomation(body);
  res.json({ ok: true, automation: body });
});

app.delete("/api/automations/:id", (req, res) => {
  deleteAutomation(req.params.id);
  res.json({ ok: true });
});

// Automation results endpoints
app.get("/api/automations/results", (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
  const automationId = req.query.automationId as string | undefined;

  const data = getResults({ limit, offset, automationId });
  res.json({ ok: true, ...data });
});

app.get("/api/automations/results/:id", (req, res) => {
  const result = getResultById(req.params.id);
  if (!result) {
    return res.status(404).json({ ok: false, error: "Result not found" });
  }
  res.json({ ok: true, result });
});

app.delete("/api/automations/results", (req, res) => {
  const automationId = req.query.automationId as string | undefined;
  clearResults(automationId);
  res.json({ ok: true });
});

// Start scheduler
startScheduler();

app.listen(port, () => {
  console.log("Sylvia backend listening on http://localhost:" + port);
  console.log("Health check: http://localhost:" + port + "/health");
});
