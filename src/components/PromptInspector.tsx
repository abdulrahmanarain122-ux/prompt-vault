import React from 'react';
import type { PromptItem, CollectionItem } from '../types/prompt';
import { copyPromptToClipboard } from '../utils/promptCopy';

interface PromptInspectorProps {
  selectedPrompt: PromptItem | null;
  onAppendToken?: (token: string) => void;
  onToggleVisibility?: (prompt: PromptItem) => void;
  onNotify: (message: string, type?: 'success' | 'error') => void;
  collections?: CollectionItem[];
  onToggleCollectionMembership?: (promptId: string, collectionId: string) => void;
}

export const PromptInspector: React.FC<PromptInspectorProps> = ({
  selectedPrompt,
  onAppendToken,
  onToggleVisibility,
  onNotify,
  collections = [],
  onToggleCollectionMembership,
}) => {
  const quickTokens = [
    '+ --ar 16:9',
    '+ --style raw',
    '+ --v 6.1',
    '+ anamorphic flare',
    '+ volumetric dust',
    '+ Kodak 250D',
  ];

  const handleTokenClick = async (token: string) => {
    const rawToken = token.replace(/^\+\s*/, '');
    try {
      if (onAppendToken) {
        onAppendToken(rawToken);
      } else {
        await navigator.clipboard.writeText(rawToken);
        onNotify(`Copied "${rawToken}" to clipboard!`, 'success');
      }
    } catch {
      onNotify(`Token: ${rawToken}`);
    }
  };

  const wordCount = selectedPrompt?.body.trim()
    ? selectedPrompt.body.trim().split(/\s+/).length
    : 0;
  const estimatedTokens = Math.round(wordCount * 1.3);
  const clipWindowMax = 77;
  const tokenPercent = Math.min(100, Math.round((estimatedTokens / clipWindowMax) * 100));

  const shortId = selectedPrompt
    ? `PV-${selectedPrompt.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase().padStart(4, '0')}`
    : 'PV-NONE';

  const engine = selectedPrompt?.engine || (selectedPrompt?.category.toLowerCase().includes('video') ? 'Runway Gen-3' : 'Flux.1 Dev');
  const ar = selectedPrompt?.aspectRatio || '16:9';

  return (
    <aside className="inspector-rail" aria-label="Selected prompt inspector rail">
      {/* Fast Stats Bento */}
      <div className="inspector-bento-card">
        <div className="inspector-bento-header">
          <span className="font-label-sm uppercase tracking-wider" style={{ color: 'var(--outline)' }}>
            Active Selection Inspector
          </span>
          <span className="font-code-sm" style={{ color: 'var(--primary)' }}>
            {shortId}
          </span>
        </div>

        {/* Model Target Box */}
        <div className="inspector-target-box">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="font-label-sm" style={{ color: 'var(--outline)' }}>
              Model Target
            </span>
            <span className="font-body-sm" style={{ color: 'var(--on-surface)', fontWeight: 500 }}>
              {engine}
            </span>
          </div>
          <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: '20px' }}>
            movie
          </span>
        </div>

        {/* Token Estimation Visual Bar */}
        <div className="inspector-progress-wrap">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} className="font-code-sm">
            <span style={{ color: 'var(--outline)' }}>Estimated Tokens</span>
            <span style={{ color: 'var(--on-surface)' }}>
              {estimatedTokens} / {clipWindowMax} clip window
            </span>
          </div>
          <div className="inspector-progress-track">
            <div
              className="inspector-progress-bar"
              style={{ width: `${tokenPercent}%` }}
            />
          </div>
        </div>

        {/* Parameter Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '4px' }}>
          <div className="inspector-param-row">
            <span style={{ color: 'var(--outline)' }}>Aspect Ratio</span>
            <span style={{ color: 'var(--on-surface)' }}>{ar}</span>
          </div>
          <div className="inspector-param-row">
            <span style={{ color: 'var(--outline)' }}>Word Count</span>
            <span style={{ color: 'var(--on-surface)' }}>{wordCount} words</span>
          </div>
          <div className="inspector-param-row">
            <span style={{ color: 'var(--outline)' }}>Archetype</span>
            <span style={{ color: 'var(--on-surface)' }}>
              {selectedPrompt ? selectedPrompt.category : 'None'}
            </span>
          </div>
          <div className="inspector-param-row">
            <span style={{ color: 'var(--outline)' }}>Cloud Visibility</span>
            <span style={{ color: selectedPrompt?.visibility === 'public' ? 'var(--primary-container)' : 'var(--outline)', fontWeight: 600 }}>
              {selectedPrompt?.visibility === 'public' ? '🌐 Public Community' : '🔒 Private Vault'}
            </span>
          </div>

          {selectedPrompt && onToggleVisibility && (
            <div style={{ paddingTop: '4px' }}>
              <button
                type="button"
                className="btn-toolbar-new"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  backgroundColor: selectedPrompt.visibility === 'public' ? 'rgba(255,255,255,0.06)' : 'rgba(0, 240, 255, 0.12)',
                  color: selectedPrompt.visibility === 'public' ? 'var(--on-surface)' : 'var(--primary-container)',
                  border: '1px solid var(--border-subtle)',
                }}
                onClick={() => onToggleVisibility(selectedPrompt)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  {selectedPrompt.visibility === 'public' ? 'lock' : 'public'}
                </span>
                <span>
                  {selectedPrompt.visibility === 'public' ? 'Switch to Private' : 'Publish as Public'}
                </span>
              </button>
            </div>
          )}

          {selectedPrompt && (
            <div style={{ paddingTop: '4px' }}>
              <button
                type="button"
                className="btn-card-copy"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={async () => {
                  try {
                    await copyPromptToClipboard(selectedPrompt);
                    onNotify(`Copied "${selectedPrompt.title}" to clipboard!`, 'success');
                  } catch {
                    onNotify('Could not copy to clipboard. Please select manually.', 'error');
                  }
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  content_copy
                </span>
                <span>Copy Full Prompt</span>
              </button>
            </div>
          )}

          {selectedPrompt?.authorUsername && (
            <div className="inspector-param-row">
              <span style={{ color: 'var(--outline)' }}>Creator</span>
              <span style={{ color: 'var(--primary)' }}>@{selectedPrompt.authorUsername}</span>
            </div>
          )}
          {selectedPrompt?.shareUrl && selectedPrompt.visibility === 'public' && (
            <div style={{ paddingTop: '6px' }}>
              <button
                type="button"
                className="btn-card-copy"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  navigator.clipboard.writeText(selectedPrompt.shareUrl!);
                  onNotify('Copied public shareable link!', 'success');
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  share
                </span>
                <span>Copy Share Link</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Custom Collections Membership Bento */}
      {selectedPrompt && collections && collections.length > 0 && (
        <div className="inspector-bento-card" aria-label="Prompt collections membership">
          <div className="inspector-bento-header">
            <span className="font-label-sm uppercase tracking-wider" style={{ color: 'var(--outline)' }}>
              Collections Membership
            </span>
            <span className="font-code-sm" style={{ color: 'var(--primary)' }}>
              {(selectedPrompt.collectionIds || []).length} assigned
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '6px' }}>
            {collections.map((col) => {
              const isMember = Boolean(selectedPrompt.collectionIds?.includes(col.id));
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => onToggleCollectionMembership?.(selectedPrompt.id, col.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    backgroundColor: isMember ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: isMember ? '1px solid var(--primary-container)' : '1px solid var(--border-subtle)',
                    color: isMember ? 'var(--primary-container)' : 'var(--on-surface-variant)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  aria-pressed={isMember}
                  aria-label={`${isMember ? 'Remove from' : 'Add to'} collection ${col.name}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      {col.visibility === 'public' ? 'folder_shared' : 'folder'}
                    </span>
                    <span className="font-body-sm" style={{ fontWeight: isMember ? 600 : 400 }}>
                      {col.name}
                    </span>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    {isMember ? 'check_circle' : 'add_circle'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Reference Prompt Expander Utility */}
      <div className="inspector-bento-card">
        <div className="inspector-bento-header">
          <span className="font-label-sm uppercase tracking-wider" style={{ color: 'var(--outline)' }}>
            Quick Token Insert
          </span>
          <span className="font-code-sm" style={{ color: 'var(--secondary)' }}>
            Click to Copy
          </span>
        </div>
        <div className="token-inserts-cluster">
          {quickTokens.map((t) => (
            <button
              key={t}
              type="button"
              className="btn-token-insert"
              onClick={() => handleTokenClick(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Live Engine Availability Indicator */}
      <div className="inspector-bento-card">
        <span className="font-label-sm uppercase tracking-wider" style={{ color: 'var(--outline)' }}>
          Engine API Status
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '4px' }}>
          <div className="api-status-row">
            <span style={{ color: 'var(--on-surface-variant)' }}>Runway Gen-3 Gen API</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="pulse-dot" style={{ width: '6px', height: '6px' }} />
              <span className="font-code-sm" style={{ color: 'var(--primary)' }}>
                Normal
              </span>
            </div>
          </div>
          <div className="api-status-row">
            <span style={{ color: 'var(--on-surface-variant)' }}>Black Forest Flux.1</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="pulse-dot" style={{ width: '6px', height: '6px' }} />
              <span className="font-code-sm" style={{ color: 'var(--primary)' }}>
                Operational
              </span>
            </div>
          </div>
          <div className="api-status-row">
            <span style={{ color: 'var(--on-surface-variant)' }}>Prompt Vault Local Engine</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="pulse-dot" style={{ width: '6px', height: '6px' }} />
              <span className="font-code-sm" style={{ color: 'var(--primary)' }}>
                Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
