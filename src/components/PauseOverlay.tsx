import { Home, Play, RotateCcw } from 'lucide-react';
import { getStageDefinition } from '../game/stages';
import type { StageId } from '../game/types';

interface PauseOverlayProps {
  stageId: StageId;
  compactLandscape?: boolean;
  onResume: () => void;
  onRestart: () => void;
  onGoTitle: () => void;
}

export function PauseOverlay({
  stageId,
  compactLandscape = false,
  onResume,
  onRestart,
  onGoTitle,
}: PauseOverlayProps) {
  const stage = getStageDefinition(stageId);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-3 bg-[#4A382C]/22 backdrop-blur-[3px]">
      <div
        className={`w-full max-w-[320px] max-h-full overflow-y-auto rounded-[28px] bg-[#FFFDF9]/95 backdrop-blur-md border border-white/90 shadow-[0_18px_44px_rgba(78,56,40,0.2)] text-center ${
          compactLandscape ? 'p-4' : 'p-6'
        }`}
      >
        <p className="text-[11px] font-bold text-[#5B8773]">
          {stage.stepLabel} · {stage.name}
        </p>
        <h2
          className={`mt-0.5 font-display text-[#4A3528] ${compactLandscape ? 'text-xl' : 'text-2xl'}`}
        >
          잠시 쉬어가는 중
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-[#745E4E]">{stage.restMessage}</p>

        <div className={`${compactLandscape ? 'mt-3.5 gap-2' : 'mt-5 gap-2.5'} flex flex-col`}>
          <button
            type="button"
            onClick={onResume}
            className="w-full min-h-[46px] rounded-[18px] bg-[#D67844] hover:bg-[#C46936] active:scale-[0.98] text-[#FFFDF9] font-display text-lg flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(214,120,68,0.28)] transition-all whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B]"
          >
            <Play className="w-4 h-4 fill-current" aria-hidden="true" />
            <span>이어서 산책하기</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full min-h-[44px] rounded-[16px] bg-[#E8F4EE] hover:bg-[#D9ECE2] active:scale-[0.98] text-[#3F6B58] text-sm font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#497C66]"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>처음부터 다시</span>
          </button>

          <button
            type="button"
            onClick={onGoTitle}
            className="w-full min-h-[44px] rounded-xl text-[#847060] hover:text-[#4A3528] hover:bg-[#F5EFE4] text-sm font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B]"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>코스 선택 화면으로</span>
          </button>
        </div>
      </div>
    </div>
  );
}
