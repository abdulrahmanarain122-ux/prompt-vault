import React, { useRef, useEffect } from 'react';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories: { name: string; count: number }[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  totalCount: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onSelectCategory,
  totalCount,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: '/' focuses search input unless focused in another input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <section className="toolbar-section" aria-label="Prompt search and category filters">
      {/* Search Input */}
      <div className="search-bar-wrap">
        <span className="search-icon-left" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          ref={searchInputRef}
          type="text"
          id="prompt-search-input"
          className="search-input-field"
          placeholder="Search prompts by title, keywords, or instructions... (Press / to focus)"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search saved prompts"
        />
        <div className="search-shortcut-badge">
          {searchQuery ? (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => onSearchChange('')}
              aria-label="Clear search text"
              title="Clear search"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : (
            <kbd className="kbd-badge" title="Press forward slash to focus search">/</kbd>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="category-filter-bar" role="tablist" aria-label="Filter prompts by category">
        <button
          type="button"
          role="tab"
          id="category-tab-all"
          aria-selected={selectedCategory === 'All'}
          className={`category-tab ${selectedCategory === 'All' ? 'active' : ''}`}
          onClick={() => onSelectCategory('All')}
        >
          <span>All Prompts</span>
          <span className="category-tab-count">{totalCount}</span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat.name}
            type="button"
            role="tab"
            id={`category-tab-${cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
            aria-selected={selectedCategory === cat.name}
            className={`category-tab ${selectedCategory === cat.name ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat.name)}
          >
            <span>{cat.name}</span>
            <span className="category-tab-count">{cat.count}</span>
          </button>
        ))}
      </div>
    </section>
  );
};
