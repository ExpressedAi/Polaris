import { marked } from 'marked';
import DOMPurify from 'dompurify';

const ADMONITION_LABELS: Record<string, string> = {
  NOTE: 'Note',
  TIP: 'Tip',
  WARN: 'Warning',
  WARNING: 'Warning',
  DANGER: 'Danger',
  INFO: 'Info',
  SUCCESS: 'Success',
};

marked.setOptions({
  gfm: true,
  breaks: true,
  smartLists: true,
});

const transformAdmonitions = (html: string): string => {
  return html.replace(/<blockquote>\s*<p>\[!(\w+)\]\s*([^<]*)<\/p>\s*([\s\S]*?)<\/blockquote>/gim, (_match, type, summary, rest) => {
    const label = ADMONITION_LABELS[type.toUpperCase()] || type;
    const body = `${summary}${rest}`.trim();
    return `
      <div class="admonition admonition-${type.toLowerCase()}">
        <div class="admonition-title">${label}</div>
        <div class="admonition-body">${body}</div>
      </div>
    `;
  });
};

/**
 * Strips ACTION markers from text for display purposes
 * ACTION markers are execution commands, not content to display
 */
const stripActionMarkers = (text: string): string => {
  // Remove ACTION markers: [ACTION:actionId|payload1|payload2|...]
  return text.replace(/\[ACTION:[^\]]+\]/g, '').trim();
};

export const renderMarkdown = (input = ''): string => {
  // Strip ACTION markers before rendering markdown
  const cleanedInput = stripActionMarkers(input);
  const raw = marked.parse(cleanedInput);
  const withAdmonitions = transformAdmonitions(raw as string);
  return DOMPurify.sanitize(withAdmonitions);
};
