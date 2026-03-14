"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/stores";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  xp: number;
  level: number;
  gold: number;
  streak_days: number;
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

  const fetchProfile = async (userId: string, retries = 3): Promise<void> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data as Profile);
      // Sync game stats to Zustand store
      useGameStore.getState().loadStats(userId);
      setIsLoading(false);
    } else if (!data && retries > 0) {
      // Create a proper promise delay so we block the `await fetchProfile` call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchProfile(userId, retries - 1);
    } else if (!data && retries === 0) {
      // If retries are exhausted and there's STILL no profile, the trigger probably failed.
      // Create a fallback profile manually from the client side.
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const newProfile = {
          id: currentUser.id,
          username: currentUser.email?.split('@')[0] || 'Traveler',
          display_name: currentUser.user_metadata?.full_name || 'Traveler',
          avatar_url: currentUser.user_metadata?.avatar_url || null,
        };
        
        const { error: insertError } = await supabase
          .from("profiles")
          .insert(newProfile);
          
        if (insertError) {
          console.error("AuthContext: Fallback profile insertion failed:", insertError);
          // Inject a mock profile so the user isn't hard-blocked
          setProfile({
            id: currentUser.id,
            username: currentUser.email?.split('@')[0] || 'Traveler',
            display_name: currentUser.user_metadata?.full_name || 'Traveler',
            avatar_url: currentUser.user_metadata?.avatar_url || null,
            role: 'student',
            xp: 0,
            level: 1,
            gold: 0,
            streak_days: 0
          });
        } else {
          // Also set up default settings for the new user, mimicking the trigger
          await supabase.from("user_settings").insert({ user_id: currentUser.id });
          
          setProfile(newProfile as unknown as Profile);
        }
      } else {
         console.error("AuthContext: Could not get current user for fallback creation.");
      }
      setIsLoading(false); // Make sure to release the loading lock on the hack boundaries
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;
    let isFetchingProfile = false;

    const refreshContext = async (sessionUser: User | null) => {
      if (!mounted) return;
      
      setUser(sessionUser);
      
      if (sessionUser) {
        if (!isFetchingProfile) {
          isFetchingProfile = true;
          await fetchProfile(sessionUser.id);
          isFetchingProfile = false;
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      refreshContext(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        refreshContext(session?.user ?? null);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchProfile is intentionally excluded to avoid infinite loops
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, full_name: username },
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    useGameStore.getState().reset();
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
