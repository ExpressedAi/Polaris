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
