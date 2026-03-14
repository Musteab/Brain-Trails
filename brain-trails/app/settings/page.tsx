"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Moon,
  Volume2,
  VolumeOff,
  Timer,
  Coffee,
  User as UserIcon,
  ArrowLeft,
  LogOut,
  Palette,
  Check,
  KeyRound,
  Trash2,
  Download,
  AlertTriangle,
  Loader2,
  Pencil,
  BookOpen,
  Bell,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useCardStyles } from "@/hooks/useCardStyles";
import { useSettings } from "@/hooks/useSettings";
import { getMuted, toggleMute } from "@/hooks/useSoundEffects";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/stores";
import TravelerHotbar from "@/components/layout/TravelerHotbar";
import BackgroundLayer from "@/components/layout/BackgroundLayer";

// ── Extracted sub-components (stable references across re-renders) ──

function Section({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  const { card, title } = useCardStyles();
  return (
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
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  const { isSun, muted: mutedText } = useCardStyles();
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0 border-white/10">
      <div className="flex-1 min-w-0 mr-3">
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
      <div className="flex items-center gap-2 shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  const { isSun } = useCardStyles();
  return (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? "bg-emerald-500" : isSun ? "bg-slate-300" : "bg-slate-600"
      }`}
    >
      <motion.div
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
      />
    </button>
  );
}

// ── Main page component ─────────────────────────────────

/**
 * Settings page — functional user preferences.
 *
 * What works:
 * - Editable profile (display_name, username, bio)
 * - Theme toggle (synced with ThemeContext + Supabase)
 * - Sound toggle (synced with localStorage mute + Supabase)
 * - Focus/break duration defaults (read by Focus page via useSettings)
 * - Change password
 * - Reset progress (XP, gold, level — with confirmation)
 * - Export study data as JSON
 * - Sign out
 *
 * Auto-saves settings on change (debounced via useSettings hook).
 */
export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, signOut, refreshProfile, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isSun, muted: mutedText } = useCardStyles();
  const { settings, isLoading: settingsLoading, saveStatus, update } = useSettings();

  // Sound mute (local state mirroring localStorage)
  const [soundMuted, setSoundMuted] = useState(false);

  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    display_name: "",
    username: "",
    bio: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Change password
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Reset progress
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Export
  const [isExporting, setIsExporting] = useState(false);

  // Init sound state
  useEffect(() => {
    setSoundMuted(getMuted());
  }, []);

  // Populate profile form from profile
  useEffect(() => {
    if (profile) {
      setProfileForm({
        display_name: profile.display_name || "",
        username: profile.username || "",
        bio: "",
      });
      // Load bio separately since Profile interface doesn't include it
      if (user) {
        supabase
          .from("profiles")
          .select("bio")
          .eq("id", user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.bio) {
              setProfileForm((prev) => ({ ...prev, bio: data.bio }));
            }
          });
      }
    }
  }, [profile, user]);

  // Keep ThemeContext in sync when settings change
  useEffect(() => {
    if (settingsLoading) return;
    const wantsSun = settings.theme === "sun";
    const wantsMoon = settings.theme === "moon";
    if ((wantsSun && theme === "moon") || (wantsMoon && theme === "sun")) {
      toggleTheme();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.theme, settingsLoading]);

  // ── Handlers ──────────────────────────────────────────

  const handleThemeChange = (t: "sun" | "moon") => {
    update({ theme: t });
  };

  const handleSoundToggle = () => {
    const newMuted = toggleMute();
    setSoundMuted(newMuted);
    update({ sound_enabled: !newMuted });
  };

  const handleProfileSave = async () => {
    if (!user) return;
    setProfileSaving(true);
    setProfileError(null);

    const trimmedUsername = profileForm.username.trim();
    const trimmedDisplayName = profileForm.display_name.trim();
    const trimmedBio = profileForm.bio.trim();

    if (!trimmedUsername) {
      setProfileError("Username cannot be empty.");
      setProfileSaving(false);
      return;
    }

    if (trimmedUsername.length < 3) {
      setProfileError("Username must be at least 3 characters.");
      setProfileSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: trimmedDisplayName || null,
        username: trimmedUsername,
        bio: trimmedBio,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      if (error.code === "23505") {
        setProfileError("That username is already taken.");
      } else {
        setProfileError(error.message);
      }
    } else {
      setIsEditingProfile(false);
      await refreshProfile();
    }
    setProfileSaving(false);
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordStatus("saving");
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordError(error.message);
      setPasswordStatus("error");
    } else {
      setPasswordStatus("success");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setPasswordStatus("idle");
        setShowPasswordForm(false);
      }, 2000);
    }
  };

  const handleResetProgress = async () => {
    if (!user || resetConfirmText !== "RESET") return;
    setIsResetting(true);

    // Reset XP, level, gold in profiles table
    const { error } = await supabase
      .from("profiles")
      .update({ xp: 0, level: 1, gold: 0, streak_days: 0 })
      .eq("id", user.id);

    if (!error) {
      // Reset Zustand game store
      useGameStore.getState().reset();
      useGameStore.getState().loadStats(user.id);
      await refreshProfile();
    }

    setIsResetting(false);
    setShowResetConfirm(false);
    setResetConfirmText("");
  };

  const handleExportData = useCallback(async () => {
    if (!user) return;
    setIsExporting(true);

    try {
      const [sessions, notes, decks, cards, log] = await Promise.all([
        supabase.from("focus_sessions").select("*").eq("user_id", user.id),
        supabase.from("notes").select("*").eq("user_id", user.id),
        supabase.from("decks").select("*").eq("user_id", user.id),
        supabase
          .from("cards")
          .select("*, decks!inner(user_id)")
          .eq("decks.user_id", user.id),
        supabase.from("adventure_log").select("*").eq("user_id", user.id),
      ]);

      const exportPayload = {
        exported_at: new Date().toISOString(),
        profile: {
          display_name: profile?.display_name,
          username: profile?.username,
          xp: profile?.xp,
          level: profile?.level,
          gold: profile?.gold,
          streak_days: profile?.streak_days,
        },
        focus_sessions: sessions.data || [],
        notes: notes.data || [],
        decks: decks.data || [],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        cards: (cards.data || []).map(({ decks: _join, ...card }) => card),
        adventure_log: log.data || [],
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `brain-trails-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[Settings] export failed:", err);
    }

    setIsExporting(false);
  }, [user, profile]);

  const handleSignOut = async () => {
    await signOut();
  };

  const inputClass = `w-full px-3 py-2 rounded-xl text-sm outline-none transition-colors ${
    isSun
      ? "bg-white/60 border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
      : "bg-white/10 border border-white/20 text-white placeholder:text-slate-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
  }`;

  // ── Loading state ─────────────────────────────────────

  if (authLoading || settingsLoading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-4xl animate-bounce">🦉</div>
        </div>
        <TravelerHotbar />
      </>
    );
  }

  // ── Render ────────────────────────────────────────────

  return (
    <>
      <BackgroundLayer />
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
                  {saveStatus === "saving"
                    ? "Saving..."
                    : saveStatus === "saved"
                    ? "All changes saved"
                    : "Customize your study experience"}
                </p>
              </div>
            </div>

            {/* Auto-save indicator */}
            <AnimatePresence>
              {saveStatus === "saved" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-500 text-xs font-bold"
                >
                  <Check className="w-3.5 h-3.5" /> Saved
                </motion.div>
              )}
            </AnimatePresence>
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
            {!isEditingProfile ? (
              /* Display mode */
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0 ${
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
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${
                      isSun ? "text-slate-800" : "text-white"
                    }`}
                  >
                    {profile?.display_name || "Traveler"}
                  </p>
                  <p className={`text-xs ${mutedText}`}>
                    @{profile?.username || "unknown"}
                  </p>
                  <p className={`text-xs ${mutedText}`}>
                    {user?.email || "No email"}
                  </p>
                  <p className={`text-xs mt-1 ${mutedText}`}>
                    Level {profile?.level ?? 1} &middot; {profile?.xp ?? 0} XP
                    &middot; {profile?.gold ?? 0} Gold
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsEditingProfile(true)}
                  className={`p-2 rounded-xl transition-colors ${
                    isSun
                      ? "bg-purple-100 text-purple-600 hover:bg-purple-200"
                      : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                  }`}
                  title="Edit profile"
                >
                  <Pencil className="w-4 h-4" />
                </motion.button>
              </div>
            ) : (
              /* Edit mode */
              <div className="space-y-3">
                <div>
                  <label className={`text-xs font-bold block mb-1 ${mutedText}`}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.display_name}
                    onChange={(e) =>
                      setProfileForm((f) => ({ ...f, display_name: e.target.value }))
                    }
                    placeholder="Your display name"
                    className={inputClass}
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className={`text-xs font-bold block mb-1 ${mutedText}`}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) =>
                      setProfileForm((f) => ({
                        ...f,
                        username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                      }))
                    }
                    placeholder="username"
                    className={inputClass}
                    maxLength={30}
                  />
                </div>
                <div>
                  <label className={`text-xs font-bold block mb-1 ${mutedText}`}>
                    Bio
                  </label>
                  <textarea
                    value={profileForm.bio}
                    onChange={(e) =>
                      setProfileForm((f) => ({ ...f, bio: e.target.value }))
                    }
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className={`${inputClass} resize-none`}
                    maxLength={200}
                  />
                  <p className={`text-xs mt-1 ${mutedText}`}>
                    {profileForm.bio.length}/200
                  </p>
                </div>
                {profileError && (
                  <p className="text-xs text-red-500 font-medium">{profileError}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleProfileSave}
                    disabled={profileSaving}
                    className="flex-1 py-2 rounded-xl bg-purple-500 text-white text-sm font-bold hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {profileSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {profileSaving ? "Saving..." : "Save Profile"}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsEditingProfile(false);
                      setProfileError(null);
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                      isSun
                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        : "bg-white/10 text-slate-300 hover:bg-white/20"
                    }`}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            )}
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
                    onClick={() => handleThemeChange(t)}
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
              description="Play sounds for XP, level-ups, and UI interactions"
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
            label="Focus Timer Defaults"
          >
            <SettingRow
              label="Default Focus Duration"
              description="Pre-selected duration on the Focus page"
            >
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={5}
                  max={90}
                  step={5}
                  value={settings.focus_duration}
                  onChange={(e) =>
                    update({ focus_duration: Number(e.target.value) })
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
              label="Default Break Duration"
              description="Pre-selected break time between sessions"
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
                      onClick={() => update({ break_duration: mins })}
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

          {/* ===== STUDY PREFERENCES SECTION ===== */}
          <Section
            icon={
              <BookOpen
                className={`w-5 h-5 ${isSun ? "text-cyan-600" : "text-cyan-400"}`}
              />
            }
            label="Study Preferences"
          >
            <SettingRow label="Text Size" description="Adjust reading font size">
              <div className="flex gap-1">
                {([
                  { value: "small" as const, label: "Small" },
                  { value: "medium" as const, label: "Medium" },
                  { value: "large" as const, label: "Large" },
                ]).map(({ value, label }) => (
                  <motion.button
                    key={value}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => update({ font_size: value })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      settings.font_size === value
                        ? "bg-emerald-500 text-white shadow"
                        : isSun
                        ? "bg-white/60 text-slate-500"
                        : "bg-white/10 text-slate-400"
                    }`}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>
            </SettingRow>

            <SettingRow
              label="Cram Mode"
              description="Enable fullscreen distraction-free mode"
            >
              <Toggle
                enabled={settings.cram_mode_enabled}
                onToggle={() => update({ cram_mode_enabled: !settings.cram_mode_enabled })}
              />
            </SettingRow>

            <SettingRow
              label="Ambient Sound"
              description="Background soundscape during focus"
            >
              <div className="flex gap-1">
                {([
                  { value: "none" as const, label: "None" },
                  { value: "rain" as const, label: "Rain" },
                  { value: "cafe" as const, label: "Cafe" },
                  { value: "forest" as const, label: "Forest" },
                  { value: "lofi" as const, label: "Lofi" },
                ]).map(({ value, label }) => (
                  <motion.button
                    key={value}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => update({ ambient_sound: value })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      settings.ambient_sound === value
                        ? "bg-emerald-500 text-white shadow"
                        : isSun
                        ? "bg-white/60 text-slate-500"
                        : "bg-white/10 text-slate-400"
                    }`}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>
            </SettingRow>
          </Section>

          {/* ===== NOTIFICATIONS SECTION ===== */}
          <Section
            icon={
              <Bell
                className={`w-5 h-5 ${isSun ? "text-orange-600" : "text-orange-400"}`}
              />
            }
            label="Notifications"
          >
            <SettingRow
              label="Streak Reminders"
              description="Get reminded to maintain your daily streak"
            >
              <Toggle
                enabled={settings.streak_reminders}
                onToggle={() => update({ streak_reminders: !settings.streak_reminders })}
              />
            </SettingRow>

            <SettingRow
              label="Guild Notifications"
              description="Receive updates from your guild"
            >
              <Toggle
                enabled={settings.guild_notifications}
                onToggle={() => update({ guild_notifications: !settings.guild_notifications })}
              />
            </SettingRow>

            <SettingRow
              label="Study Nudges"
              description="Gentle reminders to start studying"
            >
              <Toggle
                enabled={settings.study_nudges}
                onToggle={() => update({ study_nudges: !settings.study_nudges })}
              />
            </SettingRow>
          </Section>

          {/* ===== ACCOUNT SECTION ===== */}
          <Section
            icon={
              <KeyRound
                className={`w-5 h-5 ${isSun ? "text-indigo-600" : "text-indigo-400"}`}
              />
            }
            label="Account"
          >
            {/* Change Password */}
            <SettingRow label="Password" description="Update your login password">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  isSun
                    ? "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                    : "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30"
                }`}
              >
                Change
              </motion.button>
            </SettingRow>

            <AnimatePresence>
              {showPasswordForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 pb-1 space-y-3">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password (min 6 characters)"
                      className={inputClass}
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className={inputClass}
                    />
                    {passwordError && (
                      <p className="text-xs text-red-500 font-medium">{passwordError}</p>
                    )}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleChangePassword}
                      disabled={passwordStatus === "saving"}
                      className={`w-full py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                        passwordStatus === "success"
                          ? "bg-emerald-500 text-white"
                          : "bg-indigo-500 text-white hover:bg-indigo-600"
                      } disabled:opacity-50`}
                    >
                      {passwordStatus === "saving" && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      {passwordStatus === "success"
                        ? "Password Updated!"
                        : passwordStatus === "saving"
                        ? "Updating..."
                        : "Update Password"}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Export Data */}
            <SettingRow label="Export Data" description="Download all your study data as JSON">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleExportData}
                disabled={isExporting}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  isSun
                    ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                    : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                } disabled:opacity-50`}
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {isExporting ? "Exporting..." : "Export"}
              </motion.button>
            </SettingRow>

            {/* Reset Progress */}
            <SettingRow
              label="Reset Progress"
              description="Reset XP, level, gold, and streak to zero"
            >
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowResetConfirm(!showResetConfirm)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  isSun
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                }`}
              >
                Reset
              </motion.button>
            </SettingRow>

            <AnimatePresence>
              {showResetConfirm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    className={`mt-2 p-4 rounded-xl border-2 ${
                      isSun
                        ? "bg-red-50 border-red-200"
                        : "bg-red-500/10 border-red-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <p
                        className={`text-sm font-bold ${
                          isSun ? "text-red-700" : "text-red-400"
                        }`}
                      >
                        This cannot be undone!
                      </p>
                    </div>
                    <p className={`text-xs mb-3 ${mutedText}`}>
                      Type <strong>RESET</strong> to confirm. This will set your XP,
                      level, gold, and streak back to zero. Your notes, flashcards,
                      and focus history will be kept.
                    </p>
                    <input
                      type="text"
                      value={resetConfirmText}
                      onChange={(e) => setResetConfirmText(e.target.value.toUpperCase())}
                      placeholder='Type "RESET" to confirm'
                      className={inputClass}
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleResetProgress}
                      disabled={resetConfirmText !== "RESET" || isResetting}
                      className="w-full mt-3 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {isResetting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      {isResetting ? "Resetting..." : "Confirm Reset"}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sign Out */}
            <div className="pt-4">
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
            </div>
          </Section>

          {/* Version footer */}
          <p className={`text-center text-xs mt-6 mb-8 ${mutedText}`}>
            Brain Trails v0.2.0
          </p>
        </div>
      </div>
      <TravelerHotbar />
    </>
  );
}
