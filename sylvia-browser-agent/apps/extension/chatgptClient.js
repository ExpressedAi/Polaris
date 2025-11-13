// ChatGPT Web Interface Client
// Interacts with chat.openai.com using the user's ChatGPT Pro account

class ChatGPTClient {
  constructor() {
    this.chatTabId = null;
    this.pendingRequests = new Map();
  }

  /**
   * Send a message to ChatGPT and get response
   * @param {string} message - The message to send
   * @param {Object} options - Options like model, temperature
   * @returns {Promise<string>} - ChatGPT's response
   */
  async chat(message, options = {}) {
    // Ensure we have a ChatGPT tab open
    await this.ensureChatGPTTab();

    // Generate request ID
    const requestId = `req-${Date.now()}-${Math.random()}`;

    // Create promise for response
    const responsePromise = new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      // Timeout after 120 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error("ChatGPT request timeout"));
        }
      }, 120000);
    });

    // Send message to ChatGPT tab
    try {
      await chrome.tabs.sendMessage(this.chatTabId, {
        type: "CHATGPT_SEND_MESSAGE",
        requestId,
        message,
        options
      });
    } catch (err) {
      this.pendingRequests.delete(requestId);
      throw new Error(`Failed to communicate with ChatGPT tab: ${err.message}`);
    }

    return responsePromise;
  }

  /**
   * Handle response from ChatGPT content script
   */
  handleResponse(requestId, response, error) {
    const pending = this.pendingRequests.get(requestId);
    if (!pending) return;

    this.pendingRequests.delete(requestId);

    if (error) {
      pending.reject(new Error(error));
    } else {
      pending.resolve(response);
    }
  }

  /**
   * Ensure we have a ChatGPT tab open and ready
   */
  async ensureChatGPTTab() {
    // Check if existing tab is still valid
    if (this.chatTabId) {
      try {
        const tab = await chrome.tabs.get(this.chatTabId);
        if (tab && tab.url && tab.url.includes("chat.openai.com")) {
          // Ping the tab to see if content script is ready
          try {
            await chrome.tabs.sendMessage(this.chatTabId, { type: "CHATGPT_PING" });
            return; // Tab is ready
          } catch (e) {
            // Content script not ready, continue to create new tab
          }
        }
      } catch (e) {
        // Tab doesn't exist, continue to create new
      }
    }

    // Find existing ChatGPT tab
    const tabs = await chrome.tabs.query({ url: "https://chat.openai.com/*" });
    if (tabs.length > 0) {
      this.chatTabId = tabs[0].id;

      // Inject our content script if not already injected
      try {
        await chrome.scripting.executeScript({
          target: { tabId: this.chatTabId },
          files: ["chatgptContentScript.js"]
        });
      } catch (e) {
        // Script might already be injected
      }

      // Wait a bit for script to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      return;
    }

    // Create new ChatGPT tab (hidden)
    const newTab = await chrome.tabs.create({
      url: "https://chat.openai.com",
      active: false
    });

    this.chatTabId = newTab.id;

    // Wait for tab to load
    await new Promise((resolve) => {
      const listener = (tabId, changeInfo) => {
        if (tabId === this.chatTabId && changeInfo.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });

    // Inject our content script
    await chrome.scripting.executeScript({
      target: { tabId: this.chatTabId },
      files: ["chatgptContentScript.js"]
    });

    // Wait for script to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Singleton instance
const chatGPTClient = new ChatGPTClient();

// Handle responses from ChatGPT content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHATGPT_RESPONSE") {
    chatGPTClient.handleResponse(message.requestId, message.response, message.error);
    sendResponse({ ok: true });
    return true;
  }
});

// Export for use in other scripts
window.chatGPTClient = chatGPTClient;
