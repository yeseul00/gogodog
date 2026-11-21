import { Check, PawPrint, Sparkles, X } from 'lucide-react';
import { CHARACTER_LIST, getCharacterDefinition } from '../game/characters';
import type { CharacterId } from '../game/types';

interface CharacterSelectModalProps {
  open: boolean;
  selectedCharacter: CharacterId;
  compactLandscape?: boolean;
  onSelect: (characterId: CharacterId) => void;
  onClose: () => void;
}

interface StatRowProps {
  label: string;
  valueLabel: string;
  percent: number;
  barColor: string;
  compact?: boolean;
}

function StatRow({ label, valueLabel, percent, barColor, compact = false }: StatRowProps) {
  return (
    <div className={compact ? 'space-y-0.5' : 'space-y-1'}>
      <div className="flex items-center justify-between gap-2">
        <span className={`${compact ? 'text-[10px]' : 'text-[11px]'} font-bold text-[#6E594A]`}>
          {label}
        </span>
        <span
          className={`${compact ? 'text-[10px]' : 'text-[11px]'} font-mono-num font-bold text-[#4A3528]`}
        >
          {valueLabel}
        </span>
      </div>
      <div
        className={`${compact ? 'h-1.5' : 'h-2'} w-full rounded-full bg-[#EFE6D8] overflow-hidden`}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(100, Math.max(12, percent))}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
    </div>
  );
}

export function CharacterSelectModal({
  open,
  selectedCharacter,
  compactLandscape = false,
  onSelect,
  onClose,
}: CharacterSelectModalProps) {
  if (!open) return null;

  const activeChar = getCharacterDefinition(selectedCharacter);

  if (compactLandscape) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="character-select-title-compact"
        onClick={onClose}
        className="absolute inset-0 z-30 flex items-center justify-center p-2 safe-px bg-[#3A2C22]/40 backdrop-blur-[3px]"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[760px] max-h-full overflow-hidden rounded-[24px] bg-[#FFFDF9]/98 backdrop-blur-md border border-white/95 shadow-[0_18px_46px_rgba(62,44,30,0.3)] flex flex-col"
        >
          {/* Compact Header */}
          <div className="px-4 py-2 border-b border-[#EFE6D8] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-7 rounded-xl bg-[#FCECE0] text-[#C86D3B] flex items-center justify-center shrink-0">
                <PawPrint className="w-4 h-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2
                  id="character-select-title-compact"
                  className="font-display text-base leading-tight text-[#4A3528] whitespace-nowrap"
                >
                  함께 산책할 강아지 선택
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="캐릭터 선택 닫기"
              className="min-h-[40px] min-w-[40px] rounded-xl bg-[#F3ECE0] hover:bg-[#EAE0D0] text-[#5C4638] flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B]"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* 3-Column Compact Character Cards */}
          <div className="p-2 grid grid-cols-3 gap-2 overflow-y-auto">
            {CHARACTER_LIST.map((char) => {
              const isSelected = char.id === selectedCharacter;
              return (
                <button
                  key={char.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSelect(char.id)}
                  className={`text-left rounded-[16px] p-2 border-2 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B] flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-[#FFFDF9] border-[#D67844] shadow-[0_6px_18px_rgba(214,120,68,0.18)]'
                      : 'bg-[#FAF4EB]/80 border-[#EAE0D0] hover:border-[#D7C6B1] hover:bg-[#FFFDF9]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-[12px] overflow-hidden shrink-0 bg-[#F3ECE0] border border-white/80">
                      <img
                        src={char.titleArtUrl}
                        alt={char.titleArtAlt}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-display text-base leading-tight text-[#4A3528] truncate">
                          {char.name}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#D67844] text-[#FFFDF9] flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" strokeWidth={3} aria-hidden="true" />
                          </span>
                        )}
                      </div>
                      <p
                        className="text-[11px] font-bold leading-snug"
                        style={{ color: char.accentColor }}
                      >
                        {char.roleTitle}
                        {char.id === 'ddaengkong' ? ' · 기본' : ''}
                      </p>
                      <p className="text-[10px] text-[#7D6858] leading-snug mt-0.5 line-clamp-2">
                        {char.shortTraitSummary}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-[#EFE6D8]">
                    <StatRow
                      label="점프력"
                      valueLabel={char.statBadges.jump}
                      percent={char.statBars.jump}
                      barColor={char.accentColor}
                      compact
                    />
                    <StatRow
                      label="피버 효율"
                      valueLabel={char.statBadges.fever}
                      percent={char.statBars.fever}
                      barColor={char.accentColor}
                      compact
                    />
                    <StatRow
                      label="수집 반경"
                      valueLabel={char.statBadges.collect}
                      percent={char.statBars.collect}
                      barColor={char.accentColor}
                      compact
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Compact Footer Confirm */}
          <div className="px-3 pb-2.5 pt-1 flex items-center justify-between gap-2 shrink-0">
            <p className="text-[10px] text-[#847060] truncate">
              미입력 시 기본 이름:{' '}
              <strong className="text-[#4A3528]">
                {activeChar.defaultNamePrefix}1, {activeChar.defaultNamePrefix}2...
              </strong>
            </p>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 rounded-xl bg-[#D67844] hover:bg-[#C46936] active:scale-[0.98] text-[#FFFDF9] font-display text-sm tracking-wide flex items-center gap-1.5 shadow-[0_4px_12px_rgba(214,120,68,0.3)] whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{activeChar.name}와 산책하기</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="character-select-title"
      onClick={onClose}
      className="absolute inset-0 z-30 flex items-center justify-center p-4 sm:p-6 bg-[#3A2C22]/40 backdrop-blur-[3px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[820px] max-h-full overflow-y-auto rounded-[30px] bg-[#FFFDF9]/98 backdrop-blur-md border border-white/95 shadow-[0_22px_56px_rgba(62,44,30,0.3)]"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[#EFE6D8] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-2xl bg-[#FCECE0] text-[#C86D3B] flex items-center justify-center shrink-0">
              <PawPrint className="w-5 h-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2
                id="character-select-title"
                className="font-display text-xl sm:text-2xl leading-tight text-[#4A3528]"
              >
                함께 산책할 강아지 선택
              </h2>
              <p className="text-xs text-[#7D6858] mt-0.5">
                각 강아지마다 고유한 점프·피버·수집 개성을 가지고 있어요
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="캐릭터 선택 닫기"
            className="min-h-[44px] min-w-[44px] rounded-2xl bg-[#F3ECE0] hover:bg-[#EAE0D0] text-[#5C4638] flex items-center justify-center shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B]"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* 3-Column Character Comparison Cards */}
        <div
          role="radiogroup"
          aria-label="플레이할 강아지 캐릭터"
          className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-3.5"
        >
          {CHARACTER_LIST.map((char) => {
            const isSelected = char.id === selectedCharacter;
            return (
              <button
                key={char.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelect(char.id)}
                className={`group text-left rounded-[24px] overflow-hidden border-2 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B] flex flex-col ${
                  isSelected
                    ? 'bg-[#FFFDF9] border-[#D67844] shadow-[0_10px_28px_rgba(214,120,68,0.2)] -translate-y-0.5'
                    : 'bg-[#FAF4EB]/80 border-[#EAE0D0] hover:border-[#D7C6B1] hover:bg-[#FFFDF9]'
                }`}
              >
                {/* Portrait */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F3ECE0]">
                  <img
                    src={char.titleArtUrl}
                    alt={char.titleArtAlt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-[#D67844] text-[#FFFDF9] shadow-md flex items-center justify-center">
                      <Check className="w-4 h-4" strokeWidth={3} aria-hidden="true" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#FFFDF9] via-[#FFFDF9]/45 to-transparent" />
                </div>

                {/* Details */}
                <div className="px-4 pb-4 pt-1 flex-1 flex flex-col">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-display text-2xl leading-tight text-[#4A3528]">
                      {char.name}
                    </h3>
                    <span
                      className="text-xs font-bold whitespace-nowrap"
                      style={{ color: char.accentColor }}
                    >
                      {char.roleTitle}
                      {char.id === 'ddaengkong' ? ' · 기본' : ''}
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs text-[#745E4E] leading-relaxed min-h-[36px]">
                    {char.tagline}
                  </p>

                  {/* Clean Stat Comparison Bars */}
                  <div className="mt-3 pt-3 border-t border-[#EFE6D8] space-y-2.5">
                    <StatRow
                      label="점프력"
                      valueLabel={char.statBadges.jump}
                      percent={char.statBars.jump}
                      barColor={char.accentColor}
                    />
                    <StatRow
                      label="피버 효율"
                      valueLabel={char.statBadges.fever}
                      percent={char.statBars.fever}
                      barColor={char.accentColor}
                    />
                    <StatRow
                      label="수집 반경"
                      valueLabel={char.statBadges.collect}
                      percent={char.statBars.collect}
                      barColor={char.accentColor}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Action */}
        <div className="px-6 pb-6 pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-[#7D6858]">
            이름 미입력 시{' '}
            <strong className="text-[#4A3528]">
              {activeChar.defaultNamePrefix}1, {activeChar.defaultNamePrefix}2
            </strong>
            로 자동 시작돼요
          </p>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-6 rounded-[18px] bg-[#D67844] hover:bg-[#C46936] active:scale-[0.98] text-[#FFFDF9] font-display text-lg tracking-wide flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(214,120,68,0.32)] transition-all whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B]"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>{activeChar.name}와 산책 준비</span>
          </button>
        </div>
      </div>
    </div>
  );
}
