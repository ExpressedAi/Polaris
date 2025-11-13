// ChatGPT Web Interface Client
// Uses existing ChatGPT Pro subscription through browser automation

class ChatGPTClient {
  constructor() {
    this.chatGPTUrl = "https://chatgpt.com";
    this.responseTimeout = 60000; // 60 seconds
  }

  /**
   * Send message to ChatGPT and get response
   * Uses browser automation - no API keys required
   */
  async chat(message) {
    try {
      // Open ChatGPT in a new tab
      const tab = await this.ensureChatGPTTab();

      // Send message and wait for response
      const response = await this.sendMessage(tab.id, message);

      return response;
    } catch (error) {
      console.error("ChatGPT client error:", error);
      throw error;
    }
  }

  /**
   * Ensure we have a ChatGPT tab open
   */
  async ensureChatGPTTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ url: ["https://chatgpt.com/*", "https://chat.openai.com/*"] }, (tabs) => {
        if (tabs.length > 0) {
          // Use existing tab
          resolve(tabs[0]);
        } else {
          // Create new tab
          chrome.tabs.create({ url: this.chatGPTUrl, active: false }, (tab) => {
            // Wait for page to load
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
              if (tabId === tab.id && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                // Give content script a moment to initialize
                setTimeout(() => resolve(tab), 500);
              }
            });
          });
        }
      });
    });
  }

  /**
   * Send message to ChatGPT tab and wait for response
   */
  async sendMessage(tabId, message) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("ChatGPT response timeout"));
      }, this.responseTimeout);

      // Inject content script if needed and send message
      chrome.tabs.sendMessage(
        tabId,
        {
          type: "CHATGPT_SEND_MESSAGE",
          message: message
        },
        (response) => {
          clearTimeout(timeout);

          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (response && response.ok) {
            resolve(response.text);
          } else {
            reject(new Error(response?.error || "Failed to get ChatGPT response"));
          }
        }
      );
    });
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatGPTClient;
}

// Make available globally for panel.js
window.chatGPTClient = new ChatGPTClient();
