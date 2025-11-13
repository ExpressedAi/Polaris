import { Automation, listAutomations, saveAutomation } from "./automations";
import { runCommandBySlug } from "./commandApi";
import { fetchPageContextForUrl } from "./pageFetcher";

export function startScheduler() {
  const INTERVAL_MS = 60_000; // once per minute tick

  setInterval(async () => {
    const now = Date.now();
    const autos = listAutomations().filter((a) => a.enabled);

    for (const a of autos) {
      if (a.trigger.type === "interval") {
        const last = a.lastRunAt ? Date.parse(a.lastRunAt) : 0;
        if (now - last < a.trigger.minutes * 60_000) continue;

        try {
          const page = await fetchPageContextForUrl(a.targetUrl);
          await runCommandBySlug(a.commandSlug, { page });
          a.lastRunAt = new Date().toISOString();
          a.lastStatus = "ok";
          a.lastError = null;
        } catch (err: any) {
          a.lastRunAt = new Date().toISOString();
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
