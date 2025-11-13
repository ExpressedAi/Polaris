// Handles requests for page content & selection
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_PAGE_CONTEXT") {
    const selection =
      window.getSelection && window.getSelection().toString().trim();
    const title = document.title || "";
    const url = location.href;
    const text = document.body ? document.body.innerText : "";
    const MAX_CHARS = 20000;

    sendResponse({
      url,
      title,
      selection: selection || null,
      content: text.slice(0, MAX_CHARS)
    });

    return true;
  }

  if (message.type === "GRAB_ELEMENT") {
    try {
      const { selector, take } = message;
      const el = document.querySelector(selector);
      let value = null;

      if (el) {
        if (take === "textContent") value = el.textContent;
        else if (take === "value" && "value" in el) value = el.value;
        else value = el.innerText || el.textContent;
      }

      sendResponse({ ok: true, value });
    } catch (e) {
      sendResponse({ ok: false, error: String(e) });
    }

    return true;
  }
});

// ---------- Selection Quick Actions ----------

let selectionButton = null;
let selectedText = "";

// Create floating button
function createSelectionButton() {
  if (selectionButton) return selectionButton;

  const btn = document.createElement("div");
  btn.id = "sylvia-selection-button";
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
    <span>Ask Sylvia</span>
  `;

  // Styles
  Object.assign(btn.style, {
    position: "absolute",
    display: "none",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    background: "linear-gradient(135deg, rgba(15, 17, 30, 0.95), rgba(30, 32, 50, 0.95))",
    backdropFilter: "blur(12px) saturate(180%)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "20px",
    color: "#f7f7ff",
    fontSize: "13px",
    fontWeight: "500",
    fontFamily: "system-ui, -apple-system, sans-serif",
    cursor: "pointer",
    zIndex: "2147483647",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset",
    transition: "all 0.2s ease",
    userSelect: "none"
  });

  btn.querySelector("svg").style.cssText = "flex-shrink: 0; width: 16px; height: 16px;";

  // Hover effect
  btn.addEventListener("mouseenter", () => {
    btn.style.background = "linear-gradient(135deg, rgba(20, 22, 40, 0.98), rgba(35, 37, 60, 0.98))";
    btn.style.transform = "scale(1.05)";
    btn.style.borderColor = "rgba(255, 92, 124, 0.4)";
  });

  btn.addEventListener("mouseleave", () => {
    btn.style.background = "linear-gradient(135deg, rgba(15, 17, 30, 0.95), rgba(30, 32, 50, 0.95))";
    btn.style.transform = "scale(1)";
    btn.style.borderColor = "rgba(255, 255, 255, 0.15)";
  });

  // Click handler
  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!selectedText) return;

    // Send message to background to open side panel
    chrome.runtime.sendMessage({
      type: "OPEN_SIDEPANEL_WITH_SELECTION",
      selection: selectedText
    });

    hideSelectionButton();
  });

  document.body.appendChild(btn);
  selectionButton = btn;
  return btn;
}

function showSelectionButton(x, y, text) {
  selectedText = text;
  const btn = createSelectionButton();

  // Position button near the selection
  btn.style.left = `${x}px`;
  btn.style.top = `${y - 50}px`; // Show above the selection
  btn.style.display = "flex";
}

function hideSelectionButton() {
  if (selectionButton) {
    selectionButton.style.display = "none";
  }
  selectedText = "";
}

// Handle text selection
document.addEventListener("mouseup", (e) => {
  // Small delay to ensure selection is complete
  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text && text.length > 3) {
      // Get selection position
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const x = rect.left + rect.width / 2 - 50; // Center button horizontally
      const y = window.scrollY + rect.top;

      showSelectionButton(x, y, text);
    } else {
      hideSelectionButton();
    }
  }, 10);
});

// Hide button when clicking elsewhere
document.addEventListener("mousedown", (e) => {
  if (selectionButton && !selectionButton.contains(e.target)) {
    hideSelectionButton();
  }
});

// Hide button on scroll
document.addEventListener("scroll", () => {
  if (selectionButton && selectionButton.style.display === "flex") {
    hideSelectionButton();
  }
});
