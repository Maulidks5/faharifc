import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'staff' | 'finance';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  fullName: string | null;
  isActive: boolean | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  changePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const loadUserRole = async (sessionUser: User | null) => {
      if (!sessionUser) {
        setRole(null);
        setFullName(null);
        setIsActive(null);
        return;
      }

      const { data } = await supabase
        .from('user_profiles')
        .select('role, full_name, is_active')
        .eq('id', sessionUser.id)
        .single();

      const nextRole = (data?.role as UserRole | undefined) || null;
      const nextFullName =
        (data?.full_name as string | undefined) ||
        (sessionUser.user_metadata?.full_name as string | undefined) ||
        null;
      const active = data?.is_active !== false;
      setRole(nextRole);
      setFullName(nextFullName);
      setIsActive(active);

      if (!active) {
        await supabase.auth.signOut();
      }
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      await loadUserRole(sessionUser);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        const sessionUser = session?.user ?? null;
        setUser(sessionUser);
        await loadUserRole(sessionUser);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const clearIdleTimer = () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    if (!user) {
      clearIdleTimer();
      return;
    }

    const handleIdleLogout = async () => {
      await supabase.auth.signOut();
    };

    const resetIdleTimer = () => {
      clearIdleTimer();
      timeoutRef.current = window.setTimeout(handleIdleLogout, IDLE_TIMEOUT_MS);
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click',
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimer, { passive: true });
    });

    resetIdleTimer();

    return () => {
      clearIdleTimer();
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimer);
      });
    };
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_active')
          .eq('id', userData.user.id)
          .single();

        if (profile?.is_active === false) {
          await supabase.auth.signOut();
          throw new Error('Account is blocked. Contact an admin.');
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const changePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, fullName, isActive, loading, signIn, changePassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
