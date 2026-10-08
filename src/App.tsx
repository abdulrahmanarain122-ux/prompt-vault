import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { PromptItem, PromptFormInput, StorageStatus } from './types/prompt';
import { StorageService } from './services/storageService';
import { AppHeader } from './components/AppHeader';
import { Sidebar } from './components/Sidebar';
import { WorkspaceToolbar, type ViewMode } from './components/WorkspaceToolbar';
import { PromptCard } from './components/PromptCard';
import { PromptModal } from './components/PromptModal';
import { ConfirmModal } from './components/ConfirmModal';
import { StatusBar } from './components/StatusBar';
import { Toast } from './components/Toast';
import type { ToastMessage } from './components/Toast';

export const App: React.FC = () => {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [storageStatus, setStorageStatus] = useState<StorageStatus>({
    isAvailable: true,
    totalPrompts: 0,
    estimatedBytes: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFilter, setSelectedFilter] = useState('');
  const [selectedEngineTag, setSelectedEngineTag] = useState('');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);
  const [deletingPrompt, setDeletingPrompt] = useState<PromptItem | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [statusMessage, setStatusMessage] = useState(
    '✓ Ready • Tap copy icon on any tile to capture prompt'
  );

  // Push toast message & update status bar message
  const addToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    const newToast: ToastMessage = {
      id: 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      text,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
    setStatusMessage(`${type === 'success' ? '✓' : '⚠'} ${text}`);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync storage status
  const refreshStorage = useCallback(() => {
    const status = StorageService.getStatus();
    setStorageStatus(status);
    if (!status.isAvailable) {
      addToast(status.error || 'Browser local storage is not available.', 'error');
    }
  }, [addToast]);

  // Initial load
  useEffect(() => {
    try {
      const loaded = StorageService.getAll();
      setPrompts(loaded);
      if (loaded.length > 0) {
        setSelectedPromptId(loaded[0].id);
      }
      refreshStorage();
    } catch (err) {
      console.error('Initialization error:', err);
      addToast('Failed to load prompts from storage.', 'error');
    }
  }, [refreshStorage, addToast]);

  // Global keyboard shortcuts (Alt+N or Ctrl+N to open new prompt)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'n') || (e.ctrlKey && e.key.toLowerCase() === 'n' && !e.shiftKey)) {
        e.preventDefault();
        setEditingPrompt(null);
        setIsModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Category counts
  const categoryCounts = useMemo(() => {
    let image = 0;
    let video = 0;
    let animation = 0;
    let other = 0;

    for (const p of prompts) {
      const lower = p.category.toLowerCase();
      if (lower.includes('image')) image++;
      else if (lower.includes('video')) video++;
      else if (lower.includes('animation')) animation++;
      else other++;
    }

    return {
      image,
      video,
      animation,
      other,
      total: prompts.length,
    };
  }, [prompts]);

  const availableCategoryNames = useMemo(() => {
    const set = new Set(prompts.map((p) => p.category.trim()));
    return Array.from(set);
  }, [prompts]);

  // Filtered & sorted prompts
  const filteredPrompts = useMemo(() => {
    let result = [...prompts];

    // Category filter
    if (selectedCategory !== 'All') {
      const targetCat = selectedCategory.trim().toLowerCase();
      result = result.filter((p) => {
        const itemCat = p.category.trim().toLowerCase();
        if (targetCat.includes('image')) return itemCat.includes('image');
        if (targetCat.includes('video')) return itemCat.includes('video');
        if (targetCat.includes('animation')) return itemCat.includes('animation');
        return itemCat === targetCat;
      });
    }

    // Engine Tag filter
    if (selectedEngineTag) {
      const tag = selectedEngineTag.toLowerCase();
      result = result.filter(
        (p) =>
          p.body.toLowerCase().includes(tag) ||
          p.title.toLowerCase().includes(tag) ||
          p.category.toLowerCase().includes(tag)
      );
    }

    // Aspect Ratio filter
    if (selectedAspectRatio) {
      const ar = selectedAspectRatio.toLowerCase();
      result = result.filter(
        (p) =>
          p.body.toLowerCase().includes(ar) ||
          p.body.toLowerCase().includes(`--ar ${ar}`)
      );
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.body.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => b.updatedAt - a.updatedAt);
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [prompts, selectedCategory, selectedEngineTag, selectedAspectRatio, searchQuery, sortBy]);

  // Handlers
  const handleOpenNewPrompt = () => {
    setEditingPrompt(null);
    setIsModalOpen(true);
  };

  const handleEditPrompt = (prompt: PromptItem) => {
    setEditingPrompt(prompt);
    setIsModalOpen(true);
  };

  const handleDeletePromptRequest = (prompt: PromptItem) => {
    setDeletingPrompt(prompt);
  };

  const handleConfirmDelete = () => {
    if (!deletingPrompt) return;
    try {
      StorageService.delete(deletingPrompt.id);
      setPrompts((prev) => prev.filter((p) => p.id !== deletingPrompt.id));
      refreshStorage();
      addToast(`Deleted prompt "${deletingPrompt.title}".`, 'success');
      if (selectedPromptId === deletingPrompt.id) {
        setSelectedPromptId(null);
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete prompt', 'error');
    } finally {
      setDeletingPrompt(null);
    }
  };

  const handleSavePrompt = (input: PromptFormInput, editId?: string) => {
    try {
      if (editId) {
        const updated = StorageService.update(editId, input);
        setPrompts((prev) => prev.map((p) => (p.id === editId ? updated : p)));
        addToast(`Updated "${updated.title}" successfully!`, 'success');
        setSelectedPromptId(updated.id);
      } else {
        const created = StorageService.create(input);
        setPrompts((prev) => [created, ...prev]);
        addToast(`Saved "${created.title}" to vault!`, 'success');
        setSelectedPromptId(created.id);
      }
      refreshStorage();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Could not save prompt', 'error');
    }
  };

  const handleRestoreStarters = () => {
    if (
      window.confirm(
        'Reset vault back to initial motion and video starter prompts? Any current custom prompts will be replaced.'
      )
    ) {
      const restored = StorageService.resetToStarters();
      setPrompts(restored);
      setSelectedCategory('All');
      setSelectedFilter('');
      setSelectedEngineTag('');
      setSelectedAspectRatio('');
      setSearchQuery('');
      refreshStorage();
      addToast('Restored motion & video starter prompts.', 'success');
      if (restored.length > 0) {
        setSelectedPromptId(restored[0].id);
      }
    }
  };

  const handleFocusSearch = () => {
    const input = document.getElementById('workspace-search-input') as HTMLInputElement;
    input?.focus();
  };

  return (
    <div className="app-layout">
      {/* Fixed Header */}
      <AppHeader
        storageStatus={storageStatus}
        totalPrompts={prompts.length}
        onNewPrompt={handleOpenNewPrompt}
        onFocusSearch={handleFocusSearch}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        onResetStarters={handleRestoreStarters}
      />

      {/* Fixed Left Navigation Sidebar */}
      <Sidebar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedFilter={selectedFilter}
        onSelectFilter={setSelectedFilter}
        totalCount={categoryCounts.total}
        imageCount={categoryCounts.image}
        videoCount={categoryCounts.video}
        animationCount={categoryCounts.animation}
        otherCount={categoryCounts.other}
        favoritesCount={0}
        storageStatus={storageStatus}
        onResetStarters={handleRestoreStarters}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Workspace Area with 256px Left Padding on Desktop */}
      <div className="workspace-pl">
        <main className="main-content">
          {/* Workspace Context & Filter Ribbon */}
          <WorkspaceToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedEngineTag={selectedEngineTag}
            onSelectEngineTag={setSelectedEngineTag}
            selectedAspectRatio={selectedAspectRatio}
            onSelectAspectRatio={setSelectedAspectRatio}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalFilteredCount={filteredPrompts.length}
            totalStoredCount={prompts.length}
            onNewPrompt={handleOpenNewPrompt}
            onBatchAction={handleRestoreStarters}
          />

          {/* Primary Workspace Content Body */}
          <div className="workspace-content-body">
            {/* Main Cards Gallery */}
            <div className={`cards-canvas view-${viewMode}`}>
              {filteredPrompts.length > 0 ? (
                <>
                  {filteredPrompts.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      onEdit={handleEditPrompt}
                      onDelete={handleDeletePromptRequest}
                      onNotify={addToast}
                    />
                  ))}

                  {/* Quick Add Placeholder Trigger Tile */}
                  <button
                    type="button"
                    className="prompt-card-placeholder"
                    onClick={handleOpenNewPrompt}
                  >
                    <div className="placeholder-plus-circle">
                      <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                        add
                      </span>
                    </div>
                    <span className="font-headline-sm" style={{ color: 'var(--on-surface)', marginBottom: '4px' }}>
                      Create New Prompt Archetype
                    </span>
                    <span className="font-body-sm" style={{ color: 'var(--outline)', maxWidth: '280px' }}>
                      Standardize tags, seed controls, and negative tokens for faster multi-model production.
                    </span>
                    <div
                      style={{
                        marginTop: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--outline)',
                      }}
                    >
                      <span>Press</span>
                      <span className="kbd-chip">⌘N</span>
                    </div>
                  </button>
                </>
              ) : (
                /* Empty State */
                <div
                  style={{
                    gridColumn: '1 / -1',
                    padding: '64px 24px',
                    textAlign: 'center',
                    backgroundColor: 'var(--surface-container-low)',
                    border: '1px dashed var(--outline-variant)',
                    borderRadius: 'var(--radius-lg)',
                    maxWidth: '560px',
                    margin: '32px auto',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 240, 255, 0.1)',
                      color: 'var(--primary-container)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                      search
                    </span>
                  </div>
                  <h3 className="font-headline-sm" style={{ color: 'var(--on-surface)', marginBottom: '8px' }}>
                    {prompts.length === 0 ? 'Your Prompt Vault is Empty' : 'No Matching Prompts Found'}
                  </h3>
                  <p className="font-body-sm" style={{ color: 'var(--outline)', marginBottom: '20px' }}>
                    {prompts.length === 0
                      ? 'Start saving your favorite AI video, image, and motion design prompts.'
                      : 'No prompts match the current search query or active category filters.'}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {searchQuery && (
                      <button
                        type="button"
                        className="btn-toolbar-new"
                        style={{ backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface)' }}
                        onClick={() => setSearchQuery('')}
                      >
                        Clear Search
                      </button>
                    )}
                    {selectedCategory !== 'All' && (
                      <button
                        type="button"
                        className="btn-toolbar-new"
                        style={{ backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface)' }}
                        onClick={() => setSelectedCategory('All')}
                      >
                        Show All Categories
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-toolbar-new"
                      onClick={handleOpenNewPrompt}
                    >
                      + Create New Prompt
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Fixed Bottom Status & Feedback Bar */}
        <StatusBar
          statusMessage={statusMessage}
          storageStatus={storageStatus}
          totalPrompts={prompts.length}
        />
      </div>

      {/* Modal Dialog for Add/Edit (Preserved while Phase 4 Slide-over Drawer is prepared) */}
      <PromptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSavePrompt}
        initialPrompt={editingPrompt}
        availableCategories={availableCategoryNames}
      />

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={Boolean(deletingPrompt)}
        prompt={deletingPrompt}
        onCancel={() => setDeletingPrompt(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Toast Notification Queue */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
