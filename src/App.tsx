import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { PromptItem, PromptFormInput, StorageStatus, CollectionItem } from './types/prompt';
import { StorageService } from './services/storageService';
import { AppHeader } from './components/AppHeader';
import { Sidebar } from './components/Sidebar';
import { WorkspaceToolbar, type ViewMode } from './components/WorkspaceToolbar';
import { PromptCard } from './components/PromptCard';
import { PromptInspector } from './components/PromptInspector';
import { PromptEditorDrawer } from './components/PromptEditorDrawer';
import { ConfirmModal } from './components/ConfirmModal';
import { StatusBar } from './components/StatusBar';
import { Toast } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CloudPromptService, isValidUUID } from './services/cloudPromptService';
import type { ActiveViewMode } from './components/Sidebar';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeViewMode, setActiveViewMode] = useState<ActiveViewMode>('vault');
  const [publicPrompts, setPublicPrompts] = useState<PromptItem[]>([]);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
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

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);
  const [deletingPrompt, setDeletingPrompt] = useState<PromptItem | null>(null);
  const [availableEngines, setAvailableEngines] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [statusMessage, setStatusMessage] = useState(
    '✓ Ready • Tap copy icon on any tile to capture prompt'
  );

  const handleEnginesChange = useCallback((list: string[]) => {
    setAvailableEngines(list);
  }, []);

  // Push toast message & update bottom status bar
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
      // eslint-disable-next-line react/set-state-in-effect
      setPrompts(loaded);
      if (loaded.length > 0) {
        setSelectedPromptId(loaded[0].id);
      }
      const loadedCols = StorageService.getCollections(user?.id);
      setCollections(loadedCols);
      refreshStorage();
    } catch (err) {
      console.error('Initialization error:', err);
      addToast('Failed to load prompts from storage.', 'error');
    }

    // Fetch Public Explore Community prompts
    CloudPromptService.fetchPublicPrompts().then(({ data, error }) => {
      if (!error && data) {
        setPublicPrompts(data);
      }
    });

    // Handle Shareable Deep Links (?prompt=uuid)
    const urlParams = new URLSearchParams(window.location.search);
    const sharedPromptId = urlParams.get('prompt');
    if (sharedPromptId) {
      CloudPromptService.fetchPromptById(sharedPromptId).then(({ data, error }) => {
        if (!error && data) {
          setPublicPrompts((prev) => {
            if (prev.some((p) => p.id === data.id)) return prev;
            return [data, ...prev];
          });
          setSelectedPromptId(data.id);
          setActiveViewMode('explore');
          addToast(`Loaded shared prompt: "${data.title}"`, 'success');
        } else if (error) {
          addToast('Could not load shared prompt from link.', 'error');
        }
      });
    }
  }, [refreshStorage, addToast, user]);

  // Keep collections in sync with user state
  useEffect(() => {
    try {
      const localCols = StorageService.getCollections(user?.id);
      setCollections(localCols);
    } catch {
      // ignore
    }
    if (user?.id && isValidUUID(user.id)) {
      CloudPromptService.fetchCollections(user.id).then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setCollections((prev) => {
            const map = new Map(prev.map((c) => [c.id, c]));
            data.forEach((c) => map.set(c.id, c));
            return Array.from(map.values());
          });
        }
      });
    }
  }, [user]);

  // Global keyboard shortcuts (Alt+N or Ctrl+N to open new prompt)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.altKey && e.key.toLowerCase() === 'n') ||
        (e.ctrlKey && e.key.toLowerCase() === 'n' && !e.shiftKey)
      ) {
        e.preventDefault();
        setEditingPrompt(null);
        setIsDrawerOpen(true);
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
    let favorites = 0;

    const source = activeViewMode === 'explore' ? publicPrompts : prompts;

    for (const p of source) {
      if (p.isFavorite) favorites++;
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
      favorites,
      total: source.length,
    };
  }, [prompts, publicPrompts, activeViewMode]);

  // Accessible collection counts
  const collectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const source = activeViewMode === 'explore' ? publicPrompts : prompts;
    for (const col of collections) {
      const count = source.filter((p) => {
        if (!p.collectionIds || !p.collectionIds.includes(col.id)) return false;
        if (p.visibility === 'public') return true;
        if (user?.id && p.userId === user.id) return true;
        return false;
      }).length;
      counts[col.id] = count;
    }
    return counts;
  }, [collections, prompts, publicPrompts, activeViewMode, user]);

  const availableCategoryNames = useMemo(() => {
    const source = activeViewMode === 'explore' ? publicPrompts : prompts;
    const set = new Set(source.map((p) => p.category.trim()));
    return Array.from(set);
  }, [prompts, publicPrompts, activeViewMode]);

  // Filtered & sorted prompts
  const filteredPrompts = useMemo(() => {
    let result = activeViewMode === 'explore' ? [...publicPrompts] : [...prompts];

    // Custom Collection Filter
    if (selectedCollectionId) {
      result = result.filter(
        (p) => p.collectionIds && p.collectionIds.includes(selectedCollectionId)
      );
    }

    // Quick Access Filter (favorites or recent)
    if (selectedFilter === 'favorites') {
      result = result.filter((p) => Boolean(p.isFavorite));
    } else if (selectedFilter === 'recent') {
      result = result.filter((p) => (p.copyCount ?? 0) > 0);
      result.sort((a, b) => (b.copyCount ?? 0) - (a.copyCount ?? 0));
    } else if (selectedFilter) {
      // Model engine filter from sidebar
      const tag = selectedFilter.toLowerCase();
      result = result.filter(
        (p) =>
          p.body.toLowerCase().includes(tag) ||
          p.title.toLowerCase().includes(tag) ||
          (p.engine && p.engine.toLowerCase().includes(tag))
      );
    }

    // Category filter
    if (selectedCategory !== 'All' && !selectedFilter && !selectedCollectionId) {
      const targetCat = selectedCategory.trim().toLowerCase();
      result = result.filter((p) => {
        const itemCat = p.category.trim().toLowerCase();
        if (targetCat.includes('image')) return itemCat.includes('image');
        if (targetCat.includes('video')) return itemCat.includes('video');
        if (targetCat.includes('animation')) return itemCat.includes('animation');
        return itemCat === targetCat;
      });
    }

    // Engine Tag filter from toolbar
    if (selectedEngineTag) {
      const tag = selectedEngineTag.toLowerCase();
      result = result.filter(
        (p) =>
          p.body.toLowerCase().includes(tag) ||
          p.title.toLowerCase().includes(tag) ||
          p.category.toLowerCase().includes(tag) ||
          (p.engine && p.engine.toLowerCase().includes(tag))
      );
    }

    // Aspect Ratio filter from toolbar
    if (selectedAspectRatio) {
      const ar = selectedAspectRatio.toLowerCase();
      result = result.filter(
        (p) =>
          p.body.toLowerCase().includes(ar) ||
          p.body.toLowerCase().includes(`--ar ${ar}`) ||
          (p.aspectRatio && p.aspectRatio.toLowerCase().includes(ar))
      );
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.body.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.engine && p.engine.toLowerCase().includes(q)) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // Sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => b.updatedAt - a.updatedAt);
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'frequent') {
      result.sort((a, b) => (b.copyCount ?? 0) - (a.copyCount ?? 0));
    }

    return result;
  }, [prompts, publicPrompts, activeViewMode, selectedCategory, selectedFilter, selectedEngineTag, selectedAspectRatio, searchQuery, sortBy, selectedCollectionId]);

  // Selected prompt for inspector
  const activePrompt = useMemo(() => {
    const source = activeViewMode === 'explore' ? publicPrompts : prompts;
    if (selectedPromptId) {
      const found = source.find((p) => p.id === selectedPromptId);
      if (found) return found;
    }
    return filteredPrompts.length > 0 ? filteredPrompts[0] : null;
  }, [prompts, publicPrompts, activeViewMode, selectedPromptId, filteredPrompts]);

  // Handlers
  const handleOpenNewPrompt = () => {
    setEditingPrompt(null);
    setIsDrawerOpen(true);
  };

  const handleEditPrompt = (prompt: PromptItem) => {
    setEditingPrompt(prompt);
    setIsDrawerOpen(true);
  };

  const handleDeletePromptRequest = (prompt: PromptItem) => {
    setDeletingPrompt(prompt);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPrompt) return;
    try {
      StorageService.delete(deletingPrompt.id);
      setPrompts((prev) => prev.filter((p) => p.id !== deletingPrompt.id));

      if (user && deletingPrompt.userId === user.id) {
        await CloudPromptService.deleteCloudPrompt(deletingPrompt.id);
      }

      refreshStorage();
      addToast(`Deleted prompt "${deletingPrompt.title}".`, 'success');
      if (selectedPromptId === deletingPrompt.id) {
        setSelectedPromptId(null);
      }
      if (isDrawerOpen && editingPrompt?.id === deletingPrompt.id) {
        setIsDrawerOpen(false);
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete prompt', 'error');
    } finally {
      setDeletingPrompt(null);
    }
  };

  const handleSavePrompt = async (input: PromptFormInput, editId?: string) => {
    try {
      if (editId) {
        const updated = StorageService.update(editId, input);
        setPrompts((prev) => prev.map((p) => (p.id === editId ? updated : p)));
        addToast(`Updated "${updated.title}" successfully!`, 'success');
        setSelectedPromptId(updated.id);

        if (input.visibility === 'public') {
          await CloudPromptService.upsertCloudPrompt(updated, user?.id);
        } else if (isValidUUID(editId)) {
          await CloudPromptService.updateCloudPrompt(editId, input);
        }
        const { data: updatedPublic } = await CloudPromptService.fetchPublicPrompts();
        if (updatedPublic) setPublicPrompts(updatedPublic);
      } else {
        const created = StorageService.create(input);
        setPrompts((prev) => [created, ...prev]);
        setSelectedPromptId(created.id);

        if (input.visibility === 'public') {
          const { data: cloudCreated } = await CloudPromptService.upsertCloudPrompt(created, user?.id);
          if (cloudCreated) {
            setPublicPrompts((prev) => [cloudCreated, ...prev]);
          }
        }

        addToast(`Saved "${created.title}" to vault!`, 'success');
      }
      refreshStorage();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Could not save prompt', 'error');
    }
  };

  const handleCreateCollection = useCallback(async (name: string): Promise<boolean> => {
    if (!user) {
      addToast('Signed-out visitors cannot create collections. Please sign in.', 'error');
      throw new Error('Signed-out visitors cannot create collections. Please sign in.');
    }

    const created = StorageService.createCollection({
      name,
      userId: user.id,
      visibility: 'private',
    });
    setCollections((prev) => [created, ...prev]);

    if (isValidUUID(user.id)) {
      CloudPromptService.createCloudCollection(name, user.id, 'private').catch((err) => {
        console.warn('Cloud collection sync warning:', err);
      });
    }

    addToast(`Collection "${created.name}" created!`, 'success');
    return true;
  }, [user, addToast]);

  const handleToggleCollectionMembership = useCallback((promptId: string, collectionId: string) => {
    if (!user) {
      addToast('Please sign in to manage collections.', 'error');
      return;
    }

    try {
      const targetPrompt = prompts.find((p) => p.id === promptId);
      if (!targetPrompt) return;

      const isMember = Boolean(targetPrompt.collectionIds?.includes(collectionId));
      let updatedPrompt: PromptItem;
      if (isMember) {
        updatedPrompt = StorageService.removePromptFromCollection(promptId, collectionId, user.id);
        addToast('Removed from collection', 'success');
      } else {
        updatedPrompt = StorageService.addPromptToCollection(promptId, collectionId, user.id);
        addToast('Added to collection', 'success');
      }

      setPrompts((prev) => prev.map((p) => (p.id === promptId ? updatedPrompt : p)));

      if (isValidUUID(collectionId) && isValidUUID(promptId)) {
        if (isMember) {
          CloudPromptService.removePromptFromCloudCollection(collectionId, promptId);
        } else {
          CloudPromptService.addPromptToCloudCollection(collectionId, promptId);
        }
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update collection membership', 'error');
    }
  }, [user, prompts, addToast]);

  const handleForkPrompt = async (prompt: PromptItem) => {
    if (!user) return;
    try {
      const { data, error } = await CloudPromptService.forkPrompt(prompt, user.id);
      if (error || !data) {
        addToast(error || 'Failed to fork prompt', 'error');
        return;
      }
      // Save locally to personal vault
      const created = StorageService.create({
        title: data.title,
        category: data.category,
        body: data.body,
        engine: data.engine,
        aspectRatio: data.aspectRatio,
        tags: data.tags,
        negativePrompt: data.negativePrompt,
      });
      setPrompts((prev) => [created, ...prev]);
      refreshStorage();
      addToast(`Forked "${prompt.title}" to your personal vault!`, 'success');
      setActiveViewMode('vault');
    } catch {
      addToast('Could not fork prompt', 'error');
    }
  };

  const handleToggleFavorite = (id: string) => {
    const isFav = StorageService.toggleFavorite(id);
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFavorite: isFav } : p))
    );
    addToast(isFav ? 'Pinned prompt to favorites!' : 'Removed from favorites.');
  };

  const handleCopySuccess = (prompt: PromptItem) => {
    const newCount = StorageService.incrementCopyCount(prompt.id);
    setPrompts((prev) =>
      prev.map((p) => (p.id === prompt.id ? { ...p, copyCount: newCount } : p))
    );
    if (prompt.visibility === 'public') {
      CloudPromptService.incrementCopyCount(prompt.id, prompt.copyCount || 0);
    }
  };

  const handleRestoreStarters = () => {
    if (
      window.confirm(
        'Reset vault back to initial interactive starter prompts? Any current custom prompts will be replaced.'
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
      addToast('Restored interactive starter prompts.', 'success');
      if (restored.length > 0) {
        setSelectedPromptId(restored[0].id);
      }
    }
  };

  const handleToggleVisibility = async (prompt: PromptItem) => {
    const nextVis: 'public' | 'private' = prompt.visibility === 'public' ? 'private' : 'public';

    try {
      const updatedLocal = StorageService.updateVisibility(prompt.id, nextVis);
      setPrompts((prev) => prev.map((p) => (p.id === prompt.id ? { ...p, visibility: nextVis } : p)));

      const targetPrompt = updatedLocal || { ...prompt, visibility: nextVis };

      if (nextVis === 'public') {
        const { data: cloudCreated, error: cloudErr } = await CloudPromptService.upsertCloudPrompt(
          targetPrompt,
          user?.id
        );
        if (cloudErr) {
          addToast(`Cloud sync notice: ${cloudErr}`, 'error');
        } else {
          if (cloudCreated && cloudCreated.id !== prompt.id) {
            StorageService.update(prompt.id, { ...prompt, visibility: 'public' });
          }
          addToast(`"${prompt.title}" is now published to Public Explore!`, 'success');
        }
      } else {
        if (isValidUUID(prompt.id)) {
          await CloudPromptService.updateCloudPrompt(prompt.id, { visibility: 'private' });
        }
        addToast(`"${prompt.title}" is now Private Vault.`, 'success');
      }

      const { data: updatedPublic } = await CloudPromptService.fetchPublicPrompts();
      if (updatedPublic) setPublicPrompts(updatedPublic);
    } catch {
      addToast('Failed to change visibility', 'error');
    }
  };

  const handleSyncCloud = async () => {
    if (!user) return;
    addToast('Syncing local vault to cloud...', 'success');
    const { syncedCount, error } = await CloudPromptService.syncLocalStorageToCloud(prompts, user.id);
    if (error) {
      addToast(error, 'error');
    } else {
      addToast(`Cloud Backup Complete: ${syncedCount} new prompts synced!`, 'success');
    }
  };

  return (
    <div className="app-layout">
      {/* Fixed Top Header */}
      <AppHeader
        storageStatus={storageStatus}
        totalPrompts={prompts.length}
        onNewPrompt={handleOpenNewPrompt}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        onSyncCloud={handleSyncCloud}
      />

      {/* Fixed Left Navigation Sidebar */}
      <Sidebar
        activeViewMode={activeViewMode}
        onSelectViewMode={setActiveViewMode}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedFilter={selectedFilter}
        onSelectFilter={setSelectedFilter}
        totalCount={categoryCounts.total}
        exploreCount={publicPrompts.length}
        imageCount={categoryCounts.image}
        videoCount={categoryCounts.video}
        animationCount={categoryCounts.animation}
        otherCount={categoryCounts.other}
        favoritesCount={categoryCounts.favorites}
        storageStatus={storageStatus}
        onResetStarters={handleRestoreStarters}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onEnginesChange={handleEnginesChange}
        onNotify={addToast}
        collections={collections}
        selectedCollectionId={selectedCollectionId}
        onSelectCollection={setSelectedCollectionId}
        onCreateCollection={handleCreateCollection}
        collectionCounts={collectionCounts}
      />

      {/* Workspace Area */}
      <div className="workspace-pl">
        <main className="main-content">
          {/* Workspace Toolbar: Unified single bar with breathing space */}
          <WorkspaceToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalFilteredCount={filteredPrompts.length}
            totalStoredCount={activeViewMode === 'explore' ? publicPrompts.length : prompts.length}
          />

          {/* Explore Community Header & Category Selection Bar */}
          {activeViewMode === 'explore' && (
            <div className="explore-feed-banner">
              <div className="explore-feed-headline">
                <div className="explore-feed-pill">
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                    public
                  </span>
                  <span>Explore Community Feed</span>
                </div>
                <h2 className="explore-feed-title">Global Prompt Discoveries</h2>
                <p className="explore-feed-desc">
                  Browse, test, and fork AI prompts shared publicly by creators. Select a category below to filter video, image, or reasoning prompts.
                </p>
              </div>

              {/* Category Filter Pills (Selection) */}
              <div className="explore-category-filter-group" role="tablist" aria-label="Explore Categories">
                <button
                  type="button"
                  className={`explore-category-pill ${selectedCategory === 'All' && !selectedFilter ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedFilter('');
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>view_list</span>
                  <span>All Prompts</span>
                  <span className="category-pill-count">{categoryCounts.total}</span>
                </button>

                <button
                  type="button"
                  className={`explore-category-pill ${selectedCategory.toLowerCase().includes('video') && !selectedFilter ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory('Video prompt');
                    setSelectedFilter('');
                  }}
                  title="Filter to Video prompts"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>movie</span>
                  <span>Video Prompts</span>
                  <span className="category-pill-count">{categoryCounts.video}</span>
                </button>

                <button
                  type="button"
                  className={`explore-category-pill ${selectedCategory.toLowerCase().includes('image') && !selectedFilter ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory('Image prompt');
                    setSelectedFilter('');
                  }}
                  title="Filter to Image prompts"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>image</span>
                  <span>Image Prompts</span>
                  <span className="category-pill-count">{categoryCounts.image}</span>
                </button>

                <button
                  type="button"
                  className={`explore-category-pill ${selectedCategory.toLowerCase().includes('animation') && !selectedFilter ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory('Animation');
                    setSelectedFilter('');
                  }}
                  title="Filter to Animation prompts"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>animation</span>
                  <span>Animation Prompts</span>
                  <span className="category-pill-count">{categoryCounts.animation}</span>
                </button>

                <button
                  type="button"
                  className={`explore-category-pill ${selectedCategory.toLowerCase().includes('other') && !selectedFilter ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory('Other');
                    setSelectedFilter('');
                  }}
                  title="Filter to Other prompts"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>category</span>
                  <span>Other Prompts</span>
                  <span className="category-pill-count">{categoryCounts.other}</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Collection Filter Banner */}
          {selectedCollectionId && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                margin: '0 24px 16px',
                backgroundColor: 'rgba(0, 240, 255, 0.08)',
                border: '1px solid rgba(0, 240, 255, 0.25)',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary-container)', fontSize: '20px' }}>
                  folder_open
                </span>
                <span className="font-body-sm" style={{ color: 'var(--on-surface)' }}>
                  Viewing Collection: <strong>{collections.find((c) => c.id === selectedCollectionId)?.name || 'Custom Collection'}</strong> ({filteredPrompts.length} prompts)
                </span>
              </div>
              <button
                type="button"
                className="btn-engine-add-cancel"
                onClick={() => setSelectedCollectionId(null)}
                style={{ padding: '4px 10px', fontSize: '12px' }}
                aria-label="Exit collection view"
              >
                Show All Prompts
              </button>
            </div>
          )}

          {/* Primary Workspace Content Body: Gallery + Inspector */}
          <div className="workspace-content-body">
            {/* Dynamic Prompt Cards Gallery */}
            <div className={`cards-canvas view-${viewMode}`} id="cardsCanvas">
              {filteredPrompts.length > 0 ? (
                <>
                  {filteredPrompts.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      isSelected={selectedPromptId === prompt.id}
                      onSelect={(p) => setSelectedPromptId(p.id)}
                      onEdit={handleEditPrompt}
                      onDelete={handleDeletePromptRequest}
                      onToggleFavorite={handleToggleFavorite}
                      onCopySuccess={handleCopySuccess}
                      onFork={handleForkPrompt}
                      onToggleVisibility={handleToggleVisibility}
                      onNotify={addToast}
                    />
                  ))}

                  {/* Quick Add Placeholder Trigger Card */}
                  <button
                    type="button"
                    className="prompt-card-placeholder"
                    onClick={handleOpenNewPrompt}
                    title="Click or press ⌘N to create a new prompt"
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
                    {activeViewMode === 'explore'
                      ? 'No Public Prompts Found'
                      : prompts.length === 0
                      ? 'Your Prompt Vault is Empty'
                      : 'No Matching Prompts Found'}
                  </h3>
                  <p className="font-body-sm" style={{ color: 'var(--outline)', marginBottom: '20px' }}>
                    {activeViewMode === 'explore'
                      ? 'Be the first to publish a public prompt to the community!'
                      : prompts.length === 0
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

            {/* Right Inspector Rail */}
            {viewMode !== 'dense' && (
              <PromptInspector
                selectedPrompt={activePrompt}
                onToggleVisibility={handleToggleVisibility}
                onNotify={addToast}
                collections={collections}
                onToggleCollectionMembership={handleToggleCollectionMembership}
              />
            )}
          </div>
        </main>

        {/* Fixed Bottom Status & Feedback Bar */}
        <StatusBar
          statusMessage={statusMessage}
          storageStatus={storageStatus}
          totalPrompts={activeViewMode === 'explore' ? publicPrompts.length : prompts.length}
        />
      </div>

      {/* Slide-Over Drawer for Add/Edit Prompt */}
      <PromptEditorDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleSavePrompt}
        onDeleteRequest={handleDeletePromptRequest}
        initialPrompt={editingPrompt}
        availableCategories={availableCategoryNames}
        availableEngines={availableEngines}
        availableCollections={collections}
      />

      {/* Destructive Deletion Confirmation Modal */}
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

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
