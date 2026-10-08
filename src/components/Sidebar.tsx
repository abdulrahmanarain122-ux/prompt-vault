import React from 'react';
import type { StorageStatus } from '../types/prompt';

interface SidebarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedFilter: string; // 'all' | 'favorites' | 'recent' | engine tag
  onSelectFilter: (filter: string) => void;
  totalCount: number;
  imageCount: number;
  videoCount: number;
  animationCount: number;
  otherCount: number;
  favoritesCount: number;
  storageStatus: StorageStatus;
  onResetStarters: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedFilter,
  onSelectFilter,
  totalCount,
  imageCount,
  videoCount,
  animationCount,
  otherCount,
  storageStatus,
  onResetStarters,
  isMobileOpen,
  onCloseMobile,
}) => {
  const modelEngines = [
    { id: 'engine-midjourney', label: 'Midjourney v6', query: 'midjourney' },
    { id: 'engine-runway', label: 'Runway Gen-3', query: 'runway' },
    { id: 'engine-sora', label: 'Sora', query: 'sora' },
    { id: 'engine-kling', label: 'Kling', query: 'kling' },
    { id: 'engine-flux', label: 'Flux.1', query: 'flux' },
  ];

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

            {/* Animation */}
            <button
              type="button"
              className={`sidebar-nav-item ${selectedCategory.toLowerCase().includes('animation') && !selectedFilter ? 'active' : ''}`}
              onClick={() => handleCategoryClick('Animation prompt')}
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
          <span className="sidebar-section-title">Model Engines</span>
          <div className="sidebar-nav-group" role="group" aria-label="Filter by AI model engine">
            {modelEngines.map((engine) => (
              <button
                key={engine.id}
                type="button"
                className={`sidebar-nav-item ${selectedFilter === engine.query ? 'active' : ''}`}
                onClick={() => handleFilterClick(selectedFilter === engine.query ? '' : engine.query)}
              >
                <div className="sidebar-item-left">
                  <span className="engine-bullet" aria-hidden="true" />
                  <span className="font-code-sm">{engine.label}</span>
                </div>
              </button>
            ))}
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
