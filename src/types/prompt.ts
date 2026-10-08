export type PromptCategory =
  | 'Image prompt'
  | 'Video prompt'
  | 'Animation prompt'
  | 'Other'
  | string;

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
}

export type PromptFormInput = {
  title: string;
  category: string;
  body: string;
  engine?: string;
  aspectRatio?: string;
  tags?: string[];
  negativePrompt?: string;
};

export interface StorageStatus {
  isAvailable: boolean;
  totalPrompts: number;
  estimatedBytes: number;
  error?: string;
}
