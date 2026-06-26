"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Download, Loader2 } from "lucide-react";
import { SHARE_FONT, escapeSvg, svgToDataUrl, renderCardPng, downloadBlob, shareOrDownload } from "@/lib/shareImage";

export interface TrialResult {
  subjectName: string;
  score: number;
  total: number;
  xpEarned: number;
}

const W = 1080, H = 1920; // IG story

function gradeFor(pct: number): { letter: string; a: string; b: string; word: string } {
  if (pct >= 95) return { letter: "S", a: "#fbbf24", b: "#f59e0b", word: "FLAWLESS" };
  if (pct >= 85) return { letter: "A", a: "#34d399", b: "#10b981", word: "MASTERED" };
  if (pct >= 70) return { letter: "B", a: "#60a5fa", b: "#3b82f6", word: "SOLID" };
  if (pct >= 55) return { letter: "C", a: "#fbbf24", b: "#fb923c", word: "GETTING THERE" };
  return { letter: "D", a: "#f87171", b: "#ef4444", word: "KEEP TRAINING" };
}

function buildSvg(r: TrialResult): string {
  const pct = Math.round((r.score / Math.max(1, r.total)) * 100);
  const g = gradeFor(pct);
  const subject = escapeSvg(r.subjectName || "Trial by Fire");
  const ring = 300;
  const c = 2 * Math.PI * ring;
  const dash = c - (pct / 100) * c;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a0b2e"/><stop offset="55%" stop-color="#2b1055"/><stop offset="100%" stop-color="#16121f"/>
    </linearGradient>
    <linearGradient id="grade" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${g.a}"/><stop offset="100%" stop-color="${g.b}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="36" y="36" width="${W - 72}" height="${H - 72}" rx="48" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="2"/>

  <circle cx="106" cy="150" r="16" fill="#a78bfa"/>
  <text x="138" y="160" font-family="${SHARE_FONT}" font-size="34" font-weight="800" fill="#ffffff" letter-spacing="3">BRAIN TRAILS</text>
  <text x="${W - 90}" y="160" font-family="${SHARE_FONT}" font-size="26" font-weight="600" fill="#8b86b8" text-anchor="end">TRIAL BY FIRE</text>

  <text x="90" y="380" font-family="${SHARE_FONT}" font-size="40" font-weight="600" fill="#8b86b8" letter-spacing="2">TESTED ON</text>
  <text x="90" y="450" font-family="${SHARE_FONT}" font-size="64" font-weight="800" fill="#ffffff">${subject}</text>

  <!-- Score ring -->
  <g transform="translate(${W / 2}, 920)">
    <circle cx="0" cy="0" r="${ring}" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="40"/>
    <circle cx="0" cy="0" r="${ring}" fill="none" stroke="url(#grade)" stroke-width="40" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${dash}" transform="rotate(-90)"/>
    <text x="0" y="-20" font-family="${SHARE_FONT}" font-size="240" font-weight="800" fill="url(#grade)" text-anchor="middle">${g.letter}</text>
    <text x="0" y="110" font-family="${SHARE_FONT}" font-size="80" font-weight="800" fill="#ffffff" text-anchor="middle">${pct}%</text>
  </g>

  <text x="${W / 2}" y="1400" font-family="${SHARE_FONT}" font-size="56" font-weight="800" fill="url(#grade)" text-anchor="middle" letter-spacing="4">${g.word}</text>
  <text x="${W / 2}" y="1470" font-family="${SHARE_FONT}" font-size="40" font-weight="600" fill="#8b86b8" text-anchor="middle">${r.score} / ${r.total} correct · +${r.xpEarned} XP</text>

  <text x="${W / 2}" y="${H - 90}" font-family="${SHARE_FONT}" font-size="30" font-weight="600" fill="#8b86b8" text-anchor="middle">braintrails.dev - come get tested</text>
</svg>`;
}

export default function TrialResultCard({
  open, onClose, result,
}: {
  open: boolean; onClose: () => void; result: TrialResult;
}) {
  const svg = useMemo(() => buildSvg(result), [result]);
  const previewUrl = useMemo(() => svgToDataUrl(svg), [svg]);
  const [busy, setBusy] = useState<null | "share" | "download">(null);

  const run = async (mode: "share" | "download") => {
    setBusy(mode);
    try {
      const blob = await renderCardPng({ overlaySvg: svg, width: W, height: H });
      if (mode === "share") {
        await shareOrDownload(blob, "brain-trails-trial.png", `I scored ${Math.round((result.score / Math.max(1, result.total)) * 100)}% on ${result.subjectName} - your turn.`);
      } else {
        downloadBlob(blob, "brain-trails-trial.png");
      }
    } catch (err) {
      console.error("Trial share failed:", err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }}
            className="relative z-10 w-full max-w-sm rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden">
            <button onClick={onClose} className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-slate-300 hover:bg-white/20">
              <X className="w-4 h-4" />
            </button>
            <div className="p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Your trial result" className="w-full mx-auto rounded-2xl" style={{ maxWidth: "260px" }} />
            </div>
            <div className="flex gap-3 px-4 pb-5">
              <button onClick={() => run("share")} disabled={busy !== null}
                className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-violet-600 text-white hover:from-purple-600 hover:to-violet-700 disabled:opacity-50">
                {busy === "share" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} Share
              </button>
              <button onClick={() => run("download")} disabled={busy !== null}
                className="px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-white/10 text-slate-200 hover:bg-white/20 disabled:opacity-50">
                {busy === "download" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
