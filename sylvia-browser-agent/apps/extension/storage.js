// Chrome storage wrapper for all Sylvia data
// Replaces the backend's in-memory storage with persistent chrome.storage.local

const Storage = {
  // ==================== Custom Commands ====================

  async getCustomCommands() {
    const result = await chrome.storage.local.get("customCommands");
    return result.customCommands || [];
  },

  async saveCustomCommand(command) {
    const commands = await this.getCustomCommands();
    const existing = commands.findIndex(c => c.slug === command.slug);

    if (existing >= 0) {
      commands[existing] = command;
    } else {
      commands.push(command);
    }

    await chrome.storage.local.set({ customCommands: commands });
    return command;
  },

  async deleteCustomCommand(slug) {
    const commands = await this.getCustomCommands();
    const filtered = commands.filter(c => c.slug !== slug);
    await chrome.storage.local.set({ customCommands: filtered });
    return filtered.length < commands.length; // true if deleted
  },

  // ==================== Automations ====================

  async getAutomations() {
    const result = await chrome.storage.local.get("automations");
    return result.automations || [];
  },

  async saveAutomation(automation) {
    const automations = await this.getAutomations();
    const existing = automations.findIndex(a => a.id === automation.id);

    if (existing >= 0) {
      automations[existing] = automation;
    } else {
      if (!automation.id) {
        automation.id = "auto-" + Date.now();
      }
      automations.push(automation);
    }

    await chrome.storage.local.set({ automations });
    return automation;
  },

  async deleteAutomation(id) {
    const automations = await this.getAutomations();
    const filtered = automations.filter(a => a.id !== id);
    await chrome.storage.local.set({ automations: filtered });
    return filtered.length < automations.length;
  },

  // ==================== Automation Results ====================

  async getResults(options = {}) {
    const result = await chrome.storage.local.get("automationResults");
    let results = result.automationResults || [];

    // Filter by automationId if specified
    if (options.automationId) {
      results = results.filter(r => r.automationId === options.automationId);
    }

    const total = results.length;
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const slice = results.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return { results: slice, total, hasMore };
  },

  async saveResult(result) {
    const stored = await chrome.storage.local.get("automationResults");
    let results = stored.automationResults || [];

    // Add to beginning
    results.unshift(result);

    // Keep only last 1000 results
    if (results.length > 1000) {
      results = results.slice(0, 1000);
    }

    await chrome.storage.local.set({ automationResults: results });
  },

  async clearResults(automationId) {
    if (automationId) {
      const stored = await chrome.storage.local.get("automationResults");
      let results = stored.automationResults || [];
      results = results.filter(r => r.automationId !== automationId);
      await chrome.storage.local.set({ automationResults: results });
    } else {
      await chrome.storage.local.set({ automationResults: [] });
    }
  },

  async getResultById(id) {
    const stored = await chrome.storage.local.get("automationResults");
    const results = stored.automationResults || [];
    return results.find(r => r.id === id);
  },

  // ==================== LLM Config ====================

  async getLlmConfig() {
    const result = await chrome.storage.local.get("llmConfig");
    return result.llmConfig || {
      provider: "chatgpt",
      model: "gpt-4",
      temperature: 0.4
    };
  },

  async updateLlmConfig(updates) {
    const config = await this.getLlmConfig();
    const newConfig = { ...config, ...updates };

    // Clamp temperature
    if (newConfig.temperature !== undefined) {
      newConfig.temperature = Math.max(0, Math.min(1, newConfig.temperature));
    }

    await chrome.storage.local.set({ llmConfig: newConfig });
    return newConfig;
  },

  // ==================== Settings ====================

  async getSettings() {
    const result = await chrome.storage.local.get("settings");
    return result.settings || {
      backendUrl: "http://localhost:4000",
      useBackend: false, // Default to not using backend
      useChatGPT: true   // Default to using web ChatGPT
    };
  },

  async updateSettings(updates) {
    const settings = await this.getSettings();
    const newSettings = { ...settings, ...updates };
    await chrome.storage.local.set({ settings: newSettings });
    return newSettings;
  }
};

// Export for use in other scripts
if (typeof window !== "undefined") {
  window.Storage = Storage;
}
