"use client";

import { useState } from "react";
import BossSelect from "@/components/battle/BossSelect";
import BossBattle from "@/components/battle/BossBattle";
import TravelerHotbar from "@/components/layout/TravelerHotbar";
import type { Boss } from "@/lib/bosses";

interface ActiveBattle {
  boss: Boss;
  deckId: string;
  deckName: string;
}

/**
 * Battle Page — Flashcard Boss Battle
 *
 * Flow: BossSelect (pick boss + deck) → BossBattle (fight).
 * Exiting a battle returns to boss selection.
 */
export default function BattlePage() {
  const [activeBattle, setActiveBattle] = useState<ActiveBattle | null>(null);

  if (activeBattle) {
    return (
      <BossBattle
        boss={activeBattle.boss}
        deckId={activeBattle.deckId}
        deckName={activeBattle.deckName}
        onExit={() => setActiveBattle(null)}
      />
    );
  }

  return (
    <main className="relative min-h-screen">
      <BossSelect
        onStartBattle={(boss, deckId, deckName) =>
          setActiveBattle({ boss, deckId, deckName })
        }
      />
      <TravelerHotbar />
    </main>
  );
}
