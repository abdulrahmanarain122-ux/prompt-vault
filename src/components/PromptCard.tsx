import React, { useState } from 'react';
import type { PromptItem } from '../types/prompt';

interface PromptCardProps {
  prompt: PromptItem;
  onEdit: (prompt: PromptItem) => void;
  onDelete: (prompt: PromptItem) => void;
  onNotify: (message: string, type?: 'success' | 'error') => void;
}

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function getCategoryClass(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes('video')) return 'video';
  if (lower.includes('vfx') || lower.includes('effects')) return 'vfx';
  if (lower.includes('image') || lower.includes('concept')) return 'image';
  if (lower.includes('sound') || lower.includes('foley')) return 'sound';
  if (lower.includes('light') || lower.includes('color')) return 'lighting';
  return '';
}

export const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  onEdit,
  onDelete,
  onNotify,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(prompt.body);
      } else {
        // Fallback for older browsers or restricted clipboard contexts
        const textarea = document.createElement('textarea');
        textarea.value = prompt.body;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      onNotify(`Copied "${prompt.title}" to clipboard!`, 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      onNotify('Could not copy to clipboard. Please select and copy manually.', 'error');
    }
  };

  const categoryModifier = getCategoryClass(prompt.category);

  return (
    <article className="prompt-card" aria-labelledby={`prompt-title-${prompt.id}`}>
      <div className="card-header">
        <div className="card-top-row">
          <span className={`category-badge ${categoryModifier}`}>
            {prompt.category}
          </span>
          <time className="card-date" dateTime={new Date(prompt.updatedAt).toISOString()}>
            {formatRelativeTime(prompt.updatedAt)}
          </time>
        </div>
        <h3 id={`prompt-title-${prompt.id}`} className="card-title">
          {prompt.title}
        </h3>
      </div>

      <div className="card-body">
        <div className="prompt-snippet-box" title="Full prompt text">
          {prompt.body}
        </div>
      </div>

      <div className="card-footer">
        <button
          type="button"
          className={`copy-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          aria-label={copied ? 'Prompt copied' : `Copy prompt: ${prompt.title}`}
        >
          {copied ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>

        <div className="card-controls">
          <button
            type="button"
            className="icon-btn"
            onClick={() => onEdit(prompt)}
            title="Edit prompt"
            aria-label={`Edit prompt: ${prompt.title}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-btn danger"
            onClick={() => onDelete(prompt)}
            title="Delete prompt"
            aria-label={`Delete prompt: ${prompt.title}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
};
