// Shared helpers for turning an SVG (optionally composited over a user photo)
// into a PNG and sharing/downloading it. Used by the weekly ShareCard and the
// Trial result card so the export path lives in one place.

export const SHARE_FONT = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

export function escapeSvg(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Cover-fit draw (center-crop) an image onto a w×h canvas context. */
export function coverDraw(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

/**
 * Composite an optional background photo + an SVG overlay into a PNG blob.
 * If `photoUrl` is null the SVG is expected to paint its own background.
 */
export async function renderCardPng(opts: {
  overlaySvg: string;
  width: number;
  height: number;
  photoUrl?: string | null;
}): Promise<Blob> {
  const { overlaySvg, width, height, photoUrl } = opts;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");

  if (photoUrl) {
    const photo = await loadImage(photoUrl);
    coverDraw(ctx, photo, width, height);
  }
  const overlay = await loadImage(svgToDataUrl(overlaySvg));
  ctx.drawImage(overlay, 0, 0, width, height);

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png")
  );
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Share via the Web Share API (with image file) when available, else download. */
export async function shareOrDownload(blob: Blob, filename: string, text: string) {
  const file = new File([blob], filename, { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d?: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] }) && nav.share) {
    await nav.share({ files: [file], title: "Brain Trails", text });
  } else {
    downloadBlob(blob, filename);
  }
}
