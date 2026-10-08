import React from 'react';
import type { StorageStatus } from '../types/prompt';

interface HeaderProps {
  storageStatus: StorageStatus;
  onNewPrompt: () => void;
  onResetStarters: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  storageStatus,
  onNewPrompt,
  onResetStarters,
}) => {
  return (
    <>
      {/* Device Storage Limitation Notice */}
      <aside className="storage-banner" aria-label="Storage status and device limitation advisory">
        <div className="main-container storage-banner-inner">
          <div className="storage-info-group">
            <span
              className={`storage-pulse ${storageStatus.isAvailable ? '' : 'warning'}`}
              aria-hidden="true"
            />
            <span>
              <strong>Local Vault Mode:</strong> Prompts are saved strictly in this browser&apos;s local storage.
              Clearing site data or switching devices will not transfer prompts.
            </span>
          </div>
          <div className="storage-actions">
            <span className="storage-badge" title="Estimated browser storage footprint">
              {storageStatus.totalPrompts} saved ({(storageStatus.estimatedBytes / 1024).toFixed(1)} KB)
            </span>
            <button
              type="button"
              className="text-btn"
              onClick={onResetStarters}
              title="Reload initial motion & video editor starter prompts"
            >
              Restore Starters
            </button>
          </div>
        </div>
      </aside>

      {/* Main App Navigation Bar */}
      <header className="site-header">
        <div className="main-container header-inner">
          <div className="brand-section">
            <div className="brand-icon-box" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <path d="M7 10h10" />
                <path d="M7 14h6" />
                <circle cx="16" cy="14" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <div className="brand-title-wrap">
              <h1>
                Prompt Vault
                <span className="brand-tag">Motion & Video</span>
              </h1>
              <p className="brand-subtitle">Personal AI & VFX prompt library for creative workflows</p>
            </div>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="btn-primary"
              id="new-prompt-btn"
              onClick={onNewPrompt}
              aria-label="Add a new prompt"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New Prompt</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
};
