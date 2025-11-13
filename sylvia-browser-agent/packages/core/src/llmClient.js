"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmClient = void 0;
class LlmClient {
    constructor(opts) {
        const key = opts?.apiKey || process.env.OPENAI_API_KEY;
        if (!key) {
            throw new Error("OPENAI_API_KEY is required");
        }
        this.apiKey = key;
        this.baseUrl = opts?.baseUrl || "https://api.openai.com/v1/chat/completions";
    }
    async chat(messages, options = {}) {
        const body = {
            model: options.model || "gpt-4o-mini",
            messages,
            temperature: options.temperature ?? 0.4
        };
        const res = await fetch(this.baseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`LLM error ${res.status}: ${text}`);
        }
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content ?? "[No response from model]";
        return content.trim();
    }
}
exports.LlmClient = LlmClient;
