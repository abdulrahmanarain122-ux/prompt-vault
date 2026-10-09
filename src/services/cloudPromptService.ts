import { supabase } from './supabaseClient';
import type { PromptItem, PromptFormInput } from '../types/prompt';

export interface SupabasePromptRow {
  id: string;
  user_id: string;
  title: string;
  category: string;
  body: string;
  visibility: 'public' | 'private';
  engine: string | null;
  aspect_ratio: string | null;
  negative_prompt: string | null;
  tags: string[] | null;
  is_favorite?: boolean | null;
  copy_count: number | null;
  fork_count?: number | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

// Convert Supabase DB row to frontend PromptItem model
export function mapRowToPromptItem(row: SupabasePromptRow): PromptItem {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    body: row.body,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    isFavorite: Boolean(row.is_favorite),
    copyCount: row.copy_count ?? 0,
    engine: row.engine || undefined,
    aspectRatio: row.aspect_ratio || undefined,
    tags: row.tags || [],
    negativePrompt: row.negative_prompt || undefined,
    visibility: row.visibility,
    userId: row.user_id,
    authorUsername: row.profiles?.username || 'Anonymous',
    authorAvatarUrl: row.profiles?.avatar_url || undefined,
    forkCount: row.fork_count ?? 0,
    shareUrl: `${window.location.origin}/?prompt=${row.id}`,
  };
}

export const COMMUNITY_AUTHOR_FALLBACK = '3e88faaa-d2ac-4ee7-b581-eb7cb9919306';

export function cleanAspectRatio(ratio?: string): string | null {
  if (!ratio) return null;
  const first = ratio.trim().split(' ')[0];
  return first.slice(0, 20);
}

export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export const CloudPromptService = {
  /**
   * Fetch all public prompts from Supabase
   */
  async fetchPublicPrompts(): Promise<{ data: PromptItem[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      if (error) {
        return { data: [], error: error.message };
      }

      const mapped = (data as unknown as SupabasePromptRow[]).map(mapRowToPromptItem);
      return { data: mapped, error: null };
    } catch (err) {
      return {
        data: [],
        error: err instanceof Error ? err.message : 'Failed to fetch public prompts.',
      };
    }
  },

  /**
   * Fetch user's own prompts (public + private)
   */
  async fetchUserPrompts(userId: string): Promise<{ data: PromptItem[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) return { data: [], error: error.message };
      const mapped = (data as unknown as SupabasePromptRow[]).map(mapRowToPromptItem);
      return { data: mapped, error: null };
    } catch (err) {
      return {
        data: [],
        error: err instanceof Error ? err.message : 'Failed to fetch user prompts.',
      };
    }
  },

  /**
   * Fetch single prompt by ID (for shareable links)
   */
  async fetchPromptById(promptId: string): Promise<{ data: PromptItem | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', promptId)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: mapRowToPromptItem(data as unknown as SupabasePromptRow), error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to fetch prompt.',
      };
    }
  },

  /**
   * Create a new prompt in Supabase with automatic resilience against foreign key constraints
   */
  async createCloudPrompt(
    input: PromptFormInput,
    userId?: string
  ): Promise<{ data: PromptItem | null; error: string | null }> {
    try {
      const now = new Date().toISOString();
      const authorId = userId && isValidUUID(userId) ? userId : COMMUNITY_AUTHOR_FALLBACK;
      const payload: Record<string, unknown> = {
        user_id: authorId,
        title: input.title,
        category: input.category,
        body: input.body,
        visibility: input.visibility || 'private',
        engine: input.engine || null,
        aspect_ratio: cleanAspectRatio(input.aspectRatio),
        negative_prompt: input.negativePrompt || null,
        tags: input.tags || [],
        copy_count: 0,
        created_at: now,
        updated_at: now,
      };

      let { data, error } = await supabase
        .from('prompts')
        .insert([payload])
        .select('*')
        .single();

      // If foreign key (23503) or not-null (23502) error, fallback to known community author
      if (error && (error.code === '23503' || error.code === '23502') && authorId !== COMMUNITY_AUTHOR_FALLBACK) {
        payload.user_id = COMMUNITY_AUTHOR_FALLBACK;
        const retryRes = await supabase
          .from('prompts')
          .insert([payload])
          .select('*')
          .single();
        data = retryRes.data;
        error = retryRes.error;
      }

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: mapRowToPromptItem(data as unknown as SupabasePromptRow), error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to create cloud prompt.',
      };
    }
  },

  /**
   * Upsert a prompt to Supabase (create or update by ID)
   */
  async upsertCloudPrompt(
    prompt: PromptItem,
    userId?: string
  ): Promise<{ data: PromptItem | null; error: string | null }> {
    try {
      const now = new Date().toISOString();
      const promptId = isValidUUID(prompt.id) ? prompt.id : undefined;
      const authorId = userId && isValidUUID(userId) ? userId : COMMUNITY_AUTHOR_FALLBACK;

      const payload: Record<string, unknown> = {
        user_id: authorId,
        title: prompt.title,
        category: prompt.category,
        body: prompt.body,
        visibility: prompt.visibility || 'private',
        engine: prompt.engine || null,
        aspect_ratio: cleanAspectRatio(prompt.aspectRatio),
        negative_prompt: prompt.negativePrompt || null,
        tags: prompt.tags || [],
        copy_count: prompt.copyCount || 0,
        updated_at: now,
      };

      if (promptId) {
        payload.id = promptId;
      }

      let { data, error } = await supabase
        .from('prompts')
        .upsert(payload)
        .select('*')
        .single();

      // Foreign key or not null fallback
      if (error && (error.code === '23503' || error.code === '23502') && authorId !== COMMUNITY_AUTHOR_FALLBACK) {
        payload.user_id = COMMUNITY_AUTHOR_FALLBACK;
        const retryRes = await supabase
          .from('prompts')
          .upsert(payload)
          .select('*')
          .single();
        data = retryRes.data;
        error = retryRes.error;
      }

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: mapRowToPromptItem(data as unknown as SupabasePromptRow), error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to sync prompt to cloud.',
      };
    }
  },

  /**
   * Update an existing cloud prompt
   */
  async updateCloudPrompt(
    id: string,
    input: Partial<PromptFormInput>
  ): Promise<{ data: PromptItem | null; error: string | null }> {
    try {
      const payload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (input.title !== undefined) payload.title = input.title;
      if (input.category !== undefined) payload.category = input.category;
      if (input.body !== undefined) payload.body = input.body;
      if (input.visibility !== undefined) payload.visibility = input.visibility;
      if (input.engine !== undefined) payload.engine = input.engine || null;
      if (input.aspectRatio !== undefined) payload.aspect_ratio = cleanAspectRatio(input.aspectRatio);
      if (input.negativePrompt !== undefined) payload.negative_prompt = input.negativePrompt || null;
      if (input.tags !== undefined) payload.tags = input.tags;

      const { data, error } = await supabase
        .from('prompts')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: mapRowToPromptItem(data as unknown as SupabasePromptRow), error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to update prompt.',
      };
    }
  },

  /**
   * Delete a cloud prompt
   */
  async deleteCloudPrompt(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.from('prompts').delete().eq('id', id);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete prompt.',
      };
    }
  },

  /**
   * Increment copy count for a cloud prompt using security definer RPC
   */
  async incrementCopyCount(id: string, currentCount: number = 0): Promise<number> {
    try {
      const { error } = await supabase.rpc('increment_prompt_copy_count', {
        target_prompt_id: id,
      });
      if (error) {
        console.warn('RPC copy increment fallback:', error.message);
        await supabase.from('prompts').update({ copy_count: currentCount + 1 }).eq('id', id);
      }
      return currentCount + 1;
    } catch (err) {
      console.warn('Failed to update cloud copy count:', err);
      return currentCount + 1;
    }
  },

  /**
   * Fork a public prompt into logged-in user's private library
   */
  async forkPrompt(
    prompt: PromptItem,
    targetUserId: string
  ): Promise<{ data: PromptItem | null; error: string | null }> {
    try {
      const created = await this.createCloudPrompt(
        {
          title: `${prompt.title} (Fork)`,
          category: prompt.category,
          body: prompt.body,
          engine: prompt.engine,
          aspectRatio: prompt.aspectRatio,
          tags: prompt.tags,
          negativePrompt: prompt.negativePrompt,
          visibility: 'private',
        },
        targetUserId
      );

      return created;
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to fork prompt.',
      };
    }
  },

  /**
   * Non-destructive sync of LocalStorage prompts to Supabase Cloud Vault
   */
  async syncLocalStorageToCloud(
    localPrompts: PromptItem[],
    userId: string
  ): Promise<{ syncedCount: number; error: string | null }> {
    try {
      const { data: userPrompts } = await this.fetchUserPrompts(userId);
      const existingTitles = new Set((userPrompts || []).map((p) => p.title.toLowerCase().trim()));

      let synced = 0;
      for (const p of localPrompts) {
        if (!existingTitles.has(p.title.toLowerCase().trim())) {
          const { error } = await this.createCloudPrompt(
            {
              title: p.title,
              category: p.category,
              body: p.body,
              engine: p.engine,
              aspectRatio: p.aspectRatio,
              tags: p.tags,
              negativePrompt: p.negativePrompt,
              visibility: p.visibility || 'private',
            },
            userId
          );
          if (!error) synced++;
        }
      }

      return { syncedCount: synced, error: null };
    } catch (err) {
      return {
        syncedCount: 0,
        error: err instanceof Error ? err.message : 'Failed to sync local storage to cloud.',
      };
    }
  },
};
