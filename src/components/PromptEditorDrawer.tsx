import React, { useState, useEffect, useRef } from 'react';
import type { PromptItem, PromptFormInput } from '../types/prompt';

interface PromptEditorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: PromptFormInput, editId?: string) => void;
  onDeleteRequest?: (prompt: PromptItem) => void;
  initialPrompt?: PromptItem | null;
  availableCategories: string[];
}

const PRESET_CATEGORIES = ['Image', 'Video', 'Other'];

const PRESET_ENGINES = [
  'Runway Gen-3 Alpha',
  'Midjourney v6.1',
  'Flux.1 Dev / Schnell',
  'Sora (OpenAI)',
  'Kling AI 1.5',
  'Luma Dream Machine',
  'Stable Video Diffusion',
  'Claude 3.5 Sonnet Directive',
];

const PRESET_ASPECT_RATIOS = [
  '2.39:1 (Cinemascope Anamorphic)',
  '16:9 (Widescreen Landscape)',
  '9:16 (Vertical Portrait)',
  '1:1 (Square)',
  '4:5 (Instagram Frame)',
];

import { useAuth } from '../context/AuthContext';

export const PromptEditorDrawer: React.FC<PromptEditorDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDeleteRequest,
  initialPrompt,
}) => {
  const { user, openAuthModal } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(PRESET_CATEGORIES[0]);
  const [engine, setEngine] = useState(PRESET_ENGINES[0]);
  const [aspectRatio, setAspectRatio] = useState(PRESET_ASPECT_RATIOS[1]);
  const [body, setBody] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Sync form when drawer opens or initialPrompt changes
  useEffect(() => {
    if (isOpen) {
      if (initialPrompt) {
        setTitle(initialPrompt.title);
        setBody(initialPrompt.body);
        setVisibility(initialPrompt.visibility || 'private');

        // Normalize category
        const catMatch = PRESET_CATEGORIES.find((c) =>
          initialPrompt.category.toLowerCase().includes(c.toLowerCase())
        );
        setCategory(catMatch || 'Other');

        setEngine(initialPrompt.engine || PRESET_ENGINES[0]);
        setAspectRatio(
          initialPrompt.aspectRatio
            ? PRESET_ASPECT_RATIOS.find((ar) => ar.startsWith(initialPrompt.aspectRatio!)) ||
              initialPrompt.aspectRatio
            : PRESET_ASPECT_RATIOS[1]
        );
        setNegativePrompt(initialPrompt.negativePrompt || '');
        setTags(initialPrompt.tags || []);
      } else {
        setTitle('');
        setBody('');
        setCategory(PRESET_CATEGORIES[0]);
        setEngine(PRESET_ENGINES[0]);
        setAspectRatio(PRESET_ASPECT_RATIOS[1]);
        setNegativePrompt('');
        setTags([]);
        setVisibility('private');
      }
      setTagInput('');
      setErrors({});
      setTimeout(() => titleInputRef.current?.focus(), 80);
    }
  }, [isOpen, initialPrompt]);

  // Keyboard shortcut: Escape to close, Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, title, category, engine, aspectRatio, body, negativePrompt, tags]);

  if (!isOpen) return null;

  const handleSave = () => {
    const newErrors: { title?: string; body?: string } = {};
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle) {
      newErrors.title = 'Prompt title is required.';
    }
    if (!trimmedBody) {
      newErrors.body = 'Prompt instructions cannot be empty.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Extract raw AR string (e.g. "16:9" from "16:9 (Widescreen Landscape)")
    const arCode = aspectRatio.split(' ')[0];

    onSubmit(
      {
        title: trimmedTitle,
        category: `${category} prompt`,
        body: trimmedBody,
        engine,
        aspectRatio: arCode,
        negativePrompt: negativePrompt.trim(),
        tags,
        visibility,
      },
      initialPrompt ? initialPrompt.id : undefined
    );

    onClose();
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, '');
      if (clean && !tags.includes(clean)) {
        setTags((prev) => [...prev, clean]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const estimatedTokens = Math.round(wordCount * 1.3);

  return (
    <div
      className={`drawer-backdrop ${isOpen ? 'open' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-heading"
    >
      <div className="drawer-panel" role="document">
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <div className="pulse-dot" aria-hidden="true" />
            <div>
              <h2 id="drawer-heading" className="font-headline-sm" style={{ color: 'var(--on-surface)' }}>
                {initialPrompt ? 'Edit Prompt Archetype' : 'New Prompt Archetype'}
              </h2>
              <span className="font-code-sm" style={{ color: 'var(--outline)' }}>
                {initialPrompt ? `ID: ${initialPrompt.id} • Modified in draft` : 'Create new workspace record'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              close
            </span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="drawer-body-form">
          {/* Prompt Title */}
          <div className="drawer-field-group">
            <label htmlFor="drawer-title-field" className="drawer-label">
              <span>Prompt Title</span>
              <span className="font-code-sm" style={{ color: 'var(--outline)' }}>
                {title.length}/120
              </span>
            </label>
            <input
              ref={titleInputRef}
              id="drawer-title-field"
              type="text"
              className="drawer-input-text"
              placeholder="e.g. Brutalist Concrete Monolith in Dense Rain"
              maxLength={120}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              required
            />
            {errors.title && (
              <span className="font-code-sm" style={{ color: 'var(--error)' }} role="alert">
                {errors.title}
              </span>
            )}
          </div>

          {/* Cloud Sharing & Visibility Segmented Control */}
          <div className="drawer-field-group">
            <label className="drawer-label">
              <span>Cloud Sharing & Visibility</span>
              <span className="font-code-sm" style={{ color: visibility === 'public' ? 'var(--primary-container)' : 'var(--outline)' }}>
                {visibility === 'public' ? '🌐 Public Community' : '🔒 Private Vault'}
              </span>
            </label>
            <div className="visibility-segmented-toggle">
              <button
                type="button"
                className={`visibility-toggle-btn ${visibility === 'private' ? 'active' : ''}`}
                onClick={() => setVisibility('private')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  lock
                </span>
                <span>Private Vault</span>
              </button>
              <button
                type="button"
                className={`visibility-toggle-btn ${visibility === 'public' ? 'active' : ''}`}
                onClick={() => {
                  if (!user) {
                    openAuthModal('login');
                    return;
                  }
                  setVisibility('public');
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  public
                </span>
                <span>Public Community</span>
              </button>
            </div>
            {!user && (
              <p className="font-code-sm" style={{ color: 'var(--outline)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary-container)' }}>info</span>
                <span>
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-container)', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                  >
                    Sign in
                  </button>{' '}
                  is required to publish prompts for the community.
                </span>
              </p>
            )}
          </div>

          {/* Archetype Category Selector */}
          <div className="drawer-field-group">
            <label className="drawer-label">Archetype Category</label>
            <div className="drawer-category-grid" role="group" aria-label="Prompt Category">
              {PRESET_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`drawer-cat-btn ${category === cat ? 'active' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Dual Dropdowns: Target Engine & Aspect Ratio */}
          <div className="drawer-dual-grid">
            <div className="drawer-field-group">
              <label htmlFor="drawer-engine-select" className="drawer-label">
                Target Engine
              </label>
              <select
                id="drawer-engine-select"
                className="drawer-select"
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
              >
                {PRESET_ENGINES.map((eng) => (
                  <option key={eng} value={eng}>
                    {eng}
                  </option>
                ))}
              </select>
            </div>

            <div className="drawer-field-group">
              <label htmlFor="drawer-ar-select" className="drawer-label">
                Aspect Ratio
              </label>
              <select
                id="drawer-ar-select"
                className="drawer-select font-mono"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
              >
                {PRESET_ASPECT_RATIOS.map((ar) => (
                  <option key={ar} value={ar}>
                    {ar}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Syntax Prompt Textarea */}
          <div className="drawer-field-group">
            <div className="drawer-label">
              <span>Main Prompt Instruction</span>
              <span className="font-code-sm" style={{ color: 'var(--outline)' }}>
                Tokens: ~{estimatedTokens} • {wordCount} words
              </span>
            </div>
            <textarea
              id="drawer-prompt-body"
              className="drawer-textarea"
              rows={7}
              placeholder="Enter exact prompt parameters, camera movements, lighting blueprints, seed..."
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                if (errors.body) setErrors((prev) => ({ ...prev, body: undefined }));
              }}
              required
            />
            {errors.body && (
              <span className="font-code-sm" style={{ color: 'var(--error)' }} role="alert">
                {errors.body}
              </span>
            )}
          </div>

          {/* Negative Prompt / Exclusions */}
          <div className="drawer-field-group">
            <label htmlFor="drawer-negative-field" className="drawer-label">
              Negative / Exclusions
            </label>
            <input
              id="drawer-negative-field"
              type="text"
              className="drawer-input-text font-code-sm"
              style={{ color: 'var(--error)' }}
              placeholder="e.g. no blur, cartoonish, lowres, oversaturated plastic"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
            />
          </div>

          {/* Workflow Tags */}
          <div className="drawer-field-group">
            <label htmlFor="drawer-tags-input" className="drawer-label">
              Workflow Tags
            </label>
            <div className="drawer-tags-box">
              {tags.map((tag) => (
                <span key={tag} className="drawer-tag-chip">
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                id="drawer-tags-input"
                type="text"
                className="drawer-tag-input"
                placeholder="+ Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
            </div>
          </div>
        </div>

        {/* Fixed Action Footer */}
        <div className="drawer-footer">
          {initialPrompt ? (
            <button
              type="button"
              className="btn-drawer-delete"
              onClick={() => onDeleteRequest?.(initialPrompt)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                delete
              </span>
              <span>Delete</span>
            </button>
          ) : (
            <div />
          )}

          <div className="drawer-footer-right">
            <button
              type="button"
              className="btn-drawer-discard"
              onClick={onClose}
            >
              Discard
            </button>
            <button
              type="button"
              className="btn-drawer-save"
              onClick={handleSave}
              id="save-to-vault-btn"
            >
              <span>Save to Vault</span>
              <span className="kbd-chip" style={{ backgroundColor: 'rgba(0, 54, 58, 0.4)', color: 'var(--on-primary-container)' }}>
                ⌘S
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
