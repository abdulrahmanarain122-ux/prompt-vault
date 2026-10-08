import type { PromptItem, PromptFormInput, StorageStatus } from '../types/prompt';

const STORAGE_KEY = 'prompt_vault_records_v1';

export const STARTER_PROMPTS: PromptItem[] = [
  {
    id: 'starter-1',
    title: 'Cinematic Anamorphic Drone Push-in',
    category: 'Video prompt',
    body: 'Cinematic FPV drone shot smoothly gliding through mist over a futuristic cyberpunk metropolis at twilight, neon reflections glistening on wet asphalt, anamorphic lens flare, photorealistic 8k, 24fps motion blur.',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: 'starter-2',
    title: 'Inertial Bounce Spring Physics Expression',
    category: 'Animation prompt',
    body: `// Inertial Bounce for AE Position/Scale\namp = .06;\nfreq = 3.5;\ndecay = 5.0;\nn = 0;\nif (numKeys > 0){ n = nearestKey(time).index; if (key(n).time > time){ n--; } }\nif (n == 0){ t = 0; } else { t = time - key(n).time; }\nif (n > 0 && t < 1){ v = velocityAtTime(key(n).time - thisComp.frameDuration/10); value + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t); } else { value; }`,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: 'starter-3',
    title: 'Sci-Fi Holographic HUD Overlay',
    category: 'Image prompt',
    body: 'Complex holographic user interface HUD overlay for a sci-fi cockpit, clean minimalist typography, telemetry gauges, wave forms, glowing cyan and amber vector lines, dark transparent background, 8k resolution.',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  },
];

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'prompt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

export const StorageService = {
  isSupported(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  getStatus(): StorageStatus {
    const supported = this.isSupported();
    if (!supported) {
      return {
        isAvailable: false,
        totalPrompts: 0,
        estimatedBytes: 0,
        error: 'Browser localStorage is disabled or restricted in this environment.',
      };
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const prompts = raw ? (JSON.parse(raw) as PromptItem[]) : [];
      const byteCount = raw ? new Blob([raw]).size : 0;
      return {
        isAvailable: true,
        totalPrompts: prompts.length,
        estimatedBytes: byteCount,
      };
    } catch (e) {
      return {
        isAvailable: true,
        totalPrompts: 0,
        estimatedBytes: 0,
        error: e instanceof Error ? e.message : 'Error reading storage status',
      };
    }
  },

  getAll(): PromptItem[] {
    if (!this.isSupported()) {
      return STARTER_PROMPTS;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.saveAll(STARTER_PROMPTS);
        return STARTER_PROMPTS;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return STARTER_PROMPTS;
    } catch (err) {
      console.error('Failed to parse prompts from localStorage:', err);
      return STARTER_PROMPTS;
    }
  },

  saveAll(prompts: PromptItem[]): boolean {
    if (!this.isSupported()) {
      throw new Error('Local storage is not supported or accessible on this browser.');
    }

    try {
      const serialized = JSON.stringify(prompts);
      window.localStorage.setItem(STORAGE_KEY, serialized);
      return true;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Please delete some old prompts before adding new ones.');
      }
      throw new Error('Failed to save prompts to local storage: ' + (err instanceof Error ? err.message : String(err)));
    }
  },

  create(input: PromptFormInput): PromptItem {
    const trimmedTitle = input.title.trim();
    const trimmedCategory = input.category.trim();
    const trimmedBody = input.body.trim();

    if (!trimmedTitle) {
      throw new Error('Prompt title is required.');
    }
    if (!trimmedCategory) {
      throw new Error('Category is required.');
    }
    if (!trimmedBody) {
      throw new Error('Prompt content cannot be empty.');
    }

    const newItem: PromptItem = {
      id: generateId(),
      title: trimmedTitle,
      category: trimmedCategory,
      body: trimmedBody,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const current = this.getAll();
    const updated = [newItem, ...current];
    this.saveAll(updated);
    return newItem;
  },

  update(id: string, input: PromptFormInput): PromptItem {
    const trimmedTitle = input.title.trim();
    const trimmedCategory = input.category.trim();
    const trimmedBody = input.body.trim();

    if (!trimmedTitle) {
      throw new Error('Prompt title is required.');
    }
    if (!trimmedCategory) {
      throw new Error('Category is required.');
    }
    if (!trimmedBody) {
      throw new Error('Prompt content cannot be empty.');
    }

    const current = this.getAll();
    const index = current.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Prompt with ID "${id}" was not found.`);
    }

    const existing = current[index];
    const updatedItem: PromptItem = {
      ...existing,
      title: trimmedTitle,
      category: trimmedCategory,
      body: trimmedBody,
      updatedAt: Date.now(),
    };

    const updatedList = [...current];
    updatedList[index] = updatedItem;
    this.saveAll(updatedList);
    return updatedItem;
  },

  delete(id: string): boolean {
    const current = this.getAll();
    const filtered = current.filter((p) => p.id !== id);
    if (filtered.length === current.length) {
      return false;
    }
    this.saveAll(filtered);
    return true;
  },

  resetToStarters(): PromptItem[] {
    this.saveAll(STARTER_PROMPTS);
    return STARTER_PROMPTS;
  },
};
