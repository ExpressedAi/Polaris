import { DEFAULT_COMMANDS } from "@sylvia/core";
import { runCommand } from "@sylvia/core";

export async function runCommandBySlug(
  slug: string,
  values: Record<string, any>
): Promise<string> {
  const cmd = DEFAULT_COMMANDS.find((c) => c.slug === slug);
  if (!cmd) {
    throw new Error(`Command not found: ${slug}`);
  }
  return runCommand(cmd, values);
}
