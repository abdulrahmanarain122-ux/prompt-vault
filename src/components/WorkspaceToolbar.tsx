import React, { useRef, useEffect } from 'react';

export type ViewMode = 'grid' | 'split' | 'dense';

interface WorkspaceToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalFilteredCount: number;
  totalStoredCount: number;
}

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalFilteredCount,
  totalStoredCount,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global search shortcut '/' or 'Cmd+K' / 'Ctrl+K'
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

  const getBreadcrumbCategory = () => {
    if (selectedCategory === 'All') return 'All Prompts';
    if (selectedCategory.toLowerCase().includes('image')) return 'Image';
    if (selectedCategory.toLowerCase().includes('video')) return 'Video';
    return selectedCategory;
  };

  return (
    <div className="workspace-toolbar-ribbon" role="region" aria-label="Library filters and controls">
      <div className="toolbar-unified-row">
        {/* Left: Breadcrumbs & Count */}
        <div className="toolbar-breadcrumbs">
          <span className="breadcrumb-label">Workspace</span>
          <span className="breadcrumb-slash">/</span>
          <span className="breadcrumb-current">{getBreadcrumbCategory()}</span>
          <span className="prompt-count-pill" title="Total saved prompts in current view">
            {totalFilteredCount} {totalFilteredCount === 1 ? 'prompt' : 'prompts'}
          </span>
          {totalFilteredCount !== totalStoredCount && (
            <span className="font-code-sm" style={{ color: 'var(--outline)' }}>
              (of {totalStoredCount})
            </span>
          )}
        </div>

        {/* Center: Single, Focused Search Input */}
        <div className="search-input-wrapper">
          <span className="material-symbols-outlined search-icon-pos" aria-hidden="true">
            search
          </span>
          <input
            ref={searchInputRef}
            type="text"
            id="workspace-search-input"
            className="toolbar-search-input"
            placeholder="Search prompts by title, instructions, or parameters... (Press / to focus)"
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
              ⌘K
            </span>
          )}
        </div>

        {/* Right: View Modes & Sort Controls */}
        <div className="toolbar-actions-cluster">
          {/* View Mode Switcher */}
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
              title="Dense View (List)"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                view_agenda
              </span>
              <span>Dense</span>
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            className="sort-select-btn"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="Sort prompts by"
          >
            <option value="newest">Sort: Newest</option>
            <option value="frequent">Sort: Most Copied</option>
            <option value="title">Sort: Title (A-Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
