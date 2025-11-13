import { SylviaCommand } from "./commandSchema";

export const DEFAULT_COMMANDS: SylviaCommand[] = [
  {
    id: "summarize-page",
    name: "Summarize page",
    slug: "summarize-page",
    kind: "chat",
    icon: "sparkles",
    description: "Short, punchy summary of the current page.",
    params: [
      { name: "page", label: "Page", type: "page", required: true }
    ],
    systemPrompt: `You are Sylvia. Summarize pages for Jake with a TL;DR then bullets.
Be concise but highlight anything actionable or surprising.`,
    userTemplate: `Summarize this page for Jake in 5–8 punchy bullets.

URL: {{page.url}}
Title: {{page.title}}
Selection: {{page.selection}}

Page content:
{{page.content}}`
  },
  {
    id: "tasks-from-page",
    name: "Create tasks from page",
    slug: "tasks-from-page",
    kind: "task-generator",
    icon: "checklist",
    description: "Generate Polaris-style tasks aligned with a goal.",
    params: [
      { name: "page", label: "Page", type: "page", required: true },
      { name: "goal", label: "Goal", type: "goal", required: true }
    ],
    systemPrompt: `You are Sylvia, turning goals + context into concrete tasks
with effort and impact labels, sized to be doable.`,
    userTemplate: `Using the goal and page context below, generate 3–7 tasks.

Goal:
{{goal}}

Page URL: {{page.url}}
Title: {{page.title}}

Page content:
{{page.content}}

Return ONLY JSON:
{ "tasks": [
  {
    "title": string,
    "description": string,
    "whyThisTask": string,
    "effort": "very low" | "low" | "medium" | "high",
    "impact": "low" | "medium" | "high" | "very high"
  }
]}`
  },
  {
    id: "concept-from-page",
    name: "Capture concept",
    slug: "concept-from-page",
    kind: "concept",
    icon: "idea",
    description: "Extract one key idea worth remembering.",
    params: [
      { name: "page", label: "Page", type: "page", required: true }
    ],
    systemPrompt: `You are Sylvia, capturing memorable concepts for Jake's knowledge base.`,
    userTemplate: `From this page, extract ONE core concept Jake should remember.

Return ONLY JSON:
{ "title": string, "category": string, "notes": string }

Page:
{{page.url}}
{{page.content}}`
  }
];
