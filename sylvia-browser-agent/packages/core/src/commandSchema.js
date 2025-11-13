"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTemplate = renderTemplate;
function renderTemplate(template, values) {
    return template.replace(/\{\{(\w+(?:\.\w+)?)\}\}/g, (_, key) => {
        const parts = key.split('.');
        let value = values;
        for (const part of parts) {
            if (value === undefined || value === null)
                return "";
            value = value[part];
        }
        if (value === undefined || value === null)
            return "";
        if (typeof value === "string")
            return value;
        return JSON.stringify(value, null, 2);
    });
}
