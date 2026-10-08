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
      className="confirm-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-heading"
      aria-describedby="confirm-delete-desc"
    >
      <div className="confirm-modal-card">
        <div className="confirm-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--error)', fontSize: '20px' }}>
              warning
            </span>
            <h2 id="confirm-delete-heading" className="font-headline-sm" style={{ color: 'var(--error)' }}>
              Delete Prompt Archetype?
            </h2>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onCancel}
            aria-label="Cancel deletion"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              close
            </span>
          </button>
        </div>

        <div className="confirm-modal-body">
          <p id="confirm-delete-desc" className="font-body-md" style={{ color: 'var(--on-surface-variant)' }}>
            Are you sure you want to delete{' '}
            <strong style={{ color: 'var(--on-surface)' }}>&ldquo;{prompt.title}&rdquo;</strong>?
          </p>
          <div className="confirm-warning-callout">
            This action immediately deletes the record from your browser local storage. This action cannot be undone.
          </div>
        </div>

        <div className="confirm-modal-footer">
          <button
            type="button"
            className="btn-drawer-discard"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-confirm-delete"
            id="confirm-delete-btn"
            onClick={onConfirm}
          >
            Permanently Delete
          </button>
        </div>
      </div>
    </div>
  );
};
