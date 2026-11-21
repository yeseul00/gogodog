import { DEFAULT_CHARACTER_ID, isCharacterId } from './characters';
import { isMemoryFragmentId } from './memories';
import { MAX_CHARACTER_NAME_LENGTH, sanitizeCharacterName } from './ranking';
import { isStageId } from './stages';
import type { CharacterId, CollectedMemoriesMap, SavedRecords, StageId } from './types';

const STORAGE_KEY = 'pome_walk_ddaengkong_v1';

const DEFAULT_RECORDS: SavedRecords = {
  bestScore: 0,
  bestDistance: 0,
  totalTreats: 0,
  isMuted: false,
  unlockedStage: 1,
  selectedStage: 1,
  selectedCharacter: DEFAULT_CHARACTER_ID,
  characterName: '',
  localDefaultCounter: 1,
  localDefaultCounters: {
    ddaengkong: 1,
    nari: 1,
    kiki: 1,
  },
  collectedMemories: {},
};

function sanitizePositiveInt(raw: unknown, fallback = 1): number {
  return typeof raw === 'number' && Number.isFinite(raw)
    ? Math.max(1, Math.floor(raw))
    : fallback;
}

function sanitizeCollectedMemories(raw: unknown): CollectedMemoriesMap {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  const clean: CollectedMemoriesMap = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!isMemoryFragmentId(key) || !val || typeof val !== 'object') continue;
    const entry = val as { count?: unknown; firstCollectedAt?: unknown };
    const count =
      typeof entry.count === 'number' && Number.isFinite(entry.count)
        ? Math.max(0, Math.floor(entry.count))
        : 0;
    if (count <= 0) continue;
    const firstCollectedAt =
      typeof entry.firstCollectedAt === 'number' && Number.isFinite(entry.firstCollectedAt)
        ? entry.firstCollectedAt
        : Date.now();
    clean[key] = { count, firstCollectedAt };
  }
  return clean;
}

export function loadRecords(): SavedRecords {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        ...DEFAULT_RECORDS,
        localDefaultCounters: { ...DEFAULT_RECORDS.localDefaultCounters },
        collectedMemories: {},
      };
    }
    const parsed = JSON.parse(raw) as Partial<SavedRecords>;
    const unlockedStage: StageId = isStageId(parsed.unlockedStage) ? parsed.unlockedStage : 1;
    const rawSelected: StageId = isStageId(parsed.selectedStage) ? parsed.selectedStage : 1;
    const selectedStage: StageId = (Math.min(rawSelected, unlockedStage) as StageId) || 1;
    const selectedCharacter: CharacterId = isCharacterId(parsed.selectedCharacter)
      ? parsed.selectedCharacter
      : DEFAULT_CHARACTER_ID;
    const characterName =
      typeof parsed.characterName === 'string'
        ? sanitizeCharacterName(parsed.characterName).slice(0, MAX_CHARACTER_NAME_LENGTH)
        : '';
    const legacyCounter = sanitizePositiveInt(parsed.localDefaultCounter, 1);
    const rawCounters =
      parsed.localDefaultCounters && typeof parsed.localDefaultCounters === 'object'
        ? parsed.localDefaultCounters
        : undefined;
    const localDefaultCounters: Record<CharacterId, number> = {
      ddaengkong: sanitizePositiveInt(rawCounters?.ddaengkong, legacyCounter),
      nari: sanitizePositiveInt(rawCounters?.nari, 1),
      kiki: sanitizePositiveInt(rawCounters?.kiki, 1),
    };

    return {
      bestScore:
        typeof parsed.bestScore === 'number' && Number.isFinite(parsed.bestScore)
          ? Math.max(0, Math.floor(parsed.bestScore))
          : 0,
      bestDistance:
        typeof parsed.bestDistance === 'number' && Number.isFinite(parsed.bestDistance)
          ? Math.max(0, Math.floor(parsed.bestDistance))
          : 0,
      totalTreats:
        typeof parsed.totalTreats === 'number' && Number.isFinite(parsed.totalTreats)
          ? Math.max(0, Math.floor(parsed.totalTreats))
          : 0,
      isMuted: Boolean(parsed.isMuted),
      unlockedStage,
      selectedStage,
      selectedCharacter,
      characterName,
      localDefaultCounter: localDefaultCounters.ddaengkong,
      localDefaultCounters,
      collectedMemories: sanitizeCollectedMemories(parsed.collectedMemories),
    };
  } catch {
    return {
      ...DEFAULT_RECORDS,
      localDefaultCounters: { ...DEFAULT_RECORDS.localDefaultCounters },
      collectedMemories: {},
    };
  }
}

export function saveRecords(records: SavedRecords): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage quota or private-mode errors gracefully
  }
}
