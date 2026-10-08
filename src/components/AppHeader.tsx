import React from 'react';
import type { StorageStatus } from '../types/prompt';

interface AppHeaderProps {
  storageStatus: StorageStatus;
  totalPrompts: number;
  onNewPrompt: () => void;
  onToggleMobileSidebar: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  storageStatus,
  onNewPrompt,
  onToggleMobileSidebar,
}) => {
  return (
    <header className="fixed-header" role="banner">
      <div className="header-left-cluster">
        {/* Mobile menu toggle */}
        <button
          type="button"
          className="mobile-sidebar-toggle"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation sidebar"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Studio Branding */}
        <div className="header-brand">
          <div className="brand-icon-glyph" aria-hidden="true">
            PV
          </div>
          <span className="brand-title">PROMPT VAULT</span>
          <span className="brand-badge">STUDIO v2.4</span>
        </div>
      </div>

      <div className="header-right-cluster">
        {/* Subtle Local Storage State Indicator */}
        <div
          className="header-sync-pill"
          title={`Data saved in browser localStorage (${(storageStatus.estimatedBytes / 1024).toFixed(1)} KB)`}
        >
          <span className="pulse-dot" aria-hidden="true" />
          <span className="font-label-sm" style={{ color: 'var(--on-surface-variant)' }}>
            Local Vault
          </span>
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          className="btn-header-cta"
          onClick={onNewPrompt}
          id="header-new-prompt-btn"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            add
          </span>
          <span>New Prompt</span>
        </button>

        {/* Workspace Account / Environment Indicator */}
        <div
          className="header-workspace-user"
          title="Local Workspace (Browser Storage)"
        >
          <div className="user-avatar-circle" aria-hidden="true">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              desktop_windows
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
        </div>
      </div>
    </header>
  );
};
