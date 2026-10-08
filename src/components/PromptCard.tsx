import React, { useState } from 'react';
import type { PromptItem } from '../types/prompt';

interface PromptCardProps {
  prompt: PromptItem;
  isSelected?: boolean;
  onSelect?: (prompt: PromptItem) => void;
  onEdit: (prompt: PromptItem) => void;
  onDelete: (prompt: PromptItem) => void;
  onToggleFavorite?: (id: string) => void;
  onCopySuccess?: (prompt: PromptItem) => void;
  onFork?: (prompt: PromptItem) => void;
  onToggleVisibility?: (prompt: PromptItem) => void;
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

function getCategoryTheme(category: string): {
  type: 'video' | 'image' | 'other';
  label: string;
  defaultEngine: string;
} {
  const lower = category.toLowerCase();
  if (lower.includes('video')) {
    return { type: 'video', label: 'VIDEO', defaultEngine: 'Runway Gen-3' };
  }
  if (lower.includes('image') || lower.includes('concept')) {
    return { type: 'image', label: 'IMAGE', defaultEngine: 'Flux.1 Dev' };
  }
  return { type: 'other', label: 'OTHER', defaultEngine: 'Directive' };
}

function formatShortId(id: string): string {
  // If id is starter-1 -> PV-0001, or extract numbers/letters
  const clean = id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
  return `PV-${clean.padStart(4, '0')}`;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopySuccess,
  onFork,
  onToggleVisibility,
  onNotify,
}) => {
  const [copied, setCopied] = useState(false);
  const theme = getCategoryTheme(prompt.category);
  const shortId = formatShortId(prompt.id);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(prompt.body);
      } else {
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
      onCopySuccess?.(prompt);
      onNotify(`Copied "${prompt.title}" to clipboard!`, 'success');
      setTimeout(() => setCopied(false), 2400);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      onNotify('Could not copy to clipboard. Please select and copy manually.', 'error');
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(prompt.id);
  };

  // Extract parameter tags or words
  const wordCount = prompt.body.trim() ? prompt.body.trim().split(/\s+/).length : 0;
  const estimatedTokens = Math.round(wordCount * 1.3);

  // Aspect ratio extraction if embedded in body (e.g. --ar 16:9) or stored
  const arMatch = prompt.body.match(/--ar\s+([0-9]+:[0-9.]+)/i);
  const displayAr = prompt.aspectRatio || (arMatch ? arMatch[1] : theme.type === 'video' ? '2.39:1' : '16:9');
  const displayEngine = prompt.engine || theme.defaultEngine;

  const handleSnippetDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(e.currentTarget);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  return (
    <article
      className={`prompt-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect?.(prompt)}
      aria-label={`Prompt: ${prompt.title}`}
    >
      {/* Cyan indicator bar on active selection */}
      {isSelected && <div className="card-selection-indicator" aria-hidden="true" />}

      {/* Card Top Metadata Strip */}
      <div className="card-top-bar">
        <div className="badge-cluster-left">
          <span className={`badge-category ${theme.type}`}>
            {theme.label}
          </span>
          {prompt.visibility && (
            <button
              type="button"
              className={`badge-visibility ${prompt.visibility} clickable`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility?.(prompt);
              }}
              title={
                prompt.visibility === 'public'
                  ? 'Public Community Prompt • Click to make Private'
                  : 'Private Personal Prompt • Click to make Public'
              }
              aria-label="Toggle Public/Private visibility"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>
                {prompt.visibility === 'public' ? 'public' : 'lock'}
              </span>
              <span>{prompt.visibility === 'public' ? 'Public' : 'Private'}</span>
            </button>
          )}
          {prompt.authorUsername && prompt.visibility === 'public' && (
            <span className="badge-author" title={`Created by @${prompt.authorUsername}`}>
              @{prompt.authorUsername}
            </span>
          )}
          <span className="badge-model-tag">
            {displayEngine}
          </span>
          <span className="card-id-text">{shortId}</span>
        </div>

        <div className="badge-cluster-right">
          <span className="badge-ar">{displayAr}</span>
          <button
            type="button"
            className={`btn-star-card ${prompt.isFavorite ? 'active' : ''}`}
            onClick={handleFavoriteClick}
            title={prompt.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
            aria-label="Toggle favorite"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '16px',
                fontVariationSettings: prompt.isFavorite ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              star
            </span>
          </button>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="card-content-wrap">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3 className="card-title-text">{prompt.title}</h3>

          {/* Monospace Code Snippet Box */}
          <div
            className="card-snippet-box font-code-sm"
            title="Click to select card • Double-click to select text"
            onDoubleClick={handleSnippetDoubleClick}
          >
            {prompt.body}
          </div>

          {/* Parameter Strip */}
          <div className="card-parameter-strip">
            <span className="card-param-pill accent">~{estimatedTokens} tokens</span>
            <span className="card-param-pill">{wordCount} words</span>
            {prompt.tags && prompt.tags.length > 0 ? (
              prompt.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="card-param-pill">
                  #{tag}
                </span>
              ))
            ) : (
              <span className="card-param-pill">{prompt.category}</span>
            )}
          </div>
        </div>

        {/* Operational Footer Strip */}
        <div className="card-footer-strip">
          <div className="footer-actions-left">
            <button
              type="button"
              className={`btn-card-copy ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
              aria-label={copied ? 'Copied to clipboard' : 'Copy prompt text'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                {copied ? 'done' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            {onFork && prompt.visibility === 'public' && (
              <button
                type="button"
                className="btn-card-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onFork(prompt);
                }}
                title="Fork prompt into your personal vault"
                aria-label="Fork prompt"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary-container)' }}>
                  alt_route
                </span>
              </button>
            )}

            <button
              type="button"
              className="btn-card-icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(prompt);
              }}
              title="Edit prompt"
              aria-label="Edit prompt"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                edit
              </span>
            </button>

            <button
              type="button"
              className="btn-card-icon danger"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(prompt);
              }}
              title="Delete prompt"
              aria-label="Delete prompt"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                delete
              </span>
            </button>
          </div>

          <div className="footer-meta-right">
            {(prompt.copyCount ?? 0) > 0 && (
              <span className="card-relative-time" title="Total times copied">
                Copied {prompt.copyCount}×
              </span>
            )}
            <span className="card-relative-time">
              {formatRelativeTime(prompt.updatedAt)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};
