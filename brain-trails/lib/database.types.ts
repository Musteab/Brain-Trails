/**
 * Database type definitions for Brain Trails.
 *
 * Generated from supabase/schema.sql — keep in sync when the schema changes.
 * These types are consumed by the Supabase client via
 *   createBrowserClient<Database>(...)
 * to get end-to-end type safety on `.from()` calls.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string;
          role: "student" | "guild_leader" | "admin";
          xp: number;
          level: number;
          gold: number;
          streak_days: number;
          streak_last_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string;
          role?: "student" | "guild_leader" | "admin";
          xp?: number;
          level?: number;
          gold?: number;
          streak_days?: number;
          streak_last_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string;
          role?: "student" | "guild_leader" | "admin";
          xp?: number;
          level?: number;
          gold?: number;
          streak_days?: number;
          streak_last_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      focus_sessions: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          duration_minutes: number;
          completed_at: string;
          xp_earned: number;
          gold_earned: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          duration_minutes: number;
          completed_at?: string;
          xp_earned?: number;
          gold_earned?: number;
        };
        Update: {
          subject?: string;
          duration_minutes?: number;
          completed_at?: string;
          xp_earned?: number;
          gold_earned?: number;
        };
        Relationships: [
          {
            foreignKeyName: "focus_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content_html: string;
          folder: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          content_html?: string;
          folder?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          content_html?: string;
          folder?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      decks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          emoji: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          emoji?: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          emoji?: string;
          color?: string;
        };
        Relationships: [
          {
            foreignKeyName: "decks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      cards: {
        Row: {
          id: string;
          deck_id: string;
          front: string;
          back: string;
          mastery: number;
          next_review: string;
          review_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          deck_id: string;
          front: string;
          back: string;
          mastery?: number;
          next_review?: string;
          review_count?: number;
          created_at?: string;
        };
        Update: {
          front?: string;
          back?: string;
          mastery?: number;
          next_review?: string;
          review_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "cards_deck_id_fkey";
            columns: ["deck_id"];
            isOneToOne: false;
            referencedRelation: "decks";
            referencedColumns: ["id"];
          }
        ];
      };
      boss_battles: {
        Row: {
          id: string;
          user_id: string;
          boss_id: string;
          deck_id: string | null;
          result: "victory" | "defeat";
          damage_dealt: number;
          cards_answered: number;
          cards_correct: number;
          xp_earned: number;
          gold_earned: number;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          boss_id: string;
          deck_id?: string | null;
          result: "victory" | "defeat";
          damage_dealt?: number;
          cards_answered?: number;
          cards_correct?: number;
          xp_earned?: number;
          gold_earned?: number;
          completed_at?: string;
        };
        Update: {
          boss_id?: string;
          deck_id?: string | null;
          result?: "victory" | "defeat";
          damage_dealt?: number;
          cards_answered?: number;
          cards_correct?: number;
          xp_earned?: number;
          gold_earned?: number;
          completed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "boss_battles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "boss_battles_deck_id_fkey";
            columns: ["deck_id"];
            isOneToOne: false;
            referencedRelation: "decks";
            referencedColumns: ["id"];
          }
        ];
      };
      adventure_log: {
        Row: {
          id: string;
          user_id: string;
          activity_type: "focus" | "flashcard" | "note" | "quest" | "login";
          xp_earned: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: "focus" | "flashcard" | "note" | "quest" | "login";
          xp_earned?: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          activity_type?: "focus" | "flashcard" | "note" | "quest" | "login";
          xp_earned?: number;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "adventure_log_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      user_settings: {
        Row: {
          user_id: string;
          theme: "sun" | "moon" | "auto";
          accent_color: string;
          focus_duration: number;
          break_duration: number;
          sound_enabled: boolean;
          notifications_enabled: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          theme?: "sun" | "moon" | "auto";
          accent_color?: string;
          focus_duration?: number;
          break_duration?: number;
          sound_enabled?: boolean;
          notifications_enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          theme?: "sun" | "moon" | "auto";
          accent_color?: string;
          focus_duration?: number;
          break_duration?: number;
          sound_enabled?: boolean;
          notifications_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Functions: {};
    Enums: Record<string, never>;
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Views: {};
  };
}

/** Convenience aliases for row types */
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type FocusSession = Database["public"]["Tables"]["focus_sessions"]["Row"];
export type Note = Database["public"]["Tables"]["notes"]["Row"];
export type Deck = Database["public"]["Tables"]["decks"]["Row"];
export type Card = Database["public"]["Tables"]["cards"]["Row"];
export type BossBattle = Database["public"]["Tables"]["boss_battles"]["Row"];
export type AdventureLogEntry = Database["public"]["Tables"]["adventure_log"]["Row"];
export type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];
