import React, { useState, useEffect, useRef } from 'react';
import type { PromptItem, PromptFormInput } from '../types/prompt';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: PromptFormInput, editId?: string) => void;
  initialPrompt?: PromptItem | null;
  availableCategories: string[];
}

const PRESET_CATEGORIES = [
  'Image prompt',
  'Video prompt',
  'Other',
];

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialPrompt,
  availableCategories,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(PRESET_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<{ title?: string; body?: string; category?: string }>({});

  const titleInputRef = useRef<HTMLInputElement>(null);

  const allCategoryOptions = useMemo(() => Array.from(
    new Set([...PRESET_CATEGORIES, ...availableCategories.filter((c) => c !== 'All')])
  ), [availableCategories]);

  useEffect(() => {
    if (isOpen) {
      if (initialPrompt) {
        // eslint-disable-next-line react/set-state-in-effect
        setTitle(initialPrompt.title);
        setBody(initialPrompt.body);
        if (allCategoryOptions.includes(initialPrompt.category)) {
          setCategory(initialPrompt.category);
          setIsCustomCategory(false);
          setCustomCategory('');
        } else {
          setCategory('__custom__');
          setIsCustomCategory(true);
          setCustomCategory(initialPrompt.category);
        }
      } else {
        setTitle('');
        setBody('');
        setCategory(PRESET_CATEGORIES[0]);
        setIsCustomCategory(false);
        setCustomCategory('');
      }
      setErrors({});
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [isOpen, initialPrompt, allCategoryOptions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCategorySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '__custom__') {
      setIsCustomCategory(true);
      setCategory('__custom__');
    } else {
      setIsCustomCategory(false);
      setCategory(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { title?: string; body?: string; category?: string } = {};

    const trimmedTitle = title.trim();
    const effectiveCategory = isCustomCategory ? customCategory.trim() : category.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle) {
      newErrors.title = 'Title is required.';
    }
    if (!effectiveCategory) {
      newErrors.category = 'Category is required.';
    }
    if (!trimmedBody) {
      newErrors.body = 'Prompt content cannot be empty.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(
      {
        title: trimmedTitle,
        category: effectiveCategory,
        body: trimmedBody,
      },
      initialPrompt ? initialPrompt.id : undefined
    );
    onClose();
  };

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const charCount = body.length;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title-heading"
    >
      <div className="modal-box">
        <div className="modal-header">
          <h2 id="modal-title-heading" className="modal-title">
            {initialPrompt ? 'Edit Prompt' : 'Create New Prompt'}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          {/* Title Input */}
          <div className="form-group">
            <label htmlFor="prompt-input-title" className="form-label">
              <span>Title</span>
              <span className="char-counter">{title.length}/100</span>
            </label>
            <input
              ref={titleInputRef}
              id="prompt-input-title"
              type="text"
              className="form-input"
              maxLength={100}
              placeholder="e.g. Cinematic Anamorphic Drone Push-in"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              required
            />
            {errors.title && <span className="form-error-msg" role="alert">{errors.title}</span>}
          </div>

          {/* Category Dropdown */}
          <div className="form-group">
            <label htmlFor="prompt-input-category" className="form-label">
              Category
            </label>
            <select
              id="prompt-input-category"
              className="form-input"
              value={category}
              onChange={handleCategorySelectChange}
            >
              {allCategoryOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              <option value="__custom__">+ Custom Category...</option>
            </select>

            {isCustomCategory && (
              <input
                type="text"
                className="form-input"
                style={{ marginTop: '0.5rem' }}
                placeholder="Enter custom category name..."
                value={customCategory}
                onChange={(e) => {
                  setCustomCategory(e.target.value);
                  if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
                }}
                autoFocus
              />
            )}
            {errors.category && <span className="form-error-msg" role="alert">{errors.category}</span>}
          </div>

          {/* Body Textarea */}
          <div className="form-group">
            <label htmlFor="prompt-input-body" className="form-label">
              <span>Prompt Text & Instructions</span>
              <span className="char-counter">
                {wordCount} words &bull; {charCount} chars
              </span>
            </label>
            <textarea
              id="prompt-input-body"
              className="form-textarea"
              rows={6}
              placeholder="Enter exact prompt text..."
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                if (errors.body) setErrors((prev) => ({ ...prev, body: undefined }));
              }}
              required
            />
            {errors.body && <span className="form-error-msg" role="alert">{errors.body}</span>}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              id="submit-prompt-btn"
            >
              {initialPrompt ? 'Save Changes' : 'Add to Vault'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
