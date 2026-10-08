import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { PromptItem, PromptFormInput, StorageStatus } from './types/prompt';
import { StorageService } from './services/storageService';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { PromptCard } from './components/PromptCard';
import { PromptModal } from './components/PromptModal';
import { ConfirmModal } from './components/ConfirmModal';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);
  const [deletingPrompt, setDeletingPrompt] = useState<PromptItem | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Push toast message
  const addToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    const newToast: ToastMessage = {
      id: 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      text,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
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
      refreshStorage();
    } catch (err) {
      console.error('Initialization error:', err);
      addToast('Failed to load prompts from storage.', 'error');
    }
  }, [refreshStorage, addToast]);

  // Global keyboard shortcuts (Ctrl+N or Alt+N to open new prompt)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'n') || (e.ctrlKey && e.key.toLowerCase() === 'n' && !e.shiftKey)) {
        // Prevent default browser new window if alt+n
        if (e.altKey) {
          e.preventDefault();
          setEditingPrompt(null);
          setIsModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Extract categories with counts
  const categoriesWithCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of prompts) {
      const cat = p.category.trim();
      map.set(cat, (map.get(cat) || 0) + 1);
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [prompts]);

  const availableCategoryNames = useMemo(() => {
    return categoriesWithCounts.map((c) => c.name);
  }, [categoriesWithCounts]);

  // Filtered prompts by Category and Search Query
  const filteredPrompts = useMemo(() => {
    let result = prompts;

    if (selectedCategory !== 'All') {
      result = result.filter(
        (p) => p.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.body.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    return result;
  }, [prompts, selectedCategory, searchQuery]);

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
      } else {
        const created = StorageService.create(input);
        setPrompts((prev) => [created, ...prev]);
        addToast(`Saved "${created.title}" to vault!`, 'success');
      }
      refreshStorage();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Could not save prompt', 'error');
    }
  };

  const handleRestoreStarters = () => {
    if (window.confirm('Reset vault back to initial motion and video starter prompts? Any current custom prompts will be replaced.')) {
      const restored = StorageService.resetToStarters();
      setPrompts(restored);
      setSelectedCategory('All');
      setSearchQuery('');
      refreshStorage();
      addToast('Restored 6 motion & video starter prompts.', 'success');
    }
  };

  return (
    <div className="app-wrapper">
      {/* Header & Storage Notice */}
      <Header
        storageStatus={storageStatus}
        onNewPrompt={handleOpenNewPrompt}
        onResetStarters={handleRestoreStarters}
      />

      <main className="main-container content-section">
        {/* Search & Category Pills */}
        <Toolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categories={categoriesWithCounts}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          totalCount={prompts.length}
        />

        {/* Results Metadata */}
        <div className="results-meta-bar">
          <span>
            Showing <strong>{filteredPrompts.length}</strong> of {prompts.length} prompts
            {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
            {searchQuery ? ` matching "${searchQuery}"` : ''}
          </span>
          {searchQuery && (
            <button
              type="button"
              className="text-btn"
              onClick={() => setSearchQuery('')}
            >
              Clear search filter
            </button>
          )}
        </div>

        {/* Prompts Grid */}
        {filteredPrompts.length > 0 ? (
          <div className="prompt-grid">
            {filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onEdit={handleEditPrompt}
                onDelete={handleDeletePromptRequest}
                onNotify={addToast}
              />
            ))}
          </div>
        ) : (
          /* Helpful Empty State */
          <div className="empty-state-card">
            <div className="empty-icon-circle" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            {prompts.length === 0 ? (
              <>
                <h3 className="empty-state-title">Your Prompt Vault is Empty</h3>
                <p className="empty-state-desc">
                  Start collecting your favorite AI video generation, image concept, and After Effects expression prompts.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleOpenNewPrompt}
                  >
                    + Create First Prompt
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      const restored = StorageService.resetToStarters();
                      setPrompts(restored);
                      refreshStorage();
                    }}
                  >
                    Restore Starter Prompts
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="empty-state-title">No Matching Prompts Found</h3>
                <p className="empty-state-desc">
                  No prompts match your current search query or category filter. Try clearing your filters or adding a new prompt.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {searchQuery && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setSearchQuery('')}
                    >
                      Clear Search Query
                    </button>
                  )}
                  {selectedCategory !== 'All' && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setSelectedCategory('All')}
                    >
                      Show All Categories
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleOpenNewPrompt}
                  >
                    + Create New Prompt
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="main-container footer-inner">
          <div>
            <strong>Prompt Vault</strong> &bull; Client-side personal prompt library for creative video & motion workflows.
          </div>
          <div>
            No server storage &bull; Zero tracking &bull; Powered by browser localStorage
          </div>
        </div>
      </footer>

      {/* Modals & Toasts */}
      <PromptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSavePrompt}
        initialPrompt={editingPrompt}
        availableCategories={availableCategoryNames}
      />

      <ConfirmModal
        isOpen={Boolean(deletingPrompt)}
        prompt={deletingPrompt}
        onCancel={() => setDeletingPrompt(null)}
        onConfirm={handleConfirmDelete}
      />

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
