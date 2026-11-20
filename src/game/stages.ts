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
  comboStartDist: number;
  groundPool: WeightedObstacle[];
  airPool: WeightedObstacle[];
}

export const STAGE_LIST: StageDefinition[] = [
  {
    id: 1,
    stepLabel: '1단계',
    name: '산책로',
    heading: '1단계 산책로',
    paceLabel: '여유',
    subtitle: '벚꽃 잎이 흩날리는 공원 산책로를 땡콩이와 여유롭게 달려봐요.',
    hint: '300m 코스 · 여유 템포 · 장애물 4종',
    jumpPreview: '물웅덩이·꼬깔콘·울타리',
    duckPreview: '늘어진 벚꽃가지',
    restMessage: '땡콩이가 벚꽃 산책로 벤치에서 물을 마시고 있어요.',
    panoramaUrl: '/src/assets/images/park_cinema_panorama_1795140651327.jpg',
    panoramaGroundAnchor: 0.72,
    timeCycleStart: 0.05,
    timeCycleEnd: 1.35,
    goalDistance: 300,
    baseSpeed: 185,
    maxSpeed: 295,
    rampDistance: 450,
    minGapStart: 2.05,
    minGapEnd: 1.45,
    maxGapStart: 2.85,
    maxGapEnd: 2.05,
    pigeonSpeedMult: 1.04,
    feverBoost: 1.1,
    airStartDist: 45,
    airChance: 0.28,
    invincibleDuration: 2.1,
    comboChance: 0,
    comboStartDist: 9999,
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
    paceLabel: '보통',
    subtitle: '초록빛 숲속 햇살 아래 통통 튀는 공과 비둘기를 피해 달려봐요.',
    hint: '500m 코스 · 보통 템포 · 장애물 8종',
    jumpPreview: '물웅덩이·울타리·통통 공',
    duckPreview: '비둘기·나뭇가지·풍선',
    restMessage: '땡콩이가 숲속 나무 그늘에서 시원한 바람을 쐬고 있어요.',
    panoramaUrl: '/src/assets/images/stage2_forest_panorama_1795150047130.jpg',
    panoramaGroundAnchor: 0.8,
    timeCycleStart: 0.55,
    timeCycleEnd: 1.85,
    goalDistance: 500,
    baseSpeed: 215,
    maxSpeed: 355,
    rampDistance: 650,
    minGapStart: 1.75,
    minGapEnd: 1.18,
    maxGapStart: 2.45,
    maxGapEnd: 1.68,
    pigeonSpeedMult: 1.07,
    feverBoost: 1.12,
    airStartDist: 35,
    airChance: 0.35,
    invincibleDuration: 1.9,
    comboChance: 0.14,
    comboStartDist: 110,
    groundPool: [
      { kind: 'puddle', weight: 20 },
      { kind: 'cone', weight: 18 },
      { kind: 'fence', weight: 22 },
      { kind: 'sign', weight: 18, minDist: 12 },
      { kind: 'ball', weight: 22, minDist: 22 },
    ],
    airPool: [
      { kind: 'branch', weight: 36 },
      { kind: 'pigeon', weight: 34 },
      { kind: 'balloon', weight: 30 },
    ],
  },
  {
    id: 3,
    stepLabel: '3단계',
    name: '저녁 카페거리',
    heading: '3단계 저녁 카페거리',
    paceLabel: '빠름',
    subtitle: '따뜻한 전구 불빛이 반짝이는 저녁 카페거리를 경쾌하게 완주해요.',
    hint: '700m 코스 · 빠름 템포 · 장애물 11종 + 연속 리듬',
    jumpPreview: '소화전·스케이트보드 외',
    duckPreview: '프리스비·비둘기·풍선',
    restMessage: '땡콩이가 따뜻한 카페 테라스 앞에서 잠시 쉬고 있어요.',
    panoramaUrl: '/src/assets/images/stage3_cafe_panorama_1795150045785.jpg',
    panoramaGroundAnchor: 0.85,
    timeCycleStart: 2.4,
    timeCycleEnd: 3.3,
    goalDistance: 700,
    baseSpeed: 255,
    maxSpeed: 430,
    rampDistance: 800,
    minGapStart: 1.45,
    minGapEnd: 0.98,
    maxGapStart: 2.05,
    maxGapEnd: 1.42,
    pigeonSpeedMult: 1.1,
    feverBoost: 1.15,
    airStartDist: 25,
    airChance: 0.4,
    invincibleDuration: 1.65,
    comboChance: 0.28,
    comboStartDist: 75,
    groundPool: [
      { kind: 'puddle', weight: 9 },
      { kind: 'cone', weight: 10 },
      { kind: 'fence', weight: 13 },
      { kind: 'sign', weight: 13 },
      { kind: 'ball', weight: 17 },
      { kind: 'hydrant', weight: 19, minDist: 18 },
      { kind: 'skateboard', weight: 19, minDist: 35 },
    ],
    airPool: [
      { kind: 'branch', weight: 20 },
      { kind: 'pigeon', weight: 26 },
      { kind: 'balloon', weight: 20 },
      { kind: 'frisbee', weight: 34, minDist: 30 },
    ],
  },
];

export const STAGE_MAP: Record<StageId, StageDefinition> = {
  1: STAGE_LIST[0],
  2: STAGE_LIST[1],
  3: STAGE_LIST[2],
};

export function getStageDefinition(stageId: StageId): StageDefinition {
  return STAGE_MAP[stageId];
}

export function getNextStageId(stageId: StageId): StageId | null {
  if (stageId === 1) return 2;
  if (stageId === 2) return 3;
  return null;
}

export function isStageId(val: unknown): val is StageId {
  return val === 1 || val === 2 || val === 3;
}
