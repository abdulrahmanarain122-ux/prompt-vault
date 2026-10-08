import React from 'react';
import type { StorageStatus } from '../types/prompt';

interface AppHeaderProps {
  storageStatus: StorageStatus;
  totalPrompts: number;
  onNewPrompt: () => void;
  onFocusSearch: () => void;
  onToggleMobileSidebar: () => void;
  onResetStarters?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  storageStatus,
  totalPrompts,
  onNewPrompt,
  onFocusSearch,
  onToggleMobileSidebar,
}) => {
  return (
    <header className="fixed-header" role="banner">
      <div className="header-left-cluster">
        {/* Mobile menu button */}
        <button
          type="button"
          className="mobile-sidebar-toggle"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation sidebar"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Brand */}
        <div className="header-brand">
          <div className="brand-icon-glyph" aria-hidden="true">
            PV
          </div>
          <span className="brand-title">PROMPT VAULT</span>
          <span className="brand-badge">STUDIO v2.4</span>
        </div>

        {/* Primary Library Context Nav */}
        <nav className="header-nav" aria-label="Main application context">
          <a
            href="#library"
            className="header-nav-link active"
            aria-current="page"
          >
            Library
          </a>
          <span
            className="header-nav-link"
            style={{ opacity: 0.5, cursor: 'not-allowed' }}
            title="Playground feature coming in next milestone"
          >
            Playground
          </span>
          <span
            className="header-nav-link"
            style={{ opacity: 0.5, cursor: 'not-allowed' }}
            title="Collections organizer coming in next milestone"
          >
            Collections
          </span>
        </nav>
      </div>

      <div className="header-right-cluster">
        {/* Search trigger entrypoint */}
        <button
          type="button"
          className="header-search-btn"
          onClick={onFocusSearch}
          title="Press / or ⌘K to search prompts"
          aria-label="Search prompts"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--outline)' }}>
              search
            </span>
            <span className="font-body-sm" style={{ color: 'var(--outline)' }}>
              Command or search...
            </span>
          </div>
          <div className="kbd-chip">
            <span>⌘</span>
            <span>K</span>
          </div>
        </button>

        {/* Storage / Vault Synchronization status */}
        <div
          className="header-sync-pill"
          title={`Stored in local browser storage (${(storageStatus.estimatedBytes / 1024).toFixed(1)} KB)`}
        >
          <span className="pulse-dot" aria-hidden="true" />
          <span className="font-label-sm">
            Vault Synced · {totalPrompts} {totalPrompts === 1 ? 'prompt' : 'prompts'}
          </span>
        </div>

        {/* Primary New Prompt CTA */}
        <button
          type="button"
          className="btn-header-cta"
          onClick={onNewPrompt}
          id="header-new-prompt-btn"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            add
          </span>
          <span>+ New Prompt</span>
        </button>

        {/* Workspace Account / Environment Indicator */}
        <div
          className="header-workspace-user"
          title="Offline-first Local Browser Workspace"
        >
          <div className="user-avatar-circle" aria-hidden="true">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              folder_managed
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.1 }}>
            <span className="font-label-sm" style={{ color: 'var(--on-surface)' }}>
              Studio Arc
            </span>
            <span className="font-code-sm" style={{ color: 'var(--outline)' }}>
              workspace
            </span>
          </div>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--outline)' }}>
            unfold_more
          </span>
        </div>
      </div>
    </header>
  );
};
