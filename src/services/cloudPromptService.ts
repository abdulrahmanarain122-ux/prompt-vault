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

export const CloudPromptService = {
  /**
   * Fetch all public prompts from Supabase with author profile metadata
   */
  async fetchPublicPrompts(): Promise<{ data: PromptItem[]; error: string | null }> {
    try {
      // Fetch public prompts
      const { data, error } = await supabase
        .from('prompts')
        .select(`
          *,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback: fetch prompts without join if profiles FK is pending
        const { data: rawPrompts, error: rawError } = await supabase
          .from('prompts')
          .select('*')
          .eq('visibility', 'public')
          .order('created_at', { ascending: false });

        if (rawError) return { data: [], error: rawError.message };
        const mapped = (rawPrompts as unknown as SupabasePromptRow[]).map(mapRowToPromptItem);
        return { data: mapped, error: null };
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
        .select(`
          *,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        // Fallback: fetch without join
        const { data: rawPrompts, error: rawError } = await supabase
          .from('prompts')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (rawError) return { data: [], error: rawError.message };
        const mapped = (rawPrompts as unknown as SupabasePromptRow[]).map(mapRowToPromptItem);
        return { data: mapped, error: null };
      }

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
        .select(`
          *,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('id', promptId)
        .single();

      if (error) {
        // Fallback without join
        const { data: rawPrompt, error: rawError } = await supabase
          .from('prompts')
          .select('*')
          .eq('id', promptId)
          .single();

        if (rawError) return { data: null, error: rawError.message };
        return { data: mapRowToPromptItem(rawPrompt as unknown as SupabasePromptRow), error: null };
      }

      return { data: mapRowToPromptItem(data as unknown as SupabasePromptRow), error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to fetch prompt.',
      };
    }
  },

  /**
   * Create a new prompt in Supabase
   */
  async createCloudPrompt(
    input: PromptFormInput,
    userId: string
  ): Promise<{ data: PromptItem | null; error: string | null }> {
    try {
      const now = new Date().toISOString();
      const payload = {
        user_id: userId,
        title: input.title,
        category: input.category,
        body: input.body,
        visibility: input.visibility || 'private',
        engine: input.engine || null,
        aspect_ratio: input.aspectRatio || null,
        negative_prompt: input.negativePrompt || null,
        tags: input.tags || [],
        copy_count: 0,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from('prompts')
        .insert([payload])
        .select('*')
        .single();

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
      if (input.aspectRatio !== undefined) payload.aspect_ratio = input.aspectRatio || null;
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
};
