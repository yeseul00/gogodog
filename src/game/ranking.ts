import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { DEFAULT_CHARACTER_ID, getCharacterDefinition } from './characters';
import { isStageId } from './stages';
import type { CharacterId, GameSummary, StageId, WalkOutcome } from './types';

export const MAX_CHARACTER_NAME_LENGTH = 12;

export type RankingTab = 'all' | StageId;

export interface RankingEntry {
  id: string;
  userId: string;
  characterName: string;
  stageId: StageId;
  score: number;
  distance: number;
  outcome: WalkOutcome;
  treatsCollected: number;
  maxCombo: number;
  isPublic: boolean;
  createdAtMs: number;
}

export interface RankedRow {
  rank: number;
  entry: RankingEntry;
}

export interface PlayerRankSnapshot {
  overallRank: number | null;
  overallTotal: number;
  stageRank: number | null;
  stageTotal: number;
  topStageRows: RankedRow[];
}

export function sanitizeCharacterName(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_CHARACTER_NAME_LENGTH);
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function makeSafeEntryId(uid: string): string {
  const cleanUid = uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) || 'player';
  const rand = Math.floor(Math.random() * 100000);
  return `${cleanUid}_${Date.now()}_${rand}`;
}

/**
 * Allocates the next sequential default character name (땡콩1, 땡콩2 / 나리1, 나리2 / 키키1, 키키2).
 * Uses an atomic Firestore transaction on counters/defaultName, counters/defaultName_nari, or counters/defaultName_kiki when signed in,
 * and falls back gracefully to a local per-character sequential number when offline or signed out.
 */
export async function allocateDefaultCharacterName(
  user: User | null,
  localNextNumber: number,
  characterId: CharacterId = DEFAULT_CHARACTER_ID
): Promise<{ name: string; nextLocalNumber: number; isServerAssigned: boolean }> {
  const charDef = getCharacterDefinition(characterId);
  const prefix = charDef.defaultNamePrefix;
  const counterDocId = charDef.counterDocId;
  const safeLocal = Math.max(1, Math.floor(localNextNumber || 1));

  if (user && user.emailVerified) {
    const counterPath = `counters/${counterDocId}`;
    try {
      const assignedNum = await runTransaction(db, async (tx) => {
        const ref = doc(db, 'counters', counterDocId);
        const snap = await tx.get(ref);
        if (!snap.exists()) {
          tx.set(ref, {
            count: 1,
            updatedAt: serverTimestamp(),
          });
          return 1;
        }
        const currentRaw = snap.data()?.count;
        const current = typeof currentRaw === 'number' && Number.isFinite(currentRaw) ? Math.floor(currentRaw) : 0;
        const next = Math.min(10000000, Math.max(1, current + 1));
        tx.update(ref, {
          count: next,
          updatedAt: serverTimestamp(),
        });
        return next;
      });

      return {
        name: `${prefix}${assignedNum}`,
        nextLocalNumber: Math.max(safeLocal, assignedNum + 1),
        isServerAssigned: true,
      };
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, counterPath);
      } catch {
        // Gracefully fall back to local counter so player can always start walking immediately
      }
    }
  }

  return {
    name: `${prefix}${safeLocal}`,
    nextLocalNumber: safeLocal + 1,
    isServerAssigned: false,
  };
}

/**
 * Subscribes to public online leaderboard entries in real time.
 */
export function subscribePublicRankings(
  onData: (entries: RankingEntry[]) => void,
  onError: (friendlyMessage: string) => void
): Unsubscribe {
  const rankingsPath = 'rankings';
  const q = query(
    collection(db, rankingsPath),
    where('isPublic', '==', true),
    limit(250)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const parsed: RankingEntry[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const rawStage = d.stageId;
        if (!isStageId(rawStage)) return;
        const rawName = typeof d.characterName === 'string' ? sanitizeCharacterName(d.characterName) : '';
        if (!rawName) return;

        const created = d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : 0;
        parsed.push({
          id: docSnap.id,
          userId: typeof d.userId === 'string' ? d.userId : '',
          characterName: rawName,
          stageId: rawStage,
          score: typeof d.score === 'number' ? clampInt(d.score, 0, 999999) : 0,
          distance: typeof d.distance === 'number' ? clampInt(d.distance, 0, 1000) : 0,
          outcome: d.outcome === 'completed' ? 'completed' : 'early_return',
          treatsCollected: typeof d.treatsCollected === 'number' ? clampInt(d.treatsCollected, 0, 9999) : 0,
          maxCombo: typeof d.maxCombo === 'number' ? clampInt(d.maxCombo, 0, 9999) : 0,
          isPublic: true,
          createdAtMs: created,
        });
      });
      onData(parsed);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, rankingsPath);
      } catch {
        // Surface friendly status message to UI without crashing gameplay
      }
      onError('랭킹 정보를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.');
    }
  );
}

/**
 * Submits an immutable run record to Firestore under strict blueprint constraints.
 */
export async function submitRankingEntry(
  user: User,
  characterName: string,
  summary: GameSummary
): Promise<string> {
  const safeName = sanitizeCharacterName(characterName);
  if (!safeName) {
    throw new Error('캐릭터 이름이 비어 있습니다.');
  }

  const entryId = makeSafeEntryId(user.uid);
  const path = `rankings/${entryId}`;

  const payload = {
    userId: user.uid,
    characterName: safeName,
    stageId: summary.stageId,
    score: clampInt(summary.score, 0, 999999),
    distance: clampInt(summary.distance, 0, 1000),
    outcome: summary.outcome === 'completed' ? 'completed' : 'early_return',
    treatsCollected: clampInt(summary.treatsCollected, 0, 9999),
    maxCombo: clampInt(summary.maxCombo, 0, 9999),
    isPublic: true,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'rankings', entryId), payload);
    return entryId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

function compareEntries(a: RankingEntry, b: RankingEntry): number {
  if (b.score !== a.score) return b.score - a.score;
  if (a.outcome !== b.outcome) return a.outcome === 'completed' ? -1 : 1;
  if (b.distance !== a.distance) return b.distance - a.distance;
  return a.createdAtMs - b.createdAtMs;
}

/**
 * Builds a deduplicated, sorted leaderboard for the chosen tab ('all' | 1 | 2 | 3).
 * Keeps each character's highest score in the tab so one player does not flood the board.
 */
export function buildLeaderboard(entries: RankingEntry[], tab: RankingTab): RankedRow[] {
  const filtered = tab === 'all' ? entries : entries.filter((e) => e.stageId === tab);
  const bestByCharacter = new Map<string, RankingEntry>();

  for (const entry of filtered) {
    const key = entry.characterName.toLowerCase();
    const existing = bestByCharacter.get(key);
    if (!existing || compareEntries(entry, existing) < 0) {
      bestByCharacter.set(key, entry);
    }
  }

  const sorted = Array.from(bestByCharacter.values()).sort(compareEntries);
  return sorted.map((entry, idx) => ({
    rank: idx + 1,
    entry,
  }));
}

/**
 * Computes the player's current overall & stage ranks plus Top 3 stage preview rows.
 */
export function computePlayerRankSnapshot(
  entries: RankingEntry[],
  characterName: string,
  stageId: StageId
): PlayerRankSnapshot {
  const normalized = sanitizeCharacterName(characterName).toLowerCase();
  const overallBoard = buildLeaderboard(entries, 'all');
  const stageBoard = buildLeaderboard(entries, stageId);

  const overallMatch = normalized
    ? overallBoard.find((row) => row.entry.characterName.toLowerCase() === normalized)
    : undefined;
  const stageMatch = normalized
    ? stageBoard.find((row) => row.entry.characterName.toLowerCase() === normalized)
    : undefined;

  return {
    overallRank: overallMatch?.rank ?? null,
    overallTotal: overallBoard.length,
    stageRank: stageMatch?.rank ?? null,
    stageTotal: stageBoard.length,
    topStageRows: stageBoard.slice(0, 3),
  };
}
