import { Heart, Pause, Play, Sparkles, Volume2, VolumeX } from 'lucide-react';
import type { GameState, HudSnapshot } from '../game/types';

interface TopHudProps {
  hud: HudSnapshot;
  gameState: GameState;
  isMuted: boolean;
  compactLandscape?: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
}

export function TopHud({
  hud,
  gameState,
  isMuted,
  compactLandscape = false,
  onToggleMute,
  onTogglePause,
}: TopHudProps) {
  const isPlayingOrPaused = gameState === 'PLAYING' || gameState === 'PAUSED';

  return (
    <header
      className={`pointer-events-none absolute top-0 inset-x-0 z-10 safe-pt safe-px ${
        compactLandscape ? 'pt-1.5' : 'sm:px-5 pt-2.5'
      }`}
    >
      <div className="max-w-5xl mx-auto flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          {/* Left & Center: Floating translucent cream-glass status strip */}
          {isPlayingOrPaused ? (
            <div
              className={`pointer-events-auto flex items-center rounded-2xl bg-[#FFFDF9]/82 backdrop-blur-md border border-white/85 shadow-[0_6px_24px_rgba(92,68,48,0.09)] min-w-0 ${
                compactLandscape ? 'gap-2 px-3 py-1.5' : 'gap-2.5 sm:gap-3.5 px-3.5 py-2'
              }`}
            >
              {/* Plump Hearts + numeric count */}
              <div
                className="flex items-center gap-1 shrink-0"
                aria-label={`남은 하트 ${hud.hearts}개 / ${hud.maxHearts}개`}
              >
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: hud.maxHearts }).map((_, idx) => {
                    const filled = idx < hud.hearts;
                    return (
                      <Heart
                        key={idx}
                        className={`${
                          compactLandscape ? 'w-4 h-4' : 'w-[18px] h-[18px]'
                        } transition-transform duration-150 ${
                          filled
                            ? 'fill-[#E86A75] text-[#C94D59] scale-100'
                            : 'fill-transparent text-[#D6C7B8] scale-90'
                        }`}
                        strokeWidth={2.2}
                        aria-hidden="true"
                      />
                    );
                  })}
                </div>
                <span className="font-mono-num text-[11px] font-bold text-[#7C6352] whitespace-nowrap">
                  {hud.hearts}/{hud.maxHearts}
                </span>
              </div>

              <span className="text-[#D8CBB8]" aria-hidden="true">·</span>

              {/* Score, Distance & Stage Memories */}
              <div className="flex items-baseline gap-1.5 sm:gap-2 min-w-0 whitespace-nowrap">
                <span
                  className={`font-mono-num font-bold text-[#4A3528] ${
                    compactLandscape ? 'text-sm' : 'text-base sm:text-lg'
                  }`}
                >
                  {hud.score.toLocaleString()}
                </span>
                <span className="text-[#D8CBB8]" aria-hidden="true">·</span>
                <span className="font-mono-num text-xs sm:text-sm font-bold text-[#735A49]">
                  {hud.distance}/{hud.goalDistance}m
                </span>
                <span className="text-[#D8CBB8]" aria-hidden="true">·</span>
                <span
                  className="font-mono-num text-xs font-bold text-[#B85B2A]"
                  aria-label={`이번 산책 추억 조각 ${hud.memoriesCollectedCount}개 / ${hud.stageMemoryTotal}개`}
                >
                  추억 {hud.memoriesCollectedCount}/{hud.stageMemoryTotal}
                </span>
              </div>

              <span className="hidden md:inline text-[#D8CBB8]" aria-hidden="true">·</span>
              <span className="hidden md:inline text-xs font-bold text-[#5B8773] whitespace-nowrap">
                {hud.stageStepLabel} · {hud.stageName}
              </span>
            </div>
          ) : (
            <div />
          )}

          {/* Inline compact fever bar in short mobile landscape to keep sky unobstructed */}
          {isPlayingOrPaused && compactLandscape && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl bg-[#FFFDF9]/78 backdrop-blur-sm border border-white/80 shadow-[0_4px_14px_rgba(92,68,48,0.06)] flex-1 max-w-[230px] min-w-[120px]">
              <div className="flex items-center gap-1 text-[11px] font-bold whitespace-nowrap shrink-0">
                {hud.isFever ? (
                  <span className="flex items-center gap-1 text-[#C86D14]">
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="font-mono-num">{hud.feverRemaining.toFixed(1)}초</span>
                  </span>
                ) : (
                  <span className="text-[#785F4E]">
                    피버 <span className="font-mono-num text-[#4A3528]">{hud.feverGauge}%</span>
                  </span>
                )}
              </div>

              <div
                className="flex-1 h-1.5 bg-[#E9DFCE] rounded-full overflow-hidden"
                role="progressbar"
                aria-label="피버 게이지"
                aria-valuenow={hud.feverGauge}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-100 ${
                    hud.isFever
                      ? 'bg-gradient-to-r from-[#F4B948] via-[#F9D66B] to-[#F08C6A]'
                      : 'bg-gradient-to-r from-[#9BD3BA] to-[#F2B552]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, hud.feverGauge))}%` }}
                />
              </div>

              {hud.combo >= 2 && (
                <span className="font-mono-num text-[11px] font-bold text-[#C86D3B] whitespace-nowrap shrink-0">
                  {hud.combo}x
                </span>
              )}
            </div>
          )}

          {/* Right: Floating 44x44px circular cream-glass icon actions */}
          <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={isMuted ? '소리 켜기' : '소리 끄기'}
              title={isMuted ? '소리 켜기 (M)' : '소리 끄기 (M)'}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl bg-[#FFFDF9]/82 backdrop-blur-md border border-white/85 shadow-[0_6px_20px_rgba(92,68,48,0.09)] text-[#5C4638] hover:bg-[#FFFDF9] active:scale-95 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B]"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {isPlayingOrPaused && (
              <button
                type="button"
                onClick={onTogglePause}
                aria-label={gameState === 'PAUSED' ? '산책 이어하기' : '일시정지'}
                title={gameState === 'PAUSED' ? '이어하기 (P)' : '일시정지 (P)'}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl bg-[#FFFDF9]/82 backdrop-blur-md border border-white/85 shadow-[0_6px_20px_rgba(92,68,48,0.09)] text-[#5C4638] hover:bg-[#FFFDF9] active:scale-95 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B]"
              >
                {gameState === 'PAUSED' ? (
                  <Play className="w-5 h-5 fill-current" />
                ) : (
                  <Pause className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Sleek Floating Fever Ribbon on taller desktop/tablet screens */}
        {isPlayingOrPaused && !compactLandscape && (
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#FFFDF9]/74 backdrop-blur-sm border border-white/75 shadow-[0_4px_14px_rgba(92,68,48,0.06)] max-w-md">
            <div className="flex items-center gap-1 text-[11px] font-bold whitespace-nowrap shrink-0">
              {hud.isFever ? (
                <span className="flex items-center gap-1 text-[#C86D14]">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>피버 x2</span>
                  <span className="font-mono-num">{hud.feverRemaining.toFixed(1)}초</span>
                </span>
              ) : (
                <span className="text-[#785F4E]">
                  피버 <span className="font-mono-num text-[#4A3528]">{hud.feverGauge}%</span>
                </span>
              )}
            </div>

            <div
              className="flex-1 h-1.5 bg-[#E9DFCE] rounded-full overflow-hidden"
              role="progressbar"
              aria-label="피버 게이지"
              aria-valuenow={hud.feverGauge}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full rounded-full transition-[width] duration-100 ${
                  hud.isFever
                    ? 'bg-gradient-to-r from-[#F4B948] via-[#F9D66B] to-[#F08C6A]'
                    : 'bg-gradient-to-r from-[#9BD3BA] to-[#F2B552]'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, hud.feverGauge))}%` }}
              />
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-[#785F4E] whitespace-nowrap shrink-0">
              {hud.combo >= 2 && (
                <>
                  <span className="font-mono-num font-bold text-[#C86D3B]">{hud.combo} 콤보</span>
                  <span className="sm:hidden text-[#D8CBB8]" aria-hidden="true">·</span>
                </>
              )}
              <span className="sm:hidden font-bold text-[#5B8773]">
                {hud.stageStepLabel} · {hud.stageName}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
