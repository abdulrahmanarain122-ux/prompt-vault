import React from 'react';
import type { StorageStatus } from '../types/prompt';

interface StatusBarProps {
  statusMessage: string;
  storageStatus: StorageStatus;
  totalPrompts: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  statusMessage,
  storageStatus,
  totalPrompts,
}) => {
  // Usage calculation against a 500 prompt local vault target
  const maxQuota = 500;
  const usagePercent = Math.min(100, Math.max(1, (totalPrompts / maxQuota) * 100));

  return (
    <footer className="fixed-status-bar" role="contentinfo" aria-label="Application status">
      {/* Interactive feedback status message */}
      <div className="status-left-toast">
        <span className="pulse-dot" style={{ width: '6px', height: '6px' }} aria-hidden="true" />
        <span id="statusBarMessage">{statusMessage}</span>
      </div>

      {/* Vault Usage & Sync Stats */}
      <div className="status-right-cluster">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="font-label-sm" style={{ color: 'var(--outline)' }}>
            Vault Usage:
          </span>
          <div className="status-progress-track">
            <div
              className="status-progress-bar"
              style={{ width: `${usagePercent.toFixed(1)}%` }}
            />
          </div>
          <span className="font-code-sm" style={{ color: 'var(--outline)' }}>
            {totalPrompts}/{maxQuota} ({usagePercent.toFixed(1)}%)
          </span>
        </div>

        <div
          style={{ width: '1px', height: '12px', backgroundColor: 'var(--surface-container-high)' }}
          aria-hidden="true"
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary-container)' }}>
            sync
          </span>
          <span className="font-code-sm" style={{ color: 'var(--outline)' }}>
            Sync: Local ({(storageStatus.estimatedBytes / 1024).toFixed(1)} KB)
          </span>
        </div>
      </div>
    </footer>
  );
};
