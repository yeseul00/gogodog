export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type WalkOutcome = 'completed' | 'early_return';

export type StageId = 1 | 2 | 3;

export type CharacterId = 'ddaengkong' | 'nari' | 'kiki';

export type TimeOfDayPhase = 'morning' | 'afternoon' | 'sunset' | 'evening';

export type ObstacleKind =
  | 'puddle'
  | 'cone'
  | 'fence'
  | 'sign'
  | 'ball'
  | 'hydrant'
  | 'skateboard'
  | 'branch'
  | 'pigeon'
  | 'balloon'
  | 'frisbee';

export type TreatKind = 'biscuit' | 'sweetpotato' | 'jerky' | 'heartCookie';

export type MemoryFragmentId =
  | 'pigeonFriend'
  | 'specialStick'
  | 'cherryBlossom'
  | 'leafVine'
  | 'forestAcorn'
  | 'pineconeToy'
  | 'puppuccino'
  | 'warmBulb'
  | 'terraceBall';

export interface MemoryFragmentDefinition {
  id: MemoryFragmentId;
  stageId: StageId;
  orderInStage: 1 | 2 | 3;
  spawnDistance: number;
  spawnHeight: number;
  name: string;
  shortNote: string;
  locationHint: string;
  bonusPoints: number;
  accentColor: string;
  glowColor: string;
}

export interface ActiveMemoryItem {
  id: number;
  fragmentId: MemoryFragmentId;
  x: number;
  y: number; // height above ground
  radius: number;
  bobPhase: number;
  collected: boolean;
}

export interface SavedMemoryEntry {
  count: number;
  firstCollectedAt: number;
}

export type CollectedMemoriesMap = Partial<Record<MemoryFragmentId, SavedMemoryEntry>>;

export interface PomeranianState {
  x: number;
  y: number; // height above ground (0 = on ground, >0 = airborne)
  vy: number;
  isGrounded: boolean;
  isDucking: boolean;
  invincibleTimer: number;
  hurtFlashTimer: number;
  runCycle: number;
  scaleX: number;
  scaleY: number;
  coyoteTimer: number;
  jumpBufferTimer: number;
  tailWag: number;
}

export interface Obstacle {
  id: number;
  kind: ObstacleKind;
  x: number;
  y: number; // height above ground
  baseY: number;
  width: number;
  height: number;
  isAir: boolean;
  speedMult: number;
  bobPhase: number;
  bounced: boolean;
  bounceVx: number;
  bounceVy: number;
  bounceRot: number;
}

export interface Treat {
  id: number;
  kind: TreatKind;
  x: number;
  y: number; // height above ground
  radius: number;
  points: number;
  feverGain: number;
  bobPhase: number;
  collected: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape: 'circle' | 'star' | 'petal' | 'leaf' | 'firefly' | 'heart';
  rotation: number;
  vRot: number;
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export interface SceneryProp {
  x: number;
  layer: 'far' | 'mid' | 'near';
  kind: 'treePink' | 'treeGreen' | 'treeWarm' | 'bench' | 'lamp' | 'bush' | 'pavilion';
  scale: number;
  seed: number;
}

export interface Cloud {
  x: number;
  yRatio: number;
  scale: number;
  speed: number;
  opacity: number;
}

export interface HudSnapshot {
  stageId: StageId;
  stageStepLabel: string;
  stageName: string;
  hearts: number;
  maxHearts: number;
  score: number;
  bestScore: number;
  distance: number;
  goalDistance: number;
  combo: number;
  maxCombo: number;
  treatsCollected: number;
  memoriesCollectedCount: number;
  stageMemoryTotal: number;
  feverGauge: number; // 0..100
  isFever: boolean;
  feverRemaining: number; // seconds
  timePhase: TimeOfDayPhase;
  timePhaseLabel: string;
  speedMultiplier: number;
}

export interface GameSummary {
  stageId: StageId;
  stageStepLabel: string;
  stageName: string;
  outcome: WalkOutcome;
  score: number;
  bestScore: number;
  isNewBestScore: boolean;
  distance: number;
  goalDistance: number;
  bestDistance: number;
  isNewBestDistance: boolean;
  remainingHearts: number;
  completionBonus: number;
  treatsCollected: number;
  collectedMemoryIds: MemoryFragmentId[];
  memoryBonusTotal: number;
  maxCombo: number;
  timePhaseLabel: string;
}

export interface SavedRecords {
  bestScore: number;
  bestDistance: number;
  totalTreats: number;
  isMuted: boolean;
  unlockedStage: StageId;
  selectedStage: StageId;
  selectedCharacter: CharacterId;
  characterName: string;
  localDefaultCounter: number;
  localDefaultCounters: Record<CharacterId, number>;
  collectedMemories: CollectedMemoriesMap;
}
