import React, { useState } from 'react';
import type { StorageStatus } from '../types/prompt';

interface EngineItem {
  id: string;
  label: string;
  query: string;
  isCustom?: boolean;
}

const DEFAULT_ENGINES: EngineItem[] = [
  { id: 'engine-midjourney', label: 'Midjourney v6', query: 'midjourney' },
  { id: 'engine-runway', label: 'Runway Gen-3', query: 'runway' },
  { id: 'engine-sora', label: 'Sora', query: 'sora' },
  { id: 'engine-kling', label: 'Kling', query: 'kling' },
  { id: 'engine-flux', label: 'Flux.1', query: 'flux' },
];

const ENGINES_STORAGE_KEY = 'prompt_vault_custom_engines_v1';

interface SidebarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedFilter: string; // 'all' | 'favorites' | 'recent' | engine tag
  onSelectFilter: (filter: string) => void;
  totalCount: number;
  imageCount: number;
  videoCount: number;
  otherCount: number;
  favoritesCount: number;
  storageStatus: StorageStatus;
  onResetStarters: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onNotify?: (message: string, type?: 'success' | 'error') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedFilter,
  onSelectFilter,
  totalCount,
  imageCount,
  videoCount,
  otherCount,
  storageStatus,
  onResetStarters,
  isMobileOpen,
  onCloseMobile,
  onNotify,
}) => {
  const [customEngines, setCustomEngines] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(ENGINES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [isAddingEngine, setIsAddingEngine] = useState(false);
  const [newEngineName, setNewEngineName] = useState('');

  const allEngines = [
    ...DEFAULT_ENGINES,
    ...customEngines.map((name) => ({
      id: `custom-${name.toLowerCase().replace(/\s+/g, '-')}`,
      label: name,
      query: name.toLowerCase(),
      isCustom: true,
    })),
  ];

  const handleAddEngineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newEngineName.trim();
    if (!trimmed) {
      setIsAddingEngine(false);
      return;
    }
    const exists = allEngines.some(
      (eng) => eng.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      onNotify?.(`Engine "${trimmed}" already exists.`);
      setIsAddingEngine(false);
      setNewEngineName('');
      return;
    }
    const updated = [...customEngines, trimmed];
    setCustomEngines(updated);
    try {
      localStorage.setItem(ENGINES_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save engine to storage:', err);
    }
    onNotify?.(`Added engine "${trimmed}"`, 'success');
    setNewEngineName('');
    setIsAddingEngine(false);
  };

  const handleRemoveCustomEngine = (e: React.MouseEvent, engineName: string) => {
    e.stopPropagation();
    const updated = customEngines.filter((n) => n !== engineName);
    setCustomEngines(updated);
    try {
      localStorage.setItem(ENGINES_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save engine to storage:', err);
    }
    if (selectedFilter === engineName.toLowerCase()) {
      onSelectFilter('');
    }
    onNotify?.(`Removed engine "${engineName}"`);
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
          {/* Section: Collections / Categories */}
          <span className="sidebar-section-title">Collections</span>
          <nav className="sidebar-nav-group" aria-label="Prompt categories">
            {/* All Prompts */}
            <button
              type="button"
              className={`sidebar-nav-item ${selectedCategory === 'All' && !selectedFilter ? 'active' : ''}`}
              onClick={() => handleCategoryClick('All')}
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
              className={`sidebar-nav-item ${selectedCategory.toLowerCase().includes('image') && !selectedFilter ? 'active' : ''}`}
              onClick={() => handleCategoryClick('Image prompt')}
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
              className={`sidebar-nav-item ${selectedCategory.toLowerCase().includes('video') && !selectedFilter ? 'active' : ''}`}
              onClick={() => handleCategoryClick('Video prompt')}
            >
              <div className="sidebar-item-left">
                <span className="material-symbols-outlined">movie</span>
                <span className="font-body-sm">Video</span>
              </div>
              <span className="sidebar-item-count">{videoCount}</span>
            </button>


            {/* Other */}
            <button
              type="button"
              className={`sidebar-nav-item ${selectedCategory.toLowerCase().includes('other') && !selectedFilter ? 'active' : ''}`}
              onClick={() => handleCategoryClick('Other')}
            >
              <div className="sidebar-item-left">
                <span className="material-symbols-outlined">category</span>
                <span className="font-body-sm">Other</span>
              </div>
              <span className="sidebar-item-count">{otherCount}</span>
            </button>
          </nav>

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

          <div className="sidebar-nav-group" role="group" aria-label="Filter by AI model engine">
            {allEngines.map((engine) => (
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
                {engine.isCustom && (
                  <button
                    type="button"
                    className="btn-remove-engine"
                    onClick={(e) => handleRemoveCustomEngine(e, engine.label)}
                    title={`Remove custom engine ${engine.label}`}
                    aria-label={`Remove engine ${engine.label}`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                      close
                    </span>
                  </button>
                )}
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
