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
    console.log("[ChatGPT] Sending message:", messageText.substring(0, 50) + "...");

    // Find the textarea
    const textarea = document.querySelector('textarea[data-id]') ||
                     document.querySelector('#prompt-textarea') ||
                     document.querySelector('textarea');

    if (!textarea) {
      console.error("[ChatGPT] Could not find textarea");
      throw new Error("Could not find ChatGPT input textarea");
    }

    console.log("[ChatGPT] Found textarea:", textarea);

    // Set the message - try multiple approaches
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
    nativeInputValueSetter.call(textarea, messageText);

    textarea.value = messageText;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));

    // Wait a bit for UI to update
    await sleep(200);

    // Find and click the send button
    const sendButton = findSendButton();
    if (!sendButton) {
      console.error("[ChatGPT] Could not find send button");
      throw new Error("Could not find ChatGPT send button");
    }

    console.log("[ChatGPT] Found send button:", sendButton);
    console.log("[ChatGPT] Button disabled?", sendButton.disabled);

    // Mark the time before sending
    const beforeSend = Date.now();

    // Click send
    sendButton.click();
    console.log("[ChatGPT] Clicked send button, waiting for response...");

    // Wait for response
    const response = await waitForResponse(beforeSend);
    console.log("[ChatGPT] Got response:", response.substring(0, 100) + "...");

    return response;
  }

  /**
   * Find the send button (tries multiple selectors)
   */
  function findSendButton() {
    const selectors = [
      'button[data-testid="send-button"]',
      'button[data-testid="fruitjuice-send-button"]',
      'button[aria-label="Send message"]',
      'button[aria-label*="Send"]',
      'form button[type="button"]'
    ];

    for (const selector of selectors) {
      try {
        const button = document.querySelector(selector);
        if (button && !button.disabled) {
          console.log("[ChatGPT] Found send button with selector:", selector);
          return button;
        }
      } catch (e) {
        // Selector might not be valid, continue
      }
    }

    // Last resort: find button near textarea
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const form = textarea.closest('form');
      if (form) {
        const buttons = form.querySelectorAll('button[type="button"]');
        for (const button of buttons) {
          if (!button.disabled && button.offsetParent !== null) {
            console.log("[ChatGPT] Found send button near textarea");
            return button;
          }
        }
      }
    }

    return null;
  }

  /**
   * Wait for ChatGPT response to appear
   */
  async function waitForResponse(afterTime, maxWait = 60000) {
    const startTime = Date.now();
    let lastLength = 0;
    let stableCount = 0;

    console.log("[ChatGPT] Waiting for response...");

    while (Date.now() - startTime < maxWait) {
      // Look for response messages - try multiple selectors
      const messages = document.querySelectorAll('[data-message-author-role="assistant"]') ||
                      document.querySelectorAll('[class*="agent-turn"]') ||
                      document.querySelectorAll('[class*="Message"][class*="assistant"]');

      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        const text = extractMessageText(lastMessage);

        // Check if response is still streaming/typing
        const isTyping = lastMessage.querySelector('.result-streaming') ||
                        lastMessage.querySelector('[class*="streaming"]') ||
                        lastMessage.querySelector('[class*="typing"]') ||
                        text.trim().endsWith('▍') ||
                        text.trim().endsWith('|');

        // Check if stop button is present (means still generating)
        const stopButton = document.querySelector('button[aria-label*="Stop"]') ||
                          document.querySelector('button[data-testid*="stop"]');

        if (text && text.trim().length > 0) {
          // Track if response length is stable
          if (text.length === lastLength) {
            stableCount++;
          } else {
            stableCount = 0;
            lastLength = text.length;
          }

          // Consider response complete if:
          // - Not typing AND no stop button AND length stable for 2 checks
          if (!isTyping && !stopButton && stableCount >= 2) {
            console.log("[ChatGPT] Response complete, length:", text.length);
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
