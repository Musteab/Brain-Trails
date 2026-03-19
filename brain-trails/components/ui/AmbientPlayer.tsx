"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, ChevronDown, ChevronUp, Volume2, VolumeX, Link2, X } from "lucide-react";
import { useCardStyles } from "@/hooks/useCardStyles";

// Curated Spotify playlist URIs (study/focus playlists)
const PLAYLISTS = [
  {
    name: "Lo-fi Beats",
    emoji: "🎵",
    uri: "37i9dQZF1DWWQRwui0ExPn",
  },
  {
    name: "Deep Focus",
    emoji: "🧠",
    uri: "37i9dQZF1DWZeKCadgRdKQ",
  },
  {
    name: "Peaceful Piano",
    emoji: "🎹",
    uri: "37i9dQZF1DX4sWSpwq3LiO",
  },
  {
    name: "Nature Sounds",
    emoji: "🌿",
    uri: "37i9dQZF1DX4PP3DA4J0N8",
  },
  {
    name: "Classical Focus",
    emoji: "🎻",
    uri: "37i9dQZF1DWYkztttC1w38",
  },
  {
    name: "Jazz Vibes",
    emoji: "🎷",
    uri: "37i9dQZF1DX0SM0LYsmbMT",
  },
];

const CUSTOM_PLAYLIST_KEY = "braintrails_custom_playlist";

function parsePlaylistUri(input: string): string | null {
  // Handle full URLs like https://open.spotify.com/playlist/ABC?si=...
  const urlMatch = input.match(/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];
  // Handle spotify:playlist:ABC format
  const uriMatch = input.match(/spotify:playlist:([a-zA-Z0-9]+)/);
  if (uriMatch) return uriMatch[1];
  // Handle bare IDs (22 chars alphanumeric)
  if (/^[a-zA-Z0-9]{22}$/.test(input.trim())) return input.trim();
  return null;
}

export default function AmbientPlayer() {
  const { isSun } = useCardStyles();
  const [isOpen, setIsOpen] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState(PLAYLISTS[0]);
  const [isMuted, setIsMuted] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [customPlaylist, setCustomPlaylist] = useState<{ name: string; emoji: string; uri: string } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load saved custom playlist on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_PLAYLIST_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setTimeout(() => setCustomPlaylist(parsed), 0);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleAddCustomPlaylist = () => {
    const uri = parsePlaylistUri(customUrl);
    if (!uri) return;

    const custom = { name: "My Playlist", emoji: "💜", uri };
    setCustomPlaylist(custom);
    setActivePlaylist(custom);
    setShowCustomInput(false);
    setCustomUrl("");

    try {
      localStorage.setItem(CUSTOM_PLAYLIST_KEY, JSON.stringify(custom));
    } catch {
      // ignore
    }
  };

  const handleRemoveCustomPlaylist = () => {
    setCustomPlaylist(null);
    if (activePlaylist.name === "My Playlist") {
      setActivePlaylist(PLAYLISTS[0]);
    }
    try {
      localStorage.removeItem(CUSTOM_PLAYLIST_KEY);
    } catch {
      // ignore
    }
  };

  const allPlaylists = customPlaylist ? [...PLAYLISTS, customPlaylist] : PLAYLISTS;

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
                  Study Music <span className="ml-2 align-middle text-[10px] bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold border border-amber-500/30">Beta</span>
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
                {allPlaylists.map(pl => (
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
                    {pl.name === "My Playlist" && (
                      <X
                        className="w-3 h-3 ml-0.5 opacity-60 hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); handleRemoveCustomPlaylist(); }}
                      />
                    )}
                  </button>
                ))}
                {/* Add custom playlist button */}
                {!customPlaylist && (
                  <button
                    onClick={() => setShowCustomInput(!showCustomInput)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                      isSun
                        ? "bg-violet-100 text-violet-600 hover:bg-violet-200"
                        : "bg-violet-500/20 text-violet-400 hover:bg-violet-500/30"
                    }`}
                  >
                    <Link2 className="w-3 h-3" />
                    Your Playlist
                  </button>
                )}
              </div>
            </div>

            {/* Custom Playlist URL Input */}
            <AnimatePresence>
              {showCustomInput && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-2">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="Paste Spotify playlist URL..."
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                          isSun
                            ? "bg-white border-slate-200 text-slate-700 placeholder:text-slate-400"
                            : "bg-white/10 border-white/10 text-white placeholder:text-slate-500"
                        }`}
                        onKeyDown={(e) => e.key === "Enter" && handleAddCustomPlaylist()}
                      />
                      <button
                        onClick={handleAddCustomPlaylist}
                        disabled={!parsePlaylistUri(customUrl)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-white disabled:opacity-40 hover:bg-emerald-600 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <p className={`text-[10px] mt-1 ${isSun ? "text-slate-400" : "text-slate-500"}`}>
                      💡 Log in to Spotify in the player for full tracks
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
