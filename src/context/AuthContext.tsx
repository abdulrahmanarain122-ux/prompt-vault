/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';

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

// Generate a valid UUID v4 fallback
function uuidv4() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
    (Number(c) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(c) / 4).toString(16)
  );
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let deviceId = localStorage.getItem('prompt_vault_device_id');
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem('prompt_vault_device_id', deviceId);
    }
    
    const fakeUser = {
      id: deviceId,
      email: 'guest@local',
      user_metadata: { username: 'Guest', display_name: 'Guest' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as User;

    const fakeSession = {
      access_token: 'local_device',
      refresh_token: 'local_device',
      expires_in: 36000000,
      token_type: 'bearer',
      user: fakeUser,
    } as unknown as Session;

    setUser(fakeUser);
    setSession(fakeSession);
    setProfile({ id: deviceId, username: 'Guest', display_name: 'Guest', avatar_url: null });
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isConfigured: true,
        authModalOpen: false,
        authModalMode: 'login',
        openAuthModal: () => {},
        closeAuthModal: () => {},
        signIn: async () => ({ error: null, session }),
        signUp: async () => ({ error: null, session }),
        signOut: async () => ({ error: null }),
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
