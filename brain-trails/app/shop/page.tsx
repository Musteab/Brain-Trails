// @ts-nocheck
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Coins,
  Check,
  Lock,
  Star,
  Sparkles,
  ArrowLeft,
  Palette,
  Frame,
  Type,
  Image as ImageIcon,
  Loader2,
  X,
  Crown,
  Gem,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCardStyles } from "@/hooks/useCardStyles";
import { useUIStore } from "@/stores";
import { supabase } from "@/lib/supabase";
import BackgroundLayer from "@/components/layout/BackgroundLayer";
import TravelerHotbar from "@/components/layout/TravelerHotbar";
import type { Cosmetic, UserCosmetic } from "@/lib/database.types";

// ── Tab config ───────────────────────────────────────────
const CATEGORY_TABS: { key: Cosmetic["category"]; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: "theme",        label: "Themes",      icon: <Palette className="w-4 h-4" />,    desc: "Change the look of your realm" },
  { key: "avatar_frame", label: "Frames",      icon: <Frame className="w-4 h-4" />,      desc: "Show off with avatar borders" },
  { key: "title",        label: "Titles",       icon: <Type className="w-4 h-4" />,       desc: "Earn distinguished titles" },
  { key: "background",   label: "Backgrounds", icon: <ImageIcon className="w-4 h-4" />,  desc: "Customize your backdrop" },
];

// ── Rarity config ───────────────────────────────────────
const RARITY_CONFIG: Record<
  Cosmetic["rarity"] | "dev",
  { stars: number; sun: { border: string; badge: string }; moon: { border: string; badge: string }; cardClass: string }
> = {
  common:    { stars: 1, sun: { border: "border-slate-300",   badge: "bg-slate-100 text-slate-500" },   moon: { border: "border-slate-500/40",   badge: "bg-slate-500/20 text-slate-400" },   cardClass: "" },
  uncommon:  { stars: 2, sun: { border: "border-green-400",   badge: "bg-green-50 text-green-600" },    moon: { border: "border-green-400/50",   badge: "bg-green-400/15 text-green-400" },   cardClass: "" },
  rare:      { stars: 3, sun: { border: "border-blue-400",    badge: "bg-blue-50 text-blue-600" },      moon: { border: "border-blue-400/50",    badge: "bg-blue-400/15 text-blue-400" },     cardClass: "card-rare-glow" },
  epic:      { stars: 4, sun: { border: "border-purple-400",  badge: "bg-purple-50 text-purple-600" },  moon: { border: "border-purple-400/50",  badge: "bg-purple-400/15 text-purple-400" }, cardClass: "card-epic-shimmer" },
  legendary: { stars: 5, sun: { border: "border-amber-400",   badge: "bg-amber-50 text-amber-600" },    moon: { border: "border-amber-400/50",   badge: "bg-amber-400/15 text-amber-400" },   cardClass: "card-legendary-shine" },
  beta:      { stars: 4, sun: { border: "border-rose-400", badge: "bg-rose-50 text-rose-600" }, moon: { border: "border-rose-400/50", badge: "bg-rose-400/15 text-rose-400" }, cardClass: "" },
  dev:       { stars: 5, sun: { border: "border-indigo-400", badge: "bg-indigo-50 text-indigo-600" }, moon: { border: "border-indigo-400/50", badge: "bg-indigo-400/15 text-indigo-400" }, cardClass: "card-legendary-shine" },
};

// ── Preview renderers ────────────────────────────────────
// Frame CSS class per rarity
const FRAME_CLASSES: Record<Cosmetic["rarity"], string> = {
  common: "cosmetic-frame-common",
  uncommon: "cosmetic-frame-uncommon",
  rare: "cosmetic-frame-rare",
  epic: "cosmetic-frame-epic",
  legendary: "cosmetic-frame-legendary",
  beta: "cosmetic-frame-beta",
  dev: "frame-dev",
} as Record<string, string>;

// Title CSS class per rarity
const TITLE_CLASSES: Record<Cosmetic["rarity"], string> = {
  common: "cosmetic-title-common",
  uncommon: "cosmetic-title-uncommon",
  rare: "cosmetic-title-rare",
  epic: "cosmetic-title-epic",
  legendary: "cosmetic-title-legendary",
  beta: "cosmetic-title-beta",
  dev: "cosmetic-title-dev",
} as Record<string, string>;

function CosmeticPreview({ cosmetic, isSun, size = "small" }: { cosmetic: Cosmetic; isSun: boolean; size?: "small" | "large" }) {
  const isLarge = size === "large";
  const preview = cosmetic.preview_data as Record<string, unknown> | null;

  // ── SQUARE FRAME PREVIEW ──
  if (cosmetic.category === "avatar_frame") {
    const frameClass = FRAME_CLASSES[cosmetic.rarity] || FRAME_CLASSES.common;
    const dim = isLarge ? "w-32 h-32" : "w-24 h-24";
    return (
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className={`${dim} ${frameClass} flex items-center justify-center text-3xl`}
          style={{ "--frame-bg": isSun ? "#f8fafc" : "#1e293b" } as React.CSSProperties}
        >
          <span className="text-2xl">👤</span>
        </motion.div>
        {/* Sparkle particles for epic+ */}
        {(cosmetic.rarity === "epic" || cosmetic.rarity === "legendary") && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ width: isLarge ? 112 : 72, height: isLarge ? 112 : 72 }}
          >
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: cosmetic.rarity === "legendary" ? "#fbbf24" : "#a855f7",
                  top: "50%",
                  left: "50%",
                  boxShadow: `0 0 4px ${cosmetic.rarity === "legendary" ? "rgba(251,191,36,0.6)" : "rgba(168,85,247,0.6)"}`,
                }}
                animate={{
                  x: Math.cos((i * Math.PI * 2) / 4) * (isLarge ? 60 : 40),
                  y: Math.sin((i * Math.PI * 2) / 4) * (isLarge ? 60 : 40),
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{ duration: 2, delay: i * 0.5, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </motion.div>
        )}
      </div>
    );
  }

  // ── TITLE PREVIEW ──
  if (cosmetic.category === "title") {
    const text = (preview?.text as string) || cosmetic.name;
    const titleClass = TITLE_CLASSES[cosmetic.rarity] || TITLE_CLASSES.common;
    return (
      <motion.div
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className={`${isLarge ? "px-6 py-3 text-lg" : "px-4 py-2 text-sm"} font-bold ${titleClass}`}
      >
        &ldquo;{text}&rdquo;
      </motion.div>
    );
  }

  // ── THEME PREVIEW ──
  if (cosmetic.category === "theme") {
    const colors = (preview?.colors as string[]) || [
      (preview?.primary as string) || "#9D4EDD",
      (preview?.secondary as string) || "#E0E9DF",
      "#FDFCF5",
    ];
    return (
      <div className={`flex gap-2 ${isLarge ? "gap-3" : ""}`}>
        {colors.map((c: string, ci: number) => (
          <motion.div
            key={ci}
            animate={{ y: [0, -6, 0], rotate: [0, 5, 0, -5, 0] }}
            transition={{ duration: 2, delay: ci * 0.25, repeat: Infinity }}
            className={`${isLarge ? "w-12 h-12" : "w-8 h-8"} rounded-xl border-2 border-white/30 shadow-lg`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    );
  }

  // ── BACKGROUND PREVIEW ──
  if (cosmetic.category === "background") {
    const gradient = (preview?.gradient as string) || "linear-gradient(135deg, #667eea, #764ba2)";
    return (
      <motion.div
        animate={{ scale: [1, 1.05, 1], rotate: [0, 2, 0, -2, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className={`${isLarge ? "w-32 h-22" : "w-22 h-16"} rounded-xl border-2 shadow-xl overflow-hidden relative ${
          isSun ? "border-white/50" : "border-white/20"
        }`}
        style={{ background: gradient }}
      >
        {/* Subtle animated overlay */}
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 6, repeat: Infinity, repeatType: "reverse" }}
          style={{ background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)", backgroundSize: "200% 200%" }}
        />
      </motion.div>
    );
  }

  return null;
}

// ── Detail Modal ─────────────────────────────────────────
function CosmeticModal({
  cosmetic,
  owned,
  equipped,
  cantAfford,
  levelLocked,
  isSun,
  onClose,
  onPurchase,
  onEquip,
  purchasingId,
  equippingId,
  gold,
}: {
  cosmetic: Cosmetic;
  owned: boolean;
  equipped: boolean;
  cantAfford: boolean;
  levelLocked: boolean;
  isSun: boolean;
  onClose: () => void;
  onPurchase: (c: Cosmetic) => void;
  onEquip: (c: Cosmetic) => void;
  purchasingId: string | null;
  equippingId: string | null;
  gold: number;
}) {
  const rarity = isSun ? RARITY_CONFIG[cosmetic.rarity].sun : RARITY_CONFIG[cosmetic.rarity].moon;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={`relative z-10 w-full max-w-md rounded-2xl border-2 shadow-2xl overflow-hidden ${
          rarity.border
        } ${isSun ? "bg-white" : "bg-slate-900"}`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center ${
            isSun ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-white/10 text-slate-400 hover:bg-white/20"
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Preview header */}
        <div className={`relative h-48 flex items-center justify-center overflow-hidden ${
          cosmetic.rarity === "legendary"
            ? isSun ? "bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100" : "bg-gradient-to-br from-amber-900/40 via-yellow-900/20 to-orange-900/40"
            : cosmetic.rarity === "epic"
              ? isSun ? "bg-gradient-to-br from-purple-100 via-violet-50 to-fuchsia-100" : "bg-gradient-to-br from-purple-900/40 via-violet-900/20 to-fuchsia-900/40"
              : cosmetic.rarity === "rare"
                ? isSun ? "bg-gradient-to-br from-blue-100 via-sky-50 to-cyan-100" : "bg-gradient-to-br from-blue-900/40 via-sky-900/20 to-cyan-900/40"
                : cosmetic.rarity === "beta"
                  ? isSun ? "bg-gradient-to-br from-rose-100 via-red-50 to-rose-100" : "bg-gradient-to-br from-rose-900/40 via-red-900/20 to-rose-900/40"
                : cosmetic.rarity === "dev" as any
                  ? isSun ? "bg-gradient-to-br from-indigo-100 via-purple-50 to-indigo-100" : "bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-indigo-900/40"
                : isSun ? "bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100" : "bg-gradient-to-br from-slate-800/60 via-slate-700/30 to-slate-800/60"
        }`}>
          {(cosmetic.rarity === "epic" || cosmetic.rarity === "legendary") && (
            <div className="absolute inset-0 cosmetic-preview-shine" />
          )}
          <CosmeticPreview cosmetic={cosmetic} isSun={isSun} size="large" />

          {/* Rarity stars */}
          <div className="absolute top-3 left-3 flex gap-0.5">
            {Array.from({ length: RARITY_CONFIG[cosmetic.rarity].stars }).map((_, si) => (
              <Star key={si} className={`w-4 h-4 fill-current ${
                cosmetic.rarity === "legendary" ? "text-amber-400" :
                cosmetic.rarity === "epic" ? "text-purple-400" :
                cosmetic.rarity === "rare" ? "text-blue-400" :
                cosmetic.rarity === "uncommon" ? "text-green-400" :
                cosmetic.rarity === "beta" ? "text-rose-400" :
                cosmetic.rarity === "dev" as any ? "text-indigo-400" :
                isSun ? "text-slate-300" : "text-slate-500"
              }`} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${rarity.badge}`}>
              {cosmetic.rarity}
            </span>
            {cosmetic.level_required > 1 && (
              <div className="flex items-center gap-1">
                <Sparkles className={`w-3 h-3 ${isSun ? "text-slate-400" : "text-slate-500"}`} />
                <span className={`text-[10px] font-bold ${isSun ? "text-slate-500" : "text-slate-400"}`}>Lv. {cosmetic.level_required}</span>
              </div>
            )}
          </div>

          <h2 className={`text-xl font-bold font-[family-name:var(--font-nunito)] mb-2 ${isSun ? "text-slate-800" : "text-white"}`}>
            {cosmetic.name}
          </h2>
          <p className={`text-sm leading-relaxed mb-5 ${isSun ? "text-slate-500" : "text-slate-400"}`}>
            {cosmetic.description}
          </p>

          {/* Price */}
          <div className="flex items-center gap-2 mb-5">
            <Coins className={`w-5 h-5 ${isSun ? "text-amber-600" : "text-amber-400"}`} />
            <span className={`text-lg font-bold ${isSun ? "text-amber-700" : "text-amber-400"}`}>
              {cosmetic.gold_cost.toLocaleString()}
            </span>
            <span className={`text-xs ${isSun ? "text-slate-400" : "text-slate-500"}`}>
              (You have {gold.toLocaleString()})
            </span>
          </div>

          {/* Action */}
          {owned ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onEquip(cosmetic)}
              disabled={equippingId === cosmetic.id}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                equipped
                  ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                  : isSun
                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                    : "bg-white/10 text-slate-300 hover:bg-white/20 border border-white/10"
              } disabled:opacity-50`}
            >
              {equippingId === cosmetic.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : equipped ? (
                <><Check className="w-4 h-4" /> Equipped</>
              ) : (
                "Equip"
              )}
            </motion.button>
          ) : levelLocked ? (
            <div className={`w-full py-3 rounded-xl text-sm font-bold text-center flex items-center justify-center gap-2 ${
              isSun ? "bg-slate-100 text-slate-400 border border-slate-200" : "bg-white/5 text-slate-500 border border-white/5"
            }`}>
              <Lock className="w-4 h-4" /> Requires Lv. {cosmetic.level_required}
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onPurchase(cosmetic)}
              disabled={cantAfford || purchasingId === cosmetic.id}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                cantAfford
                  ? isSun
                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    : "bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-violet-600 text-white hover:from-purple-600 hover:to-violet-700 shadow-lg shadow-purple-500/20"
              } disabled:opacity-50`}
            >
              {purchasingId === cosmetic.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : cantAfford ? (
                <><Coins className="w-4 h-4" /> Not enough gold</>
              ) : (
                <><Gem className="w-4 h-4" /> Purchase</>
              )}
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Shop Page ────────────────────────────────────────────
export default function ShopPage() {
  const router = useRouter();
  const { user, profile, refreshProfile, isLoading: authLoading } = useAuth();
  const { isSun, muted } = useCardStyles();
  const { addToast } = useUIStore();

  const [cosmetics, setCosmetics] = useState<Cosmetic[]>([]);
  const [userCosmetics, setUserCosmetics] = useState<UserCosmetic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Cosmetic["category"]>("theme");
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [equippingId, setEquippingId] = useState<string | null>(null);
  const [selectedCosmetic, setSelectedCosmetic] = useState<Cosmetic | null>(null);

  // ── Fetch data ─────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    const run = async () => {
      try {
        setIsLoading(true);
        const [cosmeticsRes, userCosmeticsRes] = await Promise.all([
          (supabase.from("cosmetics") as any).select("*"),
          (supabase.from("user_cosmetics") as any).select("*").eq("user_id", user.id),
        ]);
        if (cancelled) return;
        if (cosmeticsRes.data) {
          // Hide exclusive dev/beta cosmetics from regular users
          const filteredItems = cosmeticsRes.data.filter(c => {
            const role = profile?.role || "";
            
            // Dev cosmetics ONLY for dev/admin
            if (c.name.includes("Dev") || c.name.includes("Arch-Mage")) {
               return ["admin", "dev"].includes(role);
            }
            // Beta cosmetics for dev/admin/beta_tester
            if (c.name.includes("Beta")) {
               return ["admin", "dev", "beta_tester"].includes(role);
            }
            
            return true;
          }).map(c => {
            if (c.name.includes("Dev's Arcane Title") || c.name.includes("Realm Arch-Mage")) {
                if (c.name.includes("Frame") || c.category === "avatar_frame") return { ...c, name: "Realm Arch-Mage Frame", rarity: "dev" as any };
                return { ...c, name: "The Realm Arch-Mage", rarity: "dev" as any };
            }
            if (c.name.includes("Beta Pioneer Frame")) return { ...c, name: "Crimson Vanguard Frame", rarity: "beta" as any };
            if (c.name.includes("Beta Trailblazer Title")) return { ...c, name: "The Crimson Vanguard", rarity: "beta" as any };
            if (c.name.includes("Beta")) return { ...c, rarity: "beta" as any };
            return c;
          });
          setCosmetics(filteredItems);
        }
        if (userCosmeticsRes.data) {
          const mappedUserCosmetics = userCosmeticsRes.data.map((uc: any) => {
             if (uc.cosmetic?.name?.includes("Dev's Arcane Title") || uc.cosmetic?.name?.includes("Realm Arch-Mage")) {
                 if (uc.cosmetic?.name?.includes("Frame") || uc.cosmetic?.category === "avatar_frame") {
                     return { ...uc, cosmetic: { ...uc.cosmetic, name: "Realm Arch-Mage Frame", rarity: "dev" } };
                 }
                 return { ...uc, cosmetic: { ...uc.cosmetic, name: "The Realm Arch-Mage", rarity: "dev" } };
             }
             if (uc.cosmetic?.name?.includes("Beta Pioneer Frame")) {
                 return { ...uc, cosmetic: { ...uc.cosmetic, name: "Crimson Vanguard Frame", rarity: "beta" } };
             }
             if (uc.cosmetic?.name?.includes("Beta Trailblazer Title")) {
                 return { ...uc, cosmetic: { ...uc.cosmetic, name: "The Crimson Vanguard", rarity: "beta" } };
             }
             if (uc.cosmetic?.name?.includes("Beta")) {
                 return { ...uc, cosmetic: { ...uc.cosmetic, rarity: "beta" } };
             }
             return uc;
          });
          setUserCosmetics(mappedUserCosmetics);
        }
      } catch (err) {
        console.error("Error fetching shop data:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void run();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  // ── Derived data ───────────────────────────────────────
  const ownedMap = useMemo(() => {
    const map = new Map<string, UserCosmetic>();
    for (const uc of userCosmetics) map.set(uc.cosmetic_id, uc);
    return map;
  }, [userCosmetics]);

  const filteredCosmetics = useMemo(() => {
    return cosmetics.filter((c) => {
      if (c.category !== activeTab) return false;
      
      const pRole = profile?.role || "user";
      const nameLowerCase = (c.name || "").toLowerCase();
      
      // Hide Developer items unless user is dev
      if (nameLowerCase.includes("dev ") || nameLowerCase.includes("developer")) {
        if (pRole !== "dev") return false;
      }
      
      // Hide Admin items (like Realm Arch-Mage) unless user is admin/dev
      if (nameLowerCase.includes("admin") || nameLowerCase.includes("arch-mage") || nameLowerCase.includes("arch mage")) {
        if (pRole !== "admin" && pRole !== "dev") return false;
      }
      
      // Beta items are intentionally left visible to everyone as requested
      
      return true;
    });
  }, [cosmetics, activeTab, profile]);

  const gold = profile?.gold ?? 0;
  const level = profile?.level ?? 1;
  const activeTabConfig = CATEGORY_TABS.find(t => t.key === activeTab);

  // ── Purchase handler ───────────────────────────────────
  const handlePurchase = useCallback(async (cosmetic: Cosmetic) => {
    if (!user || purchasingId) return;
    if (gold < cosmetic.gold_cost) { addToast("Not enough gold!", "error"); return; }
    if (level < cosmetic.level_required) { addToast(`You need to be Level ${cosmetic.level_required}!`, "error"); return; }

    setPurchasingId(cosmetic.id);
    const previousGold = gold;
    const newGold = gold - cosmetic.gold_cost;

    const { error: goldError } = await (supabase.from("profiles") as any).update({ gold: newGold }).eq("id", user.id);
    if (goldError) { addToast("Purchase failed. Try again.", "error"); setPurchasingId(null); return; }

    const { data, error } = await (supabase.from("user_cosmetics") as any).insert({ user_id: user.id, cosmetic_id: cosmetic.id }).select().single();
    if (error) {
      addToast("Purchase failed. Try again.", "error");
      await (supabase.from("profiles") as any).update({ gold: previousGold }).eq("id", user.id);
      setPurchasingId(null);
      await refreshProfile();
      return;
    }

    if (data) setUserCosmetics((prev) => [...prev, data]);
    await refreshProfile();
    addToast(`🎉 Purchased ${cosmetic.name}!`, "success");
    setPurchasingId(null);
  }, [user, purchasingId, gold, level, addToast, refreshProfile]);

  // ── Equip/unequip handler ──────────────────────────────
  const handleEquip = useCallback(async (cosmetic: Cosmetic) => {
    if (!user || equippingId) return;
    const uc = ownedMap.get(cosmetic.id);
    if (!uc) return;

    setEquippingId(cosmetic.id);
    const newEquipped = !uc.equipped;

    if (newEquipped) {
      const sameCategory = userCosmetics.filter((u) => {
        const c = cosmetics.find((co) => co.id === u.cosmetic_id);
        return c?.category === cosmetic.category && u.equipped && u.id !== uc.id;
      });
      for (const other of sameCategory) {
        await (supabase.from("user_cosmetics") as any).update({ equipped: false }).eq("id", other.id);
      }
    }

    await (supabase.from("user_cosmetics") as any).update({ equipped: newEquipped }).eq("id", uc.id);

    const profileUpdate: Record<string, string | null> = {};
    if (cosmetic.category === "title") {
      const text = (cosmetic.preview_data as { text?: string })?.text ?? cosmetic.name;
      const classStr = TITLE_CLASSES[cosmetic.rarity] || "";
      profileUpdate.title = newEquipped ? `${text}|${classStr}` : null;
    } else if (cosmetic.category === "avatar_frame") {
      profileUpdate.title_border = newEquipped ? FRAME_CLASSES[cosmetic.rarity] : null;
    }
    if (Object.keys(profileUpdate).length > 0) {
      await (supabase.from("profiles") as any).update(profileUpdate).eq("id", user.id);
    }

    // Re-fetch user cosmetics and force-refresh modal
    const { data } = await (supabase.from("user_cosmetics") as any).select("*").eq("user_id", user.id);
    if (data) setUserCosmetics(data);

    await refreshProfile();
    addToast(newEquipped ? `Equipped ${cosmetic.name}!` : `Unequipped ${cosmetic.name}`, "success");
    setEquippingId(null);

    // Force re-render modal by briefly closing and reopening
    if (selectedCosmetic?.id === cosmetic.id) {
      setSelectedCosmetic(null);
      setTimeout(() => setSelectedCosmetic(cosmetic), 50);
    }
  }, [user, equippingId, ownedMap, userCosmetics, cosmetics, addToast, refreshProfile, selectedCosmetic]);

  // ── Loading state ──────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-5xl"
          >
            🛍️
          </motion.div>
        </div>
        <TravelerHotbar />
      </>
    );
  }

  return (
    <>
      <BackgroundLayer />
      <div className="min-h-screen pb-28 pt-6 px-4">
        <div className="max-w-5xl mx-auto">
          {/* ─── MERCHANT BANNER ─── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => router.push("/")}
                  className={`p-2.5 rounded-xl backdrop-blur-sm border shadow-sm ${
                    isSun ? "bg-white/70 border-slate-200 text-slate-600" : "bg-white/10 border-white/20 text-white"
                  }`}
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.button>
                <div>
                  <div className="flex items-center gap-2">
                    <Crown className={`w-6 h-6 ${isSun ? "text-amber-500" : "text-amber-400"}`} />
                    <h1 className={`text-2xl md:text-3xl font-black font-[family-name:var(--font-nunito)] ${
                      isSun ? "text-slate-800" : "text-white"
                    }`}>
                      Merchant&apos;s Emporium
                    </h1>
                  </div>
                  <p className={`text-xs mt-0.5 ${muted}`}>
                    Rare treasures and mystical cosmetics await
                  </p>
                </div>
              </div>

              {/* Gold balance */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl shadow-md ${
                  isSun
                    ? "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
                    : "bg-gradient-to-r from-amber-400/10 to-orange-400/10 border border-amber-400/30"
                }`}
              >
                <motion.span
                  animate={{ rotate: [0, 15, 0, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-xl"
                >
                  🪙
                </motion.span>
                <span className={`text-lg font-bold font-[family-name:var(--font-nunito)] ${
                  isSun ? "text-amber-700" : "text-amber-400"
                }`}>
                  {gold.toLocaleString()}
                </span>
              </motion.div>
            </div>
          </motion.div>

          {/* ─── CATEGORY TABS ─── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 mb-2 overflow-x-auto pb-2 scrollbar-hide"
          >
            {CATEGORY_TABS.map((tab) => (
              <motion.button
                key={tab.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all
                  ${activeTab === tab.key
                    ? isSun
                      ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/20"
                      : "bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/30"
                    : isSun
                      ? "bg-white/70 text-slate-600 hover:bg-white/90 border border-slate-200 shadow-sm"
                      : "bg-white/10 text-slate-400 hover:bg-white/20 border border-white/10"
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </motion.button>
            ))}
          </motion.div>

          {/* Tab description */}
          {activeTabConfig && (
            <p className={`text-xs mb-6 ${muted}`}>{activeTabConfig.desc}</p>
          )}

          {/* ─── ITEMS GRID ─── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {filteredCosmetics.map((cosmetic, i) => {
                const owned = ownedMap.has(cosmetic.id);
                const equipped = ownedMap.get(cosmetic.id)?.equipped ?? false;
                const levelLocked = level < cosmetic.level_required;
                const cantAfford = gold < cosmetic.gold_cost;
                const rarityConf = RARITY_CONFIG[cosmetic.rarity];
                const rarity = isSun ? rarityConf.sun : rarityConf.moon;

                return (
                  <motion.div
                    key={cosmetic.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.03, y: -4 }}
                    onClick={() => setSelectedCosmetic(cosmetic)}
                    className={`
                      relative rounded-2xl border-2 overflow-hidden transition-all cursor-pointer
                      ${rarity.border}
                      ${isSun ? "bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-xl" : "bg-white/5 backdrop-blur-sm hover:shadow-xl"}
                      ${levelLocked && !owned ? "opacity-50" : ""}
                      ${rarityConf.cardClass}
                      rarity-${cosmetic.rarity === "legendary" ? "legendary" : cosmetic.rarity === "epic" ? "epic" : cosmetic.rarity === "rare" ? "rare" : ""}
                    `}
                  >
                    {/* Equipped badge */}
                    {equipped && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 z-20 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}

                    {/* Preview Area */}
                    <div className={`relative h-32 flex items-center justify-center overflow-hidden ${
                      cosmetic.rarity === "legendary"
                        ? isSun ? "bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100" : "bg-gradient-to-br from-amber-900/30 via-yellow-900/20 to-orange-900/30"
                        : cosmetic.rarity === "epic"
                          ? isSun ? "bg-gradient-to-br from-purple-100 via-violet-50 to-fuchsia-100" : "bg-gradient-to-br from-purple-900/30 via-violet-900/20 to-fuchsia-900/30"
                          : cosmetic.rarity === "rare"
                            ? isSun ? "bg-gradient-to-br from-blue-100 via-sky-50 to-cyan-100" : "bg-gradient-to-br from-blue-900/30 via-sky-900/20 to-cyan-900/30"
                            : cosmetic.rarity === "uncommon"
                              ? isSun ? "bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100" : "bg-gradient-to-br from-green-900/30 via-emerald-900/20 to-teal-900/30"
                              : isSun ? "bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100" : "bg-gradient-to-br from-slate-800/50 via-slate-700/30 to-slate-800/50"
                    }`}>
                      {(cosmetic.rarity === "epic" || cosmetic.rarity === "legendary") && (
                        <div className="absolute inset-0 cosmetic-preview-shine" />
                      )}

                      <CosmeticPreview cosmetic={cosmetic} isSun={isSun} />

                      {/* Rarity stars */}
                      <div className="absolute top-2 right-2 flex gap-0.5">
                        {Array.from({ length: rarityConf.stars }).map((_, si) => (
                          <Star key={si} className={`w-3 h-3 fill-current ${
                            cosmetic.rarity === "legendary" ? "text-amber-400" :
                            cosmetic.rarity === "epic" ? "text-purple-400" :
                            cosmetic.rarity === "rare" ? "text-blue-400" :
                            cosmetic.rarity === "uncommon" ? "text-green-400" :
                            isSun ? "text-slate-300" : "text-slate-500"
                          }`} />
                        ))}
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${rarity.badge}`}>
                          {cosmetic.rarity}
                        </span>
                        {cosmetic.level_required > 1 && (
                          <div className="flex items-center gap-1">
                            <Sparkles className={`w-3 h-3 ${isSun ? "text-slate-400" : "text-slate-500"}`} />
                            <span className={`text-[10px] font-bold ${muted}`}>Lv. {cosmetic.level_required}</span>
                          </div>
                        )}
                      </div>

                      <h3 className={`text-sm font-bold font-[family-name:var(--font-nunito)] mb-1 ${
                        isSun ? "text-slate-800" : "text-white"
                      }`}>
                        {cosmetic.name}
                      </h3>
                      <p className={`text-xs leading-relaxed mb-3 min-h-[32px] ${
                        isSun ? "text-slate-500" : "text-slate-400"
                      }`}>
                        {cosmetic.description}
                      </p>

                      {/* Price + action */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Coins className={`w-3.5 h-3.5 ${isSun ? "text-amber-600" : "text-amber-400"}`} />
                          <span className={`text-sm font-bold ${isSun ? "text-amber-700" : "text-amber-400"}`}>
                            {cosmetic.gold_cost.toLocaleString()}
                          </span>
                        </div>
                        {owned ? (
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            equipped
                              ? "bg-emerald-500/20 text-emerald-500"
                              : isSun ? "bg-slate-100 text-slate-500" : "bg-white/10 text-slate-400"
                          }`}>
                            {equipped ? "✓ Equipped" : "Owned"}
                          </span>
                        ) : levelLocked ? (
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
                            isSun ? "bg-slate-100 text-slate-400" : "bg-white/5 text-slate-500"
                          }`}>
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        ) : (
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            cantAfford
                              ? isSun ? "bg-red-50 text-red-400" : "bg-red-500/10 text-red-400"
                              : "bg-purple-500/20 text-purple-500"
                          }`}>
                            {cantAfford ? "Too expensive" : "Click to buy"}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {filteredCosmetics.length === 0 && (
                <div className="col-span-full text-center py-20">
                  <motion.div
                    animate={{ y: [-4, 4, -4] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <ShoppingBag className={`w-14 h-14 mx-auto mb-4 ${muted}`} />
                  </motion.div>
                  <p className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${muted}`}>
                    The merchant is restocking this category... 🏪
                  </p>
                  <p className={`text-xs mt-1 ${muted}`}>Check back soon!</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ─── DETAIL MODAL ─── */}
      <AnimatePresence>
        {selectedCosmetic && (
          <CosmeticModal
            cosmetic={selectedCosmetic}
            owned={ownedMap.has(selectedCosmetic.id)}
            equipped={ownedMap.get(selectedCosmetic.id)?.equipped ?? false}
            cantAfford={gold < selectedCosmetic.gold_cost}
            levelLocked={level < selectedCosmetic.level_required}
            isSun={isSun}
            onClose={() => setSelectedCosmetic(null)}
            onPurchase={handlePurchase}
            onEquip={handleEquip}
            purchasingId={purchasingId}
            equippingId={equippingId}
            gold={gold}
          />
        )}
      </AnimatePresence>

      <TravelerHotbar />
    </>
  );
}
