import React, { useEffect } from 'react';
import type { PromptItem } from '../types/prompt';

interface ConfirmModalProps {
  isOpen: boolean;
  prompt: PromptItem | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  prompt,
  onCancel,
  onConfirm,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !prompt) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-heading"
      aria-describedby="confirm-delete-desc"
    >
      <div className="modal-box" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h2 id="confirm-delete-heading" className="modal-title" style={{ color: 'var(--danger)' }}>
            Delete Prompt?
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onCancel}
            aria-label="Cancel deletion"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <p id="confirm-delete-desc" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Are you sure you want to permanently delete{' '}
            <strong style={{ color: 'var(--text-primary)' }}>&ldquo;{prompt.title}&rdquo;</strong>?
          </p>
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--danger-surface)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              color: '#fca5a5',
            }}
          >
            This action immediately removes the record from your browser storage and cannot be undone.
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger"
            id="confirm-delete-btn"
            onClick={onConfirm}
          >
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
};
