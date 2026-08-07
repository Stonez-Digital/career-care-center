import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile, UserRole } from './supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: string | null; requiresEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function extractErrorMessage(err: unknown): string {
  if (!err) return 'An unexpected error occurred.';
  if (typeof err === 'string') return err;
  if (typeof err === 'object') {
    const e = err as Record<string, unknown>;
    if (typeof e.message === 'string' && e.message.length > 0) return e.message;
    if (typeof e.error_description === 'string') return e.error_description;
    if (typeof e.msg === 'string') return e.msg;
    // Avoid returning empty "{}" for opaque objects
    const str = JSON.stringify(err);
    if (str !== '{}') return str;
  }
  return 'An unexpected error occurred. Please try again.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('[CCC] Profile load error:', error.message, error);
      return;
    }
    setProfile(data as Profile | null);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user.id).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        setSession(newSession);
        if (newSession?.user) {
          await loadProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string, role: UserRole) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, role } },
        });

        if (error) {
          console.error('[CCC] signUp auth error:', error);
          return { error: extractErrorMessage(error), requiresEmailConfirmation: false };
        }

        if (!data.user) {
          // Email confirmation may be enabled; treat as success
          return { error: null, requiresEmailConfirmation: true };
        }

        // The handle_new_user trigger already created the profile.
        // We do a follow-up upsert only to ensure the role from meta_data is persisted
        // (the trigger reads raw_user_meta_data which IS set above).
        // Wait briefly to let the trigger commit before we try to read back.
        await new Promise((r) => setTimeout(r, 800));

        // Attempt to load the profile created by the trigger
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError) {
          // Non-fatal — profile will be loaded on next auth state change
          console.warn('[CCC] Profile fetch after signUp warning:', profileError.message);
        } else if (profileData) {
          setProfile(profileData as Profile);
        }

        return { error: null, requiresEmailConfirmation: !data.session };
      } catch (err) {
        console.error('[CCC] signUp unexpected error:', err);
        return { error: extractErrorMessage(err), requiresEmailConfirmation: false };
      }
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('[CCC] signIn error:', error);
        return { error: extractErrorMessage(error) };
      }
      return { error: null };
    } catch (err) {
      console.error('[CCC] signIn unexpected error:', err);
      return { error: extractErrorMessage(err) };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, profile, loading, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
