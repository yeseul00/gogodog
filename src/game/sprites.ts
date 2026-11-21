import { CHARACTER_LIST } from './characters';
import { STAGE_MAP } from './stages';
import type { CharacterId, StageId } from './types';

export interface ProcessedSprite {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  aspect: number;
  /** Ratio of trimmed height to source square canvas height so multi-frame sprites keep identical head/body scale */
  heightRatio: number;
}

export interface CharacterSpriteSet {
  runFrames: ProcessedSprite[];
  jump: ProcessedSprite | null;
  duck: ProcessedSprite | null;
}

export interface GameSprites {
  characters: Record<CharacterId, CharacterSpriteSet>;
  stagePanoramas: Record<StageId, HTMLCanvasElement | null>;
  ready: boolean;
}

export function createEmptyGameSprites(): GameSprites {
  return {
    characters: {
      ddaengkong: { runFrames: [], jump: null, duck: null },
      nari: { runFrames: [], jump: null, duck: null },
      kiki: { runFrames: [], jump: null, duck: null },
    },
    stagePanoramas: {
      1: null,
      2: null,
      3: null,
    },
    ready: false,
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * VFX-grade magenta chroma-keying + soft fur-edge feathering & despilling.
 * Supports warm cream/honey fur (ddaengkong) and crisp neutral black/white fur (nari).
 */
function processWatercolorChromaSprite(
  img: HTMLImageElement,
  neutralFur = false,
  maxDim = 420
): ProcessedSprite | null {
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const work = document.createElement('canvas');
  work.width = w;
  work.height = h;
  const ctx = work.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const total = w * h;

  const isHardKey = new Uint8Array(total);
  const magentaScore = new Int16Array(total);

  for (let i = 0; i < total; i++) {
    const o = i * 4;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const m = Math.min(r, b) - g;
    magentaScore[i] = m;
    if (m >= 88 && r >= 145 && b >= 145) {
      isHardKey[i] = 1;
    }
  }

  const distToBg = new Uint8Array(total);
  distToBg.fill(255);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  for (let i = 0; i < total; i++) {
    if (isHardKey[i]) {
      distToBg[i] = 0;
      queue[tail++] = i;
    }
  }

  const maxFringeRadius = 5;
  while (head < tail) {
    const cur = queue[head++];
    const d = distToBg[cur];
    if (d >= maxFringeRadius) continue;

    const cx = cur % w;
    const cy = (cur - cx) / w;
    const nextD = d + 1;

    if (cx > 0 && distToBg[cur - 1] > nextD) {
      distToBg[cur - 1] = nextD;
      queue[tail++] = cur - 1;
    }
    if (cx + 1 < w && distToBg[cur + 1] > nextD) {
      distToBg[cur + 1] = nextD;
      queue[tail++] = cur + 1;
    }
    if (cy > 0 && distToBg[cur - w] > nextD) {
      distToBg[cur - w] = nextD;
      queue[tail++] = cur - w;
    }
    if (cy + 1 < h && distToBg[cur + w] > nextD) {
      distToBg[cur + w] = nextD;
      queue[tail++] = cur + w;
    }
  }

  for (let i = 0; i < total; i++) {
    const o = i * 4;
    const m = magentaScore[i];

    if (isHardKey[i]) {
      data[o + 3] = 0;
      continue;
    }

    if (distToBg[i] <= maxFringeRadius && m > 4) {
      const r = data[o];
      const g = data[o + 1];
      const b = data[o + 2];

      if (m > 20) {
        const t = Math.min(1, (m - 20) / (90 - 20));
        const smooth = t * t * (3 - 2 * t);
        data[o + 3] = Math.round(255 * (1 - smooth));
      }

      const spill = Math.min(1, m / 88);
      if (neutralFur) {
        // Neutral grayscale despill for crisp white & black fur edges
        const cleanG = Math.min(255, Math.round(g + spill * 26));
        const cleanR = Math.min(r, cleanG + 6);
        const cleanB = Math.min(b, cleanG + 6);
        data[o] = cleanR;
        data[o + 1] = cleanG;
        data[o + 2] = cleanB;
      } else {
        const cleanG = Math.min(255, Math.round(g + spill * 34));
        const cleanB = Math.min(b, Math.round(cleanG * 0.9));
        const cleanR = Math.min(255, Math.round(r * (1 - spill * 0.08) + cleanG * spill * 0.1));
        data[o] = cleanR;
        data[o + 1] = cleanG;
        data[o + 2] = cleanB;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 26) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    return { canvas: work, width: w, height: h, aspect: w / h, heightRatio: 1 };
  }

  const pad = 2;
  const sx = Math.max(0, minX - pad);
  const sy = Math.max(0, minY - pad);
  const sw = Math.min(w - sx, maxX - minX + 1 + pad * 2);
  const sh = Math.min(h - sy, maxY - minY + 1 + pad * 2);

  const trimmed = document.createElement('canvas');
  trimmed.width = sw;
  trimmed.height = sh;
  const tctx = trimmed.getContext('2d');
  if (!tctx) return null;
  tctx.drawImage(work, sx, sy, sw, sh, 0, 0, sw, sh);

  return {
    canvas: trimmed,
    width: sw,
    height: sh,
    aspect: sw / sh,
    heightRatio: sh / h,
  };
}

function buildSeamlessPanorama(img: HTMLImageElement): HTMLCanvasElement | null {
  const targetH = Math.min(680, img.naturalHeight || 540);
  const scale = targetH / (img.naturalHeight || 540);
  const singleW = Math.round((img.naturalWidth || 960) * scale);

  const tile = document.createElement('canvas');
  tile.width = singleW * 2;
  tile.height = targetH;
  const ctx = tile.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, singleW, targetH);

  ctx.save();
  ctx.translate(singleW * 2, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(img, 0, 0, singleW, targetH);
  ctx.restore();

  return tile;
}

async function loadCharacterSprites(
  runUrls: string[],
  jumpUrl: string,
  duckUrl: string,
  neutralFur: boolean
): Promise<CharacterSpriteSet> {
  const set: CharacterSpriteSet = {
    runFrames: [],
    jump: null,
    duck: null,
  };

  const [runResults, jumpRes, duckRes] = await Promise.all([
    Promise.allSettled(runUrls.map((url) => loadImage(url))),
    Promise.allSettled([loadImage(jumpUrl)]).then((r) => r[0]),
    Promise.allSettled([loadImage(duckUrl)]).then((r) => r[0]),
  ]);

  for (const r of runResults) {
    if (r.status === 'fulfilled') {
      const processed = processWatercolorChromaSprite(r.value, neutralFur);
      if (processed) {
        set.runFrames.push(processed);
      }
    }
  }

  if (jumpRes.status === 'fulfilled') {
    set.jump = processWatercolorChromaSprite(jumpRes.value, neutralFur);
  }
  if (duckRes.status === 'fulfilled') {
    set.duck = processWatercolorChromaSprite(duckRes.value, neutralFur);
  }

  return set;
}

export async function loadGameSprites(): Promise<GameSprites> {
  const result = createEmptyGameSprites();
  const stageIds: StageId[] = [1, 2, 3];

  const [characterSets, panoResults] = await Promise.all([
    Promise.all(
      CHARACTER_LIST.map((charDef) =>
        loadCharacterSprites(
          charDef.spriteUrls.runFrames,
          charDef.spriteUrls.jump,
          charDef.spriteUrls.duck,
          charDef.spriteUrls.neutralFur
        ).then((set) => ({ id: charDef.id, set }))
      )
    ),
    Promise.allSettled(stageIds.map((id) => loadImage(STAGE_MAP[id].panoramaUrl))),
  ]);

  for (const { id, set } of characterSets) {
    result.characters[id] = set;
  }

  panoResults.forEach((res, idx) => {
    const id = stageIds[idx];
    if (res.status === 'fulfilled') {
      result.stagePanoramas[id] = buildSeamlessPanorama(res.value);
    }
  });

  result.ready =
    result.characters.ddaengkong.runFrames.length > 0 ||
    result.characters.nari.runFrames.length > 0 ||
    result.characters.kiki.runFrames.length > 0 ||
    Boolean(result.stagePanoramas[1] || result.stagePanoramas[2] || result.stagePanoramas[3]);

  return result;
}
