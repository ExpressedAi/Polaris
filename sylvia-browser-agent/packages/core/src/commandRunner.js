"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCommand = runCommand;
const commandSchema_1 = require("./commandSchema");
const llmClient_1 = require("./llmClient");
const client = new llmClient_1.LlmClient();
async function runCommand(command, values) {
    const userContent = (0, commandSchema_1.renderTemplate)(command.userTemplate, values);
    const messages = [
        { role: "system", content: command.systemPrompt },
        { role: "user", content: userContent }
    ];
    return client.chat(messages, {
        model: command.model || "gpt-4o-mini"
    });
}
