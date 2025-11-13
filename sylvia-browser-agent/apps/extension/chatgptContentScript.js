// Content script for chat.openai.com
// Handles message injection and response scraping

(function() {
  'use strict';

  // Listen for messages from extension
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CHATGPT_SEND_MESSAGE") {
      handleChatGPTMessage(message.message)
        .then(response => {
          sendResponse({ ok: true, text: response });
        })
        .catch(error => {
          sendResponse({ ok: false, error: error.message });
        });
      return true; // Keep channel open for async response
    }
  });

  /**
   * Send message to ChatGPT and wait for response
   */
  async function handleChatGPTMessage(messageText) {
    // Find the textarea
    const textarea = document.querySelector('textarea[data-id]') ||
                     document.querySelector('#prompt-textarea') ||
                     document.querySelector('textarea');

    if (!textarea) {
      throw new Error("Could not find ChatGPT input textarea");
    }

    // Set the message
    textarea.value = messageText;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait a bit for UI to update
    await sleep(100);

    // Find and click the send button
    const sendButton = findSendButton();
    if (!sendButton) {
      throw new Error("Could not find ChatGPT send button");
    }

    // Mark the time before sending
    const beforeSend = Date.now();

    // Click send
    sendButton.click();

    // Wait for response
    const response = await waitForResponse(beforeSend);

    return response;
  }

  /**
   * Find the send button (tries multiple selectors)
   */
  function findSendButton() {
    const selectors = [
      'button[data-testid="send-button"]',
      'button[aria-label="Send message"]',
      'button svg[class*="icon"]',
      'button:has(svg)'
    ];

    for (const selector of selectors) {
      const button = document.querySelector(selector);
      if (button && !button.disabled) {
        return button;
      }
    }

    return null;
  }

  /**
   * Wait for ChatGPT response to appear
   */
  async function waitForResponse(afterTime, maxWait = 60000) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      // Look for response message that appeared after our send time
      const messages = document.querySelectorAll('[data-message-author-role="assistant"]');

      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];

        // Check if this message is still being typed (has the cursor)
        const isTyping = lastMessage.querySelector('.result-streaming') ||
                        lastMessage.querySelector('[class*="typing"]') ||
                        lastMessage.textContent.trim().endsWith('▍');

        if (!isTyping) {
          // Get the text content
          const text = extractMessageText(lastMessage);
          if (text && text.trim().length > 0) {
            return text;
          }
        }
      }

      // Wait before checking again
      await sleep(500);
    }

    throw new Error("Timeout waiting for ChatGPT response");
  }

  /**
   * Extract text from message element
   */
  function extractMessageText(element) {
    // Remove any code blocks for now (can be enhanced later)
    const clone = element.cloneNode(true);

    // Remove button elements
    const buttons = clone.querySelectorAll('button');
    buttons.forEach(btn => btn.remove());

    // Get text content
    return clone.textContent.trim();
  }

  /**
   * Sleep helper
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  console.log("ChatGPT content script loaded");
})();
