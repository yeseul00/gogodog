import type {
  CollectedMemoriesMap,
  MemoryFragmentDefinition,
  MemoryFragmentId,
  StageId,
} from './types';

export const MEMORY_FRAGMENTS: MemoryFragmentDefinition[] = [
  // 1단계 산책로 (300m)
  {
    id: 'pigeonFriend',
    stageId: 1,
    orderInStage: 1,
    spawnDistance: 85,
    spawnHeight: 54,
    name: '반짝 비둘기 친구',
    shortNote: '공원 벤치 옆에서 통통 걷던 친절한 아기 비둘기와 코인사했어요!',
    locationHint: '1단계 산책로 초반 (약 85m) 등장',
    bonusPoints: 120,
    accentColor: '#5B9AB8',
    glowColor: '#FFE89A',
  },
  {
    id: 'specialStick',
    stageId: 1,
    orderInStage: 2,
    spawnDistance: 165,
    spawnHeight: 42,
    name: '특별한 나뭇가지',
    shortNote: '입에 쏙 물기 딱 좋은 황금빛 Y자 보물 나뭇가지를 찾았어요!',
    locationHint: '1단계 산책로 중반 (약 165m) 등장',
    bonusPoints: 120,
    accentColor: '#B5733B',
    glowColor: '#FFE28A',
  },
  {
    id: 'cherryBlossom',
    stageId: 1,
    orderInStage: 3,
    spawnDistance: 245,
    spawnHeight: 68,
    name: '벚꽃 꽃잎 리본',
    shortNote: '봄바람에 흩날려 땡콩이 코끝에 사뿐 내려앉은 분홍 벚꽃 잎이에요.',
    locationHint: '1단계 산책로 후반 (약 245m) 등장',
    bonusPoints: 120,
    accentColor: '#E47B97',
    glowColor: '#FFDCE6',
  },

  // 2단계 숲속 오솔길 (500m)
  {
    id: 'leafVine',
    stageId: 2,
    orderInStage: 1,
    spawnDistance: 140,
    spawnHeight: 46,
    name: '바스락 낙엽 덩쿨',
    shortNote: '밟고 지나갈 때마다 바스락바스락 신나는 소리가 나는 낙엽 덩쿨이에요!',
    locationHint: '2단계 숲속 오솔길 초반 (약 140m) 등장',
    bonusPoints: 120,
    accentColor: '#C96B33',
    glowColor: '#FFD98E',
  },
  {
    id: 'forestAcorn',
    stageId: 2,
    orderInStage: 2,
    spawnDistance: 280,
    spawnHeight: 62,
    name: '통통 도토리 보물',
    shortNote: '다람쥐가 숨겨 둔 윤기 반짝이는 숲속 보물 도토리를 발견했어요!',
    locationHint: '2단계 숲속 오솔길 중반 (약 280m) 등장',
    bonusPoints: 120,
    accentColor: '#8F5B32',
    glowColor: '#FCE29B',
  },
  {
    id: 'pineconeToy',
    stageId: 2,
    orderInStage: 3,
    spawnDistance: 420,
    spawnHeight: 50,
    name: '솔방울 장난감',
    shortNote: '앞발로 톡 굴리면 데구루루 굴러가는 향긋한 솔방울 장난감이에요.',
    locationHint: '2단계 숲속 오솔길 후반 (약 420m) 등장',
    bonusPoints: 120,
    accentColor: '#5B8752',
    glowColor: '#DDF0AE',
  },

  // 3단계 저녁 카페거리 (700m)
  {
    id: 'puppuccino',
    stageId: 3,
    orderInStage: 1,
    spawnDistance: 190,
    spawnHeight: 48,
    name: '퍼푸치노 거품컵',
    shortNote: '테라스 카페 사장님이 반갑게 챙겨 준 달콤폭신 멍푸치노 한 컵!',
    locationHint: '3단계 저녁 카페거리 초반 (약 190m) 등장',
    bonusPoints: 120,
    accentColor: '#C87846',
    glowColor: '#FFE5B4',
  },
  {
    id: 'warmBulb',
    stageId: 3,
    orderInStage: 2,
    spawnDistance: 395,
    spawnHeight: 72,
    name: '따끈한 꼬마 전구',
    shortNote: '저녁 골목을 포근하게 비추던 노란 카페 스트링 전구의 반짝임이에요.',
    locationHint: '3단계 저녁 카페거리 중반 (약 395m) 등장',
    bonusPoints: 120,
    accentColor: '#D9931E',
    glowColor: '#FFF1A8',
  },
  {
    id: 'terraceBall',
    stageId: 3,
    orderInStage: 3,
    spawnDistance: 590,
    spawnHeight: 52,
    name: '노란 리본 공',
    shortNote: '카페거리 끝자락에서 통통 튀며 땡콩이를 기다리던 산책 친구 공이에요!',
    locationHint: '3단계 저녁 카페거리 후반 (약 590m) 등장',
    bonusPoints: 120,
    accentColor: '#4E9A84',
    glowColor: '#C8F2DF',
  },
];

export const TOTAL_MEMORY_COUNT = MEMORY_FRAGMENTS.length;

export const MEMORY_MAP: Record<MemoryFragmentId, MemoryFragmentDefinition> = {
  pigeonFriend: MEMORY_FRAGMENTS[0],
  specialStick: MEMORY_FRAGMENTS[1],
  cherryBlossom: MEMORY_FRAGMENTS[2],
  leafVine: MEMORY_FRAGMENTS[3],
  forestAcorn: MEMORY_FRAGMENTS[4],
  pineconeToy: MEMORY_FRAGMENTS[5],
  puppuccino: MEMORY_FRAGMENTS[6],
  warmBulb: MEMORY_FRAGMENTS[7],
  terraceBall: MEMORY_FRAGMENTS[8],
};

export function isMemoryFragmentId(value: unknown): value is MemoryFragmentId {
  return typeof value === 'string' && value in MEMORY_MAP;
}

export function getMemoryDefinition(id: MemoryFragmentId): MemoryFragmentDefinition {
  return MEMORY_MAP[id];
}

export function getStageMemories(stageId: StageId): MemoryFragmentDefinition[] {
  return MEMORY_FRAGMENTS.filter((m) => m.stageId === stageId);
}

export function getTotalCollectedCount(collected: CollectedMemoriesMap): number {
  let count = 0;
  for (const frag of MEMORY_FRAGMENTS) {
    if ((collected[frag.id]?.count ?? 0) > 0) {
      count += 1;
    }
  }
  return count;
}

export function getStageCollectedCount(
  collected: CollectedMemoriesMap,
  stageId: StageId
): number {
  let count = 0;
  for (const frag of MEMORY_FRAGMENTS) {
    if (frag.stageId === stageId && (collected[frag.id]?.count ?? 0) > 0) {
      count += 1;
    }
  }
  return count;
}
