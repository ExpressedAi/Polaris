// Content script that runs on chat.openai.com
// Handles sending messages and extracting responses

(function() {
  console.log("[Sylvia] ChatGPT content script loaded");

  // Listen for messages from extension
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CHATGPT_PING") {
      sendResponse({ ok: true });
      return true;
    }

    if (message.type === "CHATGPT_SEND_MESSAGE") {
      handleSendMessage(message.requestId, message.message, message.options)
        .then(response => {
          chrome.runtime.sendMessage({
            type: "CHATGPT_RESPONSE",
            requestId: message.requestId,
            response
          });
        })
        .catch(error => {
          chrome.runtime.sendMessage({
            type: "CHATGPT_RESPONSE",
            requestId: message.requestId,
            error: error.message
          });
        });

      sendResponse({ ok: true });
      return true;
    }
  });

  /**
   * Send a message to ChatGPT and wait for response
   */
  async function handleSendMessage(requestId, messageText, options) {
    console.log("[Sylvia] Sending message to ChatGPT:", messageText);

    // Find the textarea input
    const textarea = await waitForElement('textarea[data-id="root"]', 10000);
    if (!textarea) {
      throw new Error("Could not find ChatGPT input textarea");
    }

    // Set the message text
    textarea.value = messageText;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));

    // Wait a bit for the send button to become enabled
    await sleep(500);

    // Find and click send button
    const sendButton = await waitForElement('button[data-testid="send-button"]', 5000);
    if (!sendButton) {
      throw new Error("Could not find ChatGPT send button");
    }

    // Start monitoring for the response
    const responsePromise = waitForResponse();

    // Click send
    sendButton.click();

    // Wait for response
    const response = await responsePromise;

    console.log("[Sylvia] Received ChatGPT response:", response.substring(0, 100) + "...");

    return response;
  }

  /**
   * Wait for ChatGPT to finish responding
   */
  async function waitForResponse() {
    // Wait for the "Stop generating" button to appear (means response started)
    await waitForElement('button[aria-label="Stop generating"]', 30000);

    // Now wait for it to disappear (means response finished)
    let attempts = 0;
    while (attempts < 300) { // 300 * 500ms = 150 seconds max
      const stopButton = document.querySelector('button[aria-label="Stop generating"]');
      if (!stopButton) {
        // Response finished
        break;
      }
      await sleep(500);
      attempts++;
    }

    if (attempts >= 300) {
      throw new Error("ChatGPT response timeout");
    }

    // Wait a bit more for DOM to stabilize
    await sleep(1000);

    // Extract the response text from the last assistant message
    const messages = document.querySelectorAll('[data-message-author-role="assistant"]');
    if (messages.length === 0) {
      throw new Error("Could not find ChatGPT response in page");
    }

    // Get the last assistant message
    const lastMessage = messages[messages.length - 1];

    // Extract text content
    const responseText = extractTextFromMessage(lastMessage);

    if (!responseText) {
      throw new Error("ChatGPT response was empty");
    }

    return responseText;
  }

  /**
   * Extract text content from a message element
   */
  function extractTextFromMessage(messageElement) {
    // Find the message content div
    const contentDiv = messageElement.querySelector('[class*="markdown"]') ||
                      messageElement.querySelector('[class*="prose"]') ||
                      messageElement;

    if (!contentDiv) return "";

    // Get all text nodes, preserving structure
    return contentDiv.innerText || contentDiv.textContent || "";
  }

  /**
   * Wait for an element to appear in the DOM
   */
  function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Timeout
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  /**
   * Sleep utility
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  console.log("[Sylvia] ChatGPT content script ready");
})();
