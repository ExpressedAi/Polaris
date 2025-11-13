export interface CustomCommand {
  slug: string;
  name: string;
  description?: string;
  template: string;
  model?: string; // Optional model override (e.g., "gpt-4o", "gpt-4o-mini")
  temperature?: number; // Optional temperature override
}

// In-memory storage for custom commands
const customCommands = new Map<string, CustomCommand>();

export function listCustomCommands(): CustomCommand[] {
  return Array.from(customCommands.values());
}

export function getCustomCommand(slug: string): CustomCommand | undefined {
  return customCommands.get(slug);
}

export function saveCustomCommand(command: CustomCommand): void {
  customCommands.set(command.slug, command);
}

export function deleteCustomCommand(slug: string): boolean {
  return customCommands.delete(slug);
}

export function commandExists(slug: string): boolean {
  return customCommands.has(slug);
}
