/**
 * Memory Export Utilities
 * Export search results in various formats (JSON, CSV, Markdown, PDF)
 */

import { MemoryResult } from './memorySearch';

/**
 * Export memories as JSON
 */
export function exportAsJSON(memories: MemoryResult[], filename?: string): void {
  const data = {
    exportDate: new Date().toISOString(),
    totalRecords: memories.length,
    memories: memories.map(m => ({
      ...m,
      createdAtISO: new Date(m.createdAt).toISOString(),
      updatedAtISO: m.updatedAt ? new Date(m.updatedAt).toISOString() : undefined,
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, filename || `memory-export-${Date.now()}.json`);
}

/**
 * Export memories as CSV
 */
export function exportAsCSV(memories: MemoryResult[], filename?: string): void {
  const headers = ['ID', 'Type', 'Title', 'Content', 'Created At', 'Updated At', 'Tags', 'Status', 'Priority'];
  const rows = memories.map(m => [
    m.id,
    m.type,
    escapeCSV(m.title),
    escapeCSV(m.content),
    new Date(m.createdAt).toISOString(),
    m.updatedAt ? new Date(m.updatedAt).toISOString() : '',
    (m.tags || []).join('; '),
    m.status || '',
    m.priority || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename || `memory-export-${Date.now()}.csv`);
}

function escapeCSV(value: string): string {
  if (!value) return '';
  const needsQuotes = /[",\n\r]/.test(value);
  if (needsQuotes) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Export memories as Markdown
 */
export function exportAsMarkdown(memories: MemoryResult[], filename?: string): void {
  const content = [
    `# Memory Export`,
    ``,
    `**Export Date:** ${new Date().toLocaleDateString()}`,
    `**Total Records:** ${memories.length}`,
    ``,
    `---`,
    ``,
  ];

  memories.forEach((memory, index) => {
    content.push(`## ${index + 1}. ${memory.title}`);
    content.push(``);
    content.push(`- **Type:** ${memory.type}`);
    content.push(`- **Created:** ${new Date(memory.createdAt).toLocaleString()}`);
    if (memory.updatedAt) {
      content.push(`- **Updated:** ${new Date(memory.updatedAt).toLocaleString()}`);
    }
    if (memory.tags && memory.tags.length > 0) {
      content.push(`- **Tags:** ${memory.tags.join(', ')}`);
    }
    if (memory.status) {
      content.push(`- **Status:** ${memory.status}`);
    }
    if (memory.priority) {
      content.push(`- **Priority:** ${memory.priority}`);
    }
    content.push(``);
    content.push(`### Content`);
    content.push(``);
    content.push(memory.content);
    content.push(``);
    content.push(`---`);
    content.push(``);
  });

  const blob = new Blob([content.join('\n')], { type: 'text/markdown;charset=utf-8;' });
  downloadBlob(blob, filename || `memory-export-${Date.now()}.md`);
}

/**
 * Export memories as formatted PDF-ready HTML
 */
export function exportAsPDFHTML(memories: MemoryResult[], filename?: string): void {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Memory Export</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      color: #1a1a1a;
      border-bottom: 3px solid #4f46e5;
      padding-bottom: 10px;
    }
    .export-info {
      background: #f3f4f6;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .memory-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      page-break-inside: avoid;
    }
    .memory-header {
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .memory-title {
      font-size: 1.5em;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 10px 0;
    }
    .memory-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      font-size: 0.9em;
      color: #6b7280;
    }
    .memory-meta-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .memory-meta-label {
      font-weight: 600;
    }
    .memory-content {
      white-space: pre-wrap;
      word-wrap: break-word;
      font-size: 0.95em;
    }
    .tag {
      display: inline-block;
      background: #dbeafe;
      color: #1e40af;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.85em;
      margin-right: 5px;
    }
    @media print {
      body {
        padding: 20px;
      }
      .memory-card {
        box-shadow: none;
        border: 1px solid #ddd;
      }
    }
  </style>
</head>
<body>
  <h1>Memory Export</h1>
  <div class="export-info">
    <p><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Total Records:</strong> ${memories.length}</p>
  </div>

  ${memories.map((memory, index) => `
    <div class="memory-card">
      <div class="memory-header">
        <h2 class="memory-title">${index + 1}. ${escapeHTML(memory.title)}</h2>
        <div class="memory-meta">
          <div class="memory-meta-item">
            <span class="memory-meta-label">Type:</span>
            <span>${escapeHTML(memory.type)}</span>
          </div>
          <div class="memory-meta-item">
            <span class="memory-meta-label">Created:</span>
            <span>${new Date(memory.createdAt).toLocaleString()}</span>
          </div>
          ${memory.updatedAt ? `
          <div class="memory-meta-item">
            <span class="memory-meta-label">Updated:</span>
            <span>${new Date(memory.updatedAt).toLocaleString()}</span>
          </div>
          ` : ''}
          ${memory.status ? `
          <div class="memory-meta-item">
            <span class="memory-meta-label">Status:</span>
            <span>${escapeHTML(memory.status)}</span>
          </div>
          ` : ''}
          ${memory.priority ? `
          <div class="memory-meta-item">
            <span class="memory-meta-label">Priority:</span>
            <span>${escapeHTML(memory.priority)}</span>
          </div>
          ` : ''}
        </div>
        ${memory.tags && memory.tags.length > 0 ? `
        <div style="margin-top: 10px;">
          ${memory.tags.map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}
        </div>
        ` : ''}
      </div>
      <div class="memory-content">
        ${escapeHTML(memory.content)}
      </div>
    </div>
  `).join('')}
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  downloadBlob(blob, filename || `memory-export-${Date.now()}.html`);
}

function escapeHTML(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy memories to clipboard as formatted text
 */
export async function copyToClipboard(memories: MemoryResult[]): Promise<boolean> {
  const text = memories.map(m => {
    const parts = [
      `${m.title}`,
      `Type: ${m.type}`,
      `Created: ${new Date(m.createdAt).toLocaleString()}`,
    ];
    if (m.tags && m.tags.length > 0) {
      parts.push(`Tags: ${m.tags.join(', ')}`);
    }
    parts.push(`\n${m.content}`);
    return parts.join('\n');
  }).join('\n\n---\n\n');

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Share memories using Web Share API (mobile-friendly)
 */
export async function shareMemories(memories: MemoryResult[]): Promise<boolean> {
  if (!navigator.share) {
    return false;
  }

  const text = memories.map(m => `${m.title}\n${m.content}`).join('\n\n---\n\n');

  try {
    await navigator.share({
      title: 'Memory Export',
      text: text,
    });
    return true;
  } catch (err) {
    console.error('Failed to share:', err);
    return false;
  }
}
