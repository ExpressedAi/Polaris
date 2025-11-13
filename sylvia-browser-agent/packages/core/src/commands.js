"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizePage = summarizePage;
exports.tasksFromPage = tasksFromPage;
exports.conceptFromPage = conceptFromPage;
exports.chatWithSylvia = chatWithSylvia;
const llmClient_1 = require("./llmClient");
const SYSTEM_PROMPT = `You are Sylvia — high-energy, sharp, concise, and allergic to fluff.
You talk to Jake (the user) directly as "you".
You help him turn goals + web pages into concrete tasks and insights.
Always:
- Start with a one-line TL;DR.
- Then respond with clean sections and bullets.
When creating tasks, keep them small, actionable, and labeled with effort & impact.`;
const client = new llmClient_1.LlmClient();
async function summarizePage(page) {
    const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        {
            role: "user",
            content: `Summarize this page for Jake in 5–8 punchy bullets.
Focus on: what's actionable, surprising, or strategically important.

URL: ${page.url}
Title: ${page.title ?? ""}
Selection (if any): ${page.selection ?? "(none)"}

Page content:
${page.content}`
        }
    ];
    return client.chat(messages);
}
async function tasksFromPage(goal, page) {
    const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        {
            role: "user",
            content: `You are helping design a Polaris-style task list.
Goal:
${JSON.stringify(goal, null, 2)}

Use the page below as context and generate 3–7 high-impact, low-to-medium effort tasks.
For each task, provide:
- title
- description
- whyThisTask (1–3 sentences)
- effort ("very low" | "low" | "medium" | "high")
- impact ("low" | "medium" | "high" | "very high")

Return ONLY valid JSON: { "tasks": SylviaTask[] }.

Page:
${page.url}
${page.content}`
        }
    ];
    const raw = await client.chat(messages, { temperature: 0.5 });
    // Best-effort JSON parse
    const match = raw.match(/\{[\s\S]*\}$/);
    const jsonString = match ? match[0] : raw;
    try {
        const parsed = JSON.parse(jsonString);
        const tasks = (parsed.tasks ?? []);
        return tasks.map((t, idx) => ({
            id: t.id || `task-${Date.now()}-${idx}`,
            goalId: goal.id,
            title: t.title?.trim() || `Task ${idx + 1}`,
            description: t.description ?? "",
            whyThisTask: t.whyThisTask ?? "",
            effort: t.effort ?? "medium",
            impact: t.impact ?? "high",
            status: "pending"
        }));
    }
    catch (err) {
        console.error("Failed to parse tasksFromPage JSON:", err, raw);
        return [];
    }
}
async function conceptFromPage(page) {
    const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        {
            role: "user",
            content: `Extract a single core concept from this page that Jake should remember.
Return JSON ONLY in the shape:
{ "title": string, "category": string, "notes": string }

Page:
${page.url}
${page.content}`
        }
    ];
    const raw = await client.chat(messages);
    const match = raw.match(/\{[\s\S]*\}$/);
    const jsonString = match ? match[0] : raw;
    try {
        const parsed = JSON.parse(jsonString);
        const concept = {
            id: `concept-${Date.now()}`,
            title: parsed.title || "Untitled concept",
            category: parsed.category || "General",
            notes: parsed.notes || "",
            sourceUrl: page.url
        };
        return concept;
    }
    catch (err) {
        console.error("Failed to parse conceptFromPage JSON:", err, raw);
        return null;
    }
}
async function chatWithSylvia(req) {
    const messages = [
        { role: "system", content: SYSTEM_PROMPT }
    ];
    if (req.page) {
        messages.push({
            role: "system",
            content: `Page context:
URL: ${req.page.url}
Title: ${req.page.title ?? ""}
Selection: ${req.page.selection ?? "(none)"}`
        });
    }
    if (req.goal) {
        messages.push({
            role: "system",
            content: `Current goal:
${JSON.stringify(req.goal, null, 2)}`
        });
    }
    if (req.history) {
        messages.push(...req.history);
    }
    messages.push({
        role: "user",
        content: req.message
    });
    return client.chat(messages);
}
