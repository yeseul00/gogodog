import type { ObstacleKind, StageId } from './types';

export interface WeightedObstacle {
  kind: ObstacleKind;
  weight: number;
  minDist?: number;
}

export interface StageDefinition {
  id: StageId;
  stepLabel: string;
  name: string;
  heading: string;
  paceLabel: string;
  subtitle: string;
  hint: string;
  jumpPreview: string;
  duckPreview: string;
  restMessage: string;
  panoramaUrl: string;
  panoramaGroundAnchor: number;
  timeCycleStart: number;
  timeCycleEnd: number;
  isEndless: boolean;
  goalDistance: number;
  baseSpeed: number;
  maxSpeed: number;
  rampDistance: number;
  minGapStart: number;
  minGapEnd: number;
  maxGapStart: number;
  maxGapEnd: number;
  pigeonSpeedMult: number;
  feverBoost: number;
  airStartDist: number;
  airChance: number;
  invincibleDuration: number;
  comboChance: number;
  tripleComboChance: number;
  comboStartDist: number;
  heartCooldownDist: number;
  maxHeartSpawns: number;
  hitboxShrink: number;
  hazardIntensity: number;
  groundPool: WeightedObstacle[];
  airPool: WeightedObstacle[];
}

export const STAGE_LIST: StageDefinition[] = [
  {
    id: 1,
    stepLabel: '1단계',
    name: '산책로',
    heading: '1단계 산책로',
    paceLabel: '입문',
    subtitle: '벚꽃 잎이 흩날리는 공원 산책로를 땡콩이와 가볍게 몸풀며 달려봐요.',
    hint: '300m 입문 코스 · 기본 점프/숙이기 익히기',
    jumpPreview: '물웅덩이·꼬깔콘·울타리',
    duckPreview: '늘어진 벚꽃가지',
    restMessage: '땡콩이가 벚꽃 산책로 벤치에서 물을 마시고 있어요.',
    panoramaUrl: '/src/assets/images/park_cinema_panorama_1795140651327.jpg',
    panoramaGroundAnchor: 0.72,
    timeCycleStart: 0.05,
    timeCycleEnd: 1.35,
    isEndless: false,
    goalDistance: 300,
    baseSpeed: 190,
    maxSpeed: 295,
    rampDistance: 270,
    minGapStart: 1.95,
    minGapEnd: 1.35,
    maxGapStart: 2.65,
    maxGapEnd: 1.88,
    pigeonSpeedMult: 1.06,
    feverBoost: 1.08,
    airStartDist: 40,
    airChance: 0.28,
    invincibleDuration: 1.9,
    comboChance: 0,
    tripleComboChance: 0,
    comboStartDist: 9999,
    heartCooldownDist: 90,
    maxHeartSpawns: 3,
    hitboxShrink: 0,
    hazardIntensity: 1.0,
    groundPool: [
      { kind: 'puddle', weight: 40 },
      { kind: 'cone', weight: 32 },
      { kind: 'fence', weight: 28 },
    ],
    airPool: [{ kind: 'branch', weight: 100 }],
  },
  {
    id: 2,
    stepLabel: '2단계',
    name: '숲속 오솔길',
    heading: '2단계 숲속 오솔길',
    paceLabel: '도전',
    subtitle: '초반부터 빨라진 템포! 높게 튀는 공과 급강하 비둘기, 연속 리듬을 돌파해 봐요.',
    hint: '500m 도전 코스 · 빠른 템포 · 2~3연속 리듬 패턴',
    jumpPreview: '높게 튀는 공·울타리·표지판',
    duckPreview: '급강하 비둘기·나뭇가지·풍선',
    restMessage: '땡콩이가 숲속 나무 그늘에서 시원한 바람을 쐬고 있어요.',
    panoramaUrl: '/src/assets/images/stage2_forest_panorama_1795150047130.jpg',
    panoramaGroundAnchor: 0.8,
    timeCycleStart: 0.55,
    timeCycleEnd: 1.85,
    isEndless: false,
    goalDistance: 500,
    baseSpeed: 265,
    maxSpeed: 435,
    rampDistance: 420,
    minGapStart: 1.32,
    minGapEnd: 0.76,
    maxGapStart: 1.85,
    maxGapEnd: 1.12,
    pigeonSpeedMult: 1.18,
    feverBoost: 1.08,
    airStartDist: 18,
    airChance: 0.4,
    invincibleDuration: 1.25,
    comboChance: 0.34,
    tripleComboChance: 0.32,
    comboStartDist: 35,
    heartCooldownDist: 150,
    maxHeartSpawns: 2,
    hitboxShrink: 1.5,
    hazardIntensity: 1.18,
    groundPool: [
      { kind: 'puddle', weight: 14 },
      { kind: 'cone', weight: 18 },
      { kind: 'fence', weight: 22 },
      { kind: 'sign', weight: 20, minDist: 8 },
      { kind: 'ball', weight: 26, minDist: 12 },
    ],
    airPool: [
      { kind: 'branch', weight: 30 },
      { kind: 'pigeon', weight: 40 },
      { kind: 'balloon', weight: 30 },
    ],
  },
  {
    id: 3,
    stepLabel: '3단계',
    name: '저녁 카페거리',
    heading: '3단계 저녁 카페거리',
    paceLabel: '매움',
    subtitle: '초반부터 매운 하드코어 리듬! 고속 보드와 프리스비, 3연속 패턴을 뚫고 완주해요.',
    hint: '700m 하드코어 · 3연속 리듬 · 고속 돌진 장애물',
    jumpPreview: '고속 보드·소화전·통통 공',
    duckPreview: '고속 프리스비·급강하 비둘기',
    restMessage: '땡콩이가 따뜻한 카페 테라스 앞에서 숨을 고르고 있어요.',
    panoramaUrl: '/src/assets/images/stage3_cafe_panorama_1795150045785.jpg',
    panoramaGroundAnchor: 0.85,
    timeCycleStart: 2.4,
    timeCycleEnd: 3.3,
    isEndless: false,
    goalDistance: 700,
    baseSpeed: 315,
    maxSpeed: 520,
    rampDistance: 560,
    minGapStart: 1.08,
    minGapEnd: 0.6,
    maxGapStart: 1.52,
    maxGapEnd: 0.88,
    pigeonSpeedMult: 1.24,
    feverBoost: 1.08,
    airStartDist: 12,
    airChance: 0.44,
    invincibleDuration: 1.05,
    comboChance: 0.52,
    tripleComboChance: 0.48,
    comboStartDist: 20,
    heartCooldownDist: 180,
    maxHeartSpawns: 1,
    hitboxShrink: 2.2,
    hazardIntensity: 1.32,
    groundPool: [
      { kind: 'puddle', weight: 6 },
      { kind: 'cone', weight: 9 },
      { kind: 'fence', weight: 12 },
      { kind: 'sign', weight: 13 },
      { kind: 'ball', weight: 18 },
      { kind: 'hydrant', weight: 20, minDist: 10 },
      { kind: 'skateboard', weight: 22, minDist: 16 },
    ],
    airPool: [
      { kind: 'branch', weight: 16 },
      { kind: 'pigeon', weight: 30 },
      { kind: 'balloon', weight: 18 },
      { kind: 'frisbee', weight: 36, minDist: 14 },
    ],
  },
  {
    id: 4,
    stepLabel: '무한',
    name: '무한 질주',
    heading: '무한 질주 모드',
    paceLabel: '극한',
    subtitle: '3단계 완주 기념! 끝없이 빨라지는 순환 산책로에서 최고 거리와 점수에 도전해요.',
    hint: '끝없는 코스 · 400m마다 배경 순환 · 극한 기록 경쟁',
    jumpPreview: '고속 보드·통통 공·소화전',
    duckPreview: '고속 프리스비·급강하 비둘기',
    restMessage: '땡콩이가 무한 질주 도중 잠시 숨을 고르고 있어요.',
    panoramaUrl: '/src/assets/images/park_cinema_panorama_1795140651327.jpg',
    panoramaGroundAnchor: 0.72,
    timeCycleStart: 0.1,
    timeCycleEnd: 3.4,
    isEndless: true,
    goalDistance: 0,
    baseSpeed: 325,
    maxSpeed: 600,
    rampDistance: 1600,
    minGapStart: 1.05,
    minGapEnd: 0.52,
    maxGapStart: 1.45,
    maxGapEnd: 0.78,
    pigeonSpeedMult: 1.26,
    feverBoost: 1.07,
    airStartDist: 10,
    airChance: 0.46,
    invincibleDuration: 0.95,
    comboChance: 0.56,
    tripleComboChance: 0.55,
    comboStartDist: 15,
    heartCooldownDist: 280,
    maxHeartSpawns: 0,
    hitboxShrink: 2.5,
    hazardIntensity: 1.4,
    groundPool: [
      { kind: 'puddle', weight: 5 },
      { kind: 'cone', weight: 9 },
      { kind: 'fence', weight: 12 },
      { kind: 'sign', weight: 13 },
      { kind: 'ball', weight: 19 },
      { kind: 'hydrant', weight: 19 },
      { kind: 'skateboard', weight: 23 },
    ],
    airPool: [
      { kind: 'branch', weight: 15 },
      { kind: 'pigeon', weight: 32 },
      { kind: 'balloon', weight: 17 },
      { kind: 'frisbee', weight: 36 },
    ],
  },
];

export const STAGE_MAP: Record<StageId, StageDefinition> = {
  1: STAGE_LIST[0],
  2: STAGE_LIST[1],
  3: STAGE_LIST[2],
  4: STAGE_LIST[3],
};

export function getStageDefinition(stageId: StageId): StageDefinition {
  return STAGE_MAP[stageId] ?? STAGE_MAP[1];
}

export function getNextStageId(stageId: StageId): StageId | null {
  if (stageId === 1) return 2;
  if (stageId === 2) return 3;
  if (stageId === 3) return 4;
  return null;
}

export function isStageId(val: unknown): val is StageId {
  return val === 1 || val === 2 || val === 3 || val === 4;
}
