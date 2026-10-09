export type PromptCategory =
  | 'Image prompt'
  | 'Video prompt'
  | 'Animation'
  | 'Other'
  | string;

export interface CollectionItem {
  id: string;
  name: string;
  description?: string;
  visibility: 'private' | 'public';
  userId?: string;
  createdAt: number;
  updatedAt: number;
  promptCount?: number;
}

export interface PromptItem {
  id: string;
  title: string;
  category: PromptCategory;
  body: string;
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
  copyCount?: number;
  engine?: string;
  aspectRatio?: string;
  tags?: string[];
  negativePrompt?: string;
  collectionIds?: string[];
  // Cloud Sharing & Visibility (Phase 3+)
  visibility?: 'public' | 'private';
  userId?: string;
  authorUsername?: string;
  authorAvatarUrl?: string;
  forkCount?: number;
  shareUrl?: string;
}

export type PromptFormInput = {
  title: string;
  category: string;
  body: string;
  engine?: string;
  aspectRatio?: string;
  tags?: string[];
  negativePrompt?: string;
  collectionIds?: string[];
  visibility?: 'public' | 'private';
};

export interface StorageStatus {
  isAvailable: boolean;
  totalPrompts: number;
  estimatedBytes: number;
  error?: string;
}
