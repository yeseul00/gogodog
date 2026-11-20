import { ArrowDown, ArrowUp } from 'lucide-react';
import { useState } from 'react';

interface TouchControlsProps {
  visible: boolean;
  compactLandscape?: boolean;
  onJumpPress: () => void;
  onJumpRelease: () => void;
  onDuckChange: (active: boolean) => void;
}

export function TouchControls({
  visible,
  compactLandscape = false,
  onJumpPress,
  onJumpRelease,
  onDuckChange,
}: TouchControlsProps) {
  const [duckPressed, setDuckPressed] = useState(false);
  const [jumpPressed, setJumpPressed] = useState(false);

  if (!visible) return null;

  const handleDuckDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDuckPressed(true);
    onDuckChange(true);
  };

  const handleDuckUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDuckPressed(false);
    onDuckChange(false);
  };

  const handleJumpDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setJumpPressed(true);
    onJumpPress();
  };

  const handleJumpUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setJumpPressed(false);
    onJumpRelease();
  };

  return (
    <div
      className={`pointer-events-none absolute bottom-0 inset-x-0 z-10 safe-px safe-pb ${
        compactLandscape ? 'pb-2.5' : 'sm:px-7 pb-4'
      }`}
    >
      <div className="max-w-5xl mx-auto flex items-end justify-between gap-4">
        {/* Left Floating Thumb Pad: Duck (Soft Mint-Cream Storybook Glass) */}
        <button
          type="button"
          onPointerDown={handleDuckDown}
          onPointerUp={handleDuckUp}
          onPointerCancel={handleDuckUp}
          onLostPointerCapture={handleDuckUp}
          aria-label="숙이기 (길게 누르기)"
          className={`pointer-events-auto border-2 flex items-center justify-center backdrop-blur-md transition-transform duration-100 select-none touch-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B8773] ${
            compactLandscape
              ? 'min-w-[116px] min-h-[56px] rounded-[22px] gap-2 px-3.5'
              : 'min-w-[126px] sm:min-w-[136px] min-h-[64px] rounded-[26px] gap-2.5 px-4'
          } ${
            duckPressed
              ? 'bg-[#DDEFE6]/95 border-[#8AC4AA] text-[#355A4A] scale-95 shadow-inner'
              : 'bg-[#FFFDF9]/86 border-white/90 text-[#4A382C] shadow-[0_8px_24px_rgba(64,84,68,0.18)] hover:bg-[#FFFDF9]/95'
          }`}
        >
          <span
            className={`${
              compactLandscape ? 'w-9 h-9 rounded-xl' : 'w-10 h-10 rounded-2xl'
            } bg-[#E1F2EA] flex items-center justify-center shrink-0`}
          >
            <ArrowDown className="w-5 h-5 text-[#497C66]" strokeWidth={2.7} aria-hidden="true" />
          </span>
          <span className="flex flex-col items-start text-left leading-tight">
            <span className="font-display text-base whitespace-nowrap">숙이기</span>
            <span className="text-[11px] text-[#6E645A] whitespace-nowrap">
              꾹 {!compactLandscape && <span className="hidden sm:inline">· ↓/S</span>}
            </span>
          </span>
        </button>

        {/* Right Floating Thumb Pad: Jump (Warm Caramel-Peach Primary Pad) */}
        <button
          type="button"
          onPointerDown={handleJumpDown}
          onPointerUp={handleJumpUp}
          onPointerCancel={handleJumpUp}
          onLostPointerCapture={handleJumpUp}
          aria-label="점프하기"
          className={`pointer-events-auto border-2 flex items-center justify-center transition-transform duration-100 select-none touch-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B] ${
            compactLandscape
              ? 'min-w-[120px] min-h-[56px] rounded-[22px] gap-2 px-3.5'
              : 'min-w-[132px] sm:min-w-[144px] min-h-[64px] rounded-[26px] gap-2.5 px-4'
          } ${
            jumpPressed
              ? 'bg-[#B95E2E] border-[#F7D7BC] text-white scale-95 shadow-inner'
              : 'bg-[#D67844]/95 border-[#FCE5D0]/85 text-[#FFFDF9] shadow-[0_8px_26px_rgba(148,76,34,0.28)] hover:bg-[#C86B38]'
          }`}
        >
          <span
            className={`${
              compactLandscape ? 'w-9 h-9 rounded-xl' : 'w-10 h-10 rounded-2xl'
            } bg-white/22 flex items-center justify-center shrink-0`}
          >
            <ArrowUp className="w-5 h-5" strokeWidth={2.8} aria-hidden="true" />
          </span>
          <span className="flex flex-col items-start text-left leading-tight">
            <span className="font-display text-base whitespace-nowrap">점프</span>
            <span className="text-[11px] text-[#FFEADB] whitespace-nowrap">
              톡 {!compactLandscape && <span className="hidden sm:inline">· Space</span>}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
