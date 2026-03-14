"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Sun,
  Moon,
  Volume2,
  VolumeOff,
  Timer,
  Coffee,
  User as UserIcon,
  Save,
  ArrowLeft,
  LogOut,
  Palette,
  Bell,
  BellOff,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useCardStyles } from "@/hooks/useCardStyles";
import { getMuted, toggleMute } from "@/hooks/useSoundEffects";
import { supabase } from "@/lib/supabase";
import TravelerHotbar from "@/components/layout/TravelerHotbar";
import SplineBackground from "@/components/layout/SplineBackground";

/** Accent color options */
const ACCENT_COLORS = [
  { id: "purple", label: "Purple", value: "#9D4EDD", ring: "ring-purple-400" },
  { id: "blue", label: "Blue", value: "#3B82F6", ring: "ring-blue-400" },
  { id: "emerald", label: "Emerald", value: "#10B981", ring: "ring-emerald-400" },
  { id: "rose", label: "Rose", value: "#F43F5E", ring: "ring-rose-400" },
  { id: "amber", label: "Amber", value: "#F59E0B", ring: "ring-amber-400" },
  { id: "cyan", label: "Cyan", value: "#06B6D4", ring: "ring-cyan-400" },
];

interface UserSettings {
  theme: "sun" | "moon" | "auto";
  accent_color: string;
  focus_duration: number;
  break_duration: number;
  sound_enabled: boolean;
  notifications_enabled: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: "moon",
  accent_color: "purple",
  focus_duration: 25,
  break_duration: 5,
  sound_enabled: true,
  notifications_enabled: true,
};

/**
 * Settings page — user preferences for theme, sound, focus timer,
 * notifications, and profile. Syncs with the `user_settings` table
 * in Supabase and persists locally via existing ThemeContext / sound hooks.
 */
export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, signOut, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { card, isSun, title, muted: mutedText } = useCardStyles();

  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  // Load settings from Supabase
  const loadSettings = useCallback(async () => {
    if (!user) return;

    setSoundMuted(getMuted());

    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Settings: failed to load:", error);
    }

    if (data) {
      setSettings({
        theme: data.theme || DEFAULT_SETTINGS.theme,
        accent_color: data.accent_color || DEFAULT_SETTINGS.accent_color,
        focus_duration: data.focus_duration ?? DEFAULT_SETTINGS.focus_duration,
        break_duration: data.break_duration ?? DEFAULT_SETTINGS.break_duration,
        sound_enabled: data.sound_enabled ?? DEFAULT_SETTINGS.sound_enabled,
        notifications_enabled:
          data.notifications_enabled ?? DEFAULT_SETTINGS.notifications_enabled,
      });
    }
    setLoaded(true);
  }, [user]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Keep local theme in sync with the settings dropdown
  useEffect(() => {
    if (!loaded) return;
    const wantsSun = settings.theme === "sun";
    const wantsMoon = settings.theme === "moon";
    if ((wantsSun && theme === "moon") || (wantsMoon && theme === "sun")) {
      toggleTheme();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.theme, loaded]);

  // Save settings to Supabase
  const saveSettings = async () => {
    if (!user) return;
    setIsSaving(true);

    const { error } = await supabase
      .from("user_settings")
      .upsert(
        {
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Settings: save failed:", error);
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
    setIsSaving(false);
  };

  const handleSoundToggle = () => {
    const newMuted = toggleMute();
    setSoundMuted(newMuted);
    setSettings((s) => ({ ...s, sound_enabled: !newMuted }));
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Section wrapper
  const Section = ({
    icon,
    label,
    children,
  }: {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${card} p-5 mb-4`}
    >
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className={`text-base font-bold font-[family-name:var(--font-nunito)] ${title}`}>
          {label}
        </h2>
      </div>
      {children}
    </motion.div>
  );

  // Row inside a section
  const SettingRow = ({
    label,
    description,
    children,
  }: {
    label: string;
    description?: string;
    children: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0 border-white/10">
      <div>
        <p
          className={`text-sm font-medium font-[family-name:var(--font-quicksand)] ${
            isSun ? "text-slate-700" : "text-white"
          }`}
        >
          {label}
        </p>
        {description && (
          <p className={`text-xs mt-0.5 ${mutedText}`}>{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );

  // Toggle switch
  const Toggle = ({
    enabled,
    onToggle,
  }: {
    enabled: boolean;
    onToggle: () => void;
  }) => (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled
          ? "bg-emerald-500"
          : isSun
          ? "bg-slate-300"
          : "bg-slate-600"
      }`}
    >
      <motion.div
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
      />
    </button>
  );

  if (authLoading || !loaded) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-4xl animate-bounce">🦉</div>
        </div>
        <TravelerHotbar />
      </>
    );
  }

  return (
    <>
      <SplineBackground />
      <div className="min-h-screen pb-24 pt-8 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push("/")}
                className={`p-2 rounded-xl backdrop-blur-sm border ${
                  isSun
                    ? "bg-white/70 border-slate-200 text-slate-600"
                    : "bg-white/10 border-white/20 text-white"
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div>
                <h1
                  className={`text-2xl font-bold font-[family-name:var(--font-nunito)] ${
                    isSun ? "text-slate-800" : "text-white"
                  }`}
                >
                  Settings
                </h1>
                <p className={`text-xs ${mutedText}`}>
                  Customize your study experience
                </p>
              </div>
            </div>

            {/* Save button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={saveSettings}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm shadow-md transition-colors ${
                saveSuccess
                  ? "bg-emerald-500 text-white"
                  : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600"
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" /> Saved
                </>
              ) : isSaving ? (
                "Saving..."
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save
                </>
              )}
            </motion.button>
          </motion.div>

          {/* ===== PROFILE SECTION ===== */}
          <Section
            icon={
              <UserIcon
                className={`w-5 h-5 ${isSun ? "text-purple-600" : "text-purple-400"}`}
              />
            }
            label="Profile"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
                  isSun ? "bg-purple-100" : "bg-purple-500/20"
                }`}
              >
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  "🦉"
                )}
              </div>
              <div>
                <p
                  className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${
                    isSun ? "text-slate-800" : "text-white"
                  }`}
                >
                  {profile?.display_name || "Traveler"}
                </p>
                <p className={`text-xs ${mutedText}`}>
                  {user?.email || "No email"}
                </p>
                <p className={`text-xs mt-1 ${mutedText}`}>
                  Level {profile?.level ?? 1} &middot; {profile?.xp ?? 0} XP
                  &middot; {profile?.gold ?? 0} Gold
                </p>
              </div>
            </div>
          </Section>

          {/* ===== APPEARANCE SECTION ===== */}
          <Section
            icon={
              <Palette
                className={`w-5 h-5 ${isSun ? "text-amber-600" : "text-amber-400"}`}
              />
            }
            label="Appearance"
          >
            <SettingRow label="Theme" description="Light or dark mode">
              <div className="flex gap-1">
                {(["sun", "moon"] as const).map((t) => (
                  <motion.button
                    key={t}
                    whileTap={{ scale: 0.9 }}
                    onClick={() =>
                      setSettings((s) => ({ ...s, theme: t }))
                    }
                    className={`p-2 rounded-xl transition-colors ${
                      settings.theme === t
                        ? "bg-purple-500 text-white shadow-md"
                        : isSun
                        ? "bg-white/60 text-slate-500 hover:bg-white/80"
                        : "bg-white/10 text-slate-400 hover:bg-white/20"
                    }`}
                  >
                    {t === "sun" ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )}
                  </motion.button>
                ))}
              </div>
            </SettingRow>

            <SettingRow
              label="Accent Color"
              description="Highlight color across the app"
            >
              <div className="flex gap-1.5">
                {ACCENT_COLORS.map((color) => (
                  <motion.button
                    key={color.id}
                    whileTap={{ scale: 0.85 }}
                    onClick={() =>
                      setSettings((s) => ({ ...s, accent_color: color.id }))
                    }
                    className={`w-6 h-6 rounded-full transition-all ${
                      settings.accent_color === color.id
                        ? `ring-2 ${color.ring} ring-offset-2 ${
                            isSun ? "ring-offset-white" : "ring-offset-slate-900"
                          }`
                        : ""
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </SettingRow>
          </Section>

          {/* ===== SOUND SECTION ===== */}
          <Section
            icon={
              soundMuted ? (
                <VolumeOff
                  className={`w-5 h-5 ${isSun ? "text-red-500" : "text-red-400"}`}
                />
              ) : (
                <Volume2
                  className={`w-5 h-5 ${isSun ? "text-blue-600" : "text-blue-400"}`}
                />
              )
            }
            label="Sound"
          >
            <SettingRow
              label="Sound Effects"
              description="Play sounds for XP, level-ups, and UI"
            >
              <Toggle enabled={!soundMuted} onToggle={handleSoundToggle} />
            </SettingRow>
          </Section>

          {/* ===== FOCUS TIMER SECTION ===== */}
          <Section
            icon={
              <Timer
                className={`w-5 h-5 ${isSun ? "text-emerald-600" : "text-emerald-400"}`}
              />
            }
            label="Focus Timer"
          >
            <SettingRow
              label="Focus Duration"
              description="Minutes per focus session"
            >
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={5}
                  max={90}
                  step={5}
                  value={settings.focus_duration}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      focus_duration: Number(e.target.value),
                    }))
                  }
                  className="w-24 accent-emerald-500"
                />
                <span
                  className={`text-sm font-bold w-10 text-right ${
                    isSun ? "text-slate-700" : "text-white"
                  }`}
                >
                  {settings.focus_duration}m
                </span>
              </div>
            </SettingRow>

            <SettingRow
              label="Break Duration"
              description="Minutes between sessions"
            >
              <div className="flex items-center gap-2">
                <Coffee
                  className={`w-4 h-4 ${isSun ? "text-amber-500" : "text-amber-400"}`}
                />
                <div className="flex gap-1">
                  {[3, 5, 10, 15].map((mins) => (
                    <motion.button
                      key={mins}
                      whileTap={{ scale: 0.9 }}
                      onClick={() =>
                        setSettings((s) => ({ ...s, break_duration: mins }))
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                        settings.break_duration === mins
                          ? "bg-emerald-500 text-white shadow"
                          : isSun
                          ? "bg-white/60 text-slate-500"
                          : "bg-white/10 text-slate-400"
                      }`}
                    >
                      {mins}m
                    </motion.button>
                  ))}
                </div>
              </div>
            </SettingRow>
          </Section>

          {/* ===== NOTIFICATIONS SECTION ===== */}
          <Section
            icon={
              settings.notifications_enabled ? (
                <Bell
                  className={`w-5 h-5 ${isSun ? "text-yellow-600" : "text-yellow-400"}`}
                />
              ) : (
                <BellOff
                  className={`w-5 h-5 ${isSun ? "text-slate-400" : "text-slate-500"}`}
                />
              )
            }
            label="Notifications"
          >
            <SettingRow
              label="Push Notifications"
              description="Get reminders to study"
            >
              <Toggle
                enabled={settings.notifications_enabled}
                onToggle={() =>
                  setSettings((s) => ({
                    ...s,
                    notifications_enabled: !s.notifications_enabled,
                  }))
                }
              />
            </SettingRow>
          </Section>

          {/* ===== ACCOUNT SECTION ===== */}
          <Section
            icon={
              <LogOut
                className={`w-5 h-5 ${isSun ? "text-red-500" : "text-red-400"}`}
              />
            }
            label="Account"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSignOut}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                isSun
                  ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                  : "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
              }`}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </motion.button>
          </Section>

          {/* Version footer */}
          <p className={`text-center text-xs mt-6 mb-8 ${mutedText}`}>
            Brain Trails v0.1.0
          </p>
        </div>
      </div>
      <TravelerHotbar />
    </>
  );
}
