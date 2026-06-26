"use client";

import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Download, Loader2, ImagePlus, Trash2 } from "lucide-react";

export interface ShareCardData {
  displayName: string;
  level: number;
  streakDays: number;
  weekMinutes: number;
  weekXp: number;
  sessionCount: number;
  dailyCounts: number[]; // length 7, Sun..Sat
}

type FormatKey = "story" | "square";
type TemplateKey = "aurora" | "ink" | "paper";

const FORMATS: Record<FormatKey, { w: number; h: number; label: string }> = {
  story: { w: 1080, h: 1920, label: "Story 9:16" },
  square: { w: 1080, h: 1080, label: "Square 1:1" },
};

const TEMPLATES: Record<TemplateKey, { label: string; bg: [string, string, string]; accentA: string; accentB: string; ink: string; sub: string }> = {
  aurora: { label: "Aurora", bg: ["#1a0b2e", "#2b1055", "#16121f"], accentA: "#a78bfa", accentB: "#f0abfc", ink: "#ffffff", sub: "#8b86b8" },
  ink:    { label: "Ink",    bg: ["#0b0d12", "#12151c", "#0b0d12"], accentA: "#e2e8f0", accentB: "#94a3b8", ink: "#ffffff", sub: "#6b7280" },
  paper:  { label: "Paper",  bg: ["#faf7f0", "#f3ece0", "#faf7f0"], accentA: "#7c3aed", accentB: "#db2777", ink: "#1a1626", sub: "#7a7488" },
};

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function formatTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function rankTitle(weekMinutes: number): string {
  if (weekMinutes >= 600) return "LEGENDARY SCHOLAR";
  if (weekMinutes >= 300) return "RISING SCHOLAR";
  if (weekMinutes >= 120) return "DEDICATED ADVENTURER";
  if (weekMinutes > 0) return "APPRENTICE";
  return "NEW TRAVELER";
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const FONT = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

/**
 * Builds the stats overlay as a self-contained SVG (pure primitives, no emoji,
 * system font) so it rasterizes consistently. When `photo` is true the SVG is
 * transparent with a bottom scrim and the stats sit in the lower portion, ready
 * to composite over a user photo. Otherwise it paints the full template bg.
 */
function buildSvg(d: ShareCardData, fmt: FormatKey, template: TemplateKey, photo: boolean): string {
  const { w, h } = FORMATS[fmt];
  const t = TEMPLATES[template];
  const name = esc(d.displayName || "A Traveler");
  const title = rankTitle(d.weekMinutes);
  const focus = formatTime(d.weekMinutes);
  const onPhotoInk = "#ffffff";
  const onPhotoSub = "#d8d4e8";
  const ink = photo ? onPhotoInk : t.ink;
  const sub = photo ? onPhotoSub : t.sub;

  // Vertical anchors differ by format. For photo mode, push everything into the
  // lower band so the user's image is visible up top.
  const story = fmt === "story";
  const base = photo ? (story ? h - 760 : h - 560) : (story ? 300 : 230);
  const A = {
    brandY: story ? 130 : 110,
    nameY: base,
    titleY: base + 58,
    heroY: base + 250,
    heroLabelY: base + 300,
    statsY: base + 440,
    barsTop: base + 520,
    barsBottom: base + (story ? 720 : 690),
    footerY: h - 80,
  };

  const max = Math.max(...d.dailyCounts, 1);
  const chartX = 90;
  const chartW = w - 180;
  const barGap = chartW / 7;
  const barW = barGap * 0.46;
  const bars = d.dailyCounts.map((c, i) => {
    const bh = Math.max((c / max) * (A.barsBottom - A.barsTop), 6);
    const x = chartX + i * barGap + (barGap - barW) / 2;
    const y = A.barsBottom - bh;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="9" fill="url(#bar)"/>
      <text x="${(x + barW / 2).toFixed(1)}" y="${A.barsBottom + 38}" font-family="${FONT}" font-size="26" fill="${sub}" text-anchor="middle">${DAY_LABELS[i]}</text>`;
  }).join("");

  const colW = w / 3;
  const stat = (idx: number, value: string, label: string, accent: string) => {
    const x = colW * idx + colW / 2;
    return `<text x="${x}" y="${A.statsY}" font-family="${FONT}" font-size="72" font-weight="800" fill="${ink}" text-anchor="middle">${esc(value)}</text>
      <text x="${x}" y="${A.statsY + 44}" font-family="${FONT}" font-size="26" font-weight="600" fill="${accent}" text-anchor="middle" letter-spacing="1.5">${label}</text>`;
  };

  const bgLayer = photo
    ? `<rect width="${w}" height="${h}" fill="url(#scrim)"/>`
    : `<rect width="${w}" height="${h}" fill="url(#bg)"/>
       <rect x="36" y="36" width="${w - 72}" height="${h - 72}" rx="48" fill="none" stroke="${ink}" stroke-opacity="0.08" stroke-width="2"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${t.bg[0]}"/><stop offset="55%" stop-color="${t.bg[1]}"/><stop offset="100%" stop-color="${t.bg[2]}"/>
    </linearGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.15"/>
      <stop offset="${photo && fmt === "story" ? "45%" : "30%"}" stop-color="#000000" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.82"/>
    </linearGradient>
    <linearGradient id="hero" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${t.accentA}"/><stop offset="100%" stop-color="${t.accentB}"/>
    </linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${t.accentA}"/><stop offset="100%" stop-color="${t.accentB}"/>
    </linearGradient>
  </defs>

  ${bgLayer}

  <circle cx="106" cy="${A.brandY - 10}" r="16" fill="${t.accentA}"/>
  <text x="138" y="${A.brandY}" font-family="${FONT}" font-size="34" font-weight="800" fill="${ink}" letter-spacing="3">BRAIN TRAILS</text>
  <text x="${w - 90}" y="${A.brandY}" font-family="${FONT}" font-size="26" font-weight="600" fill="${sub}" text-anchor="end">THIS WEEK</text>

  <text x="90" y="${A.nameY}" font-family="${FONT}" font-size="60" font-weight="800" fill="${ink}">${name}</text>
  <text x="90" y="${A.titleY}" font-family="${FONT}" font-size="30" font-weight="700" fill="url(#hero)" letter-spacing="3">${title}</text>

  <text x="90" y="${A.heroY}" font-family="${FONT}" font-size="170" font-weight="800" fill="url(#hero)">${esc(focus)}</text>
  <text x="96" y="${A.heroLabelY}" font-family="${FONT}" font-size="28" font-weight="600" fill="${sub}" letter-spacing="3">FOCUSED THIS WEEK</text>

  ${stat(0, `${d.streakDays}`, "STREAK", "#fb923c")}
  ${stat(1, `${d.weekXp}`, "XP", "#fbbf24")}
  ${stat(2, `${d.sessionCount}`, "SESSIONS", "#34d399")}

  ${bars}

  <text x="90" y="${A.footerY}" font-family="${FONT}" font-size="32" font-weight="700" fill="${ink}">Lv. ${d.level}</text>
  <text x="${w - 90}" y="${A.footerY}" font-family="${FONT}" font-size="28" font-weight="600" fill="${sub}" text-anchor="end">braintrails.dev</text>
</svg>`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

function coverDraw(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ShareCard({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: ShareCardData;
}) {
  const [format, setFormat] = useState<FormatKey>("story");
  const [template, setTemplate] = useState<TemplateKey>("aurora");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "share" | "download">(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const overlaySvg = useMemo(
    () => buildSvg(data, format, template, !!photoUrl),
    [data, format, template, photoUrl]
  );
  const overlayUrl = useMemo(
    () => `data:image/svg+xml;utf8,${encodeURIComponent(overlaySvg)}`,
    [overlaySvg]
  );

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Composite photo (if any) + overlay into a PNG blob.
  const renderPng = async (): Promise<Blob> => {
    const { w, h } = FORMATS[format];
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unsupported");

    if (photoUrl) {
      const photo = await loadImage(photoUrl);
      coverDraw(ctx, photo, w, h);
    }
    const overlay = await loadImage(overlayUrl);
    ctx.drawImage(overlay, 0, 0, w, h);

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png")
    );
  };

  const handleShare = async () => {
    setBusy("share");
    try {
      const blob = await renderPng();
      const file = new File([blob], "brain-trails-week.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d?: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: "My Brain Trails week", text: "My study week on Brain Trails - come study with me!" });
      } else {
        downloadBlob(blob, "brain-trails-week.png");
      }
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setBusy(null);
    }
  };

  const handleDownload = async () => {
    setBusy("download");
    try {
      downloadBlob(await renderPng(), "brain-trails-week.png");
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setBusy(null);
    }
  };

  const aspect = format === "story" ? "9 / 16" : "1 / 1";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            className="relative z-10 w-full max-w-sm rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto"
          >
            <button onClick={onClose}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-slate-300 hover:bg-white/20">
              <X className="w-4 h-4" />
            </button>

            {/* Preview */}
            <div className="p-4 pb-3">
              <div
                className="relative w-full mx-auto rounded-2xl overflow-hidden bg-slate-800"
                style={{ aspectRatio: aspect, maxWidth: format === "story" ? "260px" : "100%" }}
              >
                {photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={overlayUrl} alt="Your shareable study week" className="absolute inset-0 w-full h-full" />
              </div>
            </div>

            {/* Controls */}
            <div className="px-4 space-y-3">
              {/* Format */}
              <Segmented
                options={Object.entries(FORMATS).map(([k, v]) => ({ key: k, label: v.label }))}
                value={format}
                onChange={(k) => setFormat(k as FormatKey)}
              />
              {/* Template */}
              <Segmented
                options={Object.entries(TEMPLATES).map(([k, v]) => ({ key: k, label: v.label }))}
                value={template}
                onChange={(k) => setTemplate(k as TemplateKey)}
              />
              {/* Photo */}
              <div className="flex gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-white/10 text-slate-200 hover:bg-white/20"
                >
                  <ImagePlus className="w-4 h-4" /> {photoUrl ? "Change photo" : "Add a photo"}
                </button>
                {photoUrl && (
                  <button
                    onClick={() => setPhotoUrl(null)}
                    className="px-3 py-2.5 rounded-xl bg-white/10 text-slate-300 hover:bg-white/20"
                    aria-label="Remove photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-4">
              <button onClick={handleShare} disabled={busy !== null}
                className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-violet-600 text-white hover:from-purple-600 hover:to-violet-700 disabled:opacity-50">
                {busy === "share" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} Share
              </button>
              <button onClick={handleDownload} disabled={busy !== null}
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

function Segmented({
  options, value, onChange,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-white/5">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
            value === o.key ? "bg-white text-slate-900" : "text-slate-300 hover:bg-white/10"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
