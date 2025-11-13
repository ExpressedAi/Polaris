const statusEl = document.getElementById("status");
const outputEl = document.getElementById("output");
const chatInput = document.getElementById("chat-input");

const API_BASE = "http://localhost:4000";

// Get page context from active tab
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

async function callBackend(path, body) {
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

async function handleSummary() {
  setStatus("Summarizing page…", "loading");

  const page = await getPageContext();
  if (!page) {
    setStatus("Failed to read page.", "error");
    return;
  }

  try {
    const json = await callBackend("/api/page/summary", { page });
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

  // Placeholder goal - in production, this would come from Polaris state
  const goal = {
    id: "ad-hoc-goal",
    title: "Ad-hoc goal from page",
    description: "Temporary goal created from Sylvia Sidecar",
    timeboxDays: 10
  };

  try {
    const json = await callBackend("/api/page/tasks", { goal, page });
    const tasks = json.tasks || [];

    if (tasks.length === 0) {
      setStatus("No tasks generated.", "error");
      showOutput("No tasks were generated from this page.", "text");
      return;
    }

    showOutput(tasks, "tasks");
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
    const json = await callBackend("/api/page/concept", { page });
    const concept = json.concept;

    if (!concept) {
      setStatus("No concept extracted.", "error");
      showOutput("No concept could be extracted from this page.", "text");
      return;
    }

    showOutput(concept, "concept");
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
    const json = await callBackend("/api/chat", body);
    showOutput(json.reply, "text");
    setStatus("✓ Response received");
  } catch (err) {
    console.error(err);
    setStatus("Error while chatting.", "error");
    showOutput(String(err), "text");
  }
}

// Event listeners
document.getElementById("btn-summary").addEventListener("click", handleSummary);
document.getElementById("btn-tasks").addEventListener("click", handleTasks);
document.getElementById("btn-concept").addEventListener("click", handleConcept);
document.getElementById("btn-chat").addEventListener("click", handleChat);

// Allow Enter to send chat (Shift+Enter for new line)
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleChat();
  }
});

// Initialize
setStatus("Ready to analyze this page...");
