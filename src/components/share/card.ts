import { CARD_COLORS, CARD_ROUTE_COLORS } from "@/config/site";
import type { CardData } from "@/lib/cardData";
import { formatBps } from "@/lib/units";

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;
const PAD = 56;

function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut}…`;
}

/** Draws the summary card. Pure canvas drawing: no network, no external assets. */
export function drawCard(
  canvas: HTMLCanvasElement,
  data: CardData,
  fonts: { mono: string; sans: string },
): void {
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  const mono = (size: number, weight = 500) => `${weight} ${size}px ${fonts.mono}`;
  const sans = (size: number, weight = 400) => `${weight} ${size}px ${fonts.sans}`;
  const inner = CARD_WIDTH - PAD * 2;

  ctx.fillStyle = CARD_COLORS.bg;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.strokeStyle = CARD_COLORS.line;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, CARD_WIDTH - 2, CARD_HEIGHT - 2);
  ctx.textBaseline = "alphabetic";

  // Header: own mark and name.
  ctx.strokeStyle = CARD_COLORS.accent;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(PAD, 44, 34, 34, 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(PAD + 8, 61);
  ctx.lineTo(PAD + 14, 67);
  ctx.lineTo(PAD + 26, 53);
  ctx.stroke();
  ctx.fillStyle = CARD_COLORS.text;
  ctx.font = mono(26);
  ctx.fillText(data.siteName, PAD + 48, 70);
  ctx.fillStyle = CARD_COLORS.muted;
  ctx.font = mono(18, 400);
  ctx.textAlign = "right";
  ctx.fillText("LAUNCH SIMULATION", CARD_WIDTH - PAD, 68);
  ctx.textAlign = "left";

  // Title.
  ctx.fillStyle = CARD_COLORS.text;
  ctx.font = mono(54);
  ctx.fillText(fit(ctx, data.title, inner), PAD, 168);
  ctx.fillStyle = CARD_COLORS.body;
  ctx.font = sans(24);
  ctx.fillText(fit(ctx, data.subtitle, inner), PAD, 210);

  // Stat boxes.
  const gap = 16;
  const boxW = (inner - gap * (data.stats.length - 1)) / data.stats.length;
  const boxY = 244;
  const boxH = 132;
  data.stats.forEach((stat, i) => {
    const bx = PAD + i * (boxW + gap);
    ctx.fillStyle = CARD_COLORS.surface;
    ctx.fillRect(bx, boxY, boxW, boxH);
    ctx.strokeStyle = CARD_COLORS.line;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, boxY + 0.5, boxW - 1, boxH - 1);
    ctx.fillStyle = CARD_COLORS.muted;
    ctx.font = mono(16, 400);
    ctx.fillText(stat.label.toUpperCase(), bx + 18, boxY + 36);
    ctx.fillStyle = stat.estimate ? CARD_COLORS.text : CARD_COLORS.accent;
    ctx.font = mono(stat.estimate ? 26 : 44);
    ctx.fillText(fit(ctx, stat.value, boxW - 36), bx + 18, boxY + (stat.estimate ? 80 : 92));
    if (stat.estimate) {
      ctx.fillStyle = CARD_COLORS.muted;
      ctx.font = mono(15, 400);
      ctx.fillText("MODEL ESTIMATE", bx + 18, boxY + 110);
    }
  });

  // Tax routing bar.
  const barY = 432;
  ctx.fillStyle = CARD_COLORS.muted;
  ctx.font = mono(16, 400);
  ctx.fillText(data.segmentsTitle.toUpperCase(), PAD, barY - 14);
  let sx = PAD;
  for (const segment of data.segments) {
    const w = (inner * segment.bps) / 10_000;
    ctx.fillStyle = CARD_ROUTE_COLORS[segment.id];
    ctx.fillRect(sx, barY, Math.max(0, w - 2), 26);
    sx += w;
  }
  let lx = PAD;
  ctx.font = sans(19);
  for (const segment of data.segments) {
    const label = `${segment.label} ${formatBps(segment.bps)}`;
    ctx.fillStyle = CARD_ROUTE_COLORS[segment.id];
    ctx.fillRect(lx, barY + 46, 12, 12);
    ctx.fillStyle = CARD_COLORS.body;
    ctx.fillText(label, lx + 20, barY + 58);
    lx += ctx.measureText(label).width + 48;
  }

  // Footer with the unofficial label.
  ctx.strokeStyle = CARD_COLORS.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, 540);
  ctx.lineTo(CARD_WIDTH - PAD, 540);
  ctx.stroke();
  ctx.fillStyle = CARD_COLORS.text;
  ctx.font = sans(21, 500);
  ctx.fillText(data.unofficialLabel, PAD, 580);
  ctx.fillStyle = CARD_COLORS.muted;
  ctx.font = mono(16, 400);
  ctx.fillText(`${data.checkedLabel}  ·  Testnet  ·  Estimates are not protocol data`, PAD, 608);
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not create the image."))),
      "image/png",
    );
  });
}
