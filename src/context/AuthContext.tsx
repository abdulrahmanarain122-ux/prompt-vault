import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export type AuthModalMode = 'login' | 'signup' | 'forgot';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  authModalOpen: boolean;
  authModalMode: AuthModalMode;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; session?: Session | null }>;
  signUp: (
    email: string,
    password: string,
    username?: string
  ) => Promise<{ error: Error | null; session?: Session | null; needsConfirmation?: boolean }>;
  signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');

  const isConfigured = useMemo(() => isSupabaseConfigured(), []);

  // Fetch public user profile from profiles table
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as UserProfile);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    // Check current active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const openAuthModal = (mode: AuthModalMode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes('confirm')) {
          return {
            error: new Error(
              'Email not confirmed. Check your inbox or turn off "Confirm Email" in Supabase Dashboard -> Authentication -> Email Provider for instant access.'
            ),
          };
        }
        return { error: error as Error };
      }
      return { error: null, session: data.session };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUp = async (email: string, password: string, username?: string) => {
    try {
      const cleanUsername = username?.trim() || email.split('@')[0];
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: cleanUsername,
            display_name: cleanUsername,
          },
        },
      });

      if (error) {
        if (error.message.includes('rate limit') || error.message.includes('over_email_send')) {
          return {
            error: new Error(
              'Supabase SMTP rate limit reached. To enable instant registration without limits, turn off "Confirm Email" in Supabase Dashboard -> Authentication -> Email Provider.'
            ),
          };
        }
        return { error: error as Error };
      }

      // Check if user already exists in Supabase
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        return {
          error: new Error('An account with this email address already exists. Click "Sign In" above to log in.'),
        };
      }

      // Attempt auto-login if session was not returned automatically
      if (!data.session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!signInError && signInData.session) {
          return { error: null, session: signInData.session, needsConfirmation: false };
        }
      }

      return { error: null, session: data.session, needsConfirmation: !data.session };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isConfigured,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
