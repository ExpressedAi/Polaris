import React from 'react';
import { renderMarkdown } from '../services/markdown';

interface MarkdownBlockProps {
  content: string;
  className?: string;
}

const MarkdownBlock: React.FC<MarkdownBlockProps> = ({ content, className }) => {
  if (!content) {
    return null;
  }
  return (
    <div
      className={`message-content ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
};

export default MarkdownBlock;
