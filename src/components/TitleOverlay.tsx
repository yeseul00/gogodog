import { ArrowDown, ArrowUp, BookHeart, Lock, PawPrint, Play, Trophy, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCharacterDefinition } from '../game/characters';
import { MAX_CHARACTER_NAME_LENGTH } from '../game/ranking';
import { getStageDefinition, STAGE_LIST } from '../game/stages';
import type { CharacterId, SavedRecords, StageId } from '../game/types';

interface TitleOverlayProps {
  records: SavedRecords;
  selectedStage: StageId;
  unlockedStage: StageId;
  selectedCharacter: CharacterId;
  characterName: string;
  collectedMemoryCount: number;
  totalMemoryCount: number;
  starting: boolean;
  compactLandscape?: boolean;
  onChangeCharacterName: (name: string) => void;
  onSelectStage: (stageId: StageId) => void;
  onOpenCharacterSelect: () => void;
  onOpenLeaderboard: () => void;
  onOpenMemoryAlbum: () => void;
  onStart: () => void;
}

export function TitleOverlay({
  records,
  selectedStage,
  unlockedStage,
  selectedCharacter,
  characterName,
  collectedMemoryCount,
  totalMemoryCount,
  starting,
  compactLandscape = false,
  onChangeCharacterName,
  onSelectStage,
  onOpenCharacterSelect,
  onOpenLeaderboard,
  onOpenMemoryAlbum,
  onStart,
}: TitleOverlayProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);
  const activeStage = getStageDefinition(selectedStage);
  const activeCharacter = getCharacterDefinition(selectedCharacter);

  const stageSubtitle = activeStage.subtitle.replace('땡콩이', activeCharacter.name);
  const defaultNameHint = `${activeCharacter.defaultNamePrefix}1, ${activeCharacter.defaultNamePrefix}2`;

  useEffect(() => {
    setLockedNotice(null);
  }, [selectedStage]);

  useEffect(() => {
    setImgFailed(false);
  }, [selectedCharacter]);

  const handleStagePress = (stageId: StageId) => {
    if (stageId > unlockedStage) {
      const prevStage = getStageDefinition((stageId - 1) as StageId);
      setLockedNotice(`${prevStage.heading} 완주 시 열려요!`);
      return;
    }
    setLockedNotice(null);
    onSelectStage(stageId);
  };

  if (compactLandscape) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center p-2 safe-px bg-[#3A2C22]/22 backdrop-blur-[2px]">
        <div className="w-full max-w-[640px] max-h-full overflow-hidden rounded-[26px] bg-[#FFFDF9]/95 backdrop-blur-md border border-white/90 shadow-[0_16px_42px_rgba(62,44,30,0.24)] grid grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
          {/* Left Stylized 3D Plush Active Character Portrait */}
          <div className="relative h-full min-h-[250px] overflow-hidden bg-gradient-to-br from-[#FDE7EE] via-[#FFF3E4] to-[#E6F2DA]">
            {!imgFailed ? (
              <img
                src={activeCharacter.titleArtUrl}
                alt={activeCharacter.titleArtAlt}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4 text-center">
                <span className="font-display text-xl text-[#C86D3B]">{activeCharacter.name}</span>
              </div>
            )}
            <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#FFFDF9] via-[#FFFDF9]/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#2E2118]/45 to-transparent pointer-events-none" />

            {/* Compact Character Select Trigger over Hero */}
            <button
              type="button"
              onClick={onOpenCharacterSelect}
              aria-label={`캐릭터 선택 (현재: ${activeCharacter.name})`}
              className="absolute bottom-2.5 left-2.5 min-h-[40px] px-3 rounded-xl bg-[#FFFDF9]/94 hover:bg-[#FFFDF9] active:scale-[0.98] backdrop-blur-md border border-white/95 shadow-[0_4px_14px_rgba(46,33,24,0.22)] text-[#4A3528] text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B]"
            >
              <PawPrint
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: activeCharacter.accentColor }}
                aria-hidden="true"
              />
              <span>{activeCharacter.name}</span>
              <span className="text-[#9A8574]">·</span>
              <span style={{ color: activeCharacter.accentColor }}>캐릭터 선택</span>
            </button>
          </div>

          {/* Right Name Input, Stage Selector & Start */}
          <div className="px-3.5 py-2.5 flex flex-col justify-center text-left min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h1 className="font-display text-[21px] leading-tight text-[#4A3528] whitespace-nowrap">
                  {activeStage.heading}
                </h1>
                <p className="text-[10px] text-[#7D6858] truncate">
                  <strong style={{ color: activeCharacter.accentColor }}>{activeCharacter.name}</strong>{' '}
                  {activeCharacter.shortTraitSummary}
                  {records.bestScore > 0 && (
                    <>
                      {' '}
                      · 최고{' '}
                      <strong className="font-mono-num text-[#4A3528]">
                        {records.bestScore.toLocaleString()}점
                      </strong>
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={onOpenMemoryAlbum}
                  aria-label={`추억 앨범 보기 (${collectedMemoryCount}/${totalMemoryCount})`}
                  className="min-h-[40px] px-2 rounded-xl bg-[#E8F4EE] hover:bg-[#D9ECE2] text-[#3F6B58] text-[11px] font-bold flex items-center gap-1 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B]"
                >
                  <BookHeart className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>추억</span>
                  <span className="font-mono-num text-[10px]">
                    {collectedMemoryCount}/{totalMemoryCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onOpenLeaderboard}
                  aria-label="온라인 랭킹 보기"
                  className="min-h-[40px] px-2.5 rounded-xl bg-[#FCECE0] hover:bg-[#F7DEC9] text-[#B85B2A] text-[11px] font-bold flex items-center gap-1 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B]"
                >
                  <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>랭킹</span>
                </button>
              </div>
            </div>

            {/* Compact Character Name Input */}
            <div className="mt-1.5 relative">
              <label htmlFor="char-name-compact" className="sr-only">
                캐릭터 이름
              </label>
              <User
                className="w-3.5 h-3.5 text-[#9A8574] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="char-name-compact"
                type="text"
                value={characterName}
                maxLength={MAX_CHARACTER_NAME_LENGTH}
                onChange={(e) => onChangeCharacterName(e.target.value)}
                placeholder={`캐릭터 이름 (비우면 ${defaultNameHint}...)`}
                className="w-full h-9 pl-8 pr-3 rounded-[12px] bg-[#FAF4EB] border border-[#E5D7C4] text-xs font-medium text-[#4A3528] placeholder:text-[#A39080] focus:outline-none focus:border-[#D67844] focus:bg-[#FFFDF9]"
              />
            </div>

            {/* 3-Stage Walk Route Selector */}
            <div className="mt-1.5 w-full">
              <div
                role="radiogroup"
                aria-label="산책 단계 선택"
                className="grid grid-cols-3 gap-1 p-1 rounded-[14px] bg-[#F3ECE0] border border-[#E7DCCB]"
              >
                {STAGE_LIST.map((stage) => {
                  const selected = stage.id === selectedStage;
                  const locked = stage.id > unlockedStage;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-disabled={locked}
                      onClick={() => handleStagePress(stage.id)}
                      className={`min-h-[42px] rounded-[10px] px-1 py-0.5 flex flex-col items-center justify-center leading-tight whitespace-nowrap transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B] ${
                        selected
                          ? 'bg-[#FFFDF9] text-[#C86D3B] font-bold shadow-[0_2px_8px_rgba(92,70,50,0.12)]'
                          : locked
                            ? 'text-[#A29081] font-medium hover:text-[#847264]'
                            : 'text-[#6E594A] font-medium hover:text-[#4A3528]'
                      }`}
                    >
                      <span className="flex items-center gap-0.5 text-[9px] opacity-85">
                        {locked && <Lock className="w-2.5 h-2.5" aria-hidden="true" />}
                        <span>{stage.stepLabel}</span>
                      </span>
                      <span className="text-[11px] font-bold">{stage.name}</span>
                    </button>
                  );
                })}
              </div>
              <p
                className={`mt-1 text-[10px] leading-snug truncate ${
                  lockedNotice ? 'text-[#C86D3B] font-bold' : 'text-[#847060]'
                }`}
              >
                {lockedNotice ?? activeStage.hint}
              </p>
            </div>

            {/* Single-line compact obstacle hint */}
            <p className="mt-1 text-[10px] text-[#7C6758] truncate">
              <strong className="text-[#C86D3B]">점프</strong> {activeStage.jumpPreview} ·{' '}
              <strong className="text-[#497C66]">숙이기</strong> {activeStage.duckPreview}
            </p>

            <button
              type="button"
              disabled={starting}
              onClick={onStart}
              className="mt-2 w-full min-h-[44px] rounded-[16px] bg-[#D67844] hover:bg-[#C46936] active:scale-[0.98] text-[#FFFDF9] font-display text-lg tracking-wide flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(214,120,68,0.34)] transition-all whitespace-nowrap cursor-pointer disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B]"
            >
              <Play className="w-4 h-4 fill-current" aria-hidden="true" />
              <span>{starting ? '출발 준비 중...' : `${activeStage.stepLabel} 산책 시작`}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4 sm:p-6 bg-[#3A2C22]/22 backdrop-blur-[2px]">
      <div className="w-full max-w-[388px] sm:max-w-[436px] max-h-full overflow-y-auto rounded-[32px] bg-[#FFFDF9]/95 backdrop-blur-md border border-white/90 shadow-[0_20px_50px_rgba(62,44,30,0.24)]">
        {/* Stylized 3D Plush Active Character Hero Art */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-[#FDE7EE] via-[#FFF3E4] to-[#E6F2DA]">
          {!imgFailed ? (
            <img
              src={activeCharacter.titleArtUrl}
              alt={activeCharacter.titleArtAlt}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-6 text-center">
              <span className="font-display text-2xl text-[#C86D3B]">{activeCharacter.name}</span>
            </div>
          )}

          {/* Top-left & Top-right floating Album, Ranking & Login actions over hero */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={onOpenMemoryAlbum}
              aria-label={`추억 앨범 보기 (${collectedMemoryCount}/${totalMemoryCount})`}
              className="min-h-[40px] px-3 rounded-2xl bg-[#FFFDF9]/92 hover:bg-[#FFFDF9] backdrop-blur-md border border-white/90 shadow-sm text-[#3F6B58] text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B]"
            >
              <BookHeart className="w-3.5 h-3.5" aria-hidden="true" />
              <span>추억 앨범</span>
              <span className="font-mono-num text-[11px] text-[#5B8773]">
                {collectedMemoryCount}/{totalMemoryCount}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="min-h-[40px] px-3 rounded-2xl bg-[#FFFDF9]/92 hover:bg-[#FFFDF9] backdrop-blur-md border border-white/90 shadow-sm text-[#B85B2A] text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B]"
            >
              <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
              <span>랭킹 보기</span>
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#FFFDF9] via-[#FFFDF9]/60 to-transparent" />

          {/* Bottom-right Character Selection Button over Hero */}
          <button
            type="button"
            onClick={onOpenCharacterSelect}
            aria-label={`캐릭터 선택 팝업 열기 (현재: ${activeCharacter.name})`}
            className="absolute bottom-2.5 right-3 min-h-[40px] px-3.5 rounded-2xl bg-[#FFFDF9]/95 hover:bg-[#FFFDF9] active:scale-[0.98] backdrop-blur-md border border-[#E7DCCB] shadow-[0_4px_14px_rgba(62,44,30,0.16)] text-[#4A3528] text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B]"
          >
            <PawPrint
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: activeCharacter.accentColor }}
              aria-hidden="true"
            />
            <span>캐릭터 선택</span>
            <span className="text-[#B7A492]">·</span>
            <span style={{ color: activeCharacter.accentColor }}>{activeCharacter.name}</span>
          </button>
        </div>

        {/* Clean Content */}
        <div className="px-6 pb-6 pt-1 flex flex-col items-center text-center">
          <h1 className="font-display text-[28px] sm:text-[32px] leading-tight text-[#4A3528] [text-wrap:balance]">
            {activeStage.heading}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#745E4E] leading-relaxed">
            {stageSubtitle}
          </p>

          {/* Unboxed active character trait & best records */}
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-xs text-[#7D6858]">
            <span>
              <strong style={{ color: activeCharacter.accentColor }}>{activeCharacter.name}</strong>{' '}
              ({activeCharacter.roleTitle}) · {activeCharacter.shortTraitSummary}
            </span>
          </div>

          {records.bestScore > 0 && (
            <div className="mt-1 flex items-center justify-center gap-2 text-xs text-[#7D6858]">
              <span>
                최고 점수{' '}
                <strong className="font-mono-num text-[#4A3528]">
                  {records.bestScore.toLocaleString()}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                최장 산책{' '}
                <strong className="font-mono-num text-[#4A3528]">{records.bestDistance}m</strong>
              </span>
            </div>
          )}

          {/* Character Name Input */}
          <div className="mt-3.5 w-full text-left">
            <label
              htmlFor="char-name-input"
              className="block text-[11px] font-bold text-[#7A6555] mb-1 pl-1"
            >
              캐릭터 이름{' '}
              <span className="font-normal text-[#9B8777]">
                (미입력 시 {defaultNameHint} 자동 부여)
              </span>
            </label>
            <div className="relative">
              <User
                className="w-4 h-4 text-[#9A8574] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="char-name-input"
                type="text"
                value={characterName}
                maxLength={MAX_CHARACTER_NAME_LENGTH}
                onChange={(e) => onChangeCharacterName(e.target.value)}
                placeholder={`예: ${activeCharacter.name}, 초코 (최대 12자)`}
                className="w-full min-h-[44px] pl-10 pr-3.5 rounded-[16px] bg-[#FAF4EB] border border-[#E5D7C4] text-sm font-medium text-[#4A3528] placeholder:text-[#A39080] focus:outline-none focus:border-[#D67844] focus:bg-[#FFFDF9] transition-colors"
              />
            </div>
          </div>

          {/* 3-Stage Walk Route Selector */}
          <div className="mt-3 w-full">
            <div
              role="radiogroup"
              aria-label="산책 단계 선택"
              className="grid grid-cols-3 gap-1 p-1 rounded-[18px] bg-[#F3ECE0] border border-[#E7DCCB]"
            >
              {STAGE_LIST.map((stage) => {
                const selected = stage.id === selectedStage;
                const locked = stage.id > unlockedStage;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-disabled={locked}
                    onClick={() => handleStagePress(stage.id)}
                    className={`min-h-[48px] rounded-[14px] px-1.5 py-1.5 flex flex-col items-center justify-center leading-tight whitespace-nowrap transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B] ${
                      selected
                        ? 'bg-[#FFFDF9] text-[#C86D3B] font-bold shadow-[0_3px_10px_rgba(92,70,50,0.12)]'
                        : locked
                          ? 'text-[#A29081] font-medium hover:text-[#847264]'
                          : 'text-[#6E594A] font-medium hover:text-[#4A3528]'
                    }`}
                  >
                    <span className="flex items-center gap-0.5 text-[10px] opacity-85">
                      {locked && <Lock className="w-3 h-3" aria-hidden="true" />}
                      <span>{stage.stepLabel}</span>
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold mt-0.5">{stage.name}</span>
                  </button>
                );
              })}
            </div>
            <p
              className={`mt-1.5 text-[11px] leading-snug ${
                lockedNotice ? 'text-[#C86D3B] font-bold' : 'text-[#847060]'
              }`}
            >
              {lockedNotice ?? activeStage.hint}
            </p>
          </div>

          {/* Airy 2-column control guide dynamically reflecting chosen stage */}
          <div className="mt-3 w-full grid grid-cols-2 gap-3 text-left border-t border-[#EFE6D8] pt-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-2xl bg-[#FCECE0] flex items-center justify-center shrink-0">
                <ArrowUp className="w-4 h-4 text-[#C86D3B]" strokeWidth={2.6} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#4A3528]">점프</p>
                <p className="text-[11px] text-[#847060] leading-snug truncate">
                  {activeStage.jumpPreview}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-2xl bg-[#E1F2EA] flex items-center justify-center shrink-0">
                <ArrowDown className="w-4 h-4 text-[#497C66]" strokeWidth={2.6} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#4A3528]">숙이기</p>
                <p className="text-[11px] text-[#847060] leading-snug truncate">
                  {activeStage.duckPreview}
                </p>
              </div>
            </div>
          </div>

          {/* Primary CTA */}
          <button
            type="button"
            disabled={starting}
            onClick={onStart}
            className="mt-4 w-full min-h-[52px] rounded-[22px] bg-[#D67844] hover:bg-[#C46936] active:scale-[0.98] text-[#FFFDF9] font-display text-xl tracking-wide flex items-center justify-center gap-2 shadow-[0_8px_22px_rgba(214,120,68,0.34)] transition-all whitespace-nowrap cursor-pointer disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B]"
          >
            <Play className="w-5 h-5 fill-current" aria-hidden="true" />
            <span>{starting ? '출발 준비 중...' : `${activeStage.stepLabel} 산책 시작`}</span>
          </button>

          <p className="mt-2 text-[11px] text-[#8C7868]">
            로그인 없이 캐릭터 이름으로 온라인 랭킹 자동 등록
          </p>
        </div>
      </div>
    </div>
  );
}
