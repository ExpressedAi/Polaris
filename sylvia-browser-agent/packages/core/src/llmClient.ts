import type { LlmMessage } from "./models";
import { MultiLlmClient, type MultiLlmClientOptions } from "./multiLlmClient";

export interface LlmClientOptions extends MultiLlmClientOptions {}

export class LlmClient {
  private inner: MultiLlmClient;

  constructor(opts?: { apiKey?: string; baseUrl?: string }) {
    // Legacy constructor for backward compatibility
    // Now uses MultiLlmClient internally
    this.inner = new MultiLlmClient();
  }

  async chat(
    messages: LlmMessage[],
    options: LlmClientOptions = {}
  ): Promise<string> {
    return this.inner.chat(messages, options);
  }
}
