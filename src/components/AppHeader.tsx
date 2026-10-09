import React, { useState, useRef, useEffect } from 'react';
import type { StorageStatus } from '../types/prompt';
import { useAuth } from '../context/AuthContext';

interface AppHeaderProps {
  storageStatus: StorageStatus;
  totalPrompts: number;
  onNewPrompt: () => void;
  onToggleMobileSidebar: () => void;
  onSyncCloud?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  storageStatus,
  onNewPrompt,
  onToggleMobileSidebar,
  onSyncCloud,
}) => {
  const { user, profile, openAuthModal, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rawDisplayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Creator';
  const displayName = rawDisplayName.trim() || 'Creator';
  const handleTag = profile?.username ? `@${profile.username}` : user?.email || 'cloud active';

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

        {/* Auth / Account Profile Controller */}
        {user ? (
          <div className="user-profile-menu" ref={dropdownRef}>
            <div
              className="header-workspace-user"
              onClick={() => setDropdownOpen((prev) => !prev)}
              style={{ cursor: 'pointer' }}
              title="Account Menu"
            >
              <div className="user-avatar-circle" aria-hidden="true" style={{ backgroundColor: 'var(--primary-container)', color: '#002022', fontWeight: 600 }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.1 }}>
                <span className="font-label-sm" style={{ color: 'var(--on-surface)', fontWeight: 600 }}>
                  {displayName}
                </span>
                <span className="font-code-sm" style={{ color: 'var(--primary)', fontSize: '10px' }}>
                  {handleTag}
                </span>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--outline)', marginLeft: '4px' }}>
                arrow_drop_down
              </span>
            </div>

            {dropdownOpen && (
              <div className="user-menu-dropdown">
                <div className="user-menu-header">
                  <span className="font-label-sm" style={{ color: 'var(--on-surface)', fontWeight: 600 }}>
                    Anonymous Session
                  </span>
                  <span className="font-code-sm" style={{ color: 'var(--outline)' }}>
                    Device ID active
                  </span>
                </div>
                {onSyncCloud && (
                  <button
                    type="button"
                    className="user-menu-item"
                    onClick={() => {
                      setDropdownOpen(false);
                      onSyncCloud();
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary-container)' }}>
                      cloud_upload
                    </span>
                    <span>Backup Vault to Cloud</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="btn-toolbar-new"
            onClick={() => openAuthModal('login')}
            style={{ backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>
              account_circle
            </span>
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
