export type CommandParamType =
  | "page"      // full page context (url, title, content, selection)
  | "selection" // just highlighted text
  | "url"
  | "view"      // screenshot (future)
  | "input"     // free text typed by user
  | "goal"      // current Polaris goal summary
  | "thread"    // thread metadata (for socials)
  | "language"
  | "tone";

export interface CommandParam {
  name: string;              // e.g. "page"
  label: string;             // "Page content"
  type: CommandParamType;
  required?: boolean;
}

export type CommandKind = "chat" | "task-generator" | "concept" | "custom";

export interface SylviaCommand {
  id: string;
  name: string;          // "Summarize page"
  slug: string;          // "summarize-page"
  kind: CommandKind;
  icon?: string;         // "sparkles"
  description?: string;
  params: CommandParam[];
  systemPrompt: string;
  userTemplate: string;  // template string with {{placeholders}}
  model?: string;        // override model, e.g. "gpt-4o"
}

export function renderTemplate(
  template: string,
  values: Record<string, any>
): string {
  return template.replace(/\{\{(\w+(?:\.\w+)?)\}\}/g, (_, key) => {
    const parts = key.split('.');
    let value = values;

    for (const part of parts) {
      if (value === undefined || value === null) return "";
      value = value[part];
    }

    if (value === undefined || value === null) return "";
    if (typeof value === "string") return value;
    return JSON.stringify(value, null, 2);
  });
}
