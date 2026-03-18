"use client";

import { useState, useEffect, useMemo } from "react";
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
const CATEGORY_TABS: { key: Cosmetic["category"]; label: string; icon: React.ReactNode }[] = [
  { key: "theme",        label: "Themes",      icon: <Palette className="w-4 h-4" /> },
  { key: "avatar_frame", label: "Frames",      icon: <Frame className="w-4 h-4" /> },
  { key: "title",        label: "Titles",       icon: <Type className="w-4 h-4" /> },
  { key: "background",   label: "Backgrounds", icon: <ImageIcon className="w-4 h-4" /> },
];

// ── Rarity styling ───────────────────────────────────────
const RARITY_STYLES: Record<
  Cosmetic["rarity"],
  { sun: { border: string; badge: string }; moon: { border: string; badge: string } }
> = {
  common:    { sun: { border: "border-slate-300",   badge: "bg-slate-100 text-slate-500" },   moon: { border: "border-slate-500/40",   badge: "bg-slate-500/20 text-slate-400" } },
  uncommon:  { sun: { border: "border-green-400",   badge: "bg-green-50 text-green-600" },    moon: { border: "border-green-400/50",   badge: "bg-green-400/15 text-green-400" } },
  rare:      { sun: { border: "border-blue-400",    badge: "bg-blue-50 text-blue-600" },      moon: { border: "border-blue-400/50",    badge: "bg-blue-400/15 text-blue-400" } },
  epic:      { sun: { border: "border-purple-400",  badge: "bg-purple-50 text-purple-600" },  moon: { border: "border-purple-400/50",  badge: "bg-purple-400/15 text-purple-400" } },
  legendary: { sun: { border: "border-amber-400",   badge: "bg-amber-50 text-amber-600" },    moon: { border: "border-amber-400/50",   badge: "bg-amber-400/15 text-amber-400" } },
};

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
          supabase.from("cosmetics").select("*"),
          supabase.from("user_cosmetics").select("*").eq("user_id", user.id),
        ]);

        if (cancelled) return;

        if (cosmeticsRes.data) setCosmetics(cosmeticsRes.data);
        if (userCosmeticsRes.data) setUserCosmetics(userCosmeticsRes.data);
      } catch (err) {
        console.error("Error fetching shop data (exception):", err);
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
    for (const uc of userCosmetics) {
      map.set(uc.cosmetic_id, uc);
    }
    return map;
  }, [userCosmetics]);

  const filteredCosmetics = useMemo(
    () => cosmetics.filter((c) => c.category === activeTab),
    [cosmetics, activeTab]
  );

  const gold = profile?.gold ?? 0;
  const level = profile?.level ?? 1;

  // ── Purchase handler ───────────────────────────────────
  const handlePurchase = async (cosmetic: Cosmetic) => {
    if (!user || purchasingId) return;
    if (gold < cosmetic.gold_cost) {
      addToast("Not enough gold!", "error");
      return;
    }
    if (level < cosmetic.level_required) {
      addToast(`You need to be Level ${cosmetic.level_required}!`, "error");
      return;
    }

    setPurchasingId(cosmetic.id);

    // Optimistic UI: immediately show gold deducted
    const previousGold = gold;

    // Deduct gold
    const newGold = gold - cosmetic.gold_cost;
    const { error: goldError } = await supabase
      .from("profiles")
      .update({ gold: newGold })
      .eq("id", user.id);

    if (goldError) {
      addToast("Purchase failed. Try again.", "error");
      setPurchasingId(null);
      return;
    }

    // Insert user_cosmetic
    const { data, error } = await supabase
      .from("user_cosmetics")
      .insert({ user_id: user.id, cosmetic_id: cosmetic.id })
      .select()
      .single();

    if (error) {
      addToast("Purchase failed. Try again.", "error");
      // Refund gold
      await supabase.from("profiles").update({ gold: previousGold }).eq("id", user.id);
      setPurchasingId(null);
      await refreshProfile();
      return;
    }

    if (data) {
      setUserCosmetics((prev) => [...prev, data]);
    }

    await refreshProfile();
    addToast(`🎉 Purchased ${cosmetic.name}!`, "success");
    setPurchasingId(null);
  };

  // ── Equip/unequip handler ──────────────────────────────
  const handleEquip = async (cosmetic: Cosmetic) => {
    if (!user || equippingId) return;
    const uc = ownedMap.get(cosmetic.id);
    if (!uc) return;

    setEquippingId(cosmetic.id);
    const newEquipped = !uc.equipped;

    // If equipping, unequip others in same category first
    if (newEquipped) {
      const sameCategory = userCosmetics.filter(
        (u) => {
          const c = cosmetics.find((co) => co.id === u.cosmetic_id);
          return c?.category === cosmetic.category && u.equipped && u.id !== uc.id;
        }
      );
      for (const other of sameCategory) {
        await supabase
          .from("user_cosmetics")
          .update({ equipped: false })
          .eq("id", other.id);
      }
    }

    await supabase
      .from("user_cosmetics")
      .update({ equipped: newEquipped })
      .eq("id", uc.id);

    // Refresh user cosmetics
    const { data } = await supabase
      .from("user_cosmetics")
      .select("*")
      .eq("user_id", user.id);
    if (data) setUserCosmetics(data);

    await refreshProfile();
    addToast(
      newEquipped ? `Equipped ${cosmetic.name}!` : `Unequipped ${cosmetic.name}`,
      "success"
    );
    setEquippingId(null);
  };

  // ── Loading state ──────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-4xl animate-bounce">🛍️</div>
        </div>
        <TravelerHotbar />
      </>
    );
  }

  return (
    <>
      <BackgroundLayer />
      <div className="min-h-screen pb-28 pt-8 px-4">
        <div className="max-w-4xl mx-auto">
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
                  Cosmetics Shop
                </h1>
                <p className={`text-xs ${muted}`}>
                  Customize your experience
                </p>
              </div>
            </div>

            {/* Gold balance */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl ${
                isSun
                  ? "bg-amber-50 border border-amber-200"
                  : "bg-amber-400/10 border border-amber-400/30"
              }`}
            >
              <Coins className={`w-5 h-5 ${isSun ? "text-amber-600" : "text-amber-400"}`} />
              <span
                className={`text-lg font-bold font-[family-name:var(--font-nunito)] ${
                  isSun ? "text-amber-700" : "text-amber-400"
                }`}
              >
                {gold.toLocaleString()}
              </span>
            </motion.div>
          </motion.div>

          {/* Category tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide"
          >
            {CATEGORY_TABS.map((tab) => (
              <motion.button
                key={tab.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors
                  ${activeTab === tab.key
                    ? isSun
                      ? "bg-purple-500 text-white shadow-md"
                      : "bg-purple-500 text-white shadow-md shadow-purple-500/30"
                    : isSun
                      ? "bg-white/70 text-slate-600 hover:bg-white/90 border border-slate-200"
                      : "bg-white/10 text-slate-400 hover:bg-white/20 border border-white/10"
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </motion.button>
            ))}
          </motion.div>

          {/* Items grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredCosmetics.map((cosmetic, i) => {
                const owned = ownedMap.has(cosmetic.id);
                const equipped = ownedMap.get(cosmetic.id)?.equipped ?? false;
                const levelLocked = level < cosmetic.level_required;
                const cantAfford = gold < cosmetic.gold_cost;
                const rarity = isSun
                  ? RARITY_STYLES[cosmetic.rarity].sun
                  : RARITY_STYLES[cosmetic.rarity].moon;

                return (
                  <motion.div
                    key={cosmetic.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`
                      relative rounded-2xl border-2 p-4 transition-all
                      ${rarity.border}
                      ${isSun ? "bg-white/70 backdrop-blur-sm" : "bg-white/5 backdrop-blur-sm"}
                      ${levelLocked && !owned ? "opacity-50" : ""}
                    `}
                  >
                    {/* Equipped indicator */}
                    {equipped && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}

                    {/* Rarity badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isSun ? "bg-purple-100" : "bg-purple-500/20"
                        }`}
                      >
                        <ShoppingBag className={`w-5 h-5 ${isSun ? "text-purple-600" : "text-purple-400"}`} />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${rarity.badge}`}>
                        {cosmetic.rarity}
                      </span>
                    </div>

                    {/* Info */}
                    <h3
                      className={`text-sm font-bold font-[family-name:var(--font-nunito)] mb-1 ${
                        isSun ? "text-slate-800" : "text-white"
                      }`}
                    >
                      {cosmetic.name}
                    </h3>
                    <p
                      className={`text-xs leading-relaxed mb-3 min-h-[32px] ${
                        isSun ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      {cosmetic.description}
                    </p>

                    {/* Price & level */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <Coins className={`w-3.5 h-3.5 ${isSun ? "text-amber-600" : "text-amber-400"}`} />
                        <span
                          className={`text-sm font-bold ${
                            isSun ? "text-amber-700" : "text-amber-400"
                          }`}
                        >
                          {cosmetic.gold_cost}
                        </span>
                      </div>
                      {cosmetic.level_required > 1 && (
                        <div className="flex items-center gap-1">
                          <Sparkles className={`w-3 h-3 ${isSun ? "text-slate-400" : "text-slate-500"}`} />
                          <span className={`text-xs ${muted}`}>Lv. {cosmetic.level_required}</span>
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    {owned ? (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEquip(cosmetic)}
                        disabled={equippingId === cosmetic.id}
                        className={`
                          w-full py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5
                          ${equipped
                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                            : isSun
                              ? "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                              : "bg-white/10 text-slate-300 hover:bg-white/20 border border-white/10"
                          }
                          disabled:opacity-50
                        `}
                      >
                        {equippingId === cosmetic.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : equipped ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Equipped
                          </>
                        ) : (
                          "Equip"
                        )}
                      </motion.button>
                    ) : levelLocked ? (
                      <div
                        className={`
                          w-full py-2.5 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5
                          ${isSun
                            ? "bg-slate-100 text-slate-400 border border-slate-200"
                            : "bg-white/5 text-slate-500 border border-white/5"
                          }
                        `}
                      >
                        <Lock className="w-3.5 h-3.5" /> Requires Lv. {cosmetic.level_required}
                      </div>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePurchase(cosmetic)}
                        disabled={cantAfford || purchasingId === cosmetic.id}
                        className={`
                          w-full py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5
                          ${cantAfford
                            ? isSun
                              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                              : "bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed"
                            : "bg-purple-500 text-white hover:bg-purple-600 shadow-md shadow-purple-500/20"
                          }
                          disabled:opacity-50
                        `}
                      >
                        {purchasingId === cosmetic.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : cantAfford ? (
                          <>
                            <Coins className="w-3.5 h-3.5" /> Not enough gold
                          </>
                        ) : (
                          <>
                            <Star className="w-3.5 h-3.5" /> Purchase
                          </>
                        )}
                      </motion.button>
                    )}
                  </motion.div>
                );
              })}

              {filteredCosmetics.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <ShoppingBag className={`w-12 h-12 mx-auto mb-3 ${muted}`} />
                  <p className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${muted}`}>
                    No items available in this category yet.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <TravelerHotbar />
    </>
  );
}
