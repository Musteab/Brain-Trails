"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, ChevronDown, ChevronUp, Volume2, VolumeX } from "lucide-react";
import { useCardStyles } from "@/hooks/useCardStyles";

// Curated Spotify playlist URIs (study/focus playlists)
const PLAYLISTS = [
  {
    name: "Lo-fi Beats",
    emoji: "🎵",
    uri: "37i9dQZF1DWWQRwui0ExPn",  // lofi beats
  },
  {
    name: "Deep Focus",
    emoji: "🧠",
    uri: "37i9dQZF1DWZeKCadgRdKQ",  // deep focus
  },
  {
    name: "Peaceful Piano",
    emoji: "🎹",
    uri: "37i9dQZF1DX4sWSpwq3LiO",  // peaceful piano
  },
  {
    name: "Nature Sounds",
    emoji: "🌿",
    uri: "37i9dQZF1DX4PP3DA4J0N8",  // nature sounds
  },
  {
    name: "Classical Focus",
    emoji: "🎻",
    uri: "37i9dQZF1DWYkztttC1w38",  // classical focus
  },
  {
    name: "Jazz Vibes",
    emoji: "🎷",
    uri: "37i9dQZF1DX0SM0LYsmbMT",  // jazz vibes
  },
];

export default function AmbientPlayer() {
  const { isSun } = useCardStyles();
  const [isOpen, setIsOpen] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState(PLAYLISTS[0]);
  const [isMuted, setIsMuted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reload iframe when muting/unmuting isn't possible via API, just toggle visibility
  const embedUrl = `https://open.spotify.com/embed/playlist/${activePlaylist.uri}?utm_source=generator&theme=${isSun ? "0" : "1"}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed bottom-24 left-4 z-50 ${isOpen ? "w-80" : "w-auto"}`}
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="open"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className={`rounded-2xl overflow-hidden border shadow-2xl ${
              isSun
                ? "bg-white/95 border-slate-200 backdrop-blur-xl"
                : "bg-slate-900/95 border-slate-700 backdrop-blur-xl"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Music className={`w-4 h-4 ${isSun ? "text-emerald-600" : "text-emerald-400"}`} />
                <span className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-700" : "text-white"}`}>
                  Study Music
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-1.5 rounded-lg transition-colors ${isSun ? "hover:bg-slate-100 text-slate-500" : "hover:bg-white/10 text-slate-400"}`}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className={`p-1.5 rounded-lg transition-colors ${isSun ? "hover:bg-slate-100 text-slate-500" : "hover:bg-white/10 text-slate-400"}`}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Playlist Selector */}
            <div className="px-3 pb-2">
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                {PLAYLISTS.map(pl => (
                  <button
                    key={pl.uri}
                    onClick={() => setActivePlaylist(pl)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                      activePlaylist.uri === pl.uri
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                        : isSun
                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        : "bg-white/10 text-slate-400 hover:bg-white/20"
                    }`}
                  >
                    <span>{pl.emoji}</span>
                    {pl.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Spotify Embed */}
            <div className={`px-3 pb-3 ${isMuted ? "opacity-30 pointer-events-none" : ""}`}>
              <iframe
                ref={iframeRef}
                key={activePlaylist.uri + (isSun ? "-sun" : "-moon")}
                src={embedUrl}
                width="100%"
                height="152"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-xl"
                title={`Spotify - ${activePlaylist.name}`}
              />
            </div>
          </motion.div>
        ) : (
          /* Collapsed FAB */
          <motion.button
            key="closed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border transition-all ${
              isSun
                ? "bg-white/90 border-slate-200 text-slate-700 hover:bg-white backdrop-blur-xl"
                : "bg-slate-800/90 border-slate-700 text-white hover:bg-slate-800 backdrop-blur-xl"
            }`}
          >
            <Music className={`w-5 h-5 ${isSun ? "text-emerald-600" : "text-emerald-400"}`} />
            <span className="text-sm font-bold font-[family-name:var(--font-nunito)]">
              {activePlaylist.emoji} Music
            </span>
            <ChevronUp className="w-4 h-4 opacity-50" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
