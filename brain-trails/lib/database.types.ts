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
          avatar_frame: string;
          bio: string;
          role: "student" | "guild_leader" | "admin" | "dev" | "beta_tester";
          xp: number;
          level: number;
          gold: number;
          streak_days: number;
          streak_last_date: string | null;
          guild_id: string | null;
          onboarding_completed: boolean;
          title: string | null;
          title_border: string | null;
          beta_joined_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          avatar_frame?: string;
          bio?: string;
          role?: "student" | "guild_leader" | "admin" | "dev" | "beta_tester";
          xp?: number;
          level?: number;
          gold?: number;
          streak_days?: number;
          streak_last_date?: string | null;
          guild_id?: string | null;
          onboarding_completed?: boolean;
          title?: string | null;
          title_border?: string | null;
          beta_joined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          avatar_frame?: string;
          bio?: string;
          role?: "student" | "guild_leader" | "admin" | "dev" | "beta_tester";
          xp?: number;
          level?: number;
          gold?: number;
          streak_days?: number;
          streak_last_date?: string | null;
          guild_id?: string | null;
          onboarding_completed?: boolean;
          title?: string | null;
          title_border?: string | null;
          beta_joined_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      focus_sessions: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          subject_id: string | null;
          duration_minutes: number;
          mode: "normal" | "cram";
          completed_at: string;
          xp_earned: number;
          gold_earned: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          subject_id?: string | null;
          duration_minutes: number;
          mode?: "normal" | "cram";
          completed_at?: string;
          xp_earned?: number;
          gold_earned?: number;
        };
        Update: {
          subject?: string;
          subject_id?: string | null;
          duration_minutes?: number;
          mode?: "normal" | "cram";
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
          subject_id: string | null;
          created_at: string;
          updated_at: string;
          tags: string[];
          is_pinned: boolean;
          parent_folder_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          content_html?: string;
          folder?: string;
          subject_id?: string | null;
          created_at?: string;
          updated_at?: string;
          tags?: string[];
          is_pinned?: boolean;
          parent_folder_id?: string | null;
        };
        Update: {
          title?: string;
          content_html?: string;
          folder?: string;
          subject_id?: string | null;
          updated_at?: string;
          tags?: string[];
          is_pinned?: boolean;
          parent_folder_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_parent_folder_id_fkey";
            columns: ["parent_folder_id"];
            isOneToOne: false;
            referencedRelation: "notes";
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
          subject_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          emoji?: string;
          color?: string;
          subject_id?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          emoji?: string;
          color?: string;
          subject_id?: string | null;
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
          activity_type: "focus" | "flashcard" | "note" | "quest" | "login" | "boss" | "guild" | "achievement" | "streak";
          xp_earned: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: "focus" | "flashcard" | "note" | "quest" | "login" | "boss" | "guild" | "achievement" | "streak";
          xp_earned?: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          activity_type?: "focus" | "flashcard" | "note" | "quest" | "login" | "boss" | "guild" | "achievement" | "streak";
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
          font_size: "small" | "medium" | "large";
          focus_duration: number;
          break_duration: number;
          cram_mode_enabled: boolean;
          ambient_sound: "none" | "rain" | "cafe" | "forest" | "lofi";
          sound_enabled: boolean;
          notifications_enabled: boolean;
          streak_reminders: boolean;
          guild_notifications: boolean;
          study_nudges: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          theme?: "sun" | "moon" | "auto";
          accent_color?: string;
          font_size?: "small" | "medium" | "large";
          focus_duration?: number;
          break_duration?: number;
          cram_mode_enabled?: boolean;
          ambient_sound?: "none" | "rain" | "cafe" | "forest" | "lofi";
          sound_enabled?: boolean;
          notifications_enabled?: boolean;
          streak_reminders?: boolean;
          guild_notifications?: boolean;
          study_nudges?: boolean;
          updated_at?: string;
        };
        Update: {
          theme?: "sun" | "moon" | "auto";
          accent_color?: string;
          font_size?: "small" | "medium" | "large";
          focus_duration?: number;
          break_duration?: number;
          cram_mode_enabled?: boolean;
          ambient_sound?: "none" | "rain" | "cafe" | "forest" | "lofi";
          sound_enabled?: boolean;
          notifications_enabled?: boolean;
          streak_reminders?: boolean;
          guild_notifications?: boolean;
          study_nudges?: boolean;
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
      knowledge_paths: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          emoji: string;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string;
          emoji?: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          emoji?: string;
          color?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_paths_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      knowledge_nodes: {
        Row: {
          id: string;
          path_id: string;
          parent_node_id: string | null;
          name: string;
          description: string;
          node_type: "topic" | "boss" | "checkpoint";
          required_focus_minutes: number;
          required_card_reviews: number;
          required_mastery_pct: number;
          focus_minutes_logged: number;
          card_reviews_logged: number;
          mastery_pct: number;
          is_unlocked: boolean;
          is_completed: boolean;
          completed_at: string | null;
          boss_deck_id: string | null;
          boss_hp: number;
          position_x: number;
          position_y: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          path_id: string;
          parent_node_id?: string | null;
          name: string;
          description?: string;
          node_type?: "topic" | "boss" | "checkpoint";
          required_focus_minutes?: number;
          required_card_reviews?: number;
          required_mastery_pct?: number;
          focus_minutes_logged?: number;
          card_reviews_logged?: number;
          mastery_pct?: number;
          is_unlocked?: boolean;
          is_completed?: boolean;
          completed_at?: string | null;
          boss_deck_id?: string | null;
          boss_hp?: number;
          position_x?: number;
          position_y?: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          parent_node_id?: string | null;
          name?: string;
          description?: string;
          node_type?: "topic" | "boss" | "checkpoint";
          required_focus_minutes?: number;
          required_card_reviews?: number;
          required_mastery_pct?: number;
          focus_minutes_logged?: number;
          card_reviews_logged?: number;
          mastery_pct?: number;
          is_unlocked?: boolean;
          is_completed?: boolean;
          completed_at?: string | null;
          boss_deck_id?: string | null;
          boss_hp?: number;
          position_x?: number;
          position_y?: number;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_nodes_path_id_fkey";
            columns: ["path_id"];
            isOneToOne: false;
            referencedRelation: "knowledge_paths";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "knowledge_nodes_parent_node_id_fkey";
            columns: ["parent_node_id"];
            isOneToOne: false;
            referencedRelation: "knowledge_nodes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "knowledge_nodes_boss_deck_id_fkey";
            columns: ["boss_deck_id"];
            isOneToOne: false;
            referencedRelation: "decks";
            referencedColumns: ["id"];
          }
        ];
      };
      guilds: {
        Row: {
          id: string;
          name: string;
          description: string;
          emblem: string;
          leader_id: string;
          max_members: number;
          member_count: number;
          weekly_xp: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          emblem?: string;
          leader_id: string;
          max_members?: number;
          member_count?: number;
          weekly_xp?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          emblem?: string;
          leader_id?: string;
          max_members?: number;
          member_count?: number;
          weekly_xp?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guilds_leader_id_fkey";
            columns: ["leader_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      guild_members: {
        Row: {
          id: string;
          guild_id: string;
          user_id: string;
          role: "member" | "officer" | "leader";
          weekly_xp: number;
          joined_at: string;
        };
        Insert: {
          id?: string;
          guild_id: string;
          user_id: string;
          role?: "member" | "officer" | "leader";
          weekly_xp?: number;
          joined_at?: string;
        };
        Update: {
          role?: "member" | "officer" | "leader";
          weekly_xp?: number;
        };
        Relationships: [
          {
            foreignKeyName: "guild_members_guild_id_fkey";
            columns: ["guild_id"];
            isOneToOne: false;
            referencedRelation: "guilds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guild_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      guild_messages: {
        Row: {
          id: string;
          guild_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          guild_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          content?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guild_messages_guild_id_fkey";
            columns: ["guild_id"];
            isOneToOne: false;
            referencedRelation: "guilds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guild_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      guild_raids: {
        Row: {
          id: string;
          guild_id: string;
          topic: string;
          boss_hp: number;
          current_hp: number;
          status: "active" | "victory" | "expired";
          week_start: string;
          xp_reward: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          guild_id: string;
          topic: string;
          boss_hp?: number;
          current_hp?: number;
          status?: "active" | "victory" | "expired";
          week_start?: string;
          xp_reward?: number;
          created_at?: string;
        };
        Update: {
          topic?: string;
          boss_hp?: number;
          current_hp?: number;
          status?: "active" | "victory" | "expired";
          xp_reward?: number;
        };
        Relationships: [
          {
            foreignKeyName: "guild_raids_guild_id_fkey";
            columns: ["guild_id"];
            isOneToOne: false;
            referencedRelation: "guilds";
            referencedColumns: ["id"];
          }
        ];
      };
      guild_raid_contributions: {
        Row: {
          id: string;
          raid_id: string;
          user_id: string;
          damage_dealt: number;
          focus_minutes: number;
          cards_reviewed: number;
          contributed_at: string;
        };
        Insert: {
          id?: string;
          raid_id: string;
          user_id: string;
          damage_dealt?: number;
          focus_minutes?: number;
          cards_reviewed?: number;
          contributed_at?: string;
        };
        Update: {
          damage_dealt?: number;
          focus_minutes?: number;
          cards_reviewed?: number;
        };
        Relationships: [
          {
            foreignKeyName: "guild_raid_contributions_raid_id_fkey";
            columns: ["raid_id"];
            isOneToOne: false;
            referencedRelation: "guild_raids";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guild_raid_contributions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      achievements: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon: string;
          category: "study" | "social" | "combat" | "exploration" | "streak";
          xp_reward: number;
          gold_reward: number;
          condition_type: string;
          condition_value: number;
          rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
        };
        Insert: {
          id: string;
          name: string;
          description: string;
          icon: string;
          category: "study" | "social" | "combat" | "exploration" | "streak";
          xp_reward?: number;
          gold_reward?: number;
          condition_type: string;
          condition_value?: number;
          rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
        };
        Update: {
          name?: string;
          description?: string;
          icon?: string;
          category?: "study" | "social" | "combat" | "exploration" | "streak";
          xp_reward?: number;
          gold_reward?: number;
          condition_type?: string;
          condition_value?: number;
          rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
        };
        Update: {
          unlocked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_achievements_achievement_id_fkey";
            columns: ["achievement_id"];
            isOneToOne: false;
            referencedRelation: "achievements";
            referencedColumns: ["id"];
          }
        ];
      };
      cosmetics: {
        Row: {
          id: string;
          name: string;
          description: string;
          category: "theme" | "avatar_frame" | "title" | "background";
          preview_data: Json;
          gold_cost: number;
          level_required: number;
          rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "beta";
        };
        Insert: {
          id: string;
          name: string;
          description: string;
          category: "theme" | "avatar_frame" | "title" | "background";
          preview_data?: Json;
          gold_cost?: number;
          level_required?: number;
          rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary" | "beta";
        };
        Update: {
          name?: string;
          description?: string;
          category?: "theme" | "avatar_frame" | "title" | "background";
          preview_data?: Json;
          gold_cost?: number;
          level_required?: number;
          rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary" | "beta";
        };
        Relationships: [];
      };
      user_cosmetics: {
        Row: {
          id: string;
          user_id: string;
          cosmetic_id: string;
          equipped: boolean;
          purchased_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cosmetic_id: string;
          equipped?: boolean;
          purchased_at?: string;
        };
        Update: {
          equipped?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "user_cosmetics_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_cosmetics_cosmetic_id_fkey";
            columns: ["cosmetic_id"];
            isOneToOne: false;
            referencedRelation: "cosmetics";
            referencedColumns: ["id"];
          }
        ];
      };
      semesters: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          start_date: string | null;
          end_date: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "semesters_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      subjects: {
        Row: {
          id: string;
          user_id: string;
          semester_id: string | null;
          name: string;
          code: string;
          emoji: string;
          color: string;
          description: string;
          professor: string;
          credit_hours: number;
          target_grade: string;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          semester_id?: string | null;
          name: string;
          code?: string;
          emoji?: string;
          color?: string;
          description?: string;
          professor?: string;
          credit_hours?: number;
          target_grade?: string;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          semester_id?: string | null;
          name?: string;
          code?: string;
          emoji?: string;
          color?: string;
          description?: string;
          professor?: string;
          credit_hours?: number;
          target_grade?: string;
          is_archived?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subjects_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subjects_semester_id_fkey";
            columns: ["semester_id"];
            isOneToOne: false;
            referencedRelation: "semesters";
            referencedColumns: ["id"];
          }
        ];
      };
      topics: {
        Row: {
          id: string;
          subject_id: string;
          name: string;
          description: string;
          sort_order: number;
          mastery_pct: number;
          is_completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          name: string;
          description?: string;
          sort_order?: number;
          mastery_pct?: number;
          is_completed?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          sort_order?: number;
          mastery_pct?: number;
          is_completed?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          }
        ];
      };
      exams: {
        Row: {
          id: string;
          subject_id: string;
          name: string;
          exam_type: "exam" | "quiz" | "assignment" | "project" | "presentation" | "other";
          exam_date: string;
          duration_minutes: number | null;
          location: string;
          weight_pct: number;
          notes: string;
          reminder_24h: boolean;
          reminder_48h: boolean;
          reminder_1week: boolean;
          cram_mode_enabled: boolean;
          score: number | null;
          max_score: number;
          is_completed: boolean;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          name: string;
          exam_type?: "exam" | "quiz" | "assignment" | "project" | "presentation" | "other";
          exam_date: string;
          duration_minutes?: number | null;
          location?: string;
          weight_pct?: number;
          notes?: string;
          reminder_24h?: boolean;
          reminder_48h?: boolean;
          reminder_1week?: boolean;
          cram_mode_enabled?: boolean;
          score?: number | null;
          max_score?: number;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          exam_type?: "exam" | "quiz" | "assignment" | "project" | "presentation" | "other";
          exam_date?: string;
          duration_minutes?: number | null;
          location?: string;
          weight_pct?: number;
          notes?: string;
          reminder_24h?: boolean;
          reminder_48h?: boolean;
          reminder_1week?: boolean;
          cram_mode_enabled?: boolean;
          score?: number | null;
          max_score?: number;
          is_completed?: boolean;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exams_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          }
        ];
      };
      exam_topics: {
        Row: {
          id: string;
          exam_id: string;
          topic_id: string;
        };
        Insert: {
          id?: string;
          exam_id: string;
          topic_id: string;
        };
        Update: {
          exam_id?: string;
          topic_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exam_topics_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_topics_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          }
        ];
      };
      quizzes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          source_type: string;
          source_id: string | null;
          difficulty: string;
          questions: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          source_type?: string;
          source_id?: string | null;
          difficulty?: string;
          questions?: Json;
          created_at?: string;
        };
        Update: {
          title?: string;
          source_type?: string;
          source_id?: string | null;
          difficulty?: string;
          questions?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "quizzes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      quiz_attempts: {
        Row: {
          id: string;
          quiz_id: string;
          user_id: string;
          score: number;
          total_questions: number;
          answers: Json;
          xp_earned: number;
          gold_earned: number;
          completed_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          user_id: string;
          score?: number;
          total_questions?: number;
          answers?: Json;
          xp_earned?: number;
          gold_earned?: number;
          completed_at?: string;
        };
        Update: {
          score?: number;
          total_questions?: number;
          answers?: Json;
          xp_earned?: number;
          gold_earned?: number;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      daily_quests: {
        Row: {
          id: string;
          user_id: string;
          quest_type: string;
          title: string;
          description: string;
          target_value: number;
          current_value: number;
          xp_reward: number;
          gold_reward: number;
          period: "daily" | "weekly" | "monthly";
          is_completed: boolean;
          generated_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quest_type: string;
          title: string;
          description?: string;
          target_value?: number;
          current_value?: number;
          xp_reward?: number;
          gold_reward?: number;
          period?: "daily" | "weekly" | "monthly";
          is_completed?: boolean;
          generated_at?: string;
          expires_at?: string;
        };
        Update: {
          current_value?: number;
          is_completed?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "daily_quests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      support_tickets: {
        Row: {
          id: string;
          user_id: string;
          category: "bug" | "feature" | "question" | "other";
          subject: string;
          message: string;
          page_url: string | null;
          severity: "low" | "medium" | "high" | "critical";
          status: "open" | "in_progress" | "resolved" | "closed";
          admin_response: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category?: "bug" | "feature" | "question" | "other";
          subject: string;
          message: string;
          page_url?: string | null;
          severity?: "low" | "medium" | "high" | "critical";
          status?: "open" | "in_progress" | "resolved" | "closed";
          admin_response?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category?: "bug" | "feature" | "question" | "other";
          subject?: string;
          message?: string;
          page_url?: string | null;
          severity?: "low" | "medium" | "high" | "critical";
          status?: "open" | "in_progress" | "resolved" | "closed";
          admin_response?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
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
export type KnowledgePath = Database["public"]["Tables"]["knowledge_paths"]["Row"];
export type KnowledgeNode = Database["public"]["Tables"]["knowledge_nodes"]["Row"];
export type Guild = Database["public"]["Tables"]["guilds"]["Row"];
export type GuildMember = Database["public"]["Tables"]["guild_members"]["Row"];
export type GuildMessage = Database["public"]["Tables"]["guild_messages"]["Row"];
export type GuildRaid = Database["public"]["Tables"]["guild_raids"]["Row"];
export type GuildRaidContribution = Database["public"]["Tables"]["guild_raid_contributions"]["Row"];
export type Achievement = Database["public"]["Tables"]["achievements"]["Row"];
export type UserAchievement = Database["public"]["Tables"]["user_achievements"]["Row"];
export type Cosmetic = Database["public"]["Tables"]["cosmetics"]["Row"];
export type UserCosmetic = Database["public"]["Tables"]["user_cosmetics"]["Row"];
export type Semester = Database["public"]["Tables"]["semesters"]["Row"];
export type Subject = Database["public"]["Tables"]["subjects"]["Row"];
export type Topic = Database["public"]["Tables"]["topics"]["Row"];
export type Exam = Database["public"]["Tables"]["exams"]["Row"];
export type ExamTopic = Database["public"]["Tables"]["exam_topics"]["Row"];
export type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
export type QuizAttempt = Database["public"]["Tables"]["quiz_attempts"]["Row"];
export type DailyQuest = Database["public"]["Tables"]["daily_quests"]["Row"];
export type SupportTicket = Database["public"]["Tables"]["support_tickets"]["Row"];
