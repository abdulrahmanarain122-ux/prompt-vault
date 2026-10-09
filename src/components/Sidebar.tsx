import React, { useState } from 'react';
import type { StorageStatus, CollectionItem } from '../types/prompt';

export const DEFAULT_ENGINE_LABELS = [
  'Midjourney v6',
  'Runway Gen-3',
  'Sora',
  'Kling',
  'Flux.1',
];

const ENGINES_STORAGE_KEY = 'prompt_vault_managed_engines_v2';

export type ActiveViewMode = 'vault' | 'explore';

interface SidebarProps {
  activeViewMode: ActiveViewMode;
  onSelectViewMode: (mode: ActiveViewMode) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedFilter: string; // 'all' | 'favorites' | 'recent' | engine tag
  onSelectFilter: (filter: string) => void;
  totalCount: number;
  exploreCount?: number;
  imageCount: number;
  videoCount: number;
  animationCount?: number;
  otherCount: number;
  favoritesCount: number;
  storageStatus: StorageStatus;
  onResetStarters: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onEnginesChange?: (engines: string[]) => void;
  onNotify?: (message: string, type?: 'success' | 'error') => void;
  collections?: CollectionItem[];
  selectedCollectionId?: string | null;
  onSelectCollection?: (collectionId: string | null) => void;
  onCreateCollection?: (name: string) => Promise<boolean> | boolean;
  collectionCounts?: Record<string, number>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeViewMode,
  onSelectViewMode,
  selectedCategory,
  onSelectCategory,
  selectedFilter,
  onSelectFilter,
  totalCount,
  exploreCount = 0,
  imageCount,
  videoCount,
  animationCount = 0,
  otherCount,
  storageStatus,
  onResetStarters,
  isMobileOpen,
  onCloseMobile,
  onEnginesChange,
  onNotify,
  collections = [],
  selectedCollectionId = null,
  onSelectCollection,
  onCreateCollection,
  collectionCounts = {},
}) => {
  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isSubmittingCollection, setIsSubmittingCollection] = useState(false);
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [engines, setEngines] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(ENGINES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_ENGINE_LABELS;
  });

  const [isAddingEngine, setIsAddingEngine] = useState(false);
  const [newEngineName, setNewEngineName] = useState('');

  // Ref to hold onEnginesChange to prevent infinite loop
  const onEnginesChangeRef = React.useRef(onEnginesChange);
  React.useEffect(() => {
    onEnginesChangeRef.current = onEnginesChange;
  }, [onEnginesChange]);

  // Safely notify parent of engine list changes only when array content actually changes
  const prevEnginesStrRef = React.useRef('');
  React.useEffect(() => {
    const currentStr = JSON.stringify(engines);
    if (prevEnginesStrRef.current !== currentStr) {
      prevEnginesStrRef.current = currentStr;
      onEnginesChangeRef.current?.(engines);
    }
  }, [engines]);

  const engineItems = engines.map((name) => ({
    id: `engine-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    label: name,
    query: name.toLowerCase(),
  }));

  const handleAddEngineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newEngineName.trim();
    if (!trimmed) {
      setIsAddingEngine(false);
      return;
    }
    const exists = engines.some((name) => name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      onNotify?.(`Engine "${trimmed}" already exists.`);
      setIsAddingEngine(false);
      setNewEngineName('');
      return;
    }
    const updated = [...engines, trimmed];
    setEngines(updated);
    try {
      localStorage.setItem(ENGINES_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save engines to storage:', err);
    }
    onNotify?.(`Added engine "${trimmed}"`, 'success');
    setNewEngineName('');
    setIsAddingEngine(false);
  };

  const handleRemoveEngine = (e: React.MouseEvent, engineName: string) => {
    e.stopPropagation();
    const updated = engines.filter((n) => n !== engineName);
    setEngines(updated);
    try {
      localStorage.setItem(ENGINES_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save engines to storage:', err);
    }
    if (selectedFilter === engineName.toLowerCase()) {
      onSelectFilter('');
    }
    onNotify?.(`Removed engine "${engineName}"`);
  };

  const handleRestoreDefaultEngines = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEngines(DEFAULT_ENGINE_LABELS);
    try {
      localStorage.setItem(ENGINES_STORAGE_KEY, JSON.stringify(DEFAULT_ENGINE_LABELS));
    } catch (err) {
      console.warn('Failed to save engines to storage:', err);
    }
    onNotify?.('Restored default model engines.', 'success');
  };

  const handleCreateCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCollectionName.trim();
    if (!trimmed) {
      setCollectionError('Collection name cannot be blank.');
      return;
    }
    if (trimmed.length > 100) {
      setCollectionError('Collection name must be 100 characters or fewer.');
      return;
    }
    if (collections.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setCollectionError(`A collection named "${trimmed}" already exists.`);
      return;
    }

    try {
      setIsSubmittingCollection(true);
      setCollectionError(null);
      if (onCreateCollection) {
        const success = await onCreateCollection(trimmed);
        if (success !== false) {
          setNewCollectionName('');
          setIsAddingCollection(false);
          onNotify?.(`Created collection "${trimmed}"`, 'success');
        }
      }
    } catch (err) {
      // Preserve entered collection name on recoverable failures
      setCollectionError(err instanceof Error ? err.message : 'Failed to create collection.');
      onNotify?.(err instanceof Error ? err.message : 'Failed to create collection.', 'error');
    } finally {
      setIsSubmittingCollection(false);
    }
  };

  const handleCategoryClick = (cat: string) => {
    onSelectFilter('');
    onSelectCategory(cat);
    onCloseMobile();
  };

  const handleFilterClick = (filter: string) => {
    onSelectFilter(filter);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="drawer-backdrop open"
          style={{ zIndex: 34 }}
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
        aria-label="Navigation sidebar"
      >
        <div className="sidebar-scroll-body">
          {/* Section: View Mode */}
          <span className="sidebar-section-title">Navigation</span>
          <nav className="sidebar-nav-group" aria-label="Main view mode">
            <button
              type="button"
              className={`sidebar-nav-item ${activeViewMode === 'vault' ? 'active' : ''}`}
              onClick={() => {
                onSelectViewMode('vault');
                onCloseMobile();
              }}
            >
              <div className="sidebar-item-left">
                <span className="material-symbols-outlined" style={{ color: activeViewMode === 'vault' ? 'var(--primary-container)' : undefined }}>
                  folder_special
                </span>
                <span className="font-body-sm" style={{ fontWeight: activeViewMode === 'vault' ? 600 : 400 }}>
                  My Vault
                </span>
              </div>
              <span className="sidebar-item-count">{totalCount}</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeViewMode === 'explore' ? 'active' : ''}`}
              onClick={() => {
                onSelectViewMode('explore');
                onCloseMobile();
              }}
            >
              <div className="sidebar-item-left">
                <span className="material-symbols-outlined" style={{ color: activeViewMode === 'explore' ? 'var(--primary-container)' : undefined }}>
                  explore
                </span>
                <span className="font-body-sm" style={{ fontWeight: activeViewMode === 'explore' ? 600 : 400 }}>
                  Explore Feed
                </span>
              </div>
              <span className="sidebar-item-count" style={{ backgroundColor: 'rgba(0, 240, 255, 0.15)', color: 'var(--primary-container)' }}>
                {exploreCount > 0 ? exploreCount : 'Live'}
              </span>
            </button>
          </nav>

          {/* Section: Categories */}
          <span className="sidebar-section-title">Categories</span>
          <nav className="sidebar-nav-group" aria-label="Prompt categories">
            {/* All Prompts */}
            <button
              type="button"
              className={`sidebar-nav-item ${selectedCategory === 'All' && !selectedFilter && !selectedCollectionId ? 'active' : ''}`}
              onClick={() => {
                onSelectCollection?.(null);
                handleCategoryClick('All');
              }}
            >
              <div className="sidebar-item-left">
                <span className="material-symbols-outlined">view_list</span>
                <span className="font-body-sm">All Prompts</span>
              </div>
              <span className="sidebar-item-count">{totalCount}</span>
            </button>

            {/* Image */}
            <button
              type="button"
              className={`sidebar-nav-item ${selectedCategory.toLowerCase().includes('image') && !selectedFilter && !selectedCollectionId ? 'active' : ''}`}
              onClick={() => {
                onSelectCollection?.(null);
                handleCategoryClick('Image prompt');
              }}
            >
              <div className="sidebar-item-left">
                <span className="material-symbols-outlined">image</span>
                <span className="font-body-sm">Image</span>
              </div>
              <span className="sidebar-item-count">{imageCount}</span>
            </button>

            {/* Video */}
            <button
              type="button"
              className={`sidebar-nav-item ${selectedCategory.toLowerCase().includes('video') && !selectedFilter && !selectedCollectionId ? 'active' : ''}`}
              onClick={() => {
                onSelectCollection?.(null);
                handleCategoryClick('Video prompt');
              }}
            >
              <div className="sidebar-item-left">
                <span className="material-symbols-outlined">movie</span>
                <span className="font-body-sm">Video</span>
              </div>
              <span className="sidebar-item-count">{videoCount}</span>
            </button>

            {/* Animation */}
            <button
              type="button"
              className={`sidebar-nav-item ${selectedCategory.toLowerCase().includes('animation') && !selectedFilter && !selectedCollectionId ? 'active' : ''}`}
              onClick={() => {
                onSelectCollection?.(null);
                handleCategoryClick('Animation');
              }}
            >
              <div className="sidebar-item-left">
                <span className="material-symbols-outlined">animation</span>
                <span className="font-body-sm">Animation</span>
              </div>
              <span className="sidebar-item-count">{animationCount}</span>
            </button>

            {/* Other */}
            <button
              type="button"
              className={`sidebar-nav-item ${selectedCategory.toLowerCase().includes('other') && !selectedFilter && !selectedCollectionId ? 'active' : ''}`}
              onClick={() => {
                onSelectCollection?.(null);
                handleCategoryClick('Other');
              }}
            >
              <div className="sidebar-item-left">
                <span className="material-symbols-outlined">category</span>
                <span className="font-body-sm">Other</span>
              </div>
              <span className="sidebar-item-count">{otherCount}</span>
            </button>
          </nav>

          {/* Section: Custom Collections */}
          <div className="sidebar-section-header">
            <span className="sidebar-section-title">Collections</span>
            <button
              type="button"
              className="btn-add-engine-icon"
              onClick={() => {
                setIsAddingCollection((prev) => !prev);
                setCollectionError(null);
              }}
              title={isAddingCollection ? 'Close collection form' : 'New collection'}
              aria-label="New collection"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                {isAddingCollection ? 'close' : 'add'}
              </span>
            </button>
          </div>

          <div className="sidebar-nav-group" role="group" aria-label="Custom collections">
            {collections.length === 0 && !isAddingCollection && (
              <div style={{ padding: '6px 12px', color: 'var(--outline)', fontSize: '12px', fontStyle: 'italic' }}>
                No custom collections yet.
              </div>
            )}

            {collections.map((col) => {
              const isSelected = selectedCollectionId === col.id;
              const count = collectionCounts[col.id] ?? 0;
              return (
                <button
                  key={col.id}
                  type="button"
                  className={`sidebar-nav-item ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    onSelectCollection?.(isSelected ? null : col.id);
                    onCloseMobile();
                  }}
                  aria-label={`Collection ${col.name}, ${count} prompts`}
                >
                  <div className="sidebar-item-left">
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: '18px',
                        color: isSelected ? 'var(--primary-container)' : undefined,
                      }}
                    >
                      {col.visibility === 'public' ? 'folder_shared' : 'folder'}
                    </span>
                    <span
                      className="font-body-sm"
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '130px',
                        fontWeight: isSelected ? 600 : 400,
                      }}
                      title={col.name}
                    >
                      {col.name}
                    </span>
                  </div>
                  <span className="sidebar-item-count">{count}</span>
                </button>
              );
            })}

            {isAddingCollection ? (
              <form onSubmit={handleCreateCollectionSubmit} className="sidebar-add-engine-form" aria-label="Create collection form">
                <input
                  type="text"
                  autoFocus
                  placeholder="Collection name..."
                  value={newCollectionName}
                  onChange={(e) => {
                    setNewCollectionName(e.target.value);
                    if (collectionError) setCollectionError(null);
                  }}
                  maxLength={100}
                  className="sidebar-add-engine-input"
                  aria-label="New collection name"
                  disabled={isSubmittingCollection}
                />
                {collectionError && (
                  <div style={{ color: 'var(--error, #ffb4ab)', fontSize: '11px', padding: '2px 4px' }} role="alert">
                    {collectionError}
                  </div>
                )}
                <div className="sidebar-add-engine-actions">
                  <button
                    type="submit"
                    className="btn-engine-add-confirm"
                    disabled={isSubmittingCollection || !newCollectionName.trim()}
                  >
                    {isSubmittingCollection ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCollection(false);
                      setCollectionError(null);
                    }}
                    className="btn-engine-add-cancel"
                    disabled={isSubmittingCollection}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="sidebar-add-engine-btn"
                onClick={() => {
                  setIsAddingCollection(true);
                  setCollectionError(null);
                }}
                title="New collection"
                aria-label="New collection"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  add
                </span>
                <span>New collection</span>
              </button>
            )}
          </div>

          {/* Section: Quick Access */}
          <span className="sidebar-section-title">Quick Access</span>
          <nav className="sidebar-nav-group" aria-label="Quick filters">
            <button
              type="button"
              className={`sidebar-nav-item ${selectedFilter === 'favorites' ? 'active' : ''}`}
              onClick={() => handleFilterClick(selectedFilter === 'favorites' ? '' : 'favorites')}
            >
              <div className="sidebar-item-left">
                <span className="material-symbols-outlined">star</span>
                <span className="font-body-sm">Pinned / Favorites</span>
              </div>
            </button>
            <button
              type="button"
              className={`sidebar-nav-item ${selectedFilter === 'recent' ? 'active' : ''}`}
              onClick={() => handleFilterClick(selectedFilter === 'recent' ? '' : 'recent')}
            >
              <div className="sidebar-item-left">
                <span className="material-symbols-outlined">history</span>
                <span className="font-body-sm">Recent Copies</span>
              </div>
            </button>
          </nav>

          {/* Section: Model Engines */}
          <div className="sidebar-section-header">
            <span className="sidebar-section-title">Model Engines</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                className="btn-add-engine-icon"
                onClick={handleRestoreDefaultEngines}
                title="Restore default model engines"
                aria-label="Restore default model engines"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                  restart_alt
                </span>
              </button>
              <button
                type="button"
                className="btn-add-engine-icon"
                onClick={() => setIsAddingEngine((prev) => !prev)}
                title={isAddingEngine ? 'Close' : 'Add model engine'}
                aria-label="Add model engine"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  {isAddingEngine ? 'close' : 'add'}
                </span>
              </button>
            </div>
          </div>

          <div className="sidebar-nav-group" role="group" aria-label="Filter by AI model engine">
            {engineItems.map((engine) => (
              <div
                key={engine.id}
                className={`sidebar-nav-item ${selectedFilter === engine.query ? 'active' : ''}`}
                onClick={() => handleFilterClick(selectedFilter === engine.query ? '' : engine.query)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleFilterClick(selectedFilter === engine.query ? '' : engine.query);
                  }
                }}
              >
                <div className="sidebar-item-left">
                  <span className="engine-bullet" aria-hidden="true" />
                  <span className="font-code-sm">{engine.label}</span>
                </div>
                <button
                  type="button"
                  className="btn-remove-engine"
                  onClick={(e) => handleRemoveEngine(e, engine.label)}
                  title={`Remove engine ${engine.label}`}
                  aria-label={`Remove engine ${engine.label}`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                    close
                  </span>
                </button>
              </div>
            ))}

            {/* Inline Add Engine Form or Button */}
            {isAddingEngine ? (
              <form onSubmit={handleAddEngineSubmit} className="sidebar-add-engine-form">
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Luma, Ideogram..."
                  value={newEngineName}
                  onChange={(e) => setNewEngineName(e.target.value)}
                  className="sidebar-add-engine-input"
                  aria-label="New model engine name"
                />
                <div className="sidebar-add-engine-actions">
                  <button type="submit" className="btn-engine-add-confirm">
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingEngine(false);
                      setNewEngineName('');
                    }}
                    className="btn-engine-add-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="sidebar-add-engine-btn"
                onClick={() => setIsAddingEngine(true)}
                title="Add custom model engine"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  add
                </span>
                <span>Add Model Engine</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Workspace Status & Starter Reset Widget */}
        <div className="sidebar-footer-widget">
          <div
            className="sidebar-config-card"
            onClick={onResetStarters}
            title="Click to restore starter prompts or check storage stats"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary-container)' }}>
                tune
              </span>
              <span className="font-label-sm" style={{ color: 'var(--on-surface-variant)' }}>
                Workspace Config
              </span>
            </div>
            <span className="config-badge" title="Browser Local Storage Mode">
              {(storageStatus.estimatedBytes / 1024).toFixed(0)} KB
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
