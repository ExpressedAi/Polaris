// Import storage and ChatGPT client
importScripts("storage.js", "chatgptClient.js");

// Store pending selection to pass to panel
let pendingSelection = null;

// Mediates between side panel and content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "OPEN_SIDEPANEL_WITH_SELECTION") {
    // Store selection for panel to retrieve
    pendingSelection = message.selection;

    // Open side panel
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.windowId) {
        chrome.sidePanel.open({ windowId: tab.windowId });
      }
    });

    sendResponse({ ok: true });
    return true;
  }

  if (message.type === "GET_PENDING_SELECTION") {
    const selection = pendingSelection;
    pendingSelection = null; // Clear after retrieval
    sendResponse({ ok: true, selection });
    return true;
  }

  if (message.type === "REQUEST_PAGE_CONTEXT") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.id) {
        sendResponse({ ok: false, error: "No active tab" });
        return;
      }

      chrome.tabs.sendMessage(
        tab.id,
        { type: "GET_PAGE_CONTEXT" },
        (page) => {
          if (!page) {
            sendResponse({ ok: false, error: "No page context" });
          } else {
            sendResponse({ ok: true, page });
          }
        }
      );
    });

    return true; // async
  }

  if (message.type === "CAPTURE_VIEW") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ ok: true, dataUrl });
      }
    });
    return true; // async
  }
});

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Keyboard shortcut handler
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-sidepanel") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.windowId) return;
      chrome.sidePanel.open({ windowId: tab.windowId });
    });
  }
});

// Create context menu for text selection
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ask-sylvia",
    title: "Ask Sylvia about \"%s\"",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "ask-sylvia" && info.selectionText) {
    pendingSelection = info.selectionText;
    if (tab && tab.windowId) {
      chrome.sidePanel.open({ windowId: tab.windowId });
    }
  }
});
