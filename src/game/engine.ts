import { SoundEngine } from './audio';
import { DEFAULT_CHARACTER_ID, getCharacterDefinition } from './characters';
import { getMemoryDefinition, getStageMemories } from './memories';
import { WatercolorRenderer } from './renderer';
import { createEmptyGameSprites, loadGameSprites, type GameSprites } from './sprites';
import { getStageDefinition, type WeightedObstacle } from './stages';
import type {
  ActiveMemoryItem,
  CharacterId,
  Cloud,
  FloatingText,
  GameState,
  GameSummary,
  HudSnapshot,
  MemoryFragmentDefinition,
  MemoryFragmentId,
  Obstacle,
  ObstacleKind,
  Particle,
  PomeranianState,
  SceneryProp,
  StageId,
  TimeOfDayPhase,
  Treat,
  TreatKind,
  VisualStageId,
  WalkOutcome,
} from './types';

export interface EngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onGameOver: (summary: GameSummary) => void;
}

const OBSTACLE_SPECS: Record<
  ObstacleKind,
  { w: number; h: number; y: number; isAir: boolean; speedMult: number }
> = {
  puddle: { w: 54, h: 14, y: 0, isAir: false, speedMult: 1.0 },
  cone: { w: 34, h: 34, y: 0, isAir: false, speedMult: 1.0 },
  fence: { w: 46, h: 40, y: 0, isAir: false, speedMult: 1.0 },
  sign: { w: 38, h: 46, y: 0, isAir: false, speedMult: 1.0 },
  ball: { w: 30, h: 30, y: 0, isAir: false, speedMult: 1.14 },
  hydrant: { w: 34, h: 48, y: 0, isAir: false, speedMult: 1.0 },
  skateboard: { w: 54, h: 22, y: 0, isAir: false, speedMult: 1.38 },
  branch: { w: 60, h: 30, y: 35, isAir: true, speedMult: 1.0 },
  pigeon: { w: 46, h: 28, y: 35, isAir: true, speedMult: 1.18 },
  balloon: { w: 36, h: 38, y: 36, isAir: true, speedMult: 0.98 },
  frisbee: { w: 48, h: 18, y: 36, isAir: true, speedMult: 1.35 },
};

const MAX_HEARTS = 3;
const FEVER_DURATION = 4.5;
const JUMP_VELOCITY = 585;
const GRAVITY = 1520;
const FAST_FALL_MULT = 2.6;
const COYOTE_TIME = 0.11;
const JUMP_BUFFER_TIME = 0.14;

const TIME_PHASE_LABELS: Record<TimeOfDayPhase, string> = {
  morning: '아침 햇살',
  afternoon: '오후 햇살',
  sunset: '노을빛',
  evening: '저녁 불빛',
};

export class PomeWalkEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: WatercolorRenderer;
  private sound: SoundEngine;
  private callbacks: EngineCallbacks;
  private sprites: GameSprites = createEmptyGameSprites();

  private rafId: number | null = null;
  private lastTimestamp = 0;
  private gameState: GameState = 'TITLE_MENU';

  private worldWidth = 560;
  private worldHeight = 420;
  private groundY = 310;
  private dpr = 1;
  private scale = 1;

  private elapsed = 0;
  private distance = 0;
  private score = 0;
  private bestScore = 0;
  private bestDistance = 0;
  private hearts = MAX_HEARTS;
  private combo = 0;
  private maxCombo = 0;
  private treatsCollected = 0;
  private feverGauge = 0;
  private isFever = false;
  private feverRemaining = 0;
  private stageId: StageId = 1;
  private characterId: CharacterId = DEFAULT_CHARACTER_ID;
  private speed = getStageDefinition(1).baseSpeed;

  private shakeTimer = 0;
  private shakeIntensity = 0;

  private jumpHeld = false;
  private duckHeld = false;

  private nextEntityId = 1;
  private player: PomeranianState;
  private obstacles: Obstacle[] = [];
  private treats: Treat[] = [];
  private activeMemories: ActiveMemoryItem[] = [];
  private pendingMemories: MemoryFragmentDefinition[] = [];
  private collectedMemoryIds: MemoryFragmentId[] = [];
  private memoryBonusTotal = 0;
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private scenery: SceneryProp[] = [];
  private clouds: Cloud[] = [];

  private nextObstacleTimer = 1.65;
  private nextTreatTimer = 0.7;
  private petalTimer = 0.25;
  private hudThrottleTimer = 0;
  private lastObstacleKind: ObstacleKind | null = null;
  private lastHeartSpawnDist = -999;
  private heartsSpawnedInRun = 0;
  private lastEndlessZone = 0;
  private nextEndlessMilestone = 250;

  constructor(
    canvas: HTMLCanvasElement,
    sound: SoundEngine,
    callbacks: EngineCallbacks,
    initialBestScore: number,
    initialBestDistance: number,
    initialStage: StageId = 1,
    initialCharacter: CharacterId = DEFAULT_CHARACTER_ID
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('2D Canvas context unavailable');
    }
    this.ctx = context;
    this.renderer = new WatercolorRenderer();
    this.sound = sound;
    this.callbacks = callbacks;
    this.bestScore = initialBestScore;
    this.bestDistance = initialBestDistance;
    this.stageId = initialStage;
    this.characterId = initialCharacter;
    this.speed = getStageDefinition(initialStage).baseSpeed;

    this.player = this.createInitialPlayer();
    this.resize();
    this.initScenery();
    this.emitHud();

    void loadGameSprites().then((loaded) => {
      this.sprites = loaded;
    });
  }

  public setCharacter(characterId: CharacterId): void {
    this.characterId = characterId;
  }

  public setStage(stageId: StageId): void {
    this.stageId = stageId;
    if (this.gameState !== 'PLAYING') {
      this.speed = getStageDefinition(stageId).baseSpeed;
      // Clear previous stage ambient particles so the new stage atmosphere previews cleanly
      this.particles = [];
      this.petalTimer = 0.05;
    }
    this.emitHud();
  }

  private createInitialPlayer(): PomeranianState {
    return {
      x: Math.min(130, this.worldWidth * 0.21),
      y: 0,
      vy: 0,
      isGrounded: true,
      isDucking: false,
      invincibleTimer: 0,
      hurtFlashTimer: 0,
      runCycle: 0,
      scaleX: 1,
      scaleY: 1,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      tailWag: 0,
    };
  }

  public resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const cssW = Math.max(300, this.canvas.clientWidth || rect.width || window.innerWidth);
    const cssH = Math.max(240, this.canvas.clientHeight || rect.height || window.innerHeight);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.round(cssW * this.dpr);
    this.canvas.height = Math.round(cssH * this.dpr);

    const isLandscape = cssW >= cssH;
    // Wide horizontal lookahead on mobile landscape & crisp proportions on desktop
    this.scale = isLandscape
      ? Math.min(cssW / 640, cssH / 355)
      : Math.min(cssW / 540, cssH / 380);
    this.worldWidth = cssW / this.scale;
    this.worldHeight = cssH / this.scale;

    // Position the walkway cleanly above floating thumb pads while preserving tall jump headroom
    const isShortLandscape = isLandscape && cssH <= 500;
    const bottomReserve = isShortLandscape
      ? Math.min(104, Math.max(84, this.worldHeight * 0.24))
      : isLandscape
        ? Math.min(128, Math.max(102, this.worldHeight * 0.27))
        : Math.min(220, Math.max(150, this.worldHeight * 0.24));

    this.groundY = this.worldHeight - bottomReserve;
    this.player.x = isLandscape
      ? Math.min(156, Math.max(106, this.worldWidth * 0.19))
      : Math.min(142, Math.max(92, this.worldWidth * 0.21));
  }

  public startLoop(): void {
    if (this.rafId !== null) return;
    this.lastTimestamp = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTimestamp) / 1000));
      this.lastTimestamp = now;
      this.update(dt);
      this.render();
      this.rafId = window.requestAnimationFrame(tick);
    };
    this.rafId = window.requestAnimationFrame(tick);
  }

  public destroy(): void {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public setState(nextState: GameState): void {
    this.gameState = nextState;
    if (nextState !== 'PLAYING') {
      this.jumpHeld = false;
      this.duckHeld = false;
    }
  }

  public startNewRun(stageOverride?: StageId): void {
    this.sound.unlock();
    if (stageOverride) {
      this.stageId = stageOverride;
    }
    this.distance = 0;
    this.score = 0;
    this.hearts = MAX_HEARTS;
    this.combo = 0;
    this.maxCombo = 0;
    this.treatsCollected = 0;
    this.feverGauge = 0;
    this.isFever = false;
    this.feverRemaining = 0;
    const cfg = getStageDefinition(this.stageId);
    this.speed = cfg.baseSpeed;
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.jumpHeld = false;
    this.duckHeld = false;

    this.player = this.createInitialPlayer();
    this.obstacles = [];
    this.treats = [];
    this.activeMemories = [];
    this.pendingMemories = [...getStageMemories(this.stageId)];
    this.collectedMemoryIds = [];
    this.memoryBonusTotal = 0;
    this.particles = [];
    this.floatingTexts = [];
    this.nextObstacleTimer = this.stageId === 1 ? 1.55 : this.stageId === 2 ? 1.05 : 0.82;
    this.nextTreatTimer = 0.55;
    this.lastObstacleKind = null;
    this.lastHeartSpawnDist = -999;
    this.heartsSpawnedInRun = 0;
    this.lastEndlessZone = 0;
    this.nextEndlessMilestone = 250;
    this.gameState = 'PLAYING';
    this.emitHud();
  }

  public triggerJumpPress(): void {
    this.sound.unlock();
    if (this.gameState !== 'PLAYING') return;
    this.jumpHeld = true;
    this.player.jumpBufferTimer = JUMP_BUFFER_TIME;
    this.tryExecuteJump();
  }

  public triggerJumpRelease(): void {
    this.jumpHeld = false;
    if (this.gameState === 'PLAYING' && this.player.vy > 210) {
      this.player.vy *= 0.56;
    }
  }

  public setDucking(active: boolean): void {
    this.sound.unlock();
    if (this.gameState !== 'PLAYING') {
      this.duckHeld = false;
      return;
    }
    if (active && !this.duckHeld) {
      this.sound.playDuck();
      if (this.player.isGrounded) {
        this.player.scaleX = 1.16;
        this.player.scaleY = 0.8;
      }
    }
    this.duckHeld = active;
  }

  private tryExecuteJump(): void {
    const canJump = this.player.isGrounded || this.player.coyoteTimer > 0;
    if (!canJump) return;

    const { traits } = getCharacterDefinition(this.characterId);
    this.duckHeld = false;
    this.player.vy = JUMP_VELOCITY * traits.jumpMult;
    this.player.isGrounded = false;
    this.player.isDucking = false;
    this.player.coyoteTimer = 0;
    this.player.jumpBufferTimer = 0;
    this.player.scaleX = 0.88;
    this.player.scaleY = 1.16;
    this.sound.playJump();
    this.spawnDustBurst(this.player.x - 6, 2, 6);
  }

  private initScenery(): void {
    this.clouds = [];
    this.scenery = [];
    // Evenly spaced vintage park streetlamps along the walkway for cozy sunset/evening glow
    for (let x = 140; x < 1260; x += 280) {
      this.scenery.push({
        x,
        layer: 'mid',
        kind: 'lamp',
        scale: 0.92,
        seed: x * 0.13,
      });
    }
  }

  private update(dt: number): void {
    this.elapsed += dt;

    if (this.gameState === 'PAUSED') {
      return;
    }

    if (this.gameState !== 'PLAYING') {
      if (this.gameState === 'TITLE_MENU') {
        const idleSpeed = 68;
        this.distance += (idleSpeed * dt) / 36;
        this.player.runCycle += dt * 7.8;
        this.player.tailWag += dt * 9;
        this.updateScenery(dt, idleSpeed);
        this.updateAmbientPetals(dt, idleSpeed);
        this.updateParticles(dt, idleSpeed);
      } else {
        // On GAME_OVER, gently animate floating petals & celebration particles without moving distance
        this.player.tailWag += dt * 7;
        this.updateAmbientPetals(dt, 24);
        this.updateParticles(dt, 18);
        this.updateFloatingTexts(dt);
      }
      return;
    }

    const cfg = getStageDefinition(this.stageId);
    let targetSpeed: number;
    if (cfg.isEndless) {
      // Relentless asymptotic acceleration that keeps climbing past 1,000m+
      const endlessCurve = 1 - Math.exp(-this.distance / 950);
      targetSpeed = cfg.baseSpeed + (cfg.maxSpeed - cfg.baseSpeed) * endlessCurve;
    } else {
      const progressRatio = Math.min(1, this.distance / cfg.rampDistance);
      // Stage 1 stays gentle; Stages 2 & 3 ramp briskly from early-mid run
      const easedProgress =
        this.stageId === 1
          ? progressRatio * progressRatio * (3 - 2 * progressRatio)
          : Math.pow(progressRatio, 0.85);
      targetSpeed = cfg.baseSpeed + (cfg.maxSpeed - cfg.baseSpeed) * easedProgress;
    }
    const feverBoost = this.isFever ? cfg.feverBoost : 1.0;
    this.speed = targetSpeed * feverBoost;

    const distDelta = (this.speed * dt) / 34;
    this.distance += distDelta;
    this.score += distDelta * (this.isFever ? 2.4 : 1.2);

    if (cfg.isEndless) {
      const currentZone = Math.floor(this.distance / 400);
      if (currentZone > this.lastEndlessZone) {
        this.lastEndlessZone = currentZone;
        const zoneStage = getStageDefinition(this.getVisualStageId());
        this.sound.playMemoryCollect();
        this.spawnSparkleBurst(this.player.x + 12, this.player.y + 42, '#F5B841', 12);
        this.floatingTexts.push({
          x: Math.max(120, Math.min(this.worldWidth - 120, this.player.x + 48)),
          y: this.player.y + 82,
          vy: 34,
          text: `구역 ${currentZone + 1} · ${zoneStage.name} 돌입!`,
          color: '#3F6B58',
          life: 1.5,
          maxLife: 1.5,
          scale: 1.15,
        });
      }

      if (this.distance >= this.nextEndlessMilestone) {
        const milestone = this.nextEndlessMilestone;
        const milestoneIndex = Math.round(milestone / 250);
        const bonus = 100 + milestoneIndex * 50;
        this.score += bonus;
        this.nextEndlessMilestone += 250;
        this.sound.playFeverStart();
        this.spawnSparkleBurst(this.player.x + 10, this.player.y + 38, '#F5B841', 14);
        this.floatingTexts.push({
          x: Math.max(110, Math.min(this.worldWidth - 110, this.player.x + 32)),
          y: this.player.y + 62,
          vy: 38,
          text: `${milestone}m 돌파! +${bonus}`,
          color: '#C86D14',
          life: 1.35,
          maxLife: 1.35,
          scale: 1.16,
        });
      }
    } else if (this.distance >= cfg.goalDistance) {
      // Completed the full walk to return home happily!
      this.distance = cfg.goalDistance;
      const completionBonus = 300 + this.hearts * 100;
      this.score += completionBonus;
      this.sound.playWalkComplete();
      this.spawnSparkleBurst(this.player.x + 10, this.player.y + 38, '#F5B841', 18);
      this.spawnHeartBurst(this.player.x + 14, this.player.y + 52);
      this.floatingTexts.push({
        x: this.player.x + 18,
        y: this.player.y + 72,
        vy: 36,
        text: `산책 완주! +${completionBonus}`,
        color: '#C86D14',
        life: 1.4,
        maxLife: 1.4,
        scale: 1.18,
      });
      this.finishRun('completed', completionBonus);
      return;
    }

    if (this.isFever) {
      const feverDuration = getCharacterDefinition(this.characterId).traits.feverDuration || FEVER_DURATION;
      this.feverRemaining -= dt;
      this.feverGauge = Math.max(0, (this.feverRemaining / feverDuration) * 100);
      if (Math.random() < dt * 26) {
        const feverColors = ['#F9CF5A', '#F6A578', '#F6A4B8', '#9BD3BA'];
        this.particles.push({
          x: this.player.x - 18 + (Math.random() - 0.5) * 14,
          y: this.player.y + 14 + Math.random() * 28,
          vx: -this.speed * 0.26 - Math.random() * 40,
          vy: (Math.random() - 0.5) * 45,
          size: 3.6 + Math.random() * 2.4,
          color: feverColors[Math.floor(Math.random() * feverColors.length)],
          alpha: 0.92,
          life: 0.46,
          maxLife: 0.46,
          shape: 'star',
          rotation: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 6,
        });
      }
      if (this.feverRemaining <= 0) {
        this.isFever = false;
        this.feverRemaining = 0;
        this.feverGauge = 0;
        this.player.invincibleTimer = Math.max(this.player.invincibleTimer, 0.55);
      }
    }

    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dt);
    }

    this.updatePlayer(dt);
    this.updateScenery(dt, this.speed);
    this.updateAmbientPetals(dt, this.speed);
    this.updateSpawners(dt);
    this.updateObstacles(dt);
    this.updateTreats(dt);
    this.updateMemories(dt);
    this.updateParticles(dt, this.speed);
    this.updateFloatingTexts(dt);

    this.hudThrottleTimer += dt;
    if (this.hudThrottleTimer >= 0.055) {
      this.hudThrottleTimer = 0;
      this.emitHud();
    }
  }

  private updatePlayer(dt: number): void {
    const p = this.player;

    if (p.invincibleTimer > 0) p.invincibleTimer = Math.max(0, p.invincibleTimer - dt);
    if (p.hurtFlashTimer > 0) p.hurtFlashTimer = Math.max(0, p.hurtFlashTimer - dt);
    if (p.coyoteTimer > 0) p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
    if (p.jumpBufferTimer > 0) p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt);

    p.scaleX += (1 - p.scaleX) * Math.min(1, dt * 14);
    p.scaleY += (1 - p.scaleY) * Math.min(1, dt * 14);
    p.tailWag += dt * (this.isFever ? 20 : 13);

    if (p.isGrounded) {
      p.isDucking = this.duckHeld;
      p.coyoteTimer = COYOTE_TIME;
      // 4-frame stride + tail-wag cadence matched smoothly to comfortable walking pace
      p.runCycle += dt * (this.speed / 25);

      if (Math.random() < dt * (p.isDucking ? 12 : 7)) {
        this.particles.push({
          x: p.x - 18,
          y: 2,
          vx: -this.speed * 0.25,
          vy: 12 + Math.random() * 18,
          size: 3 + Math.random() * 2.5,
          color: 'rgba(232, 214, 188, 0.85)',
          alpha: 0.6,
          life: 0.34,
          maxLife: 0.34,
          shape: 'circle',
          rotation: 0,
          vRot: 0,
        });
      }

      // Soft watercolor flutter wisps near Ddaengkong-i's wagging fluffy tail!
      if (!p.isDucking && Math.random() < dt * (this.isFever ? 11 : 4.2)) {
        const tailWave = Math.sin(p.runCycle * 2);
        this.particles.push({
          x: p.x - 24 + (Math.random() - 0.5) * 6,
          y: 44 + tailWave * 5,
          vx: -this.speed * 0.22 - Math.random() * 24,
          vy: 14 + tailWave * 16,
          size: this.isFever ? 3.2 : 2.6,
          color: this.isFever ? '#FBD66B' : '#FFF4E0',
          alpha: 0.72,
          life: 0.38,
          maxLife: 0.38,
          shape: this.isFever ? 'star' : 'circle',
          rotation: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 4,
        });
      }

      if (p.jumpBufferTimer > 0) {
        this.tryExecuteJump();
      }
    } else {
      const grav = this.duckHeld ? GRAVITY * FAST_FALL_MULT : GRAVITY;
      p.vy -= grav * dt;
      p.y += p.vy * dt;

      if (p.y <= 0) {
        p.y = 0;
        p.vy = 0;
        p.isGrounded = true;
        p.isDucking = this.duckHeld;
        p.scaleX = 1.16;
        p.scaleY = 0.85;
        this.spawnDustBurst(p.x - 4, 2, 5);
        if (p.jumpBufferTimer > 0) {
          this.tryExecuteJump();
        }
      }
    }
  }

  private updateScenery(dt: number, moveSpeed: number): void {
    for (const prop of this.scenery) {
      prop.x -= moveSpeed * 0.45 * dt;
      if (prop.x < -80) {
        let maxX = this.worldWidth;
        for (const other of this.scenery) {
          if (other.x > maxX) maxX = other.x;
        }
        prop.x = maxX + 260 + Math.random() * 90;
      }
    }
  }

  private getVisualStageId(): VisualStageId {
    if (this.stageId !== 4) {
      return this.stageId;
    }
    const zoneIndex = Math.floor(this.distance / 400);
    return (((zoneIndex % 3) + 1) as VisualStageId);
  }

  private updateAmbientPetals(dt: number, moveSpeed: number): void {
    const visualStage = this.getVisualStageId();
    this.petalTimer -= dt;
    if (this.petalTimer <= 0) {
      this.petalTimer =
        visualStage === 3 ? 0.34 + Math.random() * 0.48 : 0.28 + Math.random() * 0.45;
      if (this.particles.length < 75) {
        if (visualStage === 2) {
          // Sunlit green & golden woodland leaves
          const leafColors = ['#8EC85B', '#A9DB72', '#E8C568', '#6EB04A'];
          this.particles.push({
            x: this.worldWidth + 15,
            y: 120 + Math.random() * Math.max(120, this.groundY - 120),
            vx: -moveSpeed * 0.28 - Math.random() * 32,
            vy: -14 - Math.random() * 16,
            size: 3.8 + Math.random() * 2.2,
            color: leafColors[Math.floor(Math.random() * leafColors.length)],
            alpha: 0.86,
            life: 4.0,
            maxLife: 4.0,
            shape: 'leaf',
            rotation: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 3.0,
          });
        } else if (visualStage === 3) {
          // Cozy glowing warm golden café fairy-light motes
          this.particles.push({
            x: this.worldWidth + 12,
            y: 44 + Math.random() * Math.max(120, this.groundY - 64),
            vx: -moveSpeed * 0.22 - Math.random() * 18,
            vy: (Math.random() - 0.5) * 14,
            size: 2.6 + Math.random() * 2.2,
            color: Math.random() < 0.72 ? '#FFE79A' : '#FFD08A',
            alpha: 0.9,
            life: 4.2,
            maxLife: 4.2,
            shape: 'firefly',
            rotation: 0,
            vRot: 0,
          });
        } else {
          // Stage 1: Drifting pink cherry blossom petals
          this.particles.push({
            x: this.worldWidth + 15,
            y: 120 + Math.random() * Math.max(120, this.groundY - 120),
            vx: -moveSpeed * 0.32 - Math.random() * 35,
            vy: -16 - Math.random() * 18,
            size: 3.4 + Math.random() * 2.2,
            color: Math.random() < 0.78 ? '#F8C0CE' : '#FCE8ED',
            alpha: 0.82,
            life: 3.6,
            maxLife: 3.6,
            shape: 'petal',
            rotation: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 3.5,
          });
        }
      }
    }
  }

  private updateSpawners(dt: number): void {
    const cfg = getStageDefinition(this.stageId);
    const remainingMeters = cfg.isEndless ? Number.POSITIVE_INFINITY : cfg.goalDistance - this.distance;

    // Keep the final stretch before our Home Arch joyful & unobstructed
    if (remainingMeters > 18) {
      this.nextObstacleTimer -= dt;
      if (this.nextObstacleTimer <= 0) {
        const extraGap = this.spawnObstaclePattern();
        const speedSpan = Math.max(1, cfg.maxSpeed - cfg.baseSpeed);
        const speedFactor = Math.min(1, Math.max(0, (this.speed - cfg.baseSpeed) / speedSpan));
        const minGap = cfg.minGapStart - speedFactor * (cfg.minGapStart - cfg.minGapEnd);
        const maxGap = cfg.maxGapStart - speedFactor * (cfg.maxGapStart - cfg.maxGapEnd);
        this.nextObstacleTimer =
          minGap + Math.random() * Math.max(0.22, maxGap - minGap) + extraGap;
      }
    }

    if (remainingMeters > 10) {
      this.nextTreatTimer -= dt;
      if (this.nextTreatTimer <= 0) {
        this.spawnStandaloneTreats();
        this.nextTreatTimer = 1.55 + Math.random() * 1.15;
      }
    }

    // Spawn stage-specific Memory Fragments at course milestones with safe obstacle clearance
    if (this.pendingMemories.length > 0 && this.distance >= this.pendingMemories[0].spawnDistance) {
      const nextFrag = this.pendingMemories.shift();
      if (nextFrag) {
        this.spawnMemoryFragment(nextFrag);
      }
    }
  }

  private spawnMemoryFragment(frag: MemoryFragmentDefinition): void {
    let spawnX = this.worldWidth + 72;
    let spawnY = frag.spawnHeight;

    const conflictingAir = this.obstacles.find(
      (o) => !o.bounced && o.isAir && Math.abs(o.x - spawnX) < 120
    );
    if (conflictingAir) {
      spawnX = Math.max(spawnX, conflictingAir.x + conflictingAir.width + 115);
      spawnY = 42;
    } else {
      const conflictingGround = this.obstacles.find(
        (o) => !o.bounced && !o.isAir && Math.abs(o.x + o.width * 0.5 - spawnX) < 95
      );
      if (conflictingGround) {
        spawnY = Math.max(spawnY, conflictingGround.height + 54);
      }
    }

    this.activeMemories.push({
      id: this.nextEntityId++,
      fragmentId: frag.id,
      x: spawnX,
      y: spawnY,
      radius: 21,
      bobPhase: Math.random() * Math.PI * 2,
      collected: false,
    });
  }

  private pickWeightedObstacle(pool: WeightedObstacle[]): ObstacleKind {
    const eligible = pool.filter((item) => this.distance >= (item.minDist ?? 0));
    const activePool = eligible.length > 0 ? eligible : pool;
    const totalWeight = activePool.reduce((sum, item) => sum + item.weight, 0);

    const draw = (): ObstacleKind => {
      let r = Math.random() * totalWeight;
      for (const item of activePool) {
        r -= item.weight;
        if (r <= 0) return item.kind;
      }
      return activePool[activePool.length - 1].kind;
    };

    let chosen = draw();
    if (activePool.length > 1 && chosen === this.lastObstacleKind) {
      chosen = draw();
    }
    return chosen;
  }

  private pushObstacle(kind: ObstacleKind, spawnX: number, allowFastBurst = true): Obstacle {
    const cfg = getStageDefinition(this.stageId);
    const s = OBSTACLE_SPECS[kind];
    const intensity = cfg.isEndless
      ? Math.min(1.65, cfg.hazardIntensity + this.distance / 2800)
      : cfg.hazardIntensity;

    let speedMult = kind === 'pigeon' ? cfg.pigeonSpeedMult : s.speedMult;
    if (!allowFastBurst && speedMult > 1.08) {
      // Keep multi-beat combo members speed-synced so fast obstacles never collide into neighbors
      speedMult = 1.04;
    } else if (kind === 'skateboard' && this.stageId >= 3) {
      speedMult = Math.min(1.48, 1.36 + (intensity - 1.25) * 0.25);
    } else if (kind === 'frisbee' && this.stageId >= 3) {
      speedMult = Math.min(1.45, 1.33 + (intensity - 1.25) * 0.22);
    }

    const swoopDepth =
      kind === 'pigeon' && this.stageId >= 2
        ? Math.min(34, 22 + (intensity - 1.0) * 18)
        : 0;
    const bounceAmp =
      kind === 'ball'
        ? this.stageId === 1
          ? 14
          : Math.min(30, 22 + (intensity - 1.0) * 16)
        : undefined;
    const bounceFreq =
      kind === 'ball'
        ? this.stageId === 1
          ? 4.8
          : Math.min(7.2, 5.8 + (intensity - 1.0) * 2.2)
        : undefined;

    const obs: Obstacle = {
      id: this.nextEntityId++,
      kind,
      x: spawnX,
      y: s.y + swoopDepth,
      baseY: s.y,
      width: s.w,
      height: s.h,
      isAir: s.isAir,
      speedMult,
      bobPhase: Math.random() * Math.PI * 2,
      bounced: false,
      bounceVx: 0,
      bounceVy: 0,
      bounceRot: 0,
      swoopDepth,
      bounceAmp,
      bounceFreq,
    };
    this.obstacles.push(obs);
    this.lastObstacleKind = kind;
    return obs;
  }

  private pickComboGroundKind(): ObstacleKind {
    const pool: WeightedObstacle[] =
      this.stageId >= 3
        ? [
            { kind: 'cone', weight: 28 },
            { kind: 'fence', weight: 32 },
            { kind: 'hydrant', weight: 25 },
            { kind: 'sign', weight: 15 },
          ]
        : [
            { kind: 'puddle', weight: 32 },
            { kind: 'cone', weight: 34 },
            { kind: 'fence', weight: 34 },
          ];
    return this.pickWeightedObstacle(pool);
  }

  private pickComboAirKind(): ObstacleKind {
    const cfg = getStageDefinition(this.stageId);
    const syncedAirPool = cfg.airPool.filter((i) => i.kind !== 'frisbee' && i.kind !== 'pigeon');
    return this.pickWeightedObstacle(syncedAirPool.length > 0 ? syncedAirPool : cfg.airPool);
  }

  private spawnGuideTreatsForBeat(obs: Obstacle, kind: TreatKind): void {
    const center = obs.x + obs.width * 0.5;
    if (obs.isAir) {
      this.spawnTreatAt(center, 16, kind);
    } else {
      const apexY = obs.height >= 44 ? 100 : 92;
      this.spawnTreatAt(center, apexY, kind);
    }
  }

  private spawnObstaclePattern(): number {
    const cfg = getStageDefinition(this.stageId);
    const spawnX = this.worldWidth + 55;
    const canSpawnAir = this.distance >= cfg.airStartDist;
    const spawnAir = canSpawnAir && Math.random() < cfg.airChance;

    const endlessBoost = cfg.isEndless ? Math.min(0.18, this.distance / 3200) : 0;
    const effectiveComboChance = Math.min(0.75, cfg.comboChance + endlessBoost);
    const effectiveTripleChance = Math.min(0.68, cfg.tripleComboChance + endlessBoost * 0.8);

    const willCombo =
      effectiveComboChance > 0 &&
      this.distance >= cfg.comboStartDist &&
      Math.random() < effectiveComboChance;

    const kind = willCombo
      ? spawnAir
        ? this.pickComboAirKind()
        : this.pickComboGroundKind()
      : this.pickWeightedObstacle(spawnAir ? cfg.airPool : cfg.groundPool);

    const primary = this.pushObstacle(kind, spawnX, !willCombo);

    if (willCombo) {
      const isTriple =
        canSpawnAir && effectiveTripleChance > 0 && Math.random() < effectiveTripleChance;

      // Speed-scaled fair reaction gaps so every 2-beat & 3-beat rhythm sequence is crisp & clearable
      const gapGroundToAir = Math.max(188, this.speed * 0.64);
      const gapAirToGround = Math.max(172, this.speed * 0.56);
      const gapGroundToGround = Math.max(198, this.speed * 0.66);

      const sequence: Obstacle[] = [primary];

      if (isTriple) {
        // 3-Beat Arcade Rhythm Patterns:
        // (A) Air -> Ground -> Air  (Duck -> Jump -> Duck)
        // (B) Ground -> Air -> Ground (Jump -> Duck -> Jump)
        // (C) Ground -> Ground -> Air (Jump -> Jump -> Duck)
        let secondIsAir: boolean;
        let thirdIsAir: boolean;
        if (primary.isAir) {
          secondIsAir = false;
          thirdIsAir = true;
        } else if (Math.random() < 0.62) {
          secondIsAir = true;
          thirdIsAir = false;
        } else {
          secondIsAir = false;
          thirdIsAir = true;
        }

        const gap1 = primary.isAir
          ? gapAirToGround
          : secondIsAir
            ? gapGroundToAir
            : gapGroundToGround;
        const x2 = primary.x + primary.width + gap1;
        const second = this.pushObstacle(
          secondIsAir ? this.pickComboAirKind() : this.pickComboGroundKind(),
          x2,
          false
        );
        sequence.push(second);

        const gap2 = second.isAir
          ? gapAirToGround
          : thirdIsAir
            ? gapGroundToAir
            : gapGroundToGround;
        const x3 = second.x + second.width + gap2;
        const third = this.pushObstacle(
          thirdIsAir ? this.pickComboAirKind() : this.pickComboGroundKind(),
          x3,
          false
        );
        sequence.push(third);

        this.spawnGuideTreatsForBeat(primary, 'biscuit');
        this.spawnGuideTreatsForBeat(second, 'sweetpotato');
        this.spawnGuideTreatsForBeat(third, 'jerky');
      } else {
        // 2-Beat Rhythm Patterns: Duck->Jump, Jump->Duck, or Double Hop
        const secondIsAir = primary.isAir ? false : canSpawnAir && Math.random() < 0.65;
        const gap1 = primary.isAir
          ? gapAirToGround
          : secondIsAir
            ? gapGroundToAir
            : gapGroundToGround;
        const x2 = primary.x + primary.width + gap1;
        const second = this.pushObstacle(
          secondIsAir ? this.pickComboAirKind() : this.pickComboGroundKind(),
          x2,
          false
        );
        sequence.push(second);

        this.spawnGuideTreatsForBeat(primary, 'biscuit');
        this.spawnGuideTreatsForBeat(second, secondIsAir ? 'jerky' : 'sweetpotato');
      }

      const lastObs = sequence[sequence.length - 1];
      const totalSpan = lastObs.x + lastObs.width - spawnX;
      return totalSpan / Math.max(220, this.speed) + (isTriple ? 0.36 : 0.28);
    }

    if (primary.isAir) {
      const count = 2 + (Math.random() < 0.45 ? 1 : 0);
      for (let i = 0; i < count; i++) {
        this.spawnTreatAt(spawnX - 16 + i * 38, 16, i === 1 ? 'sweetpotato' : 'biscuit');
      }
    } else if (Math.random() < 0.68) {
      const center = spawnX + primary.width * 0.5;
      const apexY = primary.height >= 44 ? 102 : 94;
      this.spawnTreatAt(center - 44, 64, 'biscuit');
      this.spawnTreatAt(center, apexY, Math.random() < 0.28 ? 'jerky' : 'sweetpotato');
      this.spawnTreatAt(center + 44, 64, 'biscuit');
    }

    return 0;
  }

  private spawnStandaloneTreats(): void {
    const cfg = getStageDefinition(this.stageId);
    const spawnX = this.worldWidth + 60;
    const tooClose = this.obstacles.some((o) => Math.abs(o.x - spawnX) < 110);
    if (tooClose) return;

    const withinHeartCap = cfg.maxHeartSpawns === 0 || this.heartsSpawnedInRun < cfg.maxHeartSpawns;
    const heartReady = this.distance - this.lastHeartSpawnDist >= cfg.heartCooldownDist;
    if (this.hearts < MAX_HEARTS && withinHeartCap && heartReady && Math.random() < 0.075) {
      const hasActiveHeart = this.treats.some((t) => t.kind === 'heartCookie' && !t.collected);
      if (!hasActiveHeart) {
        this.lastHeartSpawnDist = this.distance;
        this.heartsSpawnedInRun += 1;
        // High jump arc placement so heart recovery requires deliberate timing
        this.spawnTreatAt(spawnX, 92, 'heartCookie');
        return;
      }
    }

    const pattern = Math.random();
    if (pattern < 0.5) {
      for (let i = 0; i < 3; i++) {
        this.spawnTreatAt(spawnX + i * 38, 22, i === 2 && Math.random() < 0.3 ? 'sweetpotato' : 'biscuit');
      }
    } else {
      this.spawnTreatAt(spawnX, 58, 'biscuit');
      this.spawnTreatAt(spawnX + 42, 86, Math.random() < 0.44 ? 'jerky' : 'sweetpotato');
    }
  }

  private spawnTreatAt(x: number, y: number, kind: TreatKind): void {
    // Rebalanced fever gains so Fever is an earned tactical payoff rather than constant invincibility
    const config: Record<TreatKind, { radius: number; points: number; feverGain: number }> = {
      biscuit: { radius: 13, points: 15, feverGain: 6 },
      sweetpotato: { radius: 13, points: 25, feverGain: 9 },
      jerky: { radius: 15, points: 50, feverGain: 15 },
      heartCookie: { radius: 14, points: 30, feverGain: 8 },
    };
    const c = config[kind];
    this.treats.push({
      id: this.nextEntityId++,
      kind,
      x,
      y,
      radius: c.radius,
      points: c.points,
      feverGain: c.feverGain,
      bobPhase: Math.random() * Math.PI * 2,
      collected: false,
    });
  }

  private getPlayerHitbox(): { left: number; right: number; bottom: number; top: number } {
    const p = this.player;
    const duck = p.isDucking && p.isGrounded;
    const halfW = duck ? 21 : 17;
    const height = duck ? 24 : 42;
    return {
      left: p.x - halfW,
      right: p.x + halfW,
      bottom: p.y + 2,
      top: p.y + height,
    };
  }

  private updateObstacles(dt: number): void {
    const pBox = this.getPlayerHitbox();

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];

      if (obs.bounced) {
        obs.x += obs.bounceVx * dt;
        obs.y += obs.bounceVy * dt;
        obs.bounceVy -= 1100 * dt;
        obs.bounceRot += 10 * dt;
        if (obs.x > this.worldWidth + 160 || obs.y < -120) {
          this.obstacles.splice(i, 1);
        }
        continue;
      }

      obs.x -= this.speed * obs.speedMult * dt;

      if (obs.kind === 'ball') {
        const amp = obs.bounceAmp ?? 24;
        const freq = obs.bounceFreq ?? 5.8;
        obs.y = obs.baseY + Math.abs(Math.sin(this.elapsed * freq + obs.bobPhase)) * amp;
      } else if (obs.kind === 'pigeon' && obs.swoopDepth && obs.swoopDepth > 0) {
        // Swoop smoothly from upper sky into head-height lane right before reaching the player
        const diveStartDist = Math.max(210, this.worldWidth * 0.62);
        const diveEndX = this.player.x + 120;
        const rawT = Math.min(1, Math.max(0, (obs.x - diveEndX) / diveStartDist));
        const wingWave = Math.sin(this.elapsed * 6.5 + obs.bobPhase) * 2.2;
        obs.y = obs.baseY + rawT * rawT * obs.swoopDepth + wingWave;
      } else if (obs.kind === 'balloon') {
        obs.y = obs.baseY + Math.sin(this.elapsed * 3.6 + obs.bobPhase) * 7.5;
      } else if (obs.kind === 'frisbee') {
        obs.y = obs.baseY + Math.sin(this.elapsed * 7.8 + obs.bobPhase) * 3.8;
      }

      if (obs.x + obs.width < -90) {
        this.obstacles.splice(i, 1);
        continue;
      }

      const shrink = getStageDefinition(this.stageId).hitboxShrink;
      const basePadX =
        obs.kind === 'puddle' || obs.kind === 'skateboard'
          ? 9
          : obs.kind === 'cone' || obs.kind === 'hydrant'
            ? 7
            : obs.isAir
              ? 8
              : 7;
      const padX = Math.max(3, basePadX - shrink);
      const padBottom = obs.isAir ? Math.max(1, 3 - shrink * 0.5) : 0;
      const padTop = Math.max(2, (obs.kind === 'cone' ? 7 : obs.isAir ? 4 : 5) - shrink * 0.6);
      const oLeft = obs.x + padX;
      const oRight = obs.x + obs.width - padX;
      const oBottom = obs.y + padBottom;
      const oTop = obs.y + obs.height - padTop;

      const overlaps =
        pBox.right > oLeft &&
        pBox.left < oRight &&
        pBox.top > oBottom &&
        pBox.bottom < oTop;

      if (overlaps) {
        if (this.isFever) {
          obs.bounced = true;
          obs.bounceVx = this.speed * 1.15;
          obs.bounceVy = 430;
          this.score += 20;
          this.sound.playFeverBounce();
          this.spawnSparkleBurst(obs.x + obs.width * 0.5, obs.y + obs.height * 0.5, '#F5B841', 10);
          this.floatingTexts.push({
            x: obs.x + obs.width * 0.5,
            y: obs.y + obs.height + 16,
            vy: 48,
            text: '피버 돌파 +20',
            color: '#C8731A',
            life: 0.75,
            maxLife: 0.75,
            scale: 1.05,
          });
        } else if (this.player.invincibleTimer <= 0) {
          this.handlePlayerHit();
        }
      }
    }
  }

  private handlePlayerHit(): void {
    this.hearts = Math.max(0, this.hearts - 1);
    this.combo = 0;
    this.player.invincibleTimer = getStageDefinition(this.stageId).invincibleDuration;
    this.player.hurtFlashTimer = 0.45;
    this.player.scaleX = 1.2;
    this.player.scaleY = 0.8;
    this.shakeTimer = 0.26;
    this.shakeIntensity = 6.5;

    this.spawnSparkleBurst(this.player.x + 6, this.player.y + 26, '#E26C62', 10);
    this.floatingTexts.push({
      x: this.player.x + 4,
      y: this.player.y + 62,
      vy: 42,
      text: this.hearts > 0 ? '아야! 하트 -1' : '아쉽지만 중도 귀가...',
      color: '#C94A4A',
      life: 0.95,
      maxLife: 0.95,
      scale: 1.05,
    });

    if (this.hearts <= 0) {
      this.sound.playGoHome();
      this.finishRun('early_return', 0);
    } else {
      this.sound.playHit();
      this.emitHud();
    }
  }

  private updateTreats(dt: number): void {
    const p = this.player;
    const pCenterX = p.x + 4;
    const pCenterY = p.y + (p.isDucking && p.isGrounded ? 16 : 26);
    const { collectRadiusMult } = getCharacterDefinition(this.characterId).traits;
    const collectRadius = (this.isFever ? 40 : 30) * collectRadiusMult;

    for (let i = this.treats.length - 1; i >= 0; i--) {
      const t = this.treats[i];
      t.x -= this.speed * dt;

      if (t.x < -50) {
        if (!t.collected && t.kind !== 'heartCookie') {
          this.combo = 0;
        }
        this.treats.splice(i, 1);
        continue;
      }

      if (t.collected) {
        this.treats.splice(i, 1);
        continue;
      }

      const dx = t.x - pCenterX;
      const dy = t.y - pCenterY;
      const distSq = dx * dx + dy * dy;
      const hitDist = collectRadius + t.radius;

      if (distSq <= hitDist * hitDist) {
        t.collected = true;
        this.collectTreat(t);
        this.treats.splice(i, 1);
      }
    }
  }

  private collectTreat(t: Treat): void {
    this.treatsCollected += 1;
    this.combo += 1;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    const feverMult = this.isFever ? 2 : 1;
    const comboBonus = Math.min(20, Math.floor((this.combo - 1) / 3) * 5);
    const gained = (t.points + comboBonus) * feverMult;
    this.score += gained;

    if (t.kind === 'heartCookie') {
      if (this.hearts < MAX_HEARTS) {
        this.hearts += 1;
      }
      this.sound.playHeartHeal();
      this.spawnHeartBurst(t.x, t.y);
      this.floatingTexts.push({
        x: t.x,
        y: t.y + 18,
        vy: 50,
        text: '하트 회복 +1!',
        color: '#D95462',
        life: 0.95,
        maxLife: 0.95,
        scale: 1.12,
      });
    } else {
      this.sound.playTreat(this.combo, t.kind === 'jerky');
      const burstColor =
        t.kind === 'jerky' ? '#F5B841' : t.kind === 'sweetpotato' ? '#F0A24C' : '#F2C679';
      this.spawnSparkleBurst(t.x, t.y, burstColor, t.kind === 'jerky' ? 11 : 7);

      const label =
        this.combo >= 3 && this.combo % 3 === 0
          ? `${this.combo} 콤보! +${gained}`
          : `+${gained}`;
      this.floatingTexts.push({
        x: t.x,
        y: t.y + 16,
        vy: 48,
        text: label,
        color: t.kind === 'jerky' || this.isFever ? '#C87114' : '#85532A',
        life: 0.78,
        maxLife: 0.78,
        scale: this.combo >= 3 && this.combo % 3 === 0 ? 1.12 : 1.0,
      });
    }

    if (!this.isFever) {
      const { feverGainMult } = getCharacterDefinition(this.characterId).traits;
      const streakBoost = 1 + Math.min(0.38, this.combo * 0.04);
      this.feverGauge = Math.min(100, this.feverGauge + t.feverGain * streakBoost * feverGainMult);
      if (this.feverGauge >= 100) {
        this.activateFever();
      }
    }

    this.emitHud();
  }

  private updateMemories(dt: number): void {
    const p = this.player;
    const pCenterX = p.x + 4;
    const pCenterY = p.y + (p.isDucking && p.isGrounded ? 16 : 28);
    const { collectRadiusMult } = getCharacterDefinition(this.characterId).traits;
    const collectRadius = (this.isFever ? 44 : 35) * collectRadiusMult;

    for (let i = this.activeMemories.length - 1; i >= 0; i--) {
      const mem = this.activeMemories[i];
      mem.x -= this.speed * dt;

      if (mem.x < -70 || mem.collected) {
        this.activeMemories.splice(i, 1);
        continue;
      }

      // Soft golden shimmer trail as the special memory floats across the screen
      if (mem.x < this.worldWidth + 20 && Math.random() < dt * 9) {
        const def = getMemoryDefinition(mem.fragmentId);
        this.particles.push({
          x: mem.x + (Math.random() - 0.5) * 18,
          y: mem.y + (Math.random() - 0.5) * 18,
          vx: -this.speed * 0.16 + (Math.random() - 0.5) * 20,
          vy: 14 + Math.random() * 20,
          size: 2.8 + Math.random() * 2,
          color: def.glowColor,
          alpha: 0.85,
          life: 0.48,
          maxLife: 0.48,
          shape: 'star',
          rotation: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 5,
        });
      }

      const dx = mem.x - pCenterX;
      const dy = mem.y - pCenterY;
      const hitDist = collectRadius + mem.radius;

      if (dx * dx + dy * dy <= hitDist * hitDist) {
        mem.collected = true;
        this.collectMemoryFragment(mem);
        this.activeMemories.splice(i, 1);
      }
    }
  }

  private collectMemoryFragment(mem: ActiveMemoryItem): void {
    const def = getMemoryDefinition(mem.fragmentId);
    const feverMult = this.isFever ? 2 : 1;
    const bonus = def.bonusPoints * feverMult;

    this.score += bonus;
    this.memoryBonusTotal += bonus;
    if (!this.collectedMemoryIds.includes(mem.fragmentId)) {
      this.collectedMemoryIds.push(mem.fragmentId);
    }

    this.sound.playMemoryCollect();
    this.spawnSparkleBurst(mem.x, mem.y, '#F5B841', 14);
    this.spawnSparkleBurst(mem.x, mem.y, def.accentColor, 8);
    this.floatingTexts.push({
      x: Math.max(96, Math.min(this.worldWidth - 96, mem.x + 12)),
      y: mem.y + 34,
      vy: 38,
      text: `추억 발견! ${def.name} +${bonus}`,
      color: '#B85B2A',
      life: 1.35,
      maxLife: 1.35,
      scale: 1.08,
    });

    this.emitHud();
  }

  private activateFever(): void {
    const { feverDuration } = getCharacterDefinition(this.characterId).traits;
    this.isFever = true;
    this.feverRemaining = feverDuration || FEVER_DURATION;
    this.feverGauge = 100;
    this.sound.playFeverStart();
    this.spawnSparkleBurst(this.player.x + 10, this.player.y + 30, '#F5B841', 16);
    this.floatingTexts.push({
      x: this.player.x + 28,
      y: this.player.y + 72,
      vy: 38,
      text: '피버 타임! 점수 x2',
      color: '#C96A0E',
      life: 1.25,
      maxLife: 1.25,
      scale: 1.22,
    });
  }

  private finishRun(outcome: WalkOutcome, completionBonus: number): void {
    this.gameState = 'GAME_OVER';
    const cfg = getStageDefinition(this.stageId);
    const finalScore = Math.floor(this.score);
    const finalDist = Math.floor(this.distance);
    const isNewBestScore = finalScore > this.bestScore;
    const isNewBestDistance = finalDist > this.bestDistance;

    if (isNewBestScore) this.bestScore = finalScore;
    if (isNewBestDistance) this.bestDistance = finalDist;

    this.emitHud();
    const { label } = this.getTimePhaseInfo();
    const endlessZoneNumber = cfg.isEndless ? Math.floor(this.distance / 400) + 1 : 1;
    this.callbacks.onGameOver({
      stageId: cfg.id,
      stageStepLabel: cfg.stepLabel,
      stageName: cfg.name,
      isEndless: cfg.isEndless,
      endlessZoneNumber,
      outcome,
      score: finalScore,
      bestScore: this.bestScore,
      isNewBestScore,
      distance: finalDist,
      goalDistance: cfg.goalDistance,
      bestDistance: this.bestDistance,
      isNewBestDistance,
      remainingHearts: this.hearts,
      completionBonus,
      treatsCollected: this.treatsCollected,
      collectedMemoryIds: [...this.collectedMemoryIds],
      memoryBonusTotal: this.memoryBonusTotal,
      maxCombo: this.maxCombo,
      timePhaseLabel: label,
    });
  }

  private spawnDustBurst(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + Math.random() * 5,
        vx: -40 - Math.random() * 65,
        vy: 20 + Math.random() * 48,
        size: 3.5 + Math.random() * 3,
        color: 'rgba(236, 218, 192, 0.92)',
        alpha: 0.74,
        life: 0.36,
        maxLife: 0.36,
        shape: 'circle',
        rotation: 0,
        vRot: 0,
      });
    }
  }

  private spawnSparkleBurst(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const spd = 55 + Math.random() * 85;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd + 25,
        size: 3.4 + Math.random() * 2.4,
        color,
        alpha: 0.95,
        life: 0.48 + Math.random() * 0.18,
        maxLife: 0.65,
        shape: i % 2 === 0 ? 'star' : 'circle',
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 7,
      });
    }
  }

  private spawnHeartBurst(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * 65,
        vy: Math.sin(angle) * 65 + 40,
        size: 5.5,
        color: '#E86A75',
        alpha: 0.95,
        life: 0.62,
        maxLife: 0.62,
        shape: 'heart',
        rotation: 0,
        vRot: 0,
      });
    }
  }

  private updateParticles(dt: number, moveSpeed: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.shape === 'petal' || pt.shape === 'leaf') {
        pt.x -= moveSpeed * 0.05 * dt;
        pt.y += Math.sin(this.elapsed * 3.5 + i) * 14 * dt;
      } else if (pt.shape === 'firefly') {
        pt.x -= moveSpeed * 0.03 * dt;
        pt.y += Math.sin(this.elapsed * 2.4 + i * 1.3) * 18 * dt;
      } else {
        pt.vy -= 140 * dt;
      }
      pt.rotation += pt.vRot * dt;
    }
  }

  private updateFloatingTexts(dt: number): void {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y += ft.vy * dt;
    }
  }

  private getTimePhaseInfo(): { phase: TimeOfDayPhase; label: string; cycleT: number } {
    const cfg = getStageDefinition(this.stageId);
    let cycleT: number;
    if (this.gameState === 'TITLE_MENU') {
      // Gently breathe around the stage's signature time-of-day while previewing on title screen
      const mid = cfg.timeCycleStart + (cfg.timeCycleEnd - cfg.timeCycleStart) * 0.22;
      cycleT = mid + Math.sin(this.elapsed * 0.25) * 0.14;
    } else if (cfg.isEndless) {
      // Smooth continuous day-to-evening lighting cycle across Endless zones
      const visualStage = this.getVisualStageId();
      const zoneProgress = (this.distance % 400) / 400;
      const visualCfg = getStageDefinition(visualStage);
      cycleT =
        visualCfg.timeCycleStart +
        (visualCfg.timeCycleEnd - visualCfg.timeCycleStart) * zoneProgress;
    } else {
      const progress = Math.min(1, Math.max(0, this.distance / cfg.goalDistance));
      cycleT = cfg.timeCycleStart + (cfg.timeCycleEnd - cfg.timeCycleStart) * progress;
    }
    const idx = Math.floor(((cycleT % 4) + 4) % 4 + 0.25) % 4;
    const order: TimeOfDayPhase[] = ['morning', 'afternoon', 'sunset', 'evening'];
    const phase = order[idx];
    return {
      phase,
      label: TIME_PHASE_LABELS[phase],
      cycleT,
    };
  }

  private emitHud(): void {
    const { phase, label } = this.getTimePhaseInfo();
    const currentScore = Math.floor(this.score);
    const cfg = getStageDefinition(this.stageId);
    const visualStage = getStageDefinition(this.getVisualStageId());
    const endlessZoneNumber = cfg.isEndless ? Math.floor(this.distance / 400) + 1 : 1;
    this.callbacks.onHudUpdate({
      stageId: cfg.id,
      stageStepLabel: cfg.stepLabel,
      stageName: cfg.name,
      isEndless: cfg.isEndless,
      endlessZoneNumber,
      endlessZoneName: visualStage.name,
      hearts: this.hearts,
      maxHearts: MAX_HEARTS,
      score: currentScore,
      bestScore: Math.max(this.bestScore, currentScore),
      distance: Math.floor(this.distance),
      goalDistance: cfg.goalDistance,
      combo: this.combo,
      maxCombo: this.maxCombo,
      treatsCollected: this.treatsCollected,
      memoriesCollectedCount: this.collectedMemoryIds.length,
      stageMemoryTotal: getStageMemories(cfg.id).length,
      feverGauge: Math.round(this.feverGauge),
      isFever: this.isFever,
      feverRemaining: Math.max(0, this.feverRemaining),
      timePhase: phase,
      timePhaseLabel: label,
      speedMultiplier: Number((this.speed / cfg.baseSpeed).toFixed(1)),
    });
  }

  private render(): void {
    const { cycleT } = this.getTimePhaseInfo();
    const cfg = getStageDefinition(this.stageId);
    const shakeX =
      this.shakeTimer > 0 ? (Math.random() - 0.5) * 2 * this.shakeIntensity * (this.shakeTimer / 0.26) : 0;
    const shakeY =
      this.shakeTimer > 0 ? (Math.random() - 0.5) * 2 * this.shakeIntensity * (this.shakeTimer / 0.26) : 0;

    this.ctx.save();
    this.ctx.setTransform(this.dpr * this.scale, 0, 0, this.dpr * this.scale, 0, 0);

    this.renderer.render(this.ctx, {
      stageId: this.getVisualStageId(),
      characterId: this.characterId,
      worldWidth: this.worldWidth,
      worldHeight: this.worldHeight,
      groundY: this.groundY,
      distance: this.distance,
      goalDistance: cfg.goalDistance,
      showHomeGate: this.gameState !== 'TITLE_MENU' && !cfg.isEndless,
      elapsed: this.elapsed,
      speed: this.speed,
      player: this.player,
      obstacles: this.obstacles,
      treats: this.treats,
      memories: this.activeMemories,
      particles: this.particles,
      floatingTexts: this.floatingTexts,
      scenery: this.scenery,
      clouds: this.clouds,
      isFever: this.isFever,
      feverRemaining: this.feverRemaining,
      shakeOffsetX: shakeX,
      shakeOffsetY: shakeY,
      timeCycleT: cycleT,
      sprites: this.sprites,
    });

    this.ctx.restore();
  }
}
