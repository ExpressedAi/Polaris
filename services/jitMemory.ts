import { JITSnippet } from '../types';
import { saveJITSnippet, getSnippetsByTags } from './storage';

const normalizeText = (text: string): string => text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

const deriveTags = (text: string, limit = 6): string[] => {
  const words = normalizeText(text).split(/\s+/).filter(Boolean);
  const significant = words.filter(word => word.length > 4);
  const frequency = new Map<string, number>();
  significant.forEach(word => {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  });
  const sorted = Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
  return sorted.length > 0 ? sorted : words.slice(0, limit);
};

const makeSnippetId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  return `jit-${Date.now()}`;
};

export const captureSnippet = async (threadId: string, text: string): Promise<JITSnippet> => {
  const tags = deriveTags(text);
  const snippet: JITSnippet = {
    id: makeSnippetId(),
    threadId,
    tags,
    text,
    relevance: 0.5,
    createdAt: Date.now(),
  };
  await saveJITSnippet(snippet);
  return snippet;
};

export const recallSnippets = async (input: string, limit = 5): Promise<JITSnippet[]> => {
  const tags = deriveTags(input, 8);
  return getSnippetsByTags(tags, limit);
};
