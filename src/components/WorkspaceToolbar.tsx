import React, { useRef, useEffect } from 'react';

export type ViewMode = 'grid' | 'split' | 'dense';

interface WorkspaceToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedEngineTag: string;
  onSelectEngineTag: (tag: string) => void;
  selectedAspectRatio: string;
  onSelectAspectRatio: (ar: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalFilteredCount: number;
  totalStoredCount: number;
  onNewPrompt: () => void;
  onBatchAction?: () => void;
}

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  selectedEngineTag,
  onSelectEngineTag,
  selectedAspectRatio,
  onSelectAspectRatio,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalFilteredCount,
  totalStoredCount,
  onNewPrompt,
  onBatchAction,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus shortcut '/' or 'Cmd+K' / 'Ctrl+K'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        onSearchChange('');
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSearchChange]);

  const categories = ['All', 'Image', 'Video', 'Animation', 'Other'];
  const engineTags = ['Flux.1', 'Runway', 'Midjourney', 'Sora'];
  const aspectRatios = ['2.39:1', '16:9', '9:16'];

  const getBreadcrumbCategory = () => {
    if (selectedCategory === 'All') return 'All Items';
    if (selectedCategory.toLowerCase().includes('image')) return 'Image Prompts';
    if (selectedCategory.toLowerCase().includes('video')) return 'Video Prompts';
    if (selectedCategory.toLowerCase().includes('animation')) return 'Animation Prompts';
    return selectedCategory;
  };

  return (
    <div className="workspace-toolbar-ribbon" role="region" aria-label="Library filters and controls">
      {/* Top Context & Action Line */}
      <div className="toolbar-top-row">
        {/* Breadcrumb + Stored Count */}
        <div className="toolbar-breadcrumbs">
          <span className="breadcrumb-label">Workspace</span>
          <span className="breadcrumb-slash">/</span>
          <span className="breadcrumb-current">Library</span>
          <span className="breadcrumb-slash">/</span>
          <span className="breadcrumb-sub">{getBreadcrumbCategory()}</span>
          <span className="prompt-count-pill" title="Total saved prompts in vault">
            {totalStoredCount} {totalStoredCount === 1 ? 'prompt' : 'prompts'} stored
          </span>
          {totalFilteredCount !== totalStoredCount && (
            <span className="font-code-sm" style={{ color: 'var(--outline)' }}>
              ({totalFilteredCount} matching)
            </span>
          )}
        </div>

        {/* Action Cluster: View Switcher, New Prompt Button, Batch Action */}
        <div className="toolbar-actions-cluster">
          {/* View Modes */}
          <div className="view-switcher-group" role="group" aria-label="Layout view mode">
            <button
              type="button"
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => onViewModeChange('grid')}
              title="Grid View (3 Columns)"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                grid_view
              </span>
              <span>Grid</span>
            </button>
            <button
              type="button"
              className={`view-btn ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => onViewModeChange('split')}
              title="Split View (2 Columns)"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                vertical_split
              </span>
              <span>Split</span>
            </button>
            <button
              type="button"
              className={`view-btn ${viewMode === 'dense' ? 'active' : ''}`}
              onClick={() => onViewModeChange('dense')}
              title="Dense View (Single Column List)"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                view_agenda
              </span>
              <span>Dense</span>
            </button>
          </div>

          {/* New Prompt Button */}
          <button
            type="button"
            className="btn-toolbar-new"
            onClick={onNewPrompt}
            id="toolbar-new-prompt-btn"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              add
            </span>
            <span>New Prompt</span>
          </button>

          {/* Batch / Extra Actions */}
          <button
            type="button"
            className="toolbar-icon-action"
            onClick={onBatchAction}
            title="Reset to Starter Prompts or Manage Vault"
            aria-label="Manage Vault"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              checklist
            </span>
          </button>
        </div>
      </div>

      {/* Second Row: Live Search & Category / Parameter Filters */}
      <div className="toolbar-filter-row">
        {/* Search Input Field */}
        <div className="search-input-wrapper">
          <span className="material-symbols-outlined search-icon-pos" aria-hidden="true">
            search
          </span>
          <input
            ref={searchInputRef}
            type="text"
            id="workspace-search-input"
            className="toolbar-search-input"
            placeholder="Filter by prompt tokens, model tags, camera parameters, seed..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Filter prompts"
          />
          {searchQuery ? (
            <button
              type="button"
              className="search-esc-chip"
              onClick={() => onSearchChange('')}
              title="Clear search filter"
              aria-label="Clear search"
            >
              ESC
            </button>
          ) : (
            <span className="search-esc-chip" title="Press Escape to clear, / to focus">
              ESC
            </span>
          )}
        </div>

        {/* Filter Badges Group */}
        <div className="filters-badge-cluster">
          {/* Category selector */}
          <div className="category-pill-group" role="tablist" aria-label="Filter by Category">
            {categories.map((cat) => {
              const isSelected =
                cat === 'All'
                  ? selectedCategory === 'All'
                  : selectedCategory.toLowerCase().startsWith(cat.toLowerCase());
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`cat-pill-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => onSelectCategory(cat === 'All' ? 'All' : `${cat} prompt`)}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="filter-divider" aria-hidden="true" />

          {/* Model Engine Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {engineTags.map((engine) => {
              const active = selectedEngineTag === engine.toLowerCase();
              return (
                <button
                  key={engine}
                  type="button"
                  className={`tag-filter-pill ${active ? 'active' : ''}`}
                  onClick={() => onSelectEngineTag(active ? '' : engine.toLowerCase())}
                >
                  {engine}
                </button>
              );
            })}
          </div>

          <div className="filter-divider" aria-hidden="true" />

          {/* Aspect Ratio Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {aspectRatios.map((ar) => {
              const active = selectedAspectRatio === ar;
              return (
                <button
                  key={ar}
                  type="button"
                  className={`tag-filter-pill ${active ? 'active' : ''}`}
                  onClick={() => onSelectAspectRatio(active ? '' : ar)}
                >
                  {ar}
                </button>
              );
            })}
          </div>

          <div className="filter-divider" aria-hidden="true" />

          {/* Sort Dropdown */}
          <select
            className="sort-select-btn"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="Sort prompts by"
          >
            <option value="frequent">Sort: Frequently Copied</option>
            <option value="newest">Sort: Newest Added</option>
            <option value="title">Sort: Title (A-Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
