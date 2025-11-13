import { Automation, listAutomations, saveAutomation } from "./automations";
import { runCommandBySlug } from "./commandApi";
import { fetchPageContextForUrl } from "./pageFetcher";
import { saveResult, AutomationResult } from "./results";

export function startScheduler() {
  const INTERVAL_MS = 60_000; // once per minute tick

  setInterval(async () => {
    const now = Date.now();
    const autos = listAutomations().filter((a) => a.enabled);

    for (const a of autos) {
      if (a.trigger.type === "interval") {
        const last = a.lastRunAt ? Date.parse(a.lastRunAt) : 0;
        if (now - last < a.trigger.minutes * 60_000) continue;

        const startTime = Date.now();
        const timestamp = new Date().toISOString();

        try {
          const page = await fetchPageContextForUrl(a.targetUrl);
          const output = await runCommandBySlug(a.commandSlug, { page });
          const durationMs = Date.now() - startTime;

          // Save successful result
          const result: AutomationResult = {
            id: `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            automationId: a.id,
            automationName: a.name,
            commandSlug: a.commandSlug,
            timestamp,
            success: true,
            input: {
              url: a.targetUrl,
              page: { title: page.title, url: page.url }
            },
            output,
            durationMs
          };
          saveResult(result);

          a.lastRunAt = timestamp;
          a.lastStatus = "ok";
          a.lastError = null;
        } catch (err: any) {
          const durationMs = Date.now() - startTime;

          // Save error result
          const result: AutomationResult = {
            id: `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            automationId: a.id,
            automationName: a.name,
            commandSlug: a.commandSlug,
            timestamp,
            success: false,
            input: { url: a.targetUrl },
            error: err.message ?? String(err),
            durationMs
          };
          saveResult(result);

          a.lastRunAt = timestamp;
          a.lastStatus = "error";
          a.lastError = err.message ?? String(err);
        }
        saveAutomation(a);
      }
      // Cron-style trigger can be added later.
    }
  }, INTERVAL_MS);

  console.log("Scheduler started - checking automations every 60 seconds");
}
