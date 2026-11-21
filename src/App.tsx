import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { GameOverOverlay, type RankingSubmitStatus } from './components/GameOverOverlay';
import { LeaderboardModal } from './components/LeaderboardModal';
import { MemoryAlbumModal, type MemoryAlbumTab } from './components/MemoryAlbumModal';
import { PauseOverlay } from './components/PauseOverlay';
import { TitleOverlay } from './components/TitleOverlay';
import { TopHud } from './components/TopHud';
import { TouchControls } from './components/TouchControls';
import { SoundEngine } from './game/audio';
import { getCharacterDefinition } from './game/characters';
import { PomeWalkEngine } from './game/engine';
import {
  getStageMemories,
  getTotalCollectedCount,
  TOTAL_MEMORY_COUNT,
} from './game/memories';
import {
  allocateDefaultCharacterName,
  computePlayerRankSnapshot,
  MAX_CHARACTER_NAME_LENGTH,
  sanitizeCharacterName,
  submitRankingEntry,
  subscribePublicRankings,
  type RankingEntry,
  type RankingTab,
} from './game/ranking';
import { getNextStageId, getStageDefinition } from './game/stages';
import { loadRecords, saveRecords } from './game/storage';
import type {
  CharacterId,
  CollectedMemoriesMap,
  GameState,
  GameSummary,
  HudSnapshot,
  MemoryFragmentId,
  SavedRecords,
  StageId,
} from './game/types';

function createInitialHud(records: SavedRecords): HudSnapshot {
  const stage = getStageDefinition(records.selectedStage);
  return {
    stageId: stage.id,
    stageStepLabel: stage.stepLabel,
    stageName: stage.name,
    hearts: 3,
    maxHearts: 3,
    score: 0,
    bestScore: records.bestScore,
    distance: 0,
    goalDistance: stage.goalDistance,
    combo: 0,
    maxCombo: 0,
    treatsCollected: 0,
    memoriesCollectedCount: 0,
    stageMemoryTotal: getStageMemories(stage.id).length,
    feverGauge: 0,
    isFever: false,
    feverRemaining: 0,
    timePhase: 'morning',
    timePhaseLabel: '아침 햇살',
    speedMultiplier: 1,
  };
}

function readViewportSize(): { width: number; height: number } {
  if (typeof window === 'undefined') return { width: 1024, height: 640 };
  return { width: window.innerWidth, height: window.innerHeight };
}

export default function App() {
  const [records, setRecords] = useState<SavedRecords>(() => loadRecords());
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [selectedStage, setSelectedStage] = useState<StageId>(() => loadRecords().selectedStage);
  const [unlockedStage, setUnlockedStage] = useState<StageId>(() => loadRecords().unlockedStage);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>(
    () => loadRecords().selectedCharacter
  );
  const [characterNameInput, setCharacterNameInput] = useState<string>(
    () => loadRecords().characterName
  );
  const [activeRunName, setActiveRunName] = useState<string>(() => {
    const initial = loadRecords();
    const charDef = getCharacterDefinition(initial.selectedCharacter);
    return initial.characterName || `${charDef.defaultNamePrefix}1`;
  });
  const [startingRun, setStartingRun] = useState<boolean>(false);
  const [newlyUnlockedStage, setNewlyUnlockedStage] = useState<StageId | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(() => createInitialHud(loadRecords()));
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => loadRecords().isMuted);
  const [viewport, setViewport] = useState<{ width: number; height: number }>(() =>
    readViewportSize()
  );

  // Online Leaderboard State (login-free)
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [rankingsLoading, setRankingsLoading] = useState<boolean>(true);
  const [rankingsError, setRankingsError] = useState<string | null>(null);
  const [rankingSubmitStatus, setRankingSubmitStatus] = useState<RankingSubmitStatus>('idle');
  const [leaderboardOpen, setLeaderboardOpen] = useState<boolean>(false);
  const [leaderboardTab, setLeaderboardTab] = useState<RankingTab>('all');

  // Character Select & Memory Album Modals
  const [characterModalOpen, setCharacterModalOpen] = useState<boolean>(false);
  const [memoryAlbumOpen, setMemoryAlbumOpen] = useState<boolean>(false);
  const [memoryAlbumTab, setMemoryAlbumTab] = useState<MemoryAlbumTab>('all');
  const [newlyDiscoveredMemoryIds, setNewlyDiscoveredMemoryIds] = useState<MemoryFragmentId[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<PomeWalkEngine | null>(null);
  const soundRef = useRef<SoundEngine | null>(null);
  const gameStateRef = useRef<GameState>(gameState);
  const unlockedStageRef = useRef<StageId>(unlockedStage);
  const selectedCharacterRef = useRef<CharacterId>(selectedCharacter);
  const activeRunNameRef = useRef<string>(activeRunName);
  const usedLocalFallbackNameRef = useRef<boolean>(false);
  const recordsRef = useRef<SavedRecords>(records);

  const touchStartAxisRef = useRef<number | null>(null);
  const canvasDuckPointerIdRef = useRef<number | null>(null);

  // Mobile portrait automatically renders in horizontal landscape layout (no blocking rotate gate)
  const isMobilePortrait = viewport.width <= 768 && viewport.height > viewport.width;
  const activeVirtualLandscape = isMobilePortrait;

  const effectiveStageW = activeVirtualLandscape ? viewport.height : viewport.width;
  const effectiveStageH = activeVirtualLandscape ? viewport.width : viewport.height;
  const isCompactLandscape = effectiveStageW > effectiveStageH && effectiveStageH <= 540;
  const isDesktopFrame =
    !activeVirtualLandscape && viewport.width >= 900 && viewport.height >= 580;

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    unlockedStageRef.current = unlockedStage;
  }, [unlockedStage]);

  useEffect(() => {
    selectedCharacterRef.current = selectedCharacter;
  }, [selectedCharacter]);

  useEffect(() => {
    activeRunNameRef.current = activeRunName;
  }, [activeRunName]);

  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  // Subscribe to public online Firestore rankings
  useEffect(() => {
    setRankingsLoading(true);
    const unsubscribe = subscribePublicRankings(
      (entries) => {
        setRankings(entries);
        setRankingsLoading(false);
        setRankingsError(null);
      },
      (friendlyErr) => {
        setRankingsLoading(false);
        setRankingsError(friendlyErr);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setViewport(readViewportSize());
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Trigger engine resize whenever stage geometry changes (including virtual landscape switch)
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      engineRef.current?.resize();
    });
    return () => window.cancelAnimationFrame(id);
  }, [viewport.width, viewport.height, activeVirtualLandscape]);

  const submitScoreToOnlineBoard = useCallback(
    async (runName: string, runSummary: GameSummary) => {
      setRankingSubmitStatus('submitting');
      try {
        let finalName = sanitizeCharacterName(runName);
        const charId = selectedCharacterRef.current;
        if (!finalName || usedLocalFallbackNameRef.current) {
          const localSeq = recordsRef.current.localDefaultCounters?.[charId] ?? 1;
          const allocated = await allocateDefaultCharacterName(localSeq, charId);
          finalName = allocated.name;
          usedLocalFallbackNameRef.current = !allocated.isServerAssigned;
          setCharacterNameInput(finalName);
          setActiveRunName(finalName);
          activeRunNameRef.current = finalName;
          setRecords((prev) => {
            const nextCounters = {
              ...prev.localDefaultCounters,
              [charId]: allocated.nextLocalNumber,
            };
            const updated: SavedRecords = {
              ...prev,
              characterName: finalName,
              localDefaultCounter: nextCounters.ddaengkong,
              localDefaultCounters: nextCounters,
            };
            saveRecords(updated);
            return updated;
          });
        }
        await submitRankingEntry(finalName, runSummary);
        setRankingSubmitStatus('submitted');
      } catch {
        setRankingSubmitStatus('error');
      }
    },
    []
  );

  useEffect(() => {
    const initial = loadRecords();
    const sound = new SoundEngine(initial.isMuted);
    soundRef.current = sound;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new PomeWalkEngine(
      canvas,
      sound,
      {
        onHudUpdate: (nextHud) => {
          setHud(nextHud);
        },
        onGameOver: (runSummary) => {
          const nextStageCandidate =
            runSummary.outcome === 'completed' ? getNextStageId(runSummary.stageId) : null;
          const prevUnlocked = unlockedStageRef.current;
          const nextUnlocked: StageId =
            nextStageCandidate && nextStageCandidate > prevUnlocked
              ? nextStageCandidate
              : prevUnlocked;
          const unlockedJustNow =
            nextStageCandidate && nextStageCandidate > prevUnlocked ? nextStageCandidate : null;

          if (unlockedJustNow) {
            unlockedStageRef.current = nextUnlocked;
            setUnlockedStage(nextUnlocked);
          }

          const prevMemories = recordsRef.current.collectedMemories;
          const newlyFoundMemories = runSummary.collectedMemoryIds.filter(
            (id) => (prevMemories[id]?.count ?? 0) === 0
          );

          setNewlyUnlockedStage(unlockedJustNow);
          setNewlyDiscoveredMemoryIds(newlyFoundMemories);
          setSummary(runSummary);
          setGameState('GAME_OVER');

          setRecords((prev) => {
            const nextMemories: CollectedMemoriesMap = { ...prev.collectedMemories };
            const now = Date.now();
            for (const fragId of runSummary.collectedMemoryIds) {
              const existing = nextMemories[fragId];
              nextMemories[fragId] = existing
                ? { count: existing.count + 1, firstCollectedAt: existing.firstCollectedAt }
                : { count: 1, firstCollectedAt: now };
            }

            const updated: SavedRecords = {
              ...prev,
              bestScore: Math.max(prev.bestScore, runSummary.bestScore),
              bestDistance: Math.max(prev.bestDistance, runSummary.bestDistance),
              totalTreats: prev.totalTreats + runSummary.treatsCollected,
              unlockedStage: Math.max(prev.unlockedStage, nextUnlocked) as StageId,
              collectedMemories: nextMemories,
            };
            saveRecords(updated);
            return updated;
          });

          void submitScoreToOnlineBoard(activeRunNameRef.current, runSummary);
        },
      },
      initial.bestScore,
      initial.bestDistance,
      initial.selectedStage,
      initial.selectedCharacter
    );

    engineRef.current = engine;
    engine.startLoop();

    const resizeObserver = new ResizeObserver(() => {
      engine.resize();
    });
    if (stageRef.current) {
      resizeObserver.observe(stageRef.current);
    }

    const handleVisibility = () => {
      if (document.hidden && gameStateRef.current === 'PLAYING') {
        engine.setState('PAUSED');
        setGameState('PAUSED');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      resizeObserver.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
  }, [submitScoreToOnlineBoard]);

  const handleChangeCharacterName = useCallback((raw: string) => {
    const sliced = raw.slice(0, MAX_CHARACTER_NAME_LENGTH);
    setCharacterNameInput(sliced);
    usedLocalFallbackNameRef.current = false;
    const cleaned = sanitizeCharacterName(sliced);
    setRecords((prev) => {
      const updated: SavedRecords = { ...prev, characterName: cleaned };
      saveRecords(updated);
      return updated;
    });
  }, []);

  const resolveCharacterNameForRun = useCallback(async (): Promise<string> => {
    const cleaned = sanitizeCharacterName(characterNameInput);
    if (cleaned) {
      usedLocalFallbackNameRef.current = false;
      setActiveRunName(cleaned);
      activeRunNameRef.current = cleaned;
      return cleaned;
    }

    const charId = selectedCharacterRef.current;
    const localSeq = recordsRef.current.localDefaultCounters?.[charId] ?? 1;
    const allocated = await allocateDefaultCharacterName(localSeq, charId);
    usedLocalFallbackNameRef.current = !allocated.isServerAssigned;
    setCharacterNameInput(allocated.name);
    setActiveRunName(allocated.name);
    activeRunNameRef.current = allocated.name;
    setRecords((prev) => {
      const nextCounters = {
        ...prev.localDefaultCounters,
        [charId]: allocated.nextLocalNumber,
      };
      const updated: SavedRecords = {
        ...prev,
        characterName: allocated.name,
        localDefaultCounter: nextCounters.ddaengkong,
        localDefaultCounters: nextCounters,
      };
      saveRecords(updated);
      return updated;
    });
    return allocated.name;
  }, [characterNameInput]);

  const handleRetrySubmit = useCallback(() => {
    if (summary) {
      void submitScoreToOnlineBoard(activeRunNameRef.current, summary);
    }
  }, [submitScoreToOnlineBoard, summary]);

  const handleSelectStage = useCallback((stageId: StageId) => {
    if (stageId > unlockedStageRef.current) return;
    soundRef.current?.unlock();
    soundRef.current?.playClick();
    setSelectedStage(stageId);
    engineRef.current?.setStage(stageId);
    setRecords((rec) => {
      const updated: SavedRecords = { ...rec, selectedStage: stageId };
      saveRecords(updated);
      return updated;
    });
  }, []);

  const handleSelectCharacter = useCallback((characterId: CharacterId) => {
    soundRef.current?.unlock();
    soundRef.current?.playClick();
    const prevCharacter = selectedCharacterRef.current;
    setSelectedCharacter(characterId);
    selectedCharacterRef.current = characterId;
    engineRef.current?.setCharacter(characterId);

    // If the input currently holds an auto-generated default name from the other character (e.g. 땡콩1),
    // clear it so starting with the newly selected character cleanly issues its own prefix (e.g. 나리1).
    const otherPrefix = getCharacterDefinition(prevCharacter).defaultNamePrefix;
    const isOtherAutoDefault =
      prevCharacter !== characterId &&
      new RegExp(`^${otherPrefix}\\d+$`).test(sanitizeCharacterName(recordsRef.current.characterName));

    if (isOtherAutoDefault) {
      setCharacterNameInput('');
      usedLocalFallbackNameRef.current = false;
    }

    setRecords((rec) => {
      const updated: SavedRecords = {
        ...rec,
        selectedCharacter: characterId,
        characterName: isOtherAutoDefault ? '' : rec.characterName,
      };
      saveRecords(updated);
      return updated;
    });
  }, []);

  const handleOpenCharacterSelect = useCallback(() => {
    soundRef.current?.unlock();
    soundRef.current?.playClick();
    setLeaderboardOpen(false);
    setMemoryAlbumOpen(false);
    setCharacterModalOpen(true);
  }, []);

  const handleStartGame = useCallback(async () => {
    if (startingRun) return;
    soundRef.current?.unlock();
    soundRef.current?.playClick();
    setStartingRun(true);
    try {
      await resolveCharacterNameForRun();
      setSummary(null);
      setNewlyUnlockedStage(null);
      setNewlyDiscoveredMemoryIds([]);
      setRankingSubmitStatus('idle');
      setLeaderboardOpen(false);
      setMemoryAlbumOpen(false);
      setCharacterModalOpen(false);
      setGameState('PLAYING');
      engineRef.current?.startNewRun();
    } finally {
      setStartingRun(false);
    }
  }, [resolveCharacterNameForRun, startingRun]);

  const handleStartNextStage = useCallback(
    async (nextStageId: StageId) => {
      if (startingRun) return;
      soundRef.current?.unlock();
      soundRef.current?.playClick();
      setStartingRun(true);
      try {
        await resolveCharacterNameForRun();
        setSelectedStage(nextStageId);
        setSummary(null);
        setNewlyUnlockedStage(null);
        setNewlyDiscoveredMemoryIds([]);
        setRankingSubmitStatus('idle');
        setLeaderboardOpen(false);
        setMemoryAlbumOpen(false);
        setGameState('PLAYING');
        setRecords((rec) => {
          const updated: SavedRecords = {
            ...rec,
            selectedStage: nextStageId,
            unlockedStage: Math.max(rec.unlockedStage, nextStageId) as StageId,
          };
          saveRecords(updated);
          return updated;
        });
        engineRef.current?.startNewRun(nextStageId);
      } finally {
        setStartingRun(false);
      }
    },
    [resolveCharacterNameForRun, startingRun]
  );

  const handleTogglePause = useCallback(() => {
    soundRef.current?.playClick();
    setGameState((prev) => {
      if (prev === 'PLAYING') {
        engineRef.current?.setState('PAUSED');
        return 'PAUSED';
      }
      if (prev === 'PAUSED') {
        engineRef.current?.setState('PLAYING');
        return 'PLAYING';
      }
      return prev;
    });
  }, []);

  const handleGoTitle = useCallback(() => {
    soundRef.current?.playClick();
    setSummary(null);
    setNewlyUnlockedStage(null);
    setNewlyDiscoveredMemoryIds([]);
    setRankingSubmitStatus('idle');
    setGameState('TITLE_MENU');
    engineRef.current?.setState('TITLE_MENU');
  }, []);

  const handleOpenLeaderboard = useCallback((initialTab: RankingTab = 'all') => {
    soundRef.current?.unlock();
    soundRef.current?.playClick();
    setMemoryAlbumOpen(false);
    setCharacterModalOpen(false);
    setLeaderboardTab(initialTab);
    setLeaderboardOpen(true);
  }, []);

  const handleOpenMemoryAlbum = useCallback((initialTab: MemoryAlbumTab = 'all') => {
    soundRef.current?.unlock();
    soundRef.current?.playClick();
    setLeaderboardOpen(false);
    setCharacterModalOpen(false);
    setMemoryAlbumTab(initialTab);
    setMemoryAlbumOpen(true);
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundRef.current?.setMuted(next);
      if (!next) {
        soundRef.current?.unlock();
        soundRef.current?.playClick();
      }
      setRecords((rec) => {
        const updated = { ...rec, isMuted: next };
        saveRecords(updated);
        return updated;
      });
      return next;
    });
  }, []);

  const handleJumpPress = useCallback(() => {
    engineRef.current?.triggerJumpPress();
  }, []);

  const handleJumpRelease = useCallback(() => {
    engineRef.current?.triggerJumpRelease();
  }, []);

  const handleDuckChange = useCallback((active: boolean) => {
    engineRef.current?.setDucking(active);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
        if (e.code === 'Enter' && gameStateRef.current === 'TITLE_MENU') {
          e.preventDefault();
          void handleStartGame();
        }
        return;
      }

      if (leaderboardOpen || memoryAlbumOpen || characterModalOpen) {
        if (e.code === 'Escape') {
          e.preventDefault();
          setLeaderboardOpen(false);
          setMemoryAlbumOpen(false);
          setCharacterModalOpen(false);
        }
        return;
      }

      const code = e.code;
      const state = gameStateRef.current;

      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
        e.preventDefault();
        if (e.repeat) return;
        if (state === 'PLAYING') {
          engineRef.current?.triggerJumpPress();
        } else if (state === 'TITLE_MENU' || state === 'GAME_OVER') {
          void handleStartGame();
        }
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        e.preventDefault();
        if (state === 'PLAYING') {
          engineRef.current?.setDucking(true);
        }
      } else if (code === 'KeyP' || code === 'Escape') {
        if (state === 'PLAYING' || state === 'PAUSED') {
          e.preventDefault();
          handleTogglePause();
        }
      } else if (code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      const code = e.code;
      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
        engineRef.current?.triggerJumpRelease();
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        engineRef.current?.setDucking(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [
    handleStartGame,
    handleTogglePause,
    handleToggleMute,
    leaderboardOpen,
    memoryAlbumOpen,
    characterModalOpen,
  ]);

  const totalCollectedMemories = useMemo(
    () => getTotalCollectedCount(records.collectedMemories),
    [records.collectedMemories]
  );

  const rankSnapshot = useMemo(
    () =>
      computePlayerRankSnapshot(
        rankings,
        activeRunName,
        summary?.stageId ?? selectedStage
      ),
    [rankings, activeRunName, summary?.stageId, selectedStage]
  );

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING') return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();

    const relX = activeVirtualLandscape
      ? (e.clientY - rect.top) / rect.height
      : (e.clientX - rect.left) / rect.width;
    touchStartAxisRef.current = activeVirtualLandscape ? -e.clientX : e.clientY;

    if (relX < 0.34) {
      canvasDuckPointerIdRef.current = e.pointerId;
      engineRef.current?.setDucking(true);
    } else {
      engineRef.current?.triggerJumpPress();
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING' || touchStartAxisRef.current === null) return;
    const currentAxis = activeVirtualLandscape ? -e.clientX : e.clientY;
    const dy = currentAxis - touchStartAxisRef.current;
    if (dy > 26) {
      canvasDuckPointerIdRef.current = e.pointerId;
      engineRef.current?.setDucking(true);
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    touchStartAxisRef.current = null;
    if (canvasDuckPointerIdRef.current === e.pointerId) {
      canvasDuckPointerIdRef.current = null;
      engineRef.current?.setDucking(false);
    } else {
      engineRef.current?.triggerJumpRelease();
    }
  };

  const stageStyle: React.CSSProperties | undefined = activeVirtualLandscape
    ? {
        position: 'fixed',
        top: '50%',
        left: '50%',
        width: `${viewport.height}px`,
        height: `${viewport.width}px`,
        transform: 'translate(-50%, -50%) rotate(90deg)',
        transformOrigin: 'center center',
      }
    : undefined;

  return (
    <div
      className={`h-[100dvh] w-full flex items-center justify-center watercolor-paper-bg overflow-hidden select-none ${
        isDesktopFrame ? 'p-4' : 'p-0'
      }`}
    >
      {/* Full-bleed mobile landscape / framed storybook desktop viewport */}
      <div
        ref={stageRef}
        style={stageStyle}
        className={`relative overflow-hidden bg-[#DFF0F6] ${
          activeVirtualLandscape
            ? ''
            : isDesktopFrame
              ? 'w-full h-full max-w-6xl rounded-[32px] border border-white/80 shadow-[0_20px_60px_rgba(92,70,50,0.14)]'
              : 'w-full h-full'
        }`}
      >
        {/* Full-screen living 3-stage walk canvas */}
        <canvas
          ref={canvasRef}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerCancel={handleCanvasPointerUp}
          className="block w-full h-full touch-none cursor-pointer"
          aria-label="땡콩이의 산책 게임 화면"
        />

        {/* Floating Minimal Cream-Glass HUD */}
        <TopHud
          hud={hud}
          gameState={gameState}
          isMuted={isMuted}
          compactLandscape={isCompactLandscape}
          onToggleMute={handleToggleMute}
          onTogglePause={handleTogglePause}
        />

        {/* Floating Sculpted Dual-Thumb Pads */}
        <TouchControls
          visible={gameState === 'PLAYING'}
          compactLandscape={isCompactLandscape}
          onJumpPress={handleJumpPress}
          onJumpRelease={handleJumpRelease}
          onDuckChange={handleDuckChange}
        />

        {/* Overlays */}
        {gameState === 'TITLE_MENU' && (
          <TitleOverlay
            records={records}
            selectedStage={selectedStage}
            unlockedStage={unlockedStage}
            selectedCharacter={selectedCharacter}
            characterName={characterNameInput}
            collectedMemoryCount={totalCollectedMemories}
            totalMemoryCount={TOTAL_MEMORY_COUNT}
            starting={startingRun}
            compactLandscape={isCompactLandscape}
            onChangeCharacterName={handleChangeCharacterName}
            onSelectStage={handleSelectStage}
            onOpenCharacterSelect={handleOpenCharacterSelect}
            onOpenLeaderboard={() => handleOpenLeaderboard('all')}
            onOpenMemoryAlbum={() => handleOpenMemoryAlbum('all')}
            onStart={() => void handleStartGame()}
          />
        )}

        {gameState === 'PAUSED' && (
          <PauseOverlay
            stageId={selectedStage}
            selectedCharacter={selectedCharacter}
            compactLandscape={isCompactLandscape}
            onResume={handleTogglePause}
            onRestart={() => void handleStartGame()}
            onGoTitle={handleGoTitle}
          />
        )}

        {gameState === 'GAME_OVER' && summary && (
          <GameOverOverlay
            summary={summary}
            selectedCharacter={selectedCharacter}
            characterName={activeRunName}
            newlyUnlockedStage={newlyUnlockedStage}
            newlyDiscoveredMemoryIds={newlyDiscoveredMemoryIds}
            rankSnapshot={rankSnapshot}
            rankingStatus={rankingSubmitStatus}
            compactLandscape={isCompactLandscape}
            onRestart={() => void handleStartGame()}
            onStartNextStage={(nextId) => void handleStartNextStage(nextId)}
            onOpenLeaderboard={() => handleOpenLeaderboard(summary.stageId)}
            onOpenMemoryAlbum={() => handleOpenMemoryAlbum(summary.stageId)}
            onRetrySubmit={handleRetrySubmit}
            onGoTitle={handleGoTitle}
          />
        )}

        {/* Online Ranking Leaderboard Modal */}
        <LeaderboardModal
          open={leaderboardOpen}
          activeTab={leaderboardTab}
          entries={rankings}
          loading={rankingsLoading}
          error={rankingsError}
          currentCharacterName={activeRunName || characterNameInput}
          compactLandscape={isCompactLandscape}
          onChangeTab={setLeaderboardTab}
          onClose={() => setLeaderboardOpen(false)}
        />

        {/* Collectible Memory Album Modal */}
        <MemoryAlbumModal
          open={memoryAlbumOpen}
          activeTab={memoryAlbumTab}
          collectedMemories={records.collectedMemories}
          newlyDiscoveredIds={newlyDiscoveredMemoryIds}
          compactLandscape={isCompactLandscape}
          onChangeTab={setMemoryAlbumTab}
          onClose={() => setMemoryAlbumOpen(false)}
        />

        {/* Playable Character Select Modal */}
        <CharacterSelectModal
          open={characterModalOpen}
          selectedCharacter={selectedCharacter}
          compactLandscape={isCompactLandscape}
          onSelect={handleSelectCharacter}
          onClose={() => setCharacterModalOpen(false)}
        />
      </div>
    </div>
  );
}
