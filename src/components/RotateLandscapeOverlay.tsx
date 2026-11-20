import { RotateCw, Smartphone } from 'lucide-react';

interface RotateLandscapeOverlayProps {
  onEnterLandscape: () => void;
}

export function RotateLandscapeOverlay({ onEnterLandscape }: RotateLandscapeOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 watercolor-paper-bg">
      <div className="w-full max-w-[340px] rounded-[32px] bg-[#FFFDF9]/96 backdrop-blur-md border border-white/90 shadow-[0_20px_50px_rgba(62,44,30,0.18)] p-7 text-center">
        {/* Animated phone rotation illustration */}
        <div className="mx-auto w-20 h-20 rounded-[24px] bg-[#FCECE0] flex items-center justify-center relative">
          <Smartphone
            className="w-10 h-10 text-[#C86D3B] animate-rotate-phone"
            strokeWidth={2.1}
            aria-hidden="true"
          />
          <span className="absolute -right-1.5 -bottom-1.5 w-8 h-8 rounded-full bg-[#FFFDF9] border border-[#EFE2D2] shadow-sm flex items-center justify-center">
            <RotateCw className="w-4 h-4 text-[#497C66]" strokeWidth={2.4} aria-hidden="true" />
          </span>
        </div>

        <h2 className="mt-5 font-display text-[26px] leading-tight text-[#4A3528] [text-wrap:balance]">
          가로 화면으로 돌려주세요
        </h2>
        <p className="mt-2 text-sm text-[#745E4E] leading-relaxed">
          모바일에서는 가로 모드로 산책해야 단계별 산책길과 장애물이 넓고 쾌적하게 보여요.
        </p>

        <button
          type="button"
          onClick={onEnterLandscape}
          className="mt-6 w-full min-h-[52px] rounded-[22px] bg-[#D67844] hover:bg-[#C46936] active:scale-[0.98] text-[#FFFDF9] font-display text-lg tracking-wide flex items-center justify-center gap-2 shadow-[0_8px_22px_rgba(214,120,68,0.32)] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B]"
        >
          <RotateCw className="w-5 h-5" strokeWidth={2.4} aria-hidden="true" />
          <span>가로 모드로 전환하기</span>
        </button>

        <p className="mt-3 text-[11px] text-[#8C7868]">
          기기를 옆으로 돌리면 자동으로 가로 화면에 맞춰집니다
        </p>
      </div>
    </div>
  );
}
