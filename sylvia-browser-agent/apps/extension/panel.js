const statusEl = document.getElementById("status");
const outputEl = document.getElementById("output");
const chatInput = document.getElementById("chat-input");

const API_BASE = "http://localhost:4000";

let cachedCommands = [];
let cachedAutomations = [];

// ---------- Shared helpers ----------

async function getPageContext() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "REQUEST_PAGE_CONTEXT" },
      (response) => {
        if (!response || !response.ok) {
          resolve(null);
        } else {
          resolve(response.page);
        }
      }
    );
  });
}

function setStatus(text, type = "normal") {
  statusEl.textContent = text;
  statusEl.className = "status";
  if (type === "loading") statusEl.classList.add("loading");
  if (type === "error") statusEl.classList.add("error");
}

function showOutput(content, type = "text") {
  outputEl.innerHTML = "";

  if (type === "text") {
    const pre = document.createElement("div");
    pre.className = "output-content";
    pre.textContent = content;
    outputEl.appendChild(pre);
  } else if (type === "tasks") {
    const container = document.createElement("div");
    container.className = "task-list";

    content.forEach((task) => {
      const card = document.createElement("div");
      card.className = "task-card";

      const title = document.createElement("div");
      title.className = "task-title";
      title.textContent = task.title;

      const desc = document.createElement("div");
      desc.textContent = task.whyThisTask || task.description || "";
      desc.style.fontSize = "12px";
      desc.style.marginTop = "4px";
      desc.style.color = "var(--text-subtle)";

      const meta = document.createElement("div");
      meta.className = "task-meta";

      const effortBadge = document.createElement("span");
      effortBadge.className = "task-badge";
      effortBadge.textContent = `Effort: ${task.effort}`;

      const impactBadge = document.createElement("span");
      impactBadge.className = "task-badge";
      impactBadge.textContent = `Impact: ${task.impact}`;

      meta.appendChild(effortBadge);
      meta.appendChild(impactBadge);

      card.appendChild(title);
      card.appendChild(desc);
      card.appendChild(meta);

      container.appendChild(card);
    });

    outputEl.appendChild(container);
  } else if (type === "concept") {
    const card = document.createElement("div");
    card.className = "concept-card";

    const title = document.createElement("div");
    title.className = "concept-title";
    title.textContent = content.title;

    const category = document.createElement("div");
    category.className = "concept-category";
    category.textContent = `Category: ${content.category}`;

    const notes = document.createElement("div");
    notes.className = "concept-notes";
    notes.textContent = content.notes;

    card.appendChild(title);
    card.appendChild(category);
    card.appendChild(notes);

    outputEl.appendChild(card);
  }
}

async function postJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Backend error ${res.status}: ${txt}`);
  }

  return res.json();
}

async function getJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Backend error ${res.status}: ${txt}`);
  }
  return res.json();
}

// ---------- Chat view handlers ----------

async function handleSummary() {
  setStatus("Summarizing page…", "loading");

  const page = await getPageContext();
  if (!page) {
    setStatus("Failed to read page.", "error");
    return;
  }

  try {
    const json = await postJson("/api/page/summary", { page });
    showOutput(json.summary, "text");
    setStatus("✓ Summary complete");
  } catch (err) {
    console.error(err);
    setStatus("Error while summarizing.", "error");
    showOutput(String(err), "text");
  }
}

async function handleTasks() {
  setStatus("Creating tasks from page…", "loading");

  const page = await getPageContext();
  if (!page) {
    setStatus("Failed to read page.", "error");
    return;
  }

  const goal = {
    id: "ad-hoc-goal",
    title: "Ad-hoc goal from page",
    description: "Temporary goal created from Sylvia Sidecar",
    timeboxDays: 10
  };

  try {
    const json = await postJson("/api/page/tasks", { goal, page });
    const tasks = json.tasks || [];

    if (tasks.length === 0) {
      setStatus("No tasks generated.", "error");
      showOutput("No tasks were generated from this page.", "text");
      return;
    }

    lastGeneratedTasks = tasks; // Store for Polaris export
    showOutput(tasks, "tasks");

    // Add "Send to Polaris" button
    const polarisBtn = document.createElement("button");
    polarisBtn.className = "btn btn-accent full-width";
    polarisBtn.style.marginTop = "8px";
    polarisBtn.textContent = "→ Send to Polaris";
    polarisBtn.addEventListener("click", async () => {
      try {
        polarisBtn.disabled = true;
        polarisBtn.textContent = "Sending...";
        await sendTasksToPolaris(lastGeneratedTasks);
        polarisBtn.textContent = "✓ Sent to Polaris!";
        setTimeout(() => {
          polarisBtn.textContent = "→ Send to Polaris";
          polarisBtn.disabled = false;
        }, 2000);
      } catch (e) {
        console.error(e);
        polarisBtn.textContent = "✗ Failed (check console)";
        polarisBtn.disabled = false;
      }
    });
    outputEl.appendChild(polarisBtn);

    setStatus(`✓ Generated ${tasks.length} tasks`);
  } catch (err) {
    console.error(err);
    setStatus("Error while creating tasks.", "error");
    showOutput(String(err), "text");
  }
}

async function handleConcept() {
  setStatus("Capturing concept…", "loading");

  const page = await getPageContext();
  if (!page) {
    setStatus("Failed to read page.", "error");
    return;
  }

  try {
    const json = await postJson("/api/page/concept", { page });
    const concept = json.concept;

    if (!concept) {
      setStatus("No concept extracted.", "error");
      showOutput("No concept could be extracted from this page.", "text");
      return;
    }

    lastGeneratedConcept = concept; // Store for Polaris export
    showOutput(concept, "concept");

    // Add "Save to Polaris" button
    const polarisBtn = document.createElement("button");
    polarisBtn.className = "btn btn-accent full-width";
    polarisBtn.style.marginTop = "8px";
    polarisBtn.textContent = "→ Save to Polaris";
    polarisBtn.addEventListener("click", async () => {
      try {
        polarisBtn.disabled = true;
        polarisBtn.textContent = "Saving...";
        await sendConceptToPolaris(lastGeneratedConcept);
        polarisBtn.textContent = "✓ Saved to Polaris!";
        setTimeout(() => {
          polarisBtn.textContent = "→ Save to Polaris";
          polarisBtn.disabled = false;
        }, 2000);
      } catch (e) {
        console.error(e);
        polarisBtn.textContent = "✗ Failed (check console)";
        polarisBtn.disabled = false;
      }
    });
    outputEl.appendChild(polarisBtn);

    setStatus("✓ Concept captured");
  } catch (err) {
    console.error(err);
    setStatus("Error while capturing concept.", "error");
    showOutput(String(err), "text");
  }
}

async function handleChat() {
  const msg = chatInput.value.trim();
  if (!msg) return;

  setStatus("Talking to Sylvia…", "loading");
  chatInput.value = "";

  const page = await getPageContext();
  const body = {
    message: msg,
    page: page || undefined
  };

  try {
    const json = await postJson("/api/chat", body);
    showOutput(json.reply, "text");
    setStatus("✓ Response received");
  } catch (err) {
    console.error(err);
    setStatus("Error while chatting.", "error");
    showOutput(String(err), "text");
  }
}

// ---------- Automations view ----------

const autoListEl = document.getElementById("auto-list");
const autoForm = document.getElementById("auto-form");
const autoNameInput = document.getElementById("auto-name");
const autoUrlInput = document.getElementById("auto-url");
const autoCommandSelect = document.getElementById("auto-command");
const autoIntervalInput = document.getElementById("auto-interval");

async function loadCommands() {
  try {
    const json = await getJson("/api/commands");
    cachedCommands = json.commands || [];

    autoCommandSelect.innerHTML = "";
    cachedCommands.forEach((cmd) => {
      const opt = document.createElement("option");
      opt.value = cmd.slug;
      opt.textContent = cmd.name;
      autoCommandSelect.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
    // Soft fail, automations still usable if commands are cached later
  }
}

function renderAutomations() {
  autoListEl.innerHTML = "";

  if (!cachedAutomations.length) {
    const empty = document.createElement("div");
    empty.className = "auto-empty";
    empty.textContent = "No automations yet. Create one below.";
    autoListEl.appendChild(empty);
    return;
  }

  cachedAutomations.forEach((a) => {
    const card = document.createElement("div");
    card.className = "auto-card";

    const name = document.createElement("div");
    name.className = "auto-name";
    name.textContent = a.name;

    const meta = document.createElement("div");
    meta.className = "auto-meta";

    const cmd = cachedCommands.find((c) => c.slug === a.commandSlug);
    const cmdLabel = document.createElement("span");
    cmdLabel.textContent = `Command: ${cmd ? cmd.name : a.commandSlug}`;

    const interval = document.createElement("span");
    if (a.trigger?.type === "interval") {
      interval.textContent = `Every ${a.trigger.minutes} min`;
    } else if (a.trigger?.type === "cron") {
      interval.textContent = `Cron: ${a.trigger.expression}`;
    } else {
      interval.textContent = "Manual";
    }

    const url = document.createElement("span");
    url.textContent = a.targetUrl;

    meta.appendChild(cmdLabel);
    meta.appendChild(interval);
    meta.appendChild(url);

    const actions = document.createElement("div");
    actions.className = "auto-actions";

    const toggleWrapper = document.createElement("label");
    toggleWrapper.className = "auto-toggle";

    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = !!a.enabled;
    toggle.addEventListener("change", () => toggleAutomation(a, toggle.checked));

    const toggleLabel = document.createElement("span");
    toggleLabel.textContent = a.enabled ? "Enabled" : "Disabled";

    toggleWrapper.appendChild(toggle);
    toggleWrapper.appendChild(toggleLabel);

    const status = document.createElement("span");
    if (a.lastStatus === "ok") {
      status.className = "auto-status-ok";
      status.textContent = "Last run: OK";
    } else if (a.lastStatus === "error") {
      status.className = "auto-status-error";
      status.textContent = "Last run: Error";
    } else {
      status.textContent = "Never run";
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "auto-delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deleteAutomation(a.id));

    actions.appendChild(toggleWrapper);
    actions.appendChild(status);
    actions.appendChild(deleteBtn);

    card.appendChild(name);
    card.appendChild(meta);
    card.appendChild(actions);

    autoListEl.appendChild(card);
  });
}

async function loadAutomations() {
  try {
    const json = await getJson("/api/automations");
    cachedAutomations = json.automations || [];
    renderAutomations();
  } catch (err) {
    console.error(err);
    // best-effort; can show toast in status if you want
  }
}

async function createAutomation(e) {
  e.preventDefault();

  const name = autoNameInput.value.trim();
  if (!name) return;

  const slug = autoCommandSelect.value;
  const minutes = parseInt(autoIntervalInput.value || "0", 10) || 1;

  let targetUrl = autoUrlInput.value.trim();
  if (!targetUrl) {
    const page = await getPageContext();
    if (!page) {
      alert("Could not detect current page URL. Please enter it manually.");
      return;
    }
    targetUrl = page.url;
  }

  const body = {
    name,
    commandSlug: slug,
    targetUrl,
    enabled: true,
    trigger: { type: "interval", minutes }
  };

  try {
    await postJson("/api/automations", body);
    autoNameInput.value = "";
    autoUrlInput.value = "";
    await loadAutomations();
  } catch (err) {
    console.error(err);
    alert("Error creating automation. See console for details.");
  }
}

async function toggleAutomation(auto, enabled) {
  const body = {
    ...auto,
    enabled
  };
  try {
    await postJson("/api/automations", body);
    await loadAutomations();
  } catch (err) {
    console.error(err);
  }
}

async function deleteAutomation(id) {
  if (!confirm("Delete this automation?")) return;

  try {
    await fetch(`${API_BASE}/api/automations/${id}`, { method: "DELETE" });
    await loadAutomations();
  } catch (err) {
    console.error(err);
  }
}

// ---------- Results View ----------

let currentResultsOffset = 0;
const RESULTS_LIMIT = 20;
let hasMoreResults = false;

async function loadResults(reset = true) {
  if (reset) {
    currentResultsOffset = 0;
  }

  try {
    const url = `${API_BASE}/api/automations/results?limit=${RESULTS_LIMIT}&offset=${currentResultsOffset}`;
    const response = await fetch(url);
    const json = await response.json();

    if (!json.ok) {
      throw new Error("Failed to load results");
    }

    hasMoreResults = json.hasMore || false;
    renderResults(json.results || [], reset);

    // Show/hide load more button
    const loadMoreDiv = document.getElementById("results-load-more");
    if (hasMoreResults) {
      loadMoreDiv.style.display = "block";
    } else {
      loadMoreDiv.style.display = "none";
    }
  } catch (err) {
    console.error("Error loading results:", err);
  }
}

function renderResults(results, reset = true) {
  const resultsList = document.getElementById("results-list");
  const emptyState = document.getElementById("results-empty");

  if (reset) {
    resultsList.innerHTML = "";
  }

  if (results.length === 0 && reset) {
    resultsList.style.display = "none";
    emptyState.style.display = "block";
    return;
  }

  resultsList.style.display = "flex";
  emptyState.style.display = "none";

  results.forEach(result => {
    const card = createResultCard(result);
    resultsList.appendChild(card);
  });
}

function createResultCard(result) {
  const card = document.createElement("div");
  card.className = "result-card";
  card.dataset.id = result.id;

  const timestamp = new Date(result.timestamp).toLocaleString();
  const duration = result.durationMs ? `${result.durationMs}ms` : "N/A";
  const statusClass = result.success ? "success" : "error";
  const statusText = result.success ? "Success" : "Error";

  card.innerHTML = `
    <div class="result-header">
      <div class="result-info">
        <div class="result-name">${escapeHtml(result.automationName)}</div>
        <div class="result-meta">
          <span>${timestamp}</span>
          <span>•</span>
          <span>${escapeHtml(result.commandSlug)}</span>
          <span>•</span>
          <span>${duration}</span>
        </div>
      </div>
      <div>
        <span class="result-status ${statusClass}">${statusText}</span>
        <span class="result-expand-icon">▼</span>
      </div>
    </div>
    <div class="result-details">
      ${result.input ? `
        <div class="result-section">
          <div class="result-section-title">Input</div>
          <div class="result-output">${escapeHtml(JSON.stringify(result.input, null, 2))}</div>
        </div>
      ` : ""}
      ${result.success && result.output ? `
        <div class="result-section">
          <div class="result-section-title">Output</div>
          <div class="result-output">${escapeHtml(typeof result.output === "string" ? result.output : JSON.stringify(result.output, null, 2))}</div>
        </div>
      ` : ""}
      ${!result.success && result.error ? `
        <div class="result-section">
          <div class="result-section-title">Error</div>
          <div class="result-output result-error">${escapeHtml(result.error)}</div>
        </div>
      ` : ""}
    </div>
  `;

  // Toggle expand on click
  card.addEventListener("click", () => {
    card.classList.toggle("expanded");
  });

  return card;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function loadMoreResults() {
  currentResultsOffset += RESULTS_LIMIT;
  await loadResults(false);
}

// ---------- Nav / view switching ----------

function initNav() {
  const tabs = Array.from(document.querySelectorAll(".nav-tab"));
  const chatView = document.getElementById("view-chat");
  const autoView = document.getElementById("view-automations");
  const resultsView = document.getElementById("view-results");

  function activate(view) {
    tabs.forEach((t) => t.classList.remove("nav-tab-active"));
    document
      .querySelector(`.nav-tab[data-view="${view}"]`)
      .classList.add("nav-tab-active");

    chatView.classList.toggle("active", view === "chat");
    autoView.classList.toggle("active", view === "automations");
    resultsView.classList.toggle("active", view === "results");
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const view = tab.getAttribute("data-view");
      activate(view);
      if (view === "automations") {
        loadAutomations();
      } else if (view === "results") {
        loadResults();
      }
    });
  });

  activate("chat");
}

// ---------- Wiring & init ----------

document.getElementById("btn-summary").addEventListener("click", handleSummary);
document.getElementById("btn-tasks").addEventListener("click", handleTasks);
document.getElementById("btn-concept").addEventListener("click", handleConcept);
document.getElementById("btn-chat").addEventListener("click", handleChat);

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleChat();
  }
});

// Automations
document
  .getElementById("btn-refresh-autos")
  .addEventListener("click", loadAutomations);
autoForm.addEventListener("submit", createAutomation);

// Results
document
  .getElementById("btn-refresh-results")
  .addEventListener("click", () => loadResults(true));
document
  .getElementById("btn-load-more-results")
  .addEventListener("click", loadMoreResults);

// Init
setStatus("Ready to analyze this page...");
initNav();
loadCommands();

// ---------- Model Config Modal ----------

const configModal = document.getElementById("config-modal");
const settingsGear = document.getElementById("settings-gear");
const btnCloseConfig = document.getElementById("btn-close-config");
const btnSaveConfig = document.getElementById("btn-save-config");
const configModelSelect = document.getElementById("config-model");
const configTempSlider = document.getElementById("config-temperature");
const configTempValue = document.getElementById("config-temperature-value");

async function loadLlmConfig() {
  try {
    const json = await getJson("/api/config/llm");
    if (json.ok && json.config) {
      configModelSelect.value = json.config.model || "gpt-4o-mini";
      configTempSlider.value = json.config.temperature || 0.4;
      configTempValue.textContent = configTempSlider.value;
    }
  } catch (err) {
    console.error("Failed to load LLM config:", err);
  }
}

async function saveLlmConfig() {
  try {
    const config = {
      model: configModelSelect.value,
      temperature: parseFloat(configTempSlider.value)
    };
    await postJson("/api/config/llm", config);
    configModal.classList.remove("active");
  } catch (err) {
    console.error("Failed to save LLM config:", err);
    alert("Failed to save configuration");
  }
}

settingsGear.addEventListener("click", () => {
  loadLlmConfig();
  configModal.classList.add("active");
});

btnCloseConfig.addEventListener("click", () => {
  configModal.classList.remove("active");
});

configModal.addEventListener("click", (e) => {
  if (e.target === configModal) {
    configModal.classList.remove("active");
  }
});

configTempSlider.addEventListener("input", () => {
  configTempValue.textContent = configTempSlider.value;
});

btnSaveConfig.addEventListener("click", saveLlmConfig);

// ---------- Polaris Integration ----------

const POLARIS_API_BASE = "http://localhost:3000"; // Configure for your Polaris backend

async function sendTasksToPolaris(tasks) {
  const res = await fetch(`${POLARIS_API_BASE}/api/sylvia/tasks/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tasks })
  });
  if (!res.ok) throw new Error("Failed to send tasks to Polaris");
  return res.json();
}

async function sendConceptToPolaris(concept) {
  const res = await fetch(`${POLARIS_API_BASE}/api/sylvia/concepts/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ concept })
  });
  if (!res.ok) throw new Error("Failed to send concept to Polaris");
  return res.json();
}

// Store last generated tasks/concept for Polaris export
let lastGeneratedTasks = [];
let lastGeneratedConcept = null;
