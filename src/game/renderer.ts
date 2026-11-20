import { getMemoryDefinition } from './memories';
import type { GameSprites } from './sprites';
import { getStageDefinition } from './stages';
import type {
  ActiveMemoryItem,
  CharacterId,
  Cloud,
  FloatingText,
  Obstacle,
  Particle,
  PomeranianState,
  SceneryProp,
  StageId,
  TimeOfDayPhase,
  Treat,
} from './types';

export interface RenderContextState {
  stageId: StageId;
  characterId: CharacterId;
  worldWidth: number;
  worldHeight: number;
  groundY: number;
  distance: number;
  goalDistance: number;
  showHomeGate: boolean;
  elapsed: number;
  speed: number;
  player: PomeranianState;
  obstacles: Obstacle[];
  treats: Treat[];
  memories: ActiveMemoryItem[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  scenery: SceneryProp[];
  clouds: Cloud[];
  isFever: boolean;
  feverRemaining: number;
  shakeOffsetX: number;
  shakeOffsetY: number;
  timeCycleT: number; // 0..4 continuous cycle (0=morning, 1=afternoon, 2=sunset, 3=evening)
  sprites: GameSprites;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface TimeAtmosphere {
  skyTop: RGB;
  skyBottom: RGB;
  tintOverlay: RGB;
  tintAlpha: number;
  sunGlow: RGB;
  sunGlowAlpha: number;
  pathTop: RGB;
  pathBottom: RGB;
  grassTop: RGB;
  grassDeep: RGB;
  lampGlow: number;
  starAlpha: number;
}

const ATMOSPHERES: Record<TimeOfDayPhase, TimeAtmosphere> = {
  morning: {
    skyTop: { r: 178, g: 222, b: 248 },
    skyBottom: { r: 252, g: 245, b: 230 },
    tintOverlay: { r: 255, g: 250, b: 238 },
    tintAlpha: 0.02,
    sunGlow: { r: 255, g: 242, b: 204 },
    sunGlowAlpha: 0.28,
    pathTop: { r: 232, g: 217, b: 194 },
    pathBottom: { r: 204, g: 186, b: 162 },
    grassTop: { r: 112, g: 172, b: 64 },
    grassDeep: { r: 68, g: 124, b: 36 },
    lampGlow: 0,
    starAlpha: 0,
  },
  afternoon: {
    skyTop: { r: 152, g: 210, b: 242 },
    skyBottom: { r: 255, g: 236, b: 196 },
    tintOverlay: { r: 255, g: 214, b: 138 },
    tintAlpha: 0.14,
    sunGlow: { r: 255, g: 220, b: 130 },
    sunGlowAlpha: 0.36,
    pathTop: { r: 234, g: 209, b: 174 },
    pathBottom: { r: 198, g: 170, b: 136 },
    grassTop: { r: 118, g: 168, b: 54 },
    grassDeep: { r: 74, g: 118, b: 32 },
    lampGlow: 0.14,
    starAlpha: 0,
  },
  sunset: {
    skyTop: { r: 126, g: 108, b: 162 },
    skyBottom: { r: 254, g: 172, b: 118 },
    tintOverlay: { r: 242, g: 124, b: 78 },
    tintAlpha: 0.36,
    sunGlow: { r: 255, g: 166, b: 92 },
    sunGlowAlpha: 0.52,
    pathTop: { r: 216, g: 168, b: 138 },
    pathBottom: { r: 174, g: 128, b: 104 },
    grassTop: { r: 118, g: 128, b: 56 },
    grassDeep: { r: 78, g: 86, b: 40 },
    lampGlow: 0.78,
    starAlpha: 0.3,
  },
  evening: {
    skyTop: { r: 28, g: 42, b: 78 },
    skyBottom: { r: 104, g: 98, b: 132 },
    tintOverlay: { r: 26, g: 40, b: 78 },
    tintAlpha: 0.62,
    sunGlow: { r: 224, g: 178, b: 132 },
    sunGlowAlpha: 0.2,
    pathTop: { r: 136, g: 130, b: 134 },
    pathBottom: { r: 98, g: 94, b: 104 },
    grassTop: { r: 52, g: 86, b: 64 },
    grassDeep: { r: 30, g: 56, b: 44 },
    lampGlow: 1.0,
    starAlpha: 0.94,
  },
};

const PHASE_ORDER: TimeOfDayPhase[] = ['morning', 'afternoon', 'sunset', 'evening'];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpRGB(a: RGB, b: RGB, t: number): RGB {
  return {
    r: Math.round(lerp(a.r, b.r, t)),
    g: Math.round(lerp(a.g, b.g, t)),
    b: Math.round(lerp(a.b, b.b, t)),
  };
}

function rgbStr(c: RGB, alpha = 1): string {
  return alpha >= 0.999 ? `rgb(${c.r}, ${c.g}, ${c.b})` : `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
}

function getAtmosphere(timeCycleT: number): TimeAtmosphere {
  const wrapped = ((timeCycleT % 4) + 4) % 4;
  const idxA = Math.floor(wrapped) % 4;
  const idxB = (idxA + 1) % 4;
  const frac = wrapped - Math.floor(wrapped);
  const t = frac * frac * (3 - 2 * frac);
  const a = ATMOSPHERES[PHASE_ORDER[idxA]];
  const b = ATMOSPHERES[PHASE_ORDER[idxB]];

  return {
    skyTop: lerpRGB(a.skyTop, b.skyTop, t),
    skyBottom: lerpRGB(a.skyBottom, b.skyBottom, t),
    tintOverlay: lerpRGB(a.tintOverlay, b.tintOverlay, t),
    tintAlpha: lerp(a.tintAlpha, b.tintAlpha, t),
    sunGlow: lerpRGB(a.sunGlow, b.sunGlow, t),
    sunGlowAlpha: lerp(a.sunGlowAlpha, b.sunGlowAlpha, t),
    pathTop: lerpRGB(a.pathTop, b.pathTop, t),
    pathBottom: lerpRGB(a.pathBottom, b.pathBottom, t),
    grassTop: lerpRGB(a.grassTop, b.grassTop, t),
    grassDeep: lerpRGB(a.grassDeep, b.grassDeep, t),
    lampGlow: lerp(a.lampGlow, b.lampGlow, t),
    starAlpha: lerp(a.starAlpha, b.starAlpha, t),
  };
}

export class WatercolorRenderer {
  private stars: Array<{ xRatio: number; yRatio: number; size: number; twinkle: number }> = [];
  private bokehMotes: Array<{ xRatio: number; yRatio: number; r: number; phase: number }> = [];

  constructor() {
    for (let i = 0; i < 40; i++) {
      this.stars.push({
        xRatio: (i * 0.61803398875) % 1,
        yRatio: 0.06 + ((i * 0.371) % 0.34),
        size: 1.0 + (i % 3) * 0.65,
        twinkle: i * 1.4,
      });
    }
    for (let i = 0; i < 14; i++) {
      this.bokehMotes.push({
        xRatio: (i * 0.381966) % 1,
        yRatio: 0.14 + ((i * 0.29) % 0.56),
        r: 9 + (i % 4) * 5,
        phase: i * 1.7,
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D, state: RenderContextState): void {
    const { worldWidth: w, worldHeight: h, groundY, stageId } = state;
    const atmo = getAtmosphere(state.timeCycleT);

    ctx.save();
    ctx.translate(state.shakeOffsetX, state.shakeOffsetY);

    // 1. Stage-Specific Seamless Panorama + Sky + Atmospheric Lighting
    this.drawSkyAndPanorama(
      ctx,
      stageId,
      w,
      h,
      groundY,
      state.distance,
      state.timeCycleT,
      state.elapsed,
      atmo,
      state.sprites
    );

    // 2. Stage-Specific Streetlamps / Forest Lanterns / Café Warm Light Pools
    this.drawLamps(ctx, stageId, state.scenery, groundY, atmo.lampGlow, state.elapsed);

    // 3. Stage-Specific Walkway & Ground Surface
    this.drawParkWalkway(ctx, stageId, w, h, groundY, state.distance, atmo);

    // 3.5 Cozy Welcome-Home Flower Arch scrolling into view on the final stretch
    if (state.showHomeGate) {
      this.drawHomeFinishArch(
        ctx,
        stageId,
        w,
        groundY,
        state.player.x,
        state.distance,
        state.goalDistance,
        state.elapsed
      );
    }

    // 4. Soft-lit 3D-shaded Obstacles
    for (const obs of state.obstacles) {
      this.drawObstacle(ctx, obs, groundY, state.elapsed);
    }

    // 5. Glossy Appetizing Treats
    for (const treat of state.treats) {
      if (!treat.collected) {
        this.drawTreat(ctx, treat, groundY, state.elapsed);
      }
    }

    // 5.5 Radiant Collectible Memory Fragments
    for (const mem of state.memories) {
      if (!mem.collected) {
        this.drawMemoryItem(ctx, mem, groundY, state.elapsed);
      }
    }

    // 6. Stylized 3D Plush Runner Character (땡콩이 or 나리 — 4-frame run + jump + duck)
    this.drawCharacterSprite(
      ctx,
      state.player,
      groundY,
      state.isFever,
      state.elapsed,
      state.sprites,
      state.characterId
    );

    // 7. Stage-Specific Foreground Grass / Woodland Ferns / Evening Café Curb
    this.drawForegroundGrass(ctx, stageId, w, h, groundY, state.distance, atmo);

    // 8. Particles (cherry petals, woodland leaves, café fairy-light motes, sparkles, hearts)
    this.drawParticles(ctx, state.particles, groundY);

    // 9. Floating Score & Combo Popups
    this.drawFloatingTexts(ctx, state.floatingTexts, groundY);

    // 10. Dreamy Sunlight / Evening Bokeh Motes & Golden Fever Glow
    this.drawSunlightBokeh(ctx, stageId, w, groundY, state.elapsed, atmo);
    if (state.isFever) {
      this.drawFeverVignette(ctx, w, h, state.elapsed, state.feverRemaining);
    }

    ctx.restore();
  }

  private drawSkyAndPanorama(
    ctx: CanvasRenderingContext2D,
    stageId: StageId,
    w: number,
    h: number,
    groundY: number,
    distance: number,
    timeCycleT: number,
    elapsed: number,
    atmo: TimeAtmosphere,
    sprites: GameSprites
  ): void {
    const stageDef = getStageDefinition(stageId);

    // Stage-harmonized sky backdrop above the panorama
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY + 14);
    if (stageId === 3) {
      skyGrad.addColorStop(0, '#5E68A8');
      skyGrad.addColorStop(0.55, '#B29CC4');
      skyGrad.addColorStop(1, '#F3C7A6');
    } else if (stageId === 2) {
      skyGrad.addColorStop(0, '#B9DFD8');
      skyGrad.addColorStop(1, '#F6ECCF');
    } else {
      skyGrad.addColorStop(0, rgbStr(atmo.skyTop));
      skyGrad.addColorStop(1, rgbStr(atmo.skyBottom));
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-12, -12, w + 24, h + 24);

    const tile = sprites.stagePanoramas[stageId] ?? sprites.stagePanoramas[1];
    if (tile) {
      const drawH = Math.max(groundY * 1.18, 360);
      const scale = drawH / tile.height;
      const drawW = tile.width * scale;
      const drawY = groundY - drawH * stageDef.panoramaGroundAnchor;
      const scrollSpeed = stageId === 3 ? 17 : 15;
      const scroll = (((distance * scrollSpeed) % drawW) + drawW) % drawW;

      for (let x = -scroll; x < w + drawW; x += drawW) {
        ctx.drawImage(tile, x, drawY, drawW + 1, drawH);
      }

      if (drawY > -6) {
        const blendTop = stageId === 3 ? 'rgba(94, 104, 168, 1)' : stageId === 2 ? 'rgba(185, 223, 216, 1)' : rgbStr(atmo.skyTop, 1);
        const blendZero = stageId === 3 ? 'rgba(94, 104, 168, 0)' : stageId === 2 ? 'rgba(185, 223, 216, 0)' : rgbStr(atmo.skyTop, 0);
        const blendGrad = ctx.createLinearGradient(0, Math.max(0, drawY - 10), 0, drawY + 62);
        blendGrad.addColorStop(0, blendTop);
        blendGrad.addColorStop(1, blendZero);
        ctx.fillStyle = blendGrad;
        ctx.fillRect(-10, 0, w + 20, drawY + 66);
      }
    }

    // Balanced atmospheric grading per stage so custom stage panoramas stay luminous & readable
    if (stageId === 3) {
      // Gentle dusk deepening across the café run while preserving warm amber windows
      const eveningWeight = Math.min(1, Math.max(0, (timeCycleT - 2.4) / 0.9));
      ctx.fillStyle = `rgba(38, 36, 76, ${0.06 + eveningWeight * 0.14})`;
      ctx.fillRect(-12, -12, w + 24, groundY + 26);
    } else if (stageId === 2) {
      // Soft golden woodland warmth as afternoon shifts toward sunset
      const forestWarmth = Math.min(1, Math.max(0, (timeCycleT - 0.55) / 1.3));
      ctx.fillStyle = `rgba(248, 198, 114, ${0.04 + forestWarmth * 0.14})`;
      ctx.fillRect(-12, -12, w + 24, groundY + 26);
    } else if (atmo.tintAlpha > 0.01) {
      ctx.fillStyle = rgbStr(atmo.tintOverlay, atmo.tintAlpha);
      ctx.fillRect(-12, -12, w + 24, groundY + 26);
    }

    // Warm sunlit or twilight glow from upper sky
    const glowX = stageId === 2 ? w * 0.54 : w * 0.84;
    const glowY = Math.max(48, groundY * 0.18);
    const sunGrad = ctx.createRadialGradient(glowX, glowY, 10, glowX, glowY, w * 0.62);
    const glowColor = stageId === 3 ? { r: 255, g: 204, b: 142 } : atmo.sunGlow;
    const glowAlpha = stageId === 3 ? 0.24 : atmo.sunGlowAlpha;
    sunGrad.addColorStop(0, rgbStr(glowColor, glowAlpha));
    sunGrad.addColorStop(0.55, rgbStr(glowColor, glowAlpha * 0.28));
    sunGrad.addColorStop(1, rgbStr(glowColor, 0));
    ctx.fillStyle = sunGrad;
    ctx.fillRect(-10, -10, w + 20, groundY + 20);

    // Twinkling stars in evening café lane or late sunset
    const starAlpha = stageId === 3 ? 0.52 + Math.min(0.35, Math.max(0, timeCycleT - 2.5) * 0.35) : atmo.starAlpha;
    if (starAlpha > 0.03) {
      for (const s of this.stars) {
        const twinkle = 0.5 + 0.5 * Math.sin(elapsed * 2.5 + s.twinkle);
        ctx.fillStyle = `rgba(255, 250, 232, ${starAlpha * twinkle})`;
        ctx.beginPath();
        ctx.arc(s.xRatio * w, s.yRatio * groundY * 0.72, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Glowing crescent moon in Stage 3 evening café street
    const wrapped = ((timeCycleT % 4) + 4) % 4;
    if (stageId === 3 || (wrapped > 2.68 && wrapped < 3.88)) {
      const cx = w * 0.82;
      const cy = Math.max(58, groundY * 0.18);
      const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 52);
      glow.addColorStop(0, 'rgba(255, 244, 198, 0.45)');
      glow.addColorStop(1, 'rgba(255, 244, 198, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, 52, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFF7D6';
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = stageId === 3 ? '#777FB4' : rgbStr(atmo.skyTop);
      ctx.beginPath();
      ctx.arc(cx + 5.5, cy - 3, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawLamps(
    ctx: CanvasRenderingContext2D,
    stageId: StageId,
    scenery: SceneryProp[],
    groundY: number,
    lampGlow: number,
    elapsed: number
  ): void {
    for (const prop of scenery) {
      if (prop.kind !== 'lamp') continue;
      ctx.save();
      ctx.translate(prop.x, groundY - 4);
      ctx.scale(prop.scale, prop.scale);

      const flicker = 0.95 + 0.05 * Math.sin(elapsed * 4.5 + prop.seed);

      if (stageId === 3) {
        // Stage 3 panorama already includes vintage café streetlamps; cast warm amber light pools onto the lane!
        const pool = ctx.createRadialGradient(0, 18, 4, 0, 18, 68);
        pool.addColorStop(0, `rgba(255, 214, 134, ${0.34 * flicker})`);
        pool.addColorStop(0.55, `rgba(255, 188, 102, ${0.14 * flicker})`);
        pool.addColorStop(1, 'rgba(255, 188, 102, 0)');
        ctx.fillStyle = pool;
        ctx.beginPath();
        ctx.ellipse(0, 18, 68, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }

      if (stageId === 2) {
        // Rustic cedar woodland trail lantern post
        const postGrad = ctx.createLinearGradient(-3.5, 0, 3.5, 0);
        postGrad.addColorStop(0, '#9B6C43');
        postGrad.addColorStop(0.5, '#7A502E');
        postGrad.addColorStop(1, '#58371E');
        ctx.fillStyle = postGrad;
        ctx.beginPath();
        ctx.roundRect(-3.2, -56, 6.4, 60, 2);
        ctx.fill();

        // Short side arm
        ctx.fillStyle = '#6D4627';
        ctx.beginPath();
        ctx.roundRect(-2, -54, 16, 4, 2);
        ctx.fill();

        // Cozy hanging wooden trail lantern
        const glow = Math.max(0.45, lampGlow) * flicker;
        ctx.fillStyle = '#56361D';
        ctx.beginPath();
        ctx.moveTo(6, -48);
        ctx.lineTo(18, -48);
        ctx.lineTo(14.5, -53);
        ctx.lineTo(9.5, -53);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = `rgba(255, 236, 174, ${0.7 + glow * 0.3})`;
        ctx.beginPath();
        ctx.roundRect(8.5, -48, 7, 9, 2);
        ctx.fill();

        const halo = ctx.createRadialGradient(12, -43, 2, 12, -43, 44);
        halo.addColorStop(0, `rgba(255, 226, 138, ${0.42 * glow})`);
        halo.addColorStop(1, 'rgba(255, 226, 138, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(12, -43, 44, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        continue;
      }

      // Stage 1: Classic slender wrought-iron park lamp post
      const poleGrad = ctx.createLinearGradient(-2, 0, 2, 0);
      poleGrad.addColorStop(0, '#3D3B3E');
      poleGrad.addColorStop(0.5, '#666368');
      poleGrad.addColorStop(1, '#2D2B2E');
      ctx.fillStyle = poleGrad;
      ctx.fillRect(-1.8, -84, 3.6, 86);

      ctx.fillStyle = '#38363A';
      ctx.beginPath();
      ctx.roundRect(-4.5, -10, 9, 12, 2);
      ctx.fill();

      ctx.fillStyle = '#353338';
      ctx.beginPath();
      ctx.moveTo(-8.5, -83);
      ctx.lineTo(8.5, -83);
      ctx.lineTo(5.5, -96);
      ctx.lineTo(-5.5, -96);
      ctx.closePath();
      ctx.fill();

      const glow = lampGlow * flicker;
      ctx.fillStyle = glow > 0.1 ? `rgba(255, 232, 162, ${0.55 + glow * 0.45})` : 'rgba(246, 242, 232, 0.85)';
      ctx.fillRect(-4.8, -93, 9.6, 9.5);

      if (glow > 0.08) {
        const halo = ctx.createRadialGradient(0, -88, 4, 0, -88, 76);
        halo.addColorStop(0, `rgba(255, 224, 140, ${0.65 * glow})`);
        halo.addColorStop(0.45, `rgba(255, 198, 108, ${0.22 * glow})`);
        halo.addColorStop(1, 'rgba(255, 198, 108, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, -88, 76, 0, Math.PI * 2);
        ctx.fill();

        const pool = ctx.createRadialGradient(0, 14, 4, 0, 14, 56);
        pool.addColorStop(0, `rgba(255, 226, 146, ${0.34 * glow})`);
        pool.addColorStop(1, 'rgba(255, 226, 146, 0)');
        ctx.fillStyle = pool;
        ctx.beginPath();
        ctx.ellipse(0, 14, 56, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private drawParkWalkway(
    ctx: CanvasRenderingContext2D,
    stageId: StageId,
    w: number,
    h: number,
    groundY: number,
    distance: number,
    atmo: TimeAtmosphere
  ): void {
    const pathBandH = 48;

    if (stageId === 2) {
      // Stage 2: Sunlit woodland earthy dirt trail with warm cedar stepping planks & moss verge
      const topEdgeGrad = ctx.createLinearGradient(0, groundY - 9, 0, groundY + 4);
      topEdgeGrad.addColorStop(0, 'rgba(92, 146, 56, 0)');
      topEdgeGrad.addColorStop(0.65, 'rgba(72, 118, 42, 0.72)');
      topEdgeGrad.addColorStop(1, 'rgba(182, 138, 92, 0.96)');
      ctx.fillStyle = topEdgeGrad;
      ctx.fillRect(-10, groundY - 9, w + 20, 15);

      const trailGrad = ctx.createLinearGradient(0, groundY, 0, groundY + pathBandH);
      trailGrad.addColorStop(0, '#C89B6B');
      trailGrad.addColorStop(0.7, '#A7794B');
      trailGrad.addColorStop(1, '#588C3A');
      ctx.fillStyle = trailGrad;
      ctx.fillRect(-10, groundY, w + 20, pathBandH);

      const forestFloorY = groundY + pathBandH - 5;
      const floorGrad = ctx.createLinearGradient(0, forestFloorY, 0, h + 16);
      floorGrad.addColorStop(0, '#5B923B');
      floorGrad.addColorStop(0.5, '#3E6E2A');
      floorGrad.addColorStop(1, '#26491B');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(-10, forestFloorY, w + 20, Math.max(40, h - forestFloorY + 20));

      const step = 92;
      const scroll = (distance * 48) % step;
      for (let x = -step - scroll; x < w + step; x += step) {
        // Warm wooden stepping log / rustic dirt grain
        ctx.fillStyle = 'rgba(246, 218, 174, 0.24)';
        ctx.beginPath();
        ctx.roundRect(x + 8, groundY + 10, 44, 11, 5);
        ctx.fill();

        // Smooth woodland pebbles
        ctx.fillStyle = 'rgba(122, 92, 62, 0.28)';
        ctx.beginPath();
        ctx.ellipse(x + 68, groundY + 24, 9, 4.5, 0.15, 0, Math.PI * 2);
        ctx.ellipse(x + 28, groundY + 32, 6, 3.2, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Fallen golden-green forest leaves
        ctx.fillStyle = 'rgba(176, 216, 98, 0.8)';
        ctx.beginPath();
        ctx.ellipse(x + 56, groundY + 15, 4.5, 2.2, 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    if (stageId === 3) {
      // Stage 3: Cozy evening European/Korean neighborhood cobblestone café street
      const curbGrad = ctx.createLinearGradient(0, groundY - 7, 0, groundY + 3);
      curbGrad.addColorStop(0, 'rgba(196, 176, 166, 0.35)');
      curbGrad.addColorStop(0.5, '#B29EA4');
      curbGrad.addColorStop(1, '#7D6F82');
      ctx.fillStyle = curbGrad;
      ctx.fillRect(-10, groundY - 6, w + 20, 10);

      const streetGrad = ctx.createLinearGradient(0, groundY, 0, groundY + pathBandH);
      streetGrad.addColorStop(0, '#96879A');
      streetGrad.addColorStop(0.65, '#76697D');
      streetGrad.addColorStop(1, '#584E63');
      ctx.fillStyle = streetGrad;
      ctx.fillRect(-10, groundY, w + 20, pathBandH);

      const lowerY = groundY + pathBandH - 5;
      const lowerGrad = ctx.createLinearGradient(0, lowerY, 0, h + 16);
      lowerGrad.addColorStop(0, '#52475D');
      lowerGrad.addColorStop(0.55, '#3E364A');
      lowerGrad.addColorStop(1, '#2C2636');
      ctx.fillStyle = lowerGrad;
      ctx.fillRect(-10, lowerY, w + 20, Math.max(40, h - lowerY + 20));

      // Scrolling warm cobblestone bricks reflecting amber café glow
      const step = 76;
      const scroll = (distance * 48) % step;
      for (let x = -step - scroll; x < w + step; x += step) {
        ctx.fillStyle = 'rgba(255, 224, 176, 0.16)';
        ctx.beginPath();
        ctx.roundRect(x + 4, groundY + 7, 30, 12, 4);
        ctx.roundRect(x + 39, groundY + 7, 30, 12, 4);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 212, 152, 0.1)';
        ctx.beginPath();
        ctx.roundRect(x + 20, groundY + 23, 34, 12, 4);
        ctx.fill();

        // Warm amber light reflection glint on stones
        ctx.fillStyle = 'rgba(255, 220, 146, 0.24)';
        ctx.beginPath();
        ctx.ellipse(x + 52, groundY + 14, 10, 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    // Stage 1: Sunlit stone park trail & emerald cherry-blossom meadow
    const topEdgeGrad = ctx.createLinearGradient(0, groundY - 8, 0, groundY + 4);
    topEdgeGrad.addColorStop(0, rgbStr(atmo.grassTop, 0));
    topEdgeGrad.addColorStop(0.65, rgbStr(atmo.grassDeep, 0.55));
    topEdgeGrad.addColorStop(1, rgbStr(atmo.pathTop, 0.95));
    ctx.fillStyle = topEdgeGrad;
    ctx.fillRect(-10, groundY - 8, w + 20, 14);

    const pathGrad = ctx.createLinearGradient(0, groundY, 0, groundY + pathBandH);
    pathGrad.addColorStop(0, rgbStr(atmo.pathTop));
    pathGrad.addColorStop(0.75, rgbStr(atmo.pathBottom));
    pathGrad.addColorStop(1, rgbStr(atmo.grassTop));
    ctx.fillStyle = pathGrad;
    ctx.fillRect(-10, groundY, w + 20, pathBandH);

    const meadowY = groundY + pathBandH - 5;
    const meadowGrad = ctx.createLinearGradient(0, meadowY, 0, h + 16);
    meadowGrad.addColorStop(0, rgbStr(atmo.grassTop));
    meadowGrad.addColorStop(0.55, rgbStr(atmo.grassDeep));
    meadowGrad.addColorStop(
      1,
      rgbStr({
        r: Math.max(12, atmo.grassDeep.r - 18),
        g: Math.max(24, atmo.grassDeep.g - 22),
        b: Math.max(12, atmo.grassDeep.b - 12),
      })
    );
    ctx.fillStyle = meadowGrad;
    ctx.fillRect(-10, meadowY, w + 20, Math.max(40, h - meadowY + 20));

    const step = 84;
    const scroll = (distance * 48) % step;
    for (let x = -step - scroll; x < w + step; x += step) {
      ctx.fillStyle = 'rgba(255, 250, 240, 0.22)';
      ctx.beginPath();
      ctx.roundRect(x + 6, groundY + 8, 52, 16, 6);
      ctx.fill();

      ctx.fillStyle = 'rgba(116, 98, 78, 0.12)';
      ctx.beginPath();
      ctx.roundRect(x + 28, groundY + 26, 38, 10, 5);
      ctx.fill();

      ctx.fillStyle = 'rgba(252, 198, 212, 0.85)';
      ctx.beginPath();
      ctx.ellipse(x + 66, groundY + 22, 4.2, 2.2, 0.35, 0, Math.PI * 2);
      ctx.ellipse(x + 18, groundY + 32, 3.2, 1.7, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawHomeFinishArch(
    ctx: CanvasRenderingContext2D,
    stageId: StageId,
    worldWidth: number,
    groundY: number,
    playerX: number,
    distance: number,
    goalDistance: number,
    elapsed: number
  ): void {
    const metersLeft = goalDistance - distance;
    if (metersLeft > 30 || metersLeft < -10) return;

    const archX = playerX + 18 + metersLeft * 34;
    if (archX < -120 || archX > worldWidth + 140) return;

    ctx.save();
    ctx.translate(archX, groundY + 4);

    // Warm welcome glow behind the home arch
    const glow = ctx.createRadialGradient(0, -56, 8, 0, -56, 88);
    glow.addColorStop(0, 'rgba(255, 232, 168, 0.58)');
    glow.addColorStop(0.6, 'rgba(252, 200, 146, 0.22)');
    glow.addColorStop(1, 'rgba(252, 200, 146, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -56, 88, 0, Math.PI * 2);
    ctx.fill();

    // Soft threshold mat on the path
    ctx.fillStyle = 'rgba(255, 244, 224, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 36, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Archway pillars (left & right)
    for (const px of [-34, 34]) {
      const postGrad = ctx.createLinearGradient(px - 6, 0, px + 6, 0);
      postGrad.addColorStop(0, '#E8BA88');
      postGrad.addColorStop(0.55, '#BE824D');
      postGrad.addColorStop(1, '#85532C');
      ctx.fillStyle = postGrad;
      ctx.beginPath();
      ctx.roundRect(px - 5, -106, 10, 114, 4);
      ctx.fill();
    }

    // Curved wooden arch beam
    ctx.strokeStyle = '#B87A46';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -102, 34, Math.PI, 0);
    ctx.stroke();

    ctx.strokeStyle = '#F0C796';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -102, 31, Math.PI + 0.15, -0.15);
    ctx.stroke();

    // Stage-themed floral/fairy garland along the top of the arch
    const garlandColors =
      stageId === 2
        ? ['#B8E378', '#FFF4C8', '#98D460', '#FFE496', '#B8E378']
        : stageId === 3
          ? ['#FFE294', '#FFF7DF', '#FFC876', '#FFF7DF', '#FFE294']
          : ['#F8B9CA', '#FFF0F5', '#FBC5D4', '#FFF2F6', '#F8B9CA'];
    const garlandSpots = [
      { x: -30, y: -116, r: 9, c: garlandColors[0] },
      { x: -18, y: -130, r: 10, c: garlandColors[1] },
      { x: 0, y: -136, r: 11, c: garlandColors[2] },
      { x: 18, y: -130, r: 10, c: garlandColors[3] },
      { x: 30, y: -116, r: 9, c: garlandColors[4] },
    ];
    for (const g of garlandSpots) {
      ctx.fillStyle = stageId === 3 ? '#5E8A60' : '#73B252';
      ctx.beginPath();
      ctx.arc(g.x - 4, g.y + 4, g.r * 0.72, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = g.c;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Warm hanging porch lantern swaying softly under the arch center
    const lanternSway = Math.sin(elapsed * 3.5) * 0.08;
    ctx.save();
    ctx.translate(0, -132);
    ctx.rotate(lanternSway);
    ctx.strokeStyle = '#6E4C32';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 12);
    ctx.stroke();

    const lGlow = ctx.createRadialGradient(0, 18, 2, 0, 18, 24);
    lGlow.addColorStop(0, 'rgba(255, 242, 180, 0.92)');
    lGlow.addColorStop(0.5, 'rgba(255, 210, 118, 0.35)');
    lGlow.addColorStop(1, 'rgba(255, 210, 118, 0)');
    ctx.fillStyle = lGlow;
    ctx.beginPath();
    ctx.arc(0, 18, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFF3C4';
    ctx.beginPath();
    ctx.roundRect(-6, 12, 12, 13, 4);
    ctx.fill();
    ctx.restore();

    // Cozy cream wooden plaque: "우리 집"
    ctx.fillStyle = '#FFF8EA';
    ctx.beginPath();
    ctx.roundRect(-34, -158, 68, 23, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(164, 112, 68, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.font = '700 13px "Jua", system-ui, sans-serif';
    ctx.fillStyle = '#7A4A28';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('우리 집', 0, -146.5);

    ctx.restore();
  }

  private drawForegroundGrass(
    ctx: CanvasRenderingContext2D,
    stageId: StageId,
    w: number,
    _h: number,
    groundY: number,
    distance: number,
    atmo: TimeAtmosphere
  ): void {
    const step = 96;
    const scroll = (distance * 56) % step;
    const yBase = groundY + 48;

    if (stageId === 3) {
      // Stage 3: Subtle evening cobblestone reflections & warm café sidewalk stone border
      for (let x = -step - scroll; x < w + step; x += step) {
        ctx.fillStyle = 'rgba(255, 214, 146, 0.14)';
        ctx.beginPath();
        ctx.ellipse(x + 28, yBase + 10, 22, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(130, 116, 148, 0.25)';
        ctx.beginPath();
        ctx.roundRect(x + 56, yBase + 4, 28, 8, 3);
        ctx.fill();
      }
      return;
    }

    if (stageId === 2) {
      // Stage 2: Woodland ferns & sunlit golden forest wildflowers
      for (let x = -step - scroll; x < w + step; x += step) {
        ctx.strokeStyle = 'rgba(42, 84, 30, 0.78)';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + 22, yBase + 10);
        ctx.quadraticCurveTo(x + 14, yBase - 4, x + 6, yBase - 12);
        ctx.moveTo(x + 26, yBase + 10);
        ctx.quadraticCurveTo(x + 28, yBase - 6, x + 36, yBase - 13);
        ctx.moveTo(x + 24, yBase + 9);
        ctx.quadraticCurveTo(x + 24, yBase - 3, x + 22, yBase - 15);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(176, 224, 108, 0.48)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 24, yBase + 8);
        ctx.quadraticCurveTo(x + 27, yBase - 3, x + 32, yBase - 10);
        ctx.stroke();

        // Warm buttercup woodland blooms
        ctx.fillStyle = 'rgba(255, 224, 112, 0.88)';
        ctx.beginPath();
        ctx.arc(x + 68, yBase + 14, 3.2, 0, Math.PI * 2);
        ctx.arc(x + 78, yBase + 20, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    // Stage 1: Sunlit meadow grass blades, white clovers & fallen cherry petals
    for (let x = -step - scroll; x < w + step; x += step) {
      ctx.strokeStyle = rgbStr(atmo.grassDeep, 0.72);
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + 20, yBase + 8);
      ctx.quadraticCurveTo(x + 16, yBase - 4, x + 11, yBase - 10);
      ctx.moveTo(x + 24, yBase + 8);
      ctx.quadraticCurveTo(x + 25, yBase - 5, x + 29, yBase - 11);
      ctx.moveTo(x + 28, yBase + 9);
      ctx.quadraticCurveTo(x + 33, yBase - 1, x + 38, yBase - 6);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(218, 242, 152, 0.42)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x + 22, yBase + 7);
      ctx.quadraticCurveTo(x + 20, yBase - 3, x + 17, yBase - 9);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 252, 240, 0.82)';
      ctx.beginPath();
      ctx.arc(x + 68, yBase + 14, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(252, 208, 102, 0.9)';
      ctx.beginPath();
      ctx.arc(x + 68, yBase + 14, 1.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(252, 200, 214, 0.8)';
      ctx.beginPath();
      ctx.ellipse(x + 82, yBase + 22, 3.5, 2, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Soft 3D-lit, outline-free cinematic obstacles harmonizing cleanly with the realistic fluffy puppy.
   */
  private drawObstacle(
    ctx: CanvasRenderingContext2D,
    obs: Obstacle,
    groundY: number,
    elapsed: number
  ): void {
    ctx.save();
    const centerX = obs.x + obs.width * 0.5;
    const baseY = groundY + 9 - obs.y;

    ctx.translate(centerX, baseY - obs.height * 0.5);
    if (obs.bounced) {
      ctx.rotate(obs.bounceRot);
    }

    if (obs.kind === 'puddle') {
      // Glossy sunlit rainwater puddle reflecting blue sky + floating cherry petals
      const rimGrad = ctx.createRadialGradient(0, 4, 6, 0, 4, obs.width * 0.54);
      rimGrad.addColorStop(0, 'rgba(136, 198, 232, 0.92)');
      rimGrad.addColorStop(0.7, 'rgba(88, 152, 196, 0.84)');
      rimGrad.addColorStop(1, 'rgba(72, 114, 146, 0.25)');
      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.ellipse(0, 4, obs.width * 0.55, obs.height * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bright sky specular gleam
      const ripple = Math.sin(elapsed * 4.5 + obs.bobPhase) * 2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.58)';
      ctx.beginPath();
      ctx.ellipse(-9 + ripple * 0.4, 2, 13, 3.2, -0.06, 0, Math.PI * 2);
      ctx.fill();

      // Floating cherry petals
      ctx.fillStyle = '#FBC2D0';
      ctx.beginPath();
      ctx.ellipse(11, 4.5, 4.2, 2.2, 0.35, 0, Math.PI * 2);
      ctx.ellipse(-15, 6, 3.2, 1.8, -0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (obs.kind === 'fence') {
      // Warm sunlit 3D cedar flowerbed fence (no harsh dark outlines!)
      const halfW = obs.width * 0.5;
      const halfH = obs.height * 0.5;

      // Soft ambient occlusion ground shadow
      ctx.fillStyle = 'rgba(42, 34, 22, 0.26)';
      ctx.beginPath();
      ctx.ellipse(2, halfH + 3, halfW + 6, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Back rails
      const railGrad = ctx.createLinearGradient(0, -8, 0, 12);
      railGrad.addColorStop(0, '#D49A64');
      railGrad.addColorStop(1, '#9A6338');
      ctx.fillStyle = railGrad;
      ctx.beginPath();
      ctx.roundRect(-halfW, -7, obs.width, 6, 2);
      ctx.roundRect(-halfW, 6, obs.width, 6, 2);
      ctx.fill();

      // Lit wooden pickets with sunlit top edge
      const posts = [-halfW + 7, 0, halfW - 7];
      for (const px of posts) {
        const pGrad = ctx.createLinearGradient(px - 6, -halfH, px + 6, halfH);
        pGrad.addColorStop(0, '#F0C794');
        pGrad.addColorStop(0.55, '#C98E59');
        pGrad.addColorStop(1, '#8C5932');
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.moveTo(px - 5.5, halfH);
        ctx.lineTo(px - 5.5, -halfH + 8);
        ctx.quadraticCurveTo(px, -halfH - 2, px + 5.5, -halfH + 8);
        ctx.lineTo(px + 5.5, halfH);
        ctx.closePath();
        ctx.fill();

        // Warm rim highlight
        ctx.fillStyle = 'rgba(255, 245, 224, 0.35)';
        ctx.fillRect(px - 4, -halfH + 8, 2, obs.height - 10);
      }

      // Lush sunlit grass & blooms at base
      const bushGrad = ctx.createRadialGradient(-8, halfH - 5, 2, 0, halfH - 2, 18);
      bushGrad.addColorStop(0, '#96D264');
      bushGrad.addColorStop(1, '#4E8A32');
      ctx.fillStyle = bushGrad;
      ctx.beginPath();
      ctx.arc(-11, halfH - 2, 7, Math.PI, 0);
      ctx.arc(11, halfH - 2, 6.5, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = '#FFE484';
      ctx.beginPath();
      ctx.arc(-12, halfH - 7, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FBC2D0';
      ctx.beginPath();
      ctx.arc(11, halfH - 6.5, 2.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (obs.kind === 'sign') {
      // Cozy sculpted cedar park trail sign
      const halfH = obs.height * 0.5;
      ctx.fillStyle = 'rgba(42, 34, 22, 0.24)';
      ctx.beginPath();
      ctx.ellipse(2, halfH + 3, 17, 4.8, 0, 0, Math.PI * 2);
      ctx.fill();

      const postGrad = ctx.createLinearGradient(-4, 0, 4, 0);
      postGrad.addColorStop(0, '#C59062');
      postGrad.addColorStop(1, '#7D512F');
      ctx.fillStyle = postGrad;
      ctx.beginPath();
      ctx.roundRect(-3.8, -2, 7.6, halfH + 3, 2);
      ctx.fill();

      // Beveled wooden sign plaque
      const boardGrad = ctx.createLinearGradient(0, -halfH, 0, -halfH + 26);
      boardGrad.addColorStop(0, '#FFF6E4');
      boardGrad.addColorStop(1, '#E6C99E');
      ctx.fillStyle = boardGrad;
      ctx.beginPath();
      ctx.roundRect(-19, -halfH, 38, 25, 7);
      ctx.fill();

      // Soft warm wood frame trim
      ctx.strokeStyle = 'rgba(146, 98, 56, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Cute coral paw print icon
      ctx.fillStyle = '#E0685A';
      ctx.beginPath();
      ctx.ellipse(0, -halfH + 15.5, 4.6, 3.6, 0, 0, Math.PI * 2);
      ctx.arc(-5.2, -halfH + 9.5, 2, 0, Math.PI * 2);
      ctx.arc(0, -halfH + 8, 2, 0, Math.PI * 2);
      ctx.arc(5.2, -halfH + 9.5, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (obs.kind === 'pigeon') {
      // Soft realistic 3D-shaded park pigeon swooping at head height (duck under!)
      const bob = Math.sin(elapsed * 8.5 + obs.bobPhase) * 3;
      const wingAngle = Math.sin(elapsed * 15.5 + obs.bobPhase) * 0.65;
      ctx.translate(0, bob);

      // Soft shadow on ground
      ctx.fillStyle = 'rgba(42, 34, 22, 0.16)';
      ctx.beginPath();
      ctx.ellipse(0, obs.y + obs.height * 0.5 - bob + 3, 17, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tail feathers
      ctx.fillStyle = '#6E7C8E';
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(25, -4);
      ctx.lineTo(23, 6.5);
      ctx.closePath();
      ctx.fill();

      // Soft shaded body
      const bodyGrad = ctx.createRadialGradient(-5, -4, 2, 0, 2, 18);
      bodyGrad.addColorStop(0, '#EEF2F6');
      bodyGrad.addColorStop(0.6, '#A8B5C4');
      bodyGrad.addColorStop(1, '#6C7A8B');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(0, 2, 16.5, 11, -0.08, 0, Math.PI * 2);
      ctx.fill();

      // Iridescent teal-emerald neck feathers
      const neckGrad = ctx.createRadialGradient(-10, -2, 1, -9, -1, 7);
      neckGrad.addColorStop(0, '#8AD4C2');
      neckGrad.addColorStop(1, '#4C8B7E');
      ctx.fillStyle = neckGrad;
      ctx.beginPath();
      ctx.arc(-9, -1, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // Smooth rounded head
      const headGrad = ctx.createRadialGradient(-15, -7, 1, -14, -5, 8);
      headGrad.addColorStop(0, '#DCE4EC');
      headGrad.addColorStop(1, '#7D8B9C');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.arc(-14, -5, 7.6, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#ED9E4E';
      ctx.beginPath();
      ctx.moveTo(-20.5, -6.5);
      ctx.lineTo(-27.5, -4.2);
      ctx.lineTo(-20.5, -2.2);
      ctx.closePath();
      ctx.fill();

      // Glossy dark eye with catchlight
      ctx.fillStyle = '#1E1A18';
      ctx.beginPath();
      ctx.arc(-16, -6.5, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-16.6, -7.2, 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Flapping wing with sunlit top highlight
      ctx.save();
      ctx.translate(2, -1);
      ctx.rotate(wingAngle);
      const wingGrad = ctx.createLinearGradient(0, -14, 0, 2);
      wingGrad.addColorStop(0, '#F2F6FA');
      wingGrad.addColorStop(1, '#8D9BAE');
      ctx.fillStyle = wingGrad;
      ctx.beginPath();
      ctx.ellipse(3, -8, 12.5, 6.2, -0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (obs.kind === 'branch') {
      // Sunlit realistic cherry-blossom bough dipping gracefully from above (duck under!)
      const sway = Math.sin(elapsed * 3.1 + obs.bobPhase) * 2.2;
      ctx.translate(0, sway);

      // Soft bark bough
      const barkGrad = ctx.createLinearGradient(-20, -40, 20, 10);
      barkGrad.addColorStop(0, '#7B5B44');
      barkGrad.addColorStop(1, '#4E3626');
      ctx.strokeStyle = barkGrad;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(18, -150);
      ctx.quadraticCurveTo(15, -26, 6, 0);
      ctx.lineTo(-22, 6);
      ctx.stroke();

      // Layered sunlit cherry blossom & vibrant green leaf clusters
      const clusters = [
        { x: -16, y: 2, r: 12.5, c0: '#AEE278', c1: '#5C983A' },
        { x: 0, y: -4, r: 14.5, c0: '#98D464', c1: '#4D8630' },
        { x: 14, y: 1, r: 11.5, c0: '#B6E682', c1: '#629E3E' },
        { x: -7, y: 4, r: 10.5, c0: '#FFF0F5', c1: '#F7B4C8' },
        { x: 9, y: -5, r: 10, c0: '#FFF4F7', c1: '#F9C0D2' },
        { x: 2, y: 5, r: 8.5, c0: '#FFFFFF', c1: '#FBCBD9' },
      ];
      for (const cl of clusters) {
        const g = ctx.createRadialGradient(cl.x - 3, cl.y - 3, 1, cl.x, cl.y, cl.r);
        g.addColorStop(0, cl.c0);
        g.addColorStop(1, cl.c1);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cl.x, cl.y, cl.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ground shadow cue
      ctx.fillStyle = 'rgba(42, 34, 22, 0.14)';
      ctx.beginPath();
      ctx.ellipse(0, obs.y + obs.height * 0.5 - sway + 3, 25, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (obs.kind === 'cone') {
      // Cute sunlit tangerine park traffic cone with cream reflective stripes
      const halfH = obs.height * 0.5;
      const halfW = obs.width * 0.5;

      // Ground shadow
      ctx.fillStyle = 'rgba(42, 34, 22, 0.24)';
      ctx.beginPath();
      ctx.ellipse(1.5, halfH + 2.5, halfW + 4, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rounded base plate
      const baseGrad = ctx.createLinearGradient(-halfW, halfH - 5, halfW, halfH + 2);
      baseGrad.addColorStop(0, '#F58C4E');
      baseGrad.addColorStop(1, '#C55526');
      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.roundRect(-halfW + 1, halfH - 6, obs.width - 2, 7, 3);
      ctx.fill();

      // Smooth 3D cone body
      const coneGrad = ctx.createLinearGradient(-12, -halfH, 12, halfH);
      coneGrad.addColorStop(0, '#FFB578');
      coneGrad.addColorStop(0.45, '#F2793B');
      coneGrad.addColorStop(1, '#BE4D20');
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(-halfW + 5, halfH - 4);
      ctx.lineTo(-4, -halfH + 2);
      ctx.quadraticCurveTo(0, -halfH - 2, 4, -halfH + 2);
      ctx.lineTo(halfW - 5, halfH - 4);
      ctx.closePath();
      ctx.fill();

      // Warm ivory reflective stripes
      ctx.fillStyle = 'rgba(255, 250, 240, 0.92)';
      ctx.beginPath();
      ctx.moveTo(-7.2, -3.5);
      ctx.lineTo(7.2, -3.5);
      ctx.lineTo(9.2, 2.2);
      ctx.lineTo(-9.2, 2.2);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-4.8, -11.5);
      ctx.lineTo(4.8, -11.5);
      ctx.lineTo(6.0, -7.5);
      ctx.lineTo(-6.0, -7.5);
      ctx.closePath();
      ctx.fill();

      // Sunlit rim highlight
      ctx.fillStyle = 'rgba(255, 245, 224, 0.32)';
      ctx.beginPath();
      ctx.moveTo(-3.2, -halfH + 4);
      ctx.lineTo(-1, -halfH + 4);
      ctx.lineTo(-6.5, halfH - 5);
      ctx.lineTo(-9.5, halfH - 5);
      ctx.closePath();
      ctx.fill();
    } else if (obs.kind === 'ball') {
      // Playful bouncing striped park rubber ball!
      const r = obs.width * 0.5;
      const shadowScale = Math.max(0.55, 1 - obs.y / 32);

      // Dynamic ground contact shadow underneath the hopping ball
      ctx.fillStyle = `rgba(42, 34, 22, ${0.26 * shadowScale})`;
      ctx.beginPath();
      ctx.ellipse(0, r + obs.y + 3, r * 1.05 * shadowScale, 4.2 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.rotate(-elapsed * 6.8 + obs.bobPhase);

      // Base cream sphere
      const sphereGrad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, 2, 0, 0, r);
      sphereGrad.addColorStop(0, '#FFFDF7');
      sphereGrad.addColorStop(0.7, '#F5E4C8');
      sphereGrad.addColorStop(1, '#CEB48F');
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Clipped vibrant pastel beach-ball stripes
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = '#EF7363';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r + 2, -0.55, 0.55);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#5EB9D6';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r + 2, 1.55, 2.65);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#F6C652';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r + 2, 3.65, 4.75);
      ctx.closePath();
      ctx.fill();

      // Center button
      ctx.fillStyle = '#FFFDF9';
      ctx.beginPath();
      ctx.arc(0, 0, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();

      // Unrotated top-left sunlit glossy highlight + subtle bottom shading
      const gloss = ctx.createRadialGradient(-r * 0.38, -r * 0.38, 1, -r * 0.25, -r * 0.25, r * 0.9);
      gloss.addColorStop(0, 'rgba(255, 255, 255, 0.68)');
      gloss.addColorStop(0.35, 'rgba(255, 255, 255, 0.12)');
      gloss.addColorStop(1, 'rgba(42, 30, 20, 0.14)');
      ctx.fillStyle = gloss;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
    } else if (obs.kind === 'hydrant') {
      // Classic sunlit crimson park fire hydrant (tall crisp jump!)
      const halfH = obs.height * 0.5;

      // Ground shadow
      ctx.fillStyle = 'rgba(42, 34, 22, 0.26)';
      ctx.beginPath();
      ctx.ellipse(2, halfH + 3, 18, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sturdy flared base
      const baseGrad = ctx.createLinearGradient(-15, 0, 15, 0);
      baseGrad.addColorStop(0, '#E9645A');
      baseGrad.addColorStop(0.5, '#C83B33');
      baseGrad.addColorStop(1, '#8D231E');
      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.roundRect(-14, halfH - 8, 28, 9, 3.5);
      ctx.fill();

      // Main cylindrical body
      const bodyGrad = ctx.createLinearGradient(-11, 0, 11, 0);
      bodyGrad.addColorStop(0, '#F57A6E');
      bodyGrad.addColorStop(0.35, '#DC473E');
      bodyGrad.addColorStop(0.8, '#B62F28');
      bodyGrad.addColorStop(1, '#8A201C');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.roundRect(-10.5, -halfH + 11, 21, obs.height - 17, 4);
      ctx.fill();

      // Side nozzle caps with warm brass bolts
      ctx.fillStyle = '#C93A32';
      ctx.beginPath();
      ctx.roundRect(-15.5, -7, 6, 9, 2.5);
      ctx.roundRect(9.5, -7, 6, 9, 2.5);
      ctx.fill();

      ctx.fillStyle = '#F2CA78';
      ctx.beginPath();
      ctx.arc(-13.5, -2.5, 2.2, 0, Math.PI * 2);
      ctx.arc(13.5, -2.5, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Upper collar flange
      ctx.fillStyle = '#E65B51';
      ctx.beginPath();
      ctx.roundRect(-12.5, -halfH + 9, 25, 5, 2.5);
      ctx.fill();

      // Domed cap + top nut
      const domeGrad = ctx.createRadialGradient(-3, -halfH + 6, 1, 0, -halfH + 9, 12);
      domeGrad.addColorStop(0, '#FF9B8E');
      domeGrad.addColorStop(0.65, '#D8443A');
      domeGrad.addColorStop(1, '#9A2520');
      ctx.fillStyle = domeGrad;
      ctx.beginPath();
      ctx.arc(0, -halfH + 10, 9.5, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#F2CA78';
      ctx.beginPath();
      ctx.roundRect(-3, -halfH - 1, 6, 4, 1.5);
      ctx.fill();

      // Center brass badge + specular gleam
      ctx.fillStyle = '#F4D084';
      ctx.beginPath();
      ctx.arc(0, -2.5, 3.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 240, 236, 0.32)';
      ctx.beginPath();
      ctx.roundRect(-7, -halfH + 15, 3.2, obs.height - 26, 1.6);
      ctx.fill();
    } else if (obs.kind === 'skateboard') {
      // Rolling sunlit maple skateboard with spinning mint wheels
      const halfW = obs.width * 0.5;
      const halfH = obs.height * 0.5;

      // Ground shadow
      ctx.fillStyle = 'rgba(42, 34, 22, 0.24)';
      ctx.beginPath();
      ctx.ellipse(1, halfH + 2.5, halfW + 3, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Subtle motion wake streaks on the right
      ctx.strokeStyle = 'rgba(255, 250, 238, 0.55)';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(halfW + 4, -2);
      ctx.lineTo(halfW + 16, -2);
      ctx.moveTo(halfW + 7, 4);
      ctx.lineTo(halfW + 15, 4);
      ctx.stroke();

      // Metal trucks
      ctx.fillStyle = '#7E8A96';
      ctx.fillRect(-15, 1, 6, 5);
      ctx.fillRect(9, 1, 6, 5);

      // Spinning mint wheels
      const wheelSpin = -elapsed * 14 + obs.bobPhase;
      for (const wx of [-12, 12]) {
        ctx.save();
        ctx.translate(wx, halfH - 4.5);
        ctx.rotate(wheelSpin);
        const wGrad = ctx.createRadialGradient(-1.5, -1.5, 1, 0, 0, 5.5);
        wGrad.addColorStop(0, '#9DE7D2');
        wGrad.addColorStop(0.7, '#4EA890');
        wGrad.addColorStop(1, '#317260');
        ctx.fillStyle = wGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 5.4, 0, Math.PI * 2);
        ctx.fill();

        // Hub & spoke dot so spin is visible
        ctx.fillStyle = '#FFFDF7';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2B5B4D';
        ctx.beginPath();
        ctx.arc(2.6, 0, 1.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Curved maple deck with upturned nose & tail
      const deckGrad = ctx.createLinearGradient(0, -6, 0, 3);
      deckGrad.addColorStop(0, '#F5CA8A');
      deckGrad.addColorStop(0.55, '#D4914E');
      deckGrad.addColorStop(1, '#9A5F2C');
      ctx.fillStyle = deckGrad;
      ctx.beginPath();
      ctx.moveTo(-halfW + 1, -6.5);
      ctx.quadraticCurveTo(-halfW + 8, -1.5, -halfW + 14, -1.5);
      ctx.lineTo(halfW - 14, -1.5);
      ctx.quadraticCurveTo(halfW - 8, -1.5, halfW - 1, -6.5);
      ctx.lineTo(halfW, -2.5);
      ctx.quadraticCurveTo(halfW - 7, 2.5, halfW - 14, 2.5);
      ctx.lineTo(-halfW + 14, 2.5);
      ctx.quadraticCurveTo(-halfW + 7, 2.5, -halfW, -2.5);
      ctx.closePath();
      ctx.fill();

      // Coral grip-tape / accent stripe on deck
      ctx.fillStyle = '#E66E5A';
      ctx.beginPath();
      ctx.roundRect(-14, -2.2, 28, 3.2, 1.5);
      ctx.fill();
    } else if (obs.kind === 'balloon') {
      // Glossy floating pastel park balloon at head height (duck under!)
      const sway = Math.sin(elapsed * 3.4 + obs.bobPhase) * 0.08;

      // Ground shadow cue
      ctx.fillStyle = 'rgba(42, 34, 22, 0.13)';
      ctx.beginPath();
      ctx.ellipse(0, obs.y + obs.height * 0.5 + 3, 14, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.rotate(sway);

      // Gently curling cream ribbon below balloon (decorative cue)
      ctx.strokeStyle = 'rgba(255, 246, 232, 0.85)';
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 17);
      ctx.quadraticCurveTo(
        5 + Math.sin(elapsed * 5 + obs.bobPhase) * 3,
        24,
        -2 + Math.cos(elapsed * 4.2 + obs.bobPhase) * 3,
        32
      );
      ctx.stroke();

      // Alternate warm coral-pink and sunny peach-gold palette per balloon
      const isWarmGold = Math.sin(obs.bobPhase * 3) > 0;
      const bGrad = ctx.createRadialGradient(-5, -6, 2, 0, 0, 19);
      if (isWarmGold) {
        bGrad.addColorStop(0, '#FFF5C4');
        bGrad.addColorStop(0.5, '#F8B952');
        bGrad.addColorStop(1, '#D47B2B');
      } else {
        bGrad.addColorStop(0, '#FFD4DC');
        bGrad.addColorStop(0.5, '#F2788C');
        bGrad.addColorStop(1, '#C4455E');
      }
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.ellipse(0, -1, 15.5, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Balloon knot
      ctx.fillStyle = isWarmGold ? '#C97024' : '#B83F56';
      ctx.beginPath();
      ctx.moveTo(-2.8, 16.5);
      ctx.lineTo(2.8, 16.5);
      ctx.lineTo(0, 19.5);
      ctx.closePath();
      ctx.fill();

      // Glossy sunlit specular reflection
      ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
      ctx.beginPath();
      ctx.ellipse(-5.5, -7, 4, 6.8, 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    } else if (obs.kind === 'frisbee') {
      // Fast spinning turquoise & cream park frisbee gliding at head height (duck under!)
      const wobble = Math.sin(elapsed * 14 + obs.bobPhase) * 0.05;

      // Ground shadow cue
      ctx.fillStyle = 'rgba(42, 34, 22, 0.15)';
      ctx.beginPath();
      ctx.ellipse(0, obs.y + obs.height * 0.5 + 3, 21, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Crisp aerodynamic wind streaks trailing behind
      ctx.strokeStyle = 'rgba(255, 253, 246, 0.72)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(22, -3);
      ctx.lineTo(39, -3);
      ctx.moveTo(25, 2.5);
      ctx.lineTo(36, 2.5);
      ctx.stroke();

      ctx.save();
      ctx.rotate(wobble);

      // Underside rim
      ctx.fillStyle = '#2E7D8B';
      ctx.beginPath();
      ctx.ellipse(0, 2.2, 23, 6.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Top saucer dome
      const discGrad = ctx.createLinearGradient(-22, -7, 22, 5);
      discGrad.addColorStop(0, '#A5F0E4');
      discGrad.addColorStop(0.5, '#4CC2B8');
      discGrad.addColorStop(1, '#2D8C8F');
      ctx.fillStyle = discGrad;
      ctx.beginPath();
      ctx.ellipse(0, -0.5, 23, 6.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner warm cream/coral ring
      ctx.strokeStyle = '#FFE8B6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -1, 14.5, 3.6, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Moving specular highlight simulating rapid spin
      const spinX = Math.cos(elapsed * 18 + obs.bobPhase) * 8;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.beginPath();
      ctx.ellipse(spinX, -2.6, 5.5, 1.7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Glossy, sunlit 3D-shaded dog treats (outline-free, appetizing, vibrant readability).
   */
  private drawTreat(
    ctx: CanvasRenderingContext2D,
    treat: Treat,
    groundY: number,
    elapsed: number
  ): void {
    const bob = Math.sin(elapsed * 5 + treat.bobPhase) * 4;
    const x = treat.x;
    const y = groundY + 4 - treat.y + bob;

    ctx.save();
    ctx.translate(x, y);

    // Radiant sunlit glow behind treat for instant visual readability
    const halo = ctx.createRadialGradient(0, 0, 3, 0, 0, treat.radius + 10);
    if (treat.kind === 'jerky') {
      halo.addColorStop(0, 'rgba(255, 226, 118, 0.72)');
      halo.addColorStop(1, 'rgba(255, 226, 118, 0)');
    } else if (treat.kind === 'heartCookie') {
      halo.addColorStop(0, 'rgba(255, 148, 168, 0.68)');
      halo.addColorStop(1, 'rgba(255, 148, 168, 0)');
    } else {
      halo.addColorStop(0, 'rgba(255, 248, 214, 0.78)');
      halo.addColorStop(1, 'rgba(255, 248, 214, 0)');
    }
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, treat.radius + 10, 0, Math.PI * 2);
    ctx.fill();

    if (treat.kind === 'biscuit') {
      // Baked golden bone biscuit with glossy 3D shading
      ctx.rotate(-0.16);
      const grad = ctx.createLinearGradient(-12, -8, 12, 8);
      grad.addColorStop(0, '#FFF0C2');
      grad.addColorStop(0.55, '#F0BE70');
      grad.addColorStop(1, '#C98A3E');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.roundRect(-10, -4.5, 20, 9, 3.5);
      for (const [kx, ky] of [
        [-10, -4],
        [-10, 4],
        [10, -4],
        [10, 4],
      ]) {
        ctx.moveTo(kx + 4.7, ky);
        ctx.arc(kx, ky, 4.7, 0, Math.PI * 2);
      }
      ctx.fill();

      // Top highlight gleam
      ctx.fillStyle = 'rgba(255, 255, 245, 0.55)';
      ctx.beginPath();
      ctx.roundRect(-8, -3.2, 16, 2.5, 1.2);
      ctx.fill();
    } else if (treat.kind === 'sweetpotato') {
      // Glossy honey-roasted sweet potato cube
      ctx.rotate(0.12);
      const grad = ctx.createLinearGradient(-10, -9, 10, 9);
      grad.addColorStop(0, '#FFE48C');
      grad.addColorStop(0.65, '#F2AE3D');
      grad.addColorStop(1, '#C97B22');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(-10, -9, 20, 18, 6);
      ctx.fill();

      const skinGrad = ctx.createLinearGradient(-10, -9, 10, -4);
      skinGrad.addColorStop(0, '#C96682');
      skinGrad.addColorStop(1, '#8D3D58');
      ctx.fillStyle = skinGrad;
      ctx.beginPath();
      ctx.roundRect(-10, -9, 20, 5.5, [6, 6, 1.5, 1.5]);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 245, 0.72)';
      ctx.beginPath();
      ctx.ellipse(-4, 1.5, 3, 2, -0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (treat.kind === 'jerky') {
      // Glowing golden 3D star treat
      const pulse = 1 + Math.sin(elapsed * 7.5 + treat.bobPhase) * 0.08;
      ctx.scale(pulse, pulse);
      ctx.rotate(Math.sin(elapsed * 3 + treat.bobPhase) * 0.14);

      const grad = ctx.createRadialGradient(-3, -4, 2, 0, 0, 15);
      grad.addColorStop(0, '#FFF8C8');
      grad.addColorStop(0.55, '#F9C046');
      grad.addColorStop(1, '#D47B1B');
      ctx.fillStyle = grad;

      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? 14.5 : 7.5;
        const sx = Math.cos(angle) * r;
        const sy = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 250, 0.85)';
      ctx.beginPath();
      ctx.arc(-3, -3.5, 2.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (treat.kind === 'heartCookie') {
      // Glossy 3D strawberry heart cookie
      const pulse = 1 + Math.sin(elapsed * 7) * 0.1;
      ctx.scale(pulse, pulse);
      const grad = ctx.createRadialGradient(-4, -5, 2, 0, 0, 15);
      grad.addColorStop(0, '#FFC0CA');
      grad.addColorStop(0.55, '#EF6478');
      grad.addColorStop(1, '#BA364A');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.bezierCurveTo(-15, 0, -14, -12, -5.8, -12);
      ctx.bezierCurveTo(-1.5, -12, 0, -7, 0, -5);
      ctx.bezierCurveTo(0, -7, 1.5, -12, 5.8, -12);
      ctx.bezierCurveTo(14, -12, 15, 0, 0, 10);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 250, 252, 0.82)';
      ctx.beginPath();
      ctx.ellipse(-4.8, -5.5, 3, 1.8, -0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Radiant golden-ringed collectible Memory Fragment unmistakably distinct from obstacles & treats.
   */
  private drawMemoryItem(
    ctx: CanvasRenderingContext2D,
    mem: ActiveMemoryItem,
    groundY: number,
    elapsed: number
  ): void {
    const def = getMemoryDefinition(mem.fragmentId);
    const bob = Math.sin(elapsed * 3.6 + mem.bobPhase) * 6;
    const pulse = 1 + Math.sin(elapsed * 5.2 + mem.bobPhase) * 0.06;
    const x = mem.x;
    const y = groundY + 4 - mem.y + bob;

    ctx.save();
    ctx.translate(x, y);

    // Warm outer sun-gold radial aura
    const outerGlow = ctx.createRadialGradient(0, 0, 8, 0, 0, 38);
    outerGlow.addColorStop(0, 'rgba(255, 246, 200, 0.92)');
    outerGlow.addColorStop(0.52, 'rgba(249, 204, 102, 0.45)');
    outerGlow.addColorStop(1, 'rgba(249, 204, 102, 0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.fill();

    // Soft rotating starburst rays
    ctx.save();
    ctx.rotate(elapsed * 0.9 + mem.bobPhase);
    ctx.fillStyle = 'rgba(255, 250, 224, 0.55)';
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(2.4, -18);
      ctx.lineTo(-2.4, -18);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Cream-gold circular keepsake medallion backing
    ctx.save();
    ctx.scale(pulse, pulse);

    const medGrad = ctx.createRadialGradient(-5, -6, 3, 0, 0, 21);
    medGrad.addColorStop(0, '#FFFDF7');
    medGrad.addColorStop(0.76, '#FFF3D4');
    medGrad.addColorStop(1, '#F6CE72');
    ctx.fillStyle = medGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 20.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#E6A134';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Inner dashed golden memory ring
    ctx.save();
    ctx.rotate(-elapsed * 0.7);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Handcrafted artwork for each of the 9 stage-specific Memory Fragments
    this.drawMemoryArtwork(ctx, mem.fragmentId);

    ctx.restore();

    // Two small orbiting golden 4-point sparkles
    for (let i = 0; i < 2; i++) {
      const angle = elapsed * 2.6 + mem.bobPhase + i * Math.PI;
      const sx = Math.cos(angle) * 25;
      const sy = Math.sin(angle) * 22;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.fillStyle = i === 0 ? '#FFFDF0' : '#FFD36E';
      ctx.beginPath();
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2;
        ctx.lineTo(Math.cos(a) * 4.5, Math.sin(a) * 4.5);
        ctx.lineTo(Math.cos(a + Math.PI / 4) * 1.6, Math.sin(a + Math.PI / 4) * 1.6);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Crisp miniature label above orb so players recognize it immediately as a special Memory!
    ctx.font = '700 11px "Jua", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = 'rgba(255, 253, 248, 0.95)';
    ctx.strokeText('추억', 0, -28);
    ctx.fillStyle = def.accentColor;
    ctx.fillText('추억', 0, -28);

    ctx.restore();
  }

  private drawMemoryArtwork(
    ctx: CanvasRenderingContext2D,
    id: ActiveMemoryItem['fragmentId']
  ): void {
    if (id === 'pigeonFriend') {
      // Friendly smiling pastel baby pigeon with tiny heart above
      ctx.fillStyle = '#8FBBD1';
      ctx.beginPath();
      ctx.ellipse(1, 3, 10, 7.5, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#D9EDF7';
      ctx.beginPath();
      ctx.ellipse(2, 4, 6.5, 4.5, -0.1, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.fillStyle = '#A8D0E4';
      ctx.beginPath();
      ctx.arc(-6, -4, 5.8, 0, Math.PI * 2);
      ctx.fill();
      // Rosy cheek & smiling eye
      ctx.fillStyle = '#F79FB0';
      ctx.beginPath();
      ctx.arc(-5, -2.2, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3A2C22';
      ctx.beginPath();
      ctx.arc(-7.5, -4.8, 1.2, 0, Math.PI * 2);
      ctx.fill();
      // Beak
      ctx.fillStyle = '#F3A544';
      ctx.beginPath();
      ctx.moveTo(-11, -5);
      ctx.lineTo(-14.5, -3.5);
      ctx.lineTo(-11, -2);
      ctx.closePath();
      ctx.fill();
      // Little mint-teal neck shine & pink heart
      ctx.fillStyle = '#F06A82';
      ctx.beginPath();
      ctx.arc(7, -8, 2.2, 0, Math.PI * 2);
      ctx.arc(9.8, -8, 2.2, 0, Math.PI * 2);
      ctx.lineTo(8.4, -4.5);
      ctx.closePath();
      ctx.fill();
    } else if (id === 'specialStick') {
      // Dog's prized Y-shaped golden-brown treasure twig with two cute green sprouts
      ctx.strokeStyle = '#9C5F30';
      ctx.lineWidth = 4.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-11, 9);
      ctx.lineTo(10, -8);
      ctx.moveTo(-1, 1);
      ctx.lineTo(-4, -10);
      ctx.stroke();

      ctx.strokeStyle = '#D49A60';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-9, 7.5);
      ctx.lineTo(8, -6.5);
      ctx.stroke();

      // Tiny fresh sprout leaves
      ctx.fillStyle = '#7DC456';
      ctx.beginPath();
      ctx.ellipse(-6, -11, 4.2, 2.2, -0.5, 0, Math.PI * 2);
      ctx.ellipse(10.5, -9, 3.6, 2, 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === 'cherryBlossom') {
      // Soft 5-petal pink cherry blossom with golden stamen
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / 5 - Math.PI / 2);
        const pGrad = ctx.createRadialGradient(0, -6, 1, 0, -7, 7);
        pGrad.addColorStop(0, '#FFF5F8');
        pGrad.addColorStop(1, '#F59BB5');
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.ellipse(0, -7.2, 4.4, 6.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#F7C948';
      ctx.beginPath();
      ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === 'leafVine') {
      // Curling crunchy autumn leaf vine (낙엽 덩쿨)
      ctx.strokeStyle = '#7E5434';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-11, 9);
      ctx.bezierCurveTo(-4, 0, 4, 2, 11, -8);
      ctx.stroke();

      const leaves = [
        { x: -7, y: 2, rot: -0.6, color: '#E27A3F' },
        { x: 1, y: 4, rot: 0.5, color: '#F0AE42' },
        { x: 5, y: -5, rot: -0.4, color: '#D45A38' },
        { x: -2, y: -6, rot: -0.9, color: '#8BBF4E' },
      ];
      for (const lf of leaves) {
        ctx.save();
        ctx.translate(lf.x, lf.y);
        ctx.rotate(lf.rot);
        ctx.fillStyle = lf.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 5.5, 3.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else if (id === 'forestAcorn') {
      // Glossy plump woodland acorn
      ctx.rotate(-0.2);
      const nutGrad = ctx.createRadialGradient(-3, 2, 1, 0, 4, 11);
      nutGrad.addColorStop(0, '#E3A45C');
      nutGrad.addColorStop(1, '#985B2A');
      ctx.fillStyle = nutGrad;
      ctx.beginPath();
      ctx.moveTo(-8.5, -1);
      ctx.quadraticCurveTo(-8.5, 11, 0, 12.5);
      ctx.quadraticCurveTo(8.5, 11, 8.5, -1);
      ctx.closePath();
      ctx.fill();

      // Cap
      ctx.fillStyle = '#6E4226';
      ctx.beginPath();
      ctx.ellipse(0, -2.5, 10.2, 5.4, 0, Math.PI, 0);
      ctx.lineTo(10.2, -0.5);
      ctx.quadraticCurveTo(0, 2.5, -10.2, -0.5);
      ctx.closePath();
      ctx.fill();
      // Stem
      ctx.strokeStyle = '#58331C';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -7.5);
      ctx.lineTo(1.5, -12);
      ctx.stroke();
      // Specular gleam
      ctx.fillStyle = 'rgba(255, 250, 232, 0.72)';
      ctx.beginPath();
      ctx.ellipse(-3.5, 4.5, 2, 3.2, -0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === 'pineconeToy') {
      // Layered woodland pinecone with tiny pine sprig
      ctx.strokeStyle = '#4F8442';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(-7, -13);
      ctx.moveTo(0, -9);
      ctx.lineTo(7, -12);
      ctx.stroke();

      const rows = [
        { y: -6, w: 6.5, c: '#A77246' },
        { y: -1, w: 9.5, c: '#8F5B34' },
        { y: 4.5, w: 8.5, c: '#784826' },
        { y: 9.5, w: 5.5, c: '#653A1E' },
      ];
      for (const r of rows) {
        ctx.fillStyle = r.c;
        ctx.beginPath();
        ctx.ellipse(-r.w * 0.4, r.y, r.w * 0.55, 3.6, -0.2, 0, Math.PI * 2);
        ctx.ellipse(r.w * 0.4, r.y, r.w * 0.55, 3.6, 0.2, 0, Math.PI * 2);
        ctx.ellipse(0, r.y + 0.8, r.w * 0.52, 3.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (id === 'puppuccino') {
      // Cute café puppuccino cup with whipped cream swirl & mini bone topper
      ctx.fillStyle = '#E8C59E';
      ctx.beginPath();
      ctx.moveTo(-7.5, 1);
      ctx.lineTo(7.5, 1);
      ctx.lineTo(5.8, 12);
      ctx.lineTo(-5.8, 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#C87846';
      ctx.fillRect(-6.8, 4.5, 13.6, 3.8);
      // Fluffy cream cloud
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-4.5, -1, 4.8, 0, Math.PI * 2);
      ctx.arc(4.5, -1, 4.8, 0, Math.PI * 2);
      ctx.arc(0, -5, 5.4, 0, Math.PI * 2);
      ctx.fill();
      // Tiny golden biscuit dot on top
      ctx.fillStyle = '#E8A84C';
      ctx.beginPath();
      ctx.roundRect(-3.8, -10.5, 7.6, 3.2, 1.5);
      ctx.fill();
    } else if (id === 'warmBulb') {
      // Cozy evening café glowing string-light bulb
      ctx.fillStyle = '#7A685B';
      ctx.beginPath();
      ctx.roundRect(-3.8, -11.5, 7.6, 4.5, 1.6);
      ctx.fill();
      const bGrad = ctx.createRadialGradient(-2, 0, 1.5, 0, 2, 11);
      bGrad.addColorStop(0, '#FFFDF0');
      bGrad.addColorStop(0.55, '#FFE066');
      bGrad.addColorStop(1, '#E89B24');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(0, 2.5, 9.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#C97818';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-2.5, -6);
      ctx.lineTo(-1.5, 1.5);
      ctx.lineTo(1.5, 1.5);
      ctx.lineTo(2.5, -6);
      ctx.stroke();
    } else if (id === 'terraceBall') {
      // Playful yellow-mint striped park ball with cute paw star
      const ballGrad = ctx.createRadialGradient(-3.5, -3.5, 1.5, 0, 0, 11);
      ballGrad.addColorStop(0, '#FFF3A8');
      ballGrad.addColorStop(0.65, '#F5C442');
      ballGrad.addColorStop(1, '#D48F1E');
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#4E9A84';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 10.5, -0.5, 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 10.5, Math.PI - 0.5, Math.PI + 0.9);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.beginPath();
      ctx.ellipse(-3.8, -4.2, 2.8, 1.8, -0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Renders the selected 3D plush puppy character (땡콩이 or 나리) with 4-frame lively
   * galloping stride alternation, jump leap pose, and low agile ducking pose!
   */
  private drawCharacterSprite(
    ctx: CanvasRenderingContext2D,
    p: PomeranianState,
    groundY: number,
    isFever: boolean,
    elapsed: number,
    sprites: GameSprites,
    characterId: CharacterId
  ): void {
    const px = p.x;
    const py = groundY + 11 - p.y;

    // Soft realistic sunlit contact shadow on stone path
    const shadowScale = Math.max(0.32, 1 - p.y / 170);
    ctx.fillStyle = 'rgba(46, 36, 24, 0.28)';
    ctx.beginPath();
    ctx.ellipse(px, groundY + 11, 29 * shadowScale, 6.2 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(px, py);

    // Invincible blink feedback
    if (p.invincibleTimer > 0 && Math.floor(elapsed * 15) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Golden sunlit Fever aura
    if (isFever) {
      const auraGrad = ctx.createRadialGradient(0, -30, 10, 0, -30, 60);
      auraGrad.addColorStop(0, 'rgba(255, 230, 128, 0.72)');
      auraGrad.addColorStop(0.55, 'rgba(252, 188, 88, 0.28)');
      auraGrad.addColorStop(1, 'rgba(252, 188, 88, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, -30, 60, 0, Math.PI * 2);
      ctx.fill();
    }

    const duck = p.isDucking && p.isGrounded;
    const airborne = !p.isGrounded;

    const charSprites =
      sprites.characters[characterId]?.runFrames.length > 0
        ? sprites.characters[characterId]
        : sprites.characters.ddaengkong;

    // Smooth 4-frame cycle: [Run1 (extended) -> Run2 (gathered) -> Run3 (mid-trot) -> Run4 (landing)]
    const runCount = charSprites.runFrames.length;
    const cyclePhase = (((p.runCycle / (Math.PI * 2)) % 1) + 1) % 1;
    const runIdx = runCount > 0 ? Math.floor(cyclePhase * runCount) % runCount : 0;
    const runFrame = runCount > 0 ? charSprites.runFrames[runIdx] : null;

    const chosenSprite = duck
      ? charSprites.duck ?? runFrame
      : airborne
        ? charSprites.jump ?? runFrame
        : runFrame;

    // Subtle organic bounce & playful tilt complementing the 4-frame stride + wagging tail
    const trotBob = !airborne && !duck ? Math.abs(Math.sin(p.runCycle)) * 5.2 : 0;
    const trotRock = !airborne && !duck ? Math.sin(p.runCycle) * 0.042 : 0;
    const jumpPitch = airborne ? Math.max(-0.2, Math.min(0.2, -p.vy * 0.0003)) : 0;
    const duckStretchX = duck ? 1.03 + Math.sin(elapsed * 16) * 0.018 : 1;
    const duckStretchY = duck ? 0.97 - Math.sin(elapsed * 16) * 0.018 : 1;

    ctx.translate(0, -trotBob);
    ctx.rotate(trotRock + jumpPitch);
    ctx.scale(p.scaleX * duckStretchX, p.scaleY * duckStretchY);

    if (chosenSprite) {
      // Scale relative to the full source square canvas (heightRatio) so head/body stays
      // rock-steady across all 4 frames while legs tuck/extend and the fluffy tail wags!
      const referenceCanvasHeight = duck ? 88 : 96;
      const drawH = duck
        ? Math.max(44, Math.min(54, referenceCanvasHeight * chosenSprite.heightRatio))
        : Math.max(62, Math.min(78, referenceCanvasHeight * chosenSprite.heightRatio));
      const drawW = drawH * chosenSprite.aspect;

      ctx.drawImage(chosenSprite.canvas, -drawW * 0.5, -drawH + 2, drawW, drawH);

      if (p.hurtFlashTimer > 0) {
        ctx.fillStyle = 'rgba(232, 92, 82, 0.22)';
        ctx.beginPath();
        ctx.ellipse(0, -drawH * 0.48, drawW * 0.4, drawH * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = characterId === 'nari' ? '#3B3B40' : '#D99E64';
      ctx.beginPath();
      ctx.ellipse(0, duck ? -16 : -28, 26, duck ? 15 : 22, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawParticles(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    groundY: number
  ): void {
    for (const pt of particles) {
      const ratio = Math.max(0, pt.life / pt.maxLife);
      const y = groundY + 8 - pt.y;
      ctx.save();
      ctx.translate(pt.x, y);
      ctx.rotate(pt.rotation);
      ctx.globalAlpha = pt.alpha * ratio;
      ctx.fillStyle = pt.color;

      if (pt.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, pt.size * (0.5 + ratio * 0.5), 0, Math.PI * 2);
        ctx.fill();
      } else if (pt.shape === 'petal') {
        ctx.beginPath();
        ctx.ellipse(0, 0, pt.size * 1.25, pt.size * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (pt.shape === 'leaf') {
        const s = pt.size;
        ctx.beginPath();
        ctx.moveTo(-s * 1.35, 0);
        ctx.quadraticCurveTo(0, -s * 0.95, s * 1.35, 0);
        ctx.quadraticCurveTo(0, s * 0.95, -s * 1.35, 0);
        ctx.closePath();
        ctx.fill();
      } else if (pt.shape === 'firefly') {
        const s = pt.size;
        const glow = ctx.createRadialGradient(0, 0, 0.5, 0, 0, s * 3.4);
        glow.addColorStop(0, 'rgba(255, 245, 204, 0.95)');
        glow.addColorStop(0.45, 'rgba(255, 214, 128, 0.42)');
        glow.addColorStop(1, 'rgba(255, 214, 128, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, s * 3.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.72, 0, Math.PI * 2);
        ctx.fill();
      } else if (pt.shape === 'star') {
        const s = pt.size;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2;
          ctx.lineTo(Math.cos(angle) * s * 1.45, Math.sin(angle) * s * 1.45);
          ctx.lineTo(Math.cos(angle + Math.PI / 4) * s * 0.45, Math.sin(angle + Math.PI / 4) * s * 0.45);
        }
        ctx.closePath();
        ctx.fill();
      } else if (pt.shape === 'heart') {
        const s = pt.size * 0.72;
        ctx.beginPath();
        ctx.moveTo(0, s);
        ctx.bezierCurveTo(-s * 1.5, 0, -s * 1.4, -s * 1.2, -s * 0.6, -s * 1.2);
        ctx.bezierCurveTo(-s * 0.1, -s * 1.2, 0, -s * 0.7, 0, -s * 0.5);
        ctx.bezierCurveTo(0, -s * 0.7, s * 0.1, -s * 1.2, s * 0.6, -s * 1.2);
        ctx.bezierCurveTo(s * 1.4, -s * 1.2, s * 1.5, 0, 0, s);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawFloatingTexts(
    ctx: CanvasRenderingContext2D,
    texts: FloatingText[],
    groundY: number
  ): void {
    for (const ft of texts) {
      const ratio = Math.max(0, ft.life / ft.maxLife);
      const y = groundY + 4 - ft.y;
      ctx.save();
      ctx.translate(ft.x, y);
      ctx.scale(ft.scale, ft.scale);
      ctx.globalAlpha = Math.min(1, ratio * 1.45);
      ctx.font = '700 17px "Jua", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255, 253, 248, 0.96)';
      ctx.strokeText(ft.text, 0, 0);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, 0, 0);
      ctx.restore();
    }
  }

  private drawSunlightBokeh(
    ctx: CanvasRenderingContext2D,
    stageId: StageId,
    w: number,
    groundY: number,
    elapsed: number,
    atmo: TimeAtmosphere
  ): void {
    const bokehColor =
      stageId === 3
        ? { r: 255, g: 214, b: 138 }
        : stageId === 2
          ? { r: 245, g: 238, b: 174 }
          : atmo.sunGlow;
    for (const m of this.bokehMotes) {
      const mx = ((m.xRatio * w - elapsed * 8) % w + w) % w;
      const my = m.yRatio * groundY + Math.sin(elapsed * 1.2 + m.phase) * 8;
      const baseAlpha = stageId === 3 ? 0.11 : 0.08;
      const pulse = baseAlpha + 0.07 * Math.sin(elapsed * 1.8 + m.phase);
      ctx.fillStyle = rgbStr(bokehColor, pulse);
      ctx.beginPath();
      ctx.arc(mx, my, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawFeverVignette(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    elapsed: number,
    feverRemaining: number
  ): void {
    const pulse = 0.22 + 0.08 * Math.sin(elapsed * 8.5);
    const fade = Math.min(1, feverRemaining / 1.2);
    const alpha = pulse * fade;

    const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.36, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
    grad.addColorStop(0, 'rgba(255, 222, 118, 0)');
    grad.addColorStop(1, `rgba(246, 178, 66, ${alpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
}
