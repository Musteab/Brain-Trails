"use client";

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/stores";
import { resetSettingsCache } from "@/hooks/useSettings";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  avatar_frame?: string;
  role: string;
  xp: number;
  level: number;
  gold: number;
  streak_days: number;
  guild_id: string | null;
  onboarding_completed: boolean;
  title: string | null;
  title_border: string | null;
  beta_joined_at: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const statsUnsubRef = useRef<(() => void) | null>(null);

  const fetchProfile = async (userId: string, retries = 1): Promise<void> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("AuthContext: fetchProfile query error:", error);
    }

    if (!error && data) {
      setProfile(data as Profile);
      useGameStore.getState().loadStats(userId);
      setIsLoading(false);
      return;
    }
    
    if (!data && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchProfile(userId, retries - 1);
    }
    
    // Retries exhausted — create a fallback profile
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      console.error("AuthContext: Could not get current user for fallback creation.");
      setIsLoading(false);
      return;
    }

    const fallbackProfile: Profile = {
      id: currentUser.id,
      username: currentUser.email?.split('@')[0] || 'Traveler',
      display_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Traveler',
      avatar_url: currentUser.user_metadata?.avatar_url || null,
      role: 'student',
      xp: 0,
      level: 1,
      gold: 0,
      streak_days: 0,
      guild_id: null,
      onboarding_completed: false,
      title: null,
      title_border: null,
      beta_joined_at: null,
    };

    const { error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: fallbackProfile.id,
        username: fallbackProfile.username,
        display_name: fallbackProfile.display_name,
        avatar_url: fallbackProfile.avatar_url,
      } as any);
      
    if (insertError) {
      console.error("AuthContext: Fallback profile insertion failed:", insertError);
    } else {
      await supabase.from("user_settings").insert({ user_id: currentUser.id });
    }

    // Set the profile either way so the user isn't stuck loading forever
    setProfile(fallbackProfile);
    useGameStore.getState().loadStats(currentUser.id);
    setIsLoading(false);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    const handleSession = async (sessionUser: User | null) => {
      if (!mounted) return;
      
      setUser(sessionUser);
      
      if (sessionUser) {
        // Fetch profile on login
        await fetchProfile(sessionUser.id);
        
        // Subscribe to real-time stat updates
        const unsubscribe = useGameStore.getState().subscribeToStats(sessionUser.id);
        statsUnsubRef.current = unsubscribe;
      } else {
        setProfile(null);
        setIsLoading(false);
        // Cleanup subscription on logout
        statsUnsubRef.current?.();
        statsUnsubRef.current = null;
      }
    };

    // CRITICAL: Do NOT await async work inside onAuthStateChange.
    // The callback holds the Supabase auth lock; awaiting blocks lock
    // release and causes cascading AbortErrors in React Strict Mode.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // Fire-and-forget — the lock is released immediately
        handleSession(session?.user ?? null);
      }
    );

    // Re-validate session when the user comes back to the tab.
    // Covers: laptop wake, mobile browser unfreeze, idle timeout.
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setSession(currentSession);
        await handleSession(currentUser ?? null);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      statsUnsubRef.current?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchProfile is intentionally excluded to avoid infinite loops
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, full_name: username },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/email-confirmed`,
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { 
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      },
    });
    
    if (error) {
      throw new Error(error.message);
    }

    if (data?.url) {
      window.location.assign(data.url);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setIsLoading(false);
    useGameStore.getState().reset();
    resetSettingsCache();
    // Force a full navigation to /login so the middleware clears cookies
    // and React state is fully reset (router.push alone won't work because
    // the middleware redirect happens server-side on the next request).
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
