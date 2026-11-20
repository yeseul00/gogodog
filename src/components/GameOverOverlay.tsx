import { ArrowRight, BookHeart, Home, LogIn, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCharacterDefinition } from '../game/characters';
import { getStageMemories } from '../game/memories';
import type { PlayerRankSnapshot } from '../game/ranking';
import { getNextStageId, getStageDefinition } from '../game/stages';
import type { CharacterId, GameSummary, MemoryFragmentId, StageId } from '../game/types';
import { MemoryIcon } from './MemoryIcon';

export type RankingSubmitStatus = 'idle' | 'submitting' | 'submitted' | 'needs_auth' | 'error';

interface GameOverOverlayProps {
  summary: GameSummary;
  selectedCharacter: CharacterId;
  characterName: string;
  newlyUnlockedStage: StageId | null;
  newlyDiscoveredMemoryIds: MemoryFragmentId[];
  rankSnapshot: PlayerRankSnapshot;
  rankingStatus: RankingSubmitStatus;
  authBusy: boolean;
  compactLandscape?: boolean;
  onRestart: () => void;
  onStartNextStage: (nextStageId: StageId) => void;
  onOpenLeaderboard: () => void;
  onOpenMemoryAlbum: () => void;
  onSignInAndSubmit: () => void;
  onRetrySubmit: () => void;
  onGoTitle: () => void;
}

export function GameOverOverlay({
  summary,
  selectedCharacter,
  characterName,
  newlyUnlockedStage,
  newlyDiscoveredMemoryIds,
  rankSnapshot,
  rankingStatus,
  authBusy,
  compactLandscape = false,
  onRestart,
  onStartNextStage,
  onOpenLeaderboard,
  onOpenMemoryAlbum,
  onSignInAndSubmit,
  onRetrySubmit,
  onGoTitle,
}: GameOverOverlayProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const isCompleted = summary.outcome === 'completed';
  const nextStageId = isCompleted ? getNextStageId(summary.stageId) : null;
  const nextStage = nextStageId ? getStageDefinition(nextStageId) : null;
  const unlockedStageDef = newlyUnlockedStage ? getStageDefinition(newlyUnlockedStage) : null;
  const activeCharacter = getCharacterDefinition(selectedCharacter);
  const stageMemories = getStageMemories(summary.stageId);

  useEffect(() => {
    setImgFailed(false);
  }, [summary.outcome, summary.stageId, selectedCharacter]);

  const portraitSrc = isCompleted
    ? activeCharacter.happyHomeArtUrl
    : activeCharacter.sadHomeArtUrl;
  const portraitAlt = isCompleted
    ? activeCharacter.happyHomeArtAlt
    : activeCharacter.sadHomeArtAlt;

  const outcomeTitle = isCompleted
    ? `${activeCharacter.name} 즐겁게 귀가!`
    : `${activeCharacter.name} 중도 귀가`;

  const completionDesc =
    isCompleted && !nextStage
      ? `${activeCharacter.name}와 3단계 저녁 카페거리까지 모든 산책 코스를 멋지게 완주했어요!`
      : isCompleted
        ? `${activeCharacter.name}가 산책을 끝까지 마치고 꼬리를 살랑이며 무사히 집에 도착했어요.`
        : `${activeCharacter.name}가 조금 지쳐서 중도 귀가했어요. 잠깐 쉬고 다시 산책해 볼까요?`;

  const rankHeadline =
    rankSnapshot.overallRank !== null && rankSnapshot.stageRank !== null
      ? `전체 ${rankSnapshot.overallRank}위 · ${summary.stageStepLabel} ${rankSnapshot.stageRank}위`
      : rankSnapshot.overallRank !== null
        ? `전체 ${rankSnapshot.overallRank}위`
        : null;

  if (compactLandscape) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center p-2 safe-px bg-[#3A2C22]/28 backdrop-blur-[3px]">
        <div className="w-full max-w-[640px] max-h-full overflow-hidden rounded-[26px] bg-[#FFFDF9]/95 backdrop-blur-md border border-white/90 shadow-[0_18px_46px_rgba(62,44,30,0.28)] grid grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
          {/* Left Outcome Portrait */}
          <div
            className={`relative h-full min-h-[246px] overflow-hidden ${
              isCompleted
                ? 'bg-gradient-to-br from-[#FDE2B8] via-[#FCE6E2] to-[#E6F1D8]'
                : 'bg-gradient-to-br from-[#E9D2BE] via-[#F2E2D4] to-[#D8CFC8]'
            }`}
          >
            {!imgFailed ? (
              <img
                src={portraitSrc}
                alt={portraitAlt}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4 text-center">
                <span className="font-display text-xl text-[#8A5434]">{outcomeTitle}</span>
              </div>
            )}
            <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#FFFDF9] via-[#FFFDF9]/45 to-transparent" />
          </div>

          {/* Right Summary, Ranking & Actions */}
          <div className="px-3.5 py-2.5 flex flex-col justify-center text-left min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-[11px] text-[#88705E] truncate min-w-0">
                <strong className="text-[#4A3528] truncate">{characterName}</strong>
                <span aria-hidden="true">·</span>
                <span className="font-bold text-[#5B8773] whitespace-nowrap">
                  {summary.stageStepLabel} {summary.stageName}
                </span>
              </div>

              <button
                type="button"
                onClick={onOpenLeaderboard}
                className="min-h-[34px] px-2.5 rounded-xl bg-[#FCECE0] hover:bg-[#F7DEC9] text-[#B85B2A] text-[11px] font-bold flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>랭킹</span>
              </button>
            </div>

            <h2
              className={`mt-0.5 font-display text-[21px] leading-tight ${
                isCompleted ? 'text-[#B85B2A]' : 'text-[#4A3528]'
              }`}
            >
              {outcomeTitle}
            </h2>

            {/* Inline Ranking Status / Unlock Strip */}
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] font-bold">
              {rankingStatus === 'submitting' && (
                <span className="text-[#847060]">온라인 랭킹 등록 중...</span>
              )}
              {rankingStatus === 'submitted' && rankHeadline && (
                <span className="inline-flex items-center gap-1 text-[#B85B2A]">
                  <Trophy className="w-3 h-3" aria-hidden="true" />
                  <span>{rankHeadline}</span>
                </span>
              )}
              {rankingStatus === 'needs_auth' && (
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={onSignInAndSubmit}
                  className="inline-flex items-center gap-1 text-[#C86D3B] underline underline-offset-2 cursor-pointer"
                >
                  <LogIn className="w-3 h-3" aria-hidden="true" />
                  <span>{authBusy ? '로그인 중...' : 'Google 로그인하고 랭킹 등록'}</span>
                </button>
              )}
              {rankingStatus === 'error' && (
                <button
                  type="button"
                  onClick={onRetrySubmit}
                  className="text-[#B84A42] underline underline-offset-2 cursor-pointer"
                >
                  등록 실패 · 다시 시도
                </button>
              )}
              {unlockedStageDef && (
                <span className="inline-flex items-center gap-1 text-[#497C66]">
                  <Sparkles className="w-3 h-3" aria-hidden="true" />
                  <span>{unlockedStageDef.heading} 해금!</span>
                </span>
              )}
            </div>

            <div className="mt-2 grid grid-cols-2 border-y border-[#EFE6D8] divide-x divide-[#EFE6D8] text-center">
              <div className="py-1 px-1.5">
                <div className="text-[10px] text-[#847060]">최종 점수</div>
                <div className="font-mono-num text-lg font-bold text-[#4A3528] leading-tight">
                  {summary.score.toLocaleString()}
                </div>
                <div className="text-[10px] text-[#968272] font-mono-num">
                  최고 {summary.bestScore.toLocaleString()}
                </div>
              </div>
              <div className="py-1 px-1.5">
                <div className="text-[10px] text-[#847060]">산책 거리</div>
                <div className="font-mono-num text-lg font-bold text-[#4A3528] leading-tight">
                  {summary.distance}m
                </div>
                <div className="text-[10px] text-[#968272] font-mono-num">
                  목표 {summary.goalDistance}m {isCompleted ? '달성' : '중'}
                </div>
              </div>
            </div>

            <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-[#745E4E]">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <span>
                  간식 <strong className="font-mono-num text-[#4A3528]">{summary.treatsCollected}개</strong>
                </span>
                <span className="text-[#D8CBB8]" aria-hidden="true">·</span>
                <span>
                  추억{' '}
                  <strong className="font-mono-num text-[#B85B2A]">
                    {summary.collectedMemoryIds.length}/{stageMemories.length}
                  </strong>
                </span>
                {summary.memoryBonusTotal > 0 && (
                  <>
                    <span className="text-[#D8CBB8]" aria-hidden="true">·</span>
                    <span className="font-mono-num font-bold text-[#497C66]">
                      +{summary.memoryBonusTotal}
                    </span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={onOpenMemoryAlbum}
                className="flex items-center gap-1 text-[#3F6B58] hover:text-[#2F5343] font-bold whitespace-nowrap shrink-0 cursor-pointer"
              >
                <div className="flex items-center -space-x-1">
                  {stageMemories.map((frag) => (
                    <MemoryIcon
                      key={frag.id}
                      id={frag.id}
                      locked={!summary.collectedMemoryIds.includes(frag.id)}
                      size={22}
                    />
                  ))}
                </div>
                <span>앨범 →</span>
              </button>
            </div>

            <div className="mt-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={onGoTitle}
                aria-label="코스 선택 화면으로 이동"
                className="min-h-[44px] min-w-[44px] px-2.5 rounded-[14px] bg-[#F3ECE0] hover:bg-[#EAE0D0] active:scale-[0.98] text-[#6E594A] text-xs font-bold flex items-center justify-center gap-1 transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" aria-hidden="true" />
                <span>코스</span>
              </button>

              {nextStage ? (
                <>
                  <button
                    type="button"
                    onClick={onRestart}
                    className="min-h-[44px] px-2.5 rounded-[14px] bg-[#E8F4EE] hover:bg-[#D9ECE2] active:scale-[0.98] text-[#3F6B58] text-xs font-bold flex items-center justify-center gap-1 transition-all whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.4} aria-hidden="true" />
                    <span>다시</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onStartNextStage(nextStage.id)}
                    className="flex-1 min-h-[44px] px-3 rounded-[14px] bg-[#D67844] hover:bg-[#C46936] active:scale-[0.98] text-[#FFFDF9] font-display text-base flex items-center justify-center gap-1.5 shadow-[0_6px_16px_rgba(214,120,68,0.3)] transition-all whitespace-nowrap cursor-pointer"
                  >
                    <span>{nextStage.stepLabel} 출발</span>
                    <ArrowRight className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onRestart}
                  className="flex-1 min-h-[44px] px-3 rounded-[14px] bg-[#D67844] hover:bg-[#C46936] active:scale-[0.98] text-[#FFFDF9] font-display text-base flex items-center justify-center gap-1.5 shadow-[0_6px_16px_rgba(214,120,68,0.3)] transition-all whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
                  <span>{isCompleted ? '한 번 더 산책하기' : '다시 산책하기'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4 sm:p-6 bg-[#3A2C22]/28 backdrop-blur-[3px]">
      <div className="w-full max-w-[390px] sm:max-w-[436px] max-h-full overflow-y-auto rounded-[32px] bg-[#FFFDF9]/95 backdrop-blur-md border border-white/90 shadow-[0_20px_50px_rgba(62,44,30,0.28)]">
        {/* Outcome-specific Return-Home Portrait */}
        <div
          className={`relative aspect-[16/10] w-full overflow-hidden ${
            isCompleted
              ? 'bg-gradient-to-br from-[#FDE2B8] via-[#FCE6E2] to-[#E6F1D8]'
              : 'bg-gradient-to-br from-[#E9D2BE] via-[#F2E2D4] to-[#D8CFC8]'
          }`}
        >
          {!imgFailed ? (
            <img
              src={portraitSrc}
              alt={portraitAlt}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-6 text-center">
              <span className="font-display text-2xl text-[#8A5434]">{outcomeTitle}</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#FFFDF9] via-[#FFFDF9]/55 to-transparent" />
        </div>

        <div className="px-6 pb-6 pt-1 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#88705E]">
            <strong className="text-[#4A3528]">{characterName}</strong>
            <span aria-hidden="true">·</span>
            <span className="font-bold text-[#5B8773]">
              {summary.stageStepLabel} · {summary.stageName}
            </span>
          </div>

          <h2
            className={`mt-1 font-display text-[27px] sm:text-[30px] leading-tight [text-wrap:balance] ${
              isCompleted ? 'text-[#B85B2A]' : 'text-[#4A3528]'
            }`}
          >
            {outcomeTitle}
          </h2>

          <p className="mt-1 text-xs sm:text-sm text-[#745E4E] leading-relaxed">{completionDesc}</p>

          {(unlockedStageDef || summary.completionBonus > 0 || summary.isNewBestScore) && (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-bold">
              {unlockedStageDef && (
                <span className="inline-flex items-center gap-1 text-[#C86D3B]">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{unlockedStageDef.heading} 코스가 열렸어요!</span>
                </span>
              )}
              {summary.completionBonus > 0 && (
                <span className="inline-flex items-center gap-1 text-[#497C66]">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>완주 보너스 +{summary.completionBonus}</span>
                </span>
              )}
              {summary.isNewBestScore && (
                <span className="inline-flex items-center gap-1 text-[#C86D14]">
                  <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>최고 점수 갱신!</span>
                </span>
              )}
            </div>
          )}

          {/* Clean 2x2 tabular metrics */}
          <div className="mt-3 grid grid-cols-2 border-y border-[#EFE6D8] divide-x divide-[#EFE6D8] text-center">
            <div className="py-2.5 px-2">
              <div className="text-[11px] text-[#847060]">최종 점수</div>
              <div className="font-mono-num text-2xl font-bold text-[#4A3528] mt-0.5">
                {summary.score.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#968272] font-mono-num">
                최고 {summary.bestScore.toLocaleString()}
              </div>
            </div>
            <div className="py-2.5 px-2">
              <div className="text-[11px] text-[#847060]">산책 거리</div>
              <div className="font-mono-num text-2xl font-bold text-[#4A3528] mt-0.5">
                {summary.distance}m
              </div>
              <div className="text-[11px] text-[#968272] font-mono-num">
                {isCompleted
                  ? `목표 ${summary.goalDistance}m 달성`
                  : `목표 ${summary.goalDistance}m 중`}
              </div>
            </div>
          </div>

          {/* Collected Stage Memory Fragments Strip */}
          <div className="mt-3 rounded-[20px] bg-[#FAF4EB] border border-[#EDE2D2] px-3.5 py-2.5 text-left">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <BookHeart className="w-4 h-4 text-[#497C66] shrink-0" aria-hidden="true" />
                <span className="text-xs font-bold text-[#4A3528] whitespace-nowrap">
                  이번 산책 추억 조각{' '}
                  <span className="font-mono-num text-[#C86D3B]">
                    {summary.collectedMemoryIds.length}/{stageMemories.length}
                  </span>
                </span>
                {summary.memoryBonusTotal > 0 && (
                  <span className="text-[11px] font-mono-num font-bold text-[#497C66] whitespace-nowrap">
                    · +{summary.memoryBonusTotal}점
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={onOpenMemoryAlbum}
                className="text-xs font-bold text-[#3F6B58] hover:text-[#2D5040] whitespace-nowrap shrink-0 cursor-pointer"
              >
                추억 앨범 →
              </button>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {stageMemories.map((frag) => {
                const gotThisRun = summary.collectedMemoryIds.includes(frag.id);
                const isNew = newlyDiscoveredMemoryIds.includes(frag.id);
                return (
                  <button
                    key={frag.id}
                    type="button"
                    onClick={onOpenMemoryAlbum}
                    className={`p-1.5 rounded-[14px] border text-center flex flex-col items-center justify-center transition-colors cursor-pointer ${
                      gotThisRun
                        ? 'bg-[#FFFDF9] border-[#E7D4B5]'
                        : 'bg-[#F5EFE6]/70 border-[#EAE0D0]/70'
                    }`}
                  >
                    <MemoryIcon id={frag.id} locked={!gotThisRun} size={34} />
                    <span
                      className={`mt-1 text-[10px] leading-tight truncate w-full ${
                        gotThisRun ? 'font-bold text-[#4A3528]' : 'text-[#9B897A]'
                      }`}
                    >
                      {gotThisRun ? frag.name : '미획득'}
                    </span>
                    {isNew && (
                      <span className="text-[9px] font-bold text-[#C86D3B] leading-none mt-0.5">
                        신규 기록
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Online Ranking Card Strip */}
          <div className="mt-2.5 rounded-[20px] bg-[#FAF4EB] border border-[#EDE2D2] px-3.5 py-2.5 text-left">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Trophy className="w-4 h-4 text-[#C86D3B] shrink-0" aria-hidden="true" />
                <span className="text-xs font-bold text-[#4A3528] truncate">
                  {rankingStatus === 'submitting'
                    ? '온라인 랭킹 등록 중...'
                    : rankingStatus === 'submitted' && rankHeadline
                      ? rankHeadline
                      : rankingStatus === 'needs_auth'
                        ? '온라인 랭킹에 점수를 남겨보세요'
                        : rankingStatus === 'error'
                          ? '랭킹 등록에 실패했어요'
                          : `${summary.stageStepLabel} 상위 랭킹`}
                </span>
              </div>

              <button
                type="button"
                onClick={onOpenLeaderboard}
                className="text-xs font-bold text-[#C86D3B] hover:text-[#A95324] whitespace-nowrap shrink-0 cursor-pointer"
              >
                전체 랭킹 →
              </button>
            </div>

            {rankingStatus === 'needs_auth' && (
              <button
                type="button"
                disabled={authBusy}
                onClick={onSignInAndSubmit}
                className="mt-2 w-full min-h-[40px] rounded-xl bg-[#FFFDF9] hover:bg-[#FCECE0] border border-[#E6D5C0] text-[#B85B2A] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
              >
                <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{authBusy ? 'Google 로그인 중...' : 'Google 로그인하고 내 기록 등록하기'}</span>
              </button>
            )}

            {rankingStatus === 'error' && (
              <button
                type="button"
                onClick={onRetrySubmit}
                className="mt-2 w-full min-h-[38px] rounded-xl bg-[#FFFDF9] border border-[#E8C5C0] text-[#B84A42] text-xs font-bold cursor-pointer"
              >
                다시 등록 시도하기
              </button>
            )}

            {rankSnapshot.topStageRows.length > 0 && (
              <ol className="mt-2 pt-2 border-t border-[#ECE1D0] space-y-1">
                {rankSnapshot.topStageRows.map((row) => {
                  const isMine =
                    row.entry.characterName.toLowerCase() === characterName.trim().toLowerCase();
                  return (
                    <li
                      key={row.entry.id}
                      className={`flex items-center justify-between text-xs px-1.5 py-0.5 rounded-lg ${
                        isMine ? 'bg-[#FCECE0] font-bold text-[#4A3528]' : 'text-[#6E594A]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="font-mono-num w-4 text-[#C86D3B] font-bold">
                          {row.rank}.
                        </span>
                        <span className="truncate">{row.entry.characterName}</span>
                      </span>
                      <span className="font-mono-num font-bold text-[#4A3528] shrink-0">
                        {row.entry.score.toLocaleString()}점
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {/* Actions */}
          {nextStage ? (
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onStartNextStage(nextStage.id)}
                className="w-full min-h-[50px] px-4 rounded-[20px] bg-[#D67844] hover:bg-[#C46936] active:scale-[0.98] text-[#FFFDF9] font-display text-lg flex items-center justify-center gap-2 shadow-[0_8px_22px_rgba(214,120,68,0.32)] transition-all whitespace-nowrap cursor-pointer"
              >
                <span>{nextStage.heading} 출발</span>
                <ArrowRight className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onGoTitle}
                  className="min-h-[46px] px-3 rounded-[16px] bg-[#F3ECE0] hover:bg-[#EAE0D0] active:scale-[0.98] text-[#6E594A] text-sm font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer"
                >
                  <Home className="w-4 h-4" aria-hidden="true" />
                  <span>코스 선택</span>
                </button>
                <button
                  type="button"
                  onClick={onRestart}
                  className="min-h-[46px] px-3 rounded-[16px] bg-[#E8F4EE] hover:bg-[#D9ECE2] active:scale-[0.98] text-[#3F6B58] text-sm font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" strokeWidth={2.4} aria-hidden="true" />
                  <span>다시 산책</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2.5">
              <button
                type="button"
                onClick={onGoTitle}
                aria-label="코스 선택 화면으로 이동"
                className="min-h-[50px] px-4 rounded-[20px] bg-[#E8F4EE] hover:bg-[#D9ECE2] active:scale-[0.98] text-[#3F6B58] text-sm font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Home className="w-4 h-4" aria-hidden="true" />
                <span>코스 선택</span>
              </button>

              <button
                type="button"
                onClick={onRestart}
                className="flex-1 min-h-[50px] px-4 rounded-[20px] bg-[#D67844] hover:bg-[#C46936] active:scale-[0.98] text-[#FFFDF9] font-display text-lg flex items-center justify-center gap-2 shadow-[0_8px_22px_rgba(214,120,68,0.3)] transition-all whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
                <span>{isCompleted ? '한 번 더 산책하기' : '다시 산책하기'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
