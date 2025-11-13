import { SylviaCommand, renderTemplate } from "./commandSchema";
import { LlmClient } from "./llmClient";
import type { LlmMessage } from "./models";

const client = new LlmClient();

export async function runCommand(
  command: SylviaCommand,
  values: Record<string, any>
): Promise<string> {
  const userContent = renderTemplate(command.userTemplate, values);
  const messages: LlmMessage[] = [
    { role: "system", content: command.systemPrompt },
    { role: "user", content: userContent }
  ];

  return client.chat(messages, {
    model: command.model || "gpt-4o-mini"
  });
}
