import type { CharacterId } from './types';

export interface CharacterTraits {
  /** Multiplier applied to base jump velocity */
  jumpMult: number;
  /** Multiplier applied to fever gauge fill per treat */
  feverGainMult: number;
  /** Fever duration in seconds */
  feverDuration: number;
  /** Multiplier applied to treat & memory fragment pickup radius */
  collectRadiusMult: number;
}

export interface CharacterSpriteUrls {
  runFrames: string[];
  jump: string;
  duck: string;
  neutralFur: boolean;
}

export interface CharacterDefinition {
  id: CharacterId;
  name: string;
  roleTitle: string;
  tagline: string;
  shortTraitSummary: string;
  defaultNamePrefix: string;
  counterDocId: 'defaultName' | 'defaultName_nari' | 'defaultName_kiki';
  titleArtUrl: string;
  titleArtAlt: string;
  happyHomeArtUrl: string;
  happyHomeArtAlt: string;
  sadHomeArtUrl: string;
  sadHomeArtAlt: string;
  accentColor: string;
  softBg: string;
  traits: CharacterTraits;
  statBars: {
    jump: number;
    fever: number;
    collect: number;
  };
  statBadges: {
    jump: string;
    fever: string;
    collect: string;
  };
  spriteUrls: CharacterSpriteUrls;
}

export const DEFAULT_CHARACTER_ID: CharacterId = 'ddaengkong';

export const CHARACTER_LIST: CharacterDefinition[] = [
  {
    id: 'ddaengkong',
    name: '땡콩이',
    roleTitle: '피버 러너',
    tagline: '간식을 먹으면 피버 게이지가 빠르게 차오르고, 황금 피버 타임이 더 오래 이어져요.',
    shortTraitSummary: '피버 충전 +18% · 피버 +1초',
    defaultNamePrefix: '땡콩',
    counterDocId: 'defaultName',
    titleArtUrl: '/src/assets/images/ddaengkong_title_main_1795150047332.jpg',
    titleArtAlt: '산책을 기대하며 귀여운 앞발을 들고 활짝 웃는 복슬복슬한 포메라니안 땡콩이',
    happyHomeArtUrl: '/src/assets/images/ddaengkong_char_happy_1795147884238.jpg',
    happyHomeArtAlt: '산책을 끝까지 마치고 활짝 웃으며 신나게 집으로 돌아오는 복슬복슬한 포메라니안 땡콩이',
    sadHomeArtUrl: '/src/assets/images/ddaengkong_char_sad_1795147884813.jpg',
    sadHomeArtAlt: '하트를 모두 소진해 아쉬운 표정으로 뒤돌아보며 중도 귀가하는 포메라니안 땡콩이',
    accentColor: '#C86D3B',
    softBg: '#FCECE0',
    traits: {
      jumpMult: 1.0,
      feverGainMult: 1.18,
      feverDuration: 7.5,
      collectRadiusMult: 1.0,
    },
    statBars: {
      jump: 74,
      fever: 96,
      collect: 74,
    },
    statBadges: {
      jump: '표준',
      fever: '+18% / 7.5초',
      collect: '표준',
    },
    spriteUrls: {
      runFrames: [
        '/src/assets/images/pome_ref_run1_1795141530880.jpg',
        '/src/assets/images/pome_ref_run2_1795141532998.jpg',
        '/src/assets/images/pome_ref_run3_1795141530346.jpg',
        '/src/assets/images/pome_ref_run4_1795141545026.jpg',
      ],
      jump: '/src/assets/images/pome_ref_jump_1795141532286.jpg',
      duck: '/src/assets/images/pome_ref_duck_1795141529772.jpg',
      neutralFur: false,
    },
  },
  {
    id: 'nari',
    name: '나리',
    roleTitle: '점프 에이스',
    tagline: '경쾌하고 높은 도약력으로 장애물을 가볍게 넘고, 간식과 추억 조각을 더 넓게 모아요.',
    shortTraitSummary: '점프력 +9% · 수집 반경 +18%',
    defaultNamePrefix: '나리',
    counterDocId: 'defaultName_nari',
    titleArtUrl: '/src/assets/images/nari_v3_title_main_1795160810638.jpg',
    titleArtAlt: '벚꽃 흩날리는 산책로에서 복슬복슬한 앞발을 들고 반갑게 웃는 슬림한 흑백 점박이 강아지 나리',
    happyHomeArtUrl: '/src/assets/images/nari_char_happy_1795160101083.jpg',
    happyHomeArtAlt: '산책을 끝까지 마치고 따뜻한 햇살 아래 환하게 웃으며 집에 무사히 도착한 복슬복슬한 흑백 점박이 강아지 나리',
    sadHomeArtUrl: '/src/assets/images/nari_char_sad_1795160088168.jpg',
    sadHomeArtAlt: '하트를 모두 소진해 귀를 살짝 내리고 아쉬운 눈빛으로 뒤돌아보며 중도 귀가하는 복슬복슬한 흑백 점박이 강아지 나리',
    accentColor: '#3F6B58',
    softBg: '#E6F4EC',
    traits: {
      jumpMult: 1.09,
      feverGainMult: 1.0,
      feverDuration: 6.5,
      collectRadiusMult: 1.18,
    },
    statBars: {
      jump: 96,
      fever: 74,
      collect: 86,
    },
    statBadges: {
      jump: '+9%',
      fever: '표준 / 6.5초',
      collect: '+18%',
    },
    spriteUrls: {
      runFrames: [
        '/src/assets/images/nari_v4_run1_1795161654136.jpg',
        '/src/assets/images/nari_v5_run_trot_1795162989702.jpg',
        '/src/assets/images/nari_v5_run_gather_1795162989895.jpg',
        '/src/assets/images/nari_v3_run2_1795160864382.jpg',
      ],
      jump: '/src/assets/images/nari_v4_jump_up_1795161705590.jpg',
      duck: '/src/assets/images/nari_v3_duck_1795160876978.jpg',
      neutralFur: true,
    },
  },
  {
    id: 'kiki',
    name: '키키',
    roleTitle: '간식 컬렉터',
    tagline: '폭신한 솜사탕 털처럼 넓은 수집 반경으로 간식과 추억 조각을 쏙쏙 모으고 균형 있게 달려요.',
    shortTraitSummary: '수집 반경 +28% · 피버 +10%',
    defaultNamePrefix: '키키',
    counterDocId: 'defaultName_kiki',
    titleArtUrl: '/src/assets/images/kiki_title_main_1795278094853.jpg',
    titleArtAlt: '벚꽃 흩날리는 산책로에서 하얀 앞발을 들고 활짝 웃는 복슬복슬한 화이트 포메라니안 키키',
    happyHomeArtUrl: '/src/assets/images/kiki_char_happy_1795278092785.jpg',
    happyHomeArtAlt: '산책을 끝까지 마치고 따뜻한 햇살 아래 꼬리를 살랑이며 집에 무사히 도착한 화이트 포메라니안 키키',
    sadHomeArtUrl: '/src/assets/images/kiki_char_sad_1795278092852.jpg',
    sadHomeArtAlt: '하트를 모두 소진해 귀를 살짝 내리고 아쉬운 눈빛으로 뒤돌아보며 중도 귀가하는 화이트 포메라니안 키키',
    accentColor: '#5B76A8',
    softBg: '#EAF1FC',
    traits: {
      jumpMult: 1.04,
      feverGainMult: 1.1,
      feverDuration: 7.0,
      collectRadiusMult: 1.28,
    },
    statBars: {
      jump: 84,
      fever: 86,
      collect: 98,
    },
    statBadges: {
      jump: '+4%',
      fever: '+10% / 7.0초',
      collect: '+28%',
    },
    spriteUrls: {
      runFrames: [
        '/src/assets/images/kiki_warm_run_push_1795281458483.jpg',
        '/src/assets/images/kiki_warm_run_land_1795281459398.jpg',
        '/src/assets/images/kiki_warm_run_tuck_1795281525473.jpg',
        '/src/assets/images/kiki_warm_run_stride_1795281525765.jpg',
      ],
      jump: '/src/assets/images/kiki_jump_up_1795278092785.jpg',
      duck: '/src/assets/images/kiki_duck.png',
      neutralFur: true,
    },
  },
];

export const CHARACTER_MAP: Record<CharacterId, CharacterDefinition> = {
  ddaengkong: CHARACTER_LIST[0],
  nari: CHARACTER_LIST[1],
  kiki: CHARACTER_LIST[2],
};

export function isCharacterId(value: unknown): value is CharacterId {
  return value === 'ddaengkong' || value === 'nari' || value === 'kiki';
}

export function getCharacterDefinition(id: CharacterId): CharacterDefinition {
  return CHARACTER_MAP[id] ?? CHARACTER_MAP.ddaengkong;
}
