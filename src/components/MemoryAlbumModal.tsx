import { BookHeart, Lock, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  getMemoryDefinition,
  getStageCollectedCount,
  getTotalCollectedCount,
  MEMORY_FRAGMENTS,
  TOTAL_MEMORY_COUNT,
} from '../game/memories';
import { getStageDefinition, STAGE_LIST } from '../game/stages';
import type { CollectedMemoriesMap, MemoryFragmentId, StageId } from '../game/types';
import { MemoryIcon } from './MemoryIcon';

export type MemoryAlbumTab = 'all' | StageId;

interface MemoryAlbumModalProps {
  open: boolean;
  activeTab: MemoryAlbumTab;
  collectedMemories: CollectedMemoriesMap;
  newlyDiscoveredIds?: MemoryFragmentId[];
  compactLandscape?: boolean;
  onChangeTab: (tab: MemoryAlbumTab) => void;
  onClose: () => void;
}

export function MemoryAlbumModal({
  open,
  activeTab,
  collectedMemories,
  newlyDiscoveredIds = [],
  compactLandscape = false,
  onChangeTab,
  onClose,
}: MemoryAlbumModalProps) {
  const filteredFragments = useMemo(
    () =>
      activeTab === 'all'
        ? MEMORY_FRAGMENTS
        : MEMORY_FRAGMENTS.filter((m) => m.stageId === activeTab),
    [activeTab]
  );

  const [selectedId, setSelectedId] = useState<MemoryFragmentId>('pigeonFriend');

  useEffect(() => {
    if (!open) return;
    if (
      filteredFragments.length > 0 &&
      !filteredFragments.some((f) => f.id === selectedId)
    ) {
      const firstCollected = filteredFragments.find(
        (f) => (collectedMemories[f.id]?.count ?? 0) > 0
      );
      setSelectedId((firstCollected ?? filteredFragments[0]).id);
    }
  }, [open, filteredFragments, selectedId, collectedMemories]);

  if (!open) return null;

  const totalCollected = getTotalCollectedCount(collectedMemories);
  const completionPct = Math.round((totalCollected / TOTAL_MEMORY_COUNT) * 100);
  const selectedFrag = getMemoryDefinition(selectedId);
  const selectedRecord = collectedMemories[selectedId];
  const selectedUnlocked = (selectedRecord?.count ?? 0) > 0;
  const selectedStage = getStageDefinition(selectedFrag.stageId);

  const tabs: { id: MemoryAlbumTab; label: string; countLabel: string }[] = [
    { id: 'all', label: '전체', countLabel: `${totalCollected}/${TOTAL_MEMORY_COUNT}` },
    ...STAGE_LIST.map((s) => ({
      id: s.id as MemoryAlbumTab,
      label: compactLandscape ? s.stepLabel : `${s.stepLabel} ${s.name}`,
      countLabel: `${getStageCollectedCount(collectedMemories, s.id)}/3`,
    })),
  ];

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center p-2.5 sm:p-5 bg-[#3A2C22]/40 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-label="땡콩이의 추억 앨범"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${
          compactLandscape ? 'max-w-[660px] max-h-[95%]' : 'max-w-[540px] max-h-[88%]'
        } flex flex-col overflow-hidden rounded-[28px] bg-[#FFFDF9]/98 border border-white/95 shadow-[0_24px_60px_rgba(62,44,30,0.32)]`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between gap-2 border-b border-[#EFE6D8] ${
            compactLandscape ? 'px-4 py-2' : 'px-5 py-3.5'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <BookHeart className="w-5 h-5 text-[#C86D3B] shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <h2
                className={`font-display text-[#4A3528] leading-tight truncate ${
                  compactLandscape ? 'text-lg' : 'text-xl'
                }`}
              >
                땡콩이의 추억 앨범
              </h2>
              <p className="text-[11px] text-[#7D6858] whitespace-nowrap">
                모은 추억{' '}
                <strong className="font-mono-num text-[#4A3528]">
                  {totalCollected}/{TOTAL_MEMORY_COUNT}
                </strong>
                <span aria-hidden="true"> · </span>
                <span className="font-mono-num text-[#5B8773] font-bold">{completionPct}%</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="추억 앨범 닫기"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl bg-[#F3ECE0] hover:bg-[#EAE0D0] text-[#5C4638] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stage Filter Tabs */}
        <div className={compactLandscape ? 'px-4 pt-2' : 'px-5 pt-3'}>
          <div
            role="tablist"
            aria-label="단계별 추억 필터"
            className="grid grid-cols-4 gap-1 p-1 rounded-[14px] bg-[#F3ECE0] border border-[#E7DCCB]"
          >
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={String(tab.id)}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onChangeTab(tab.id)}
                  className={`min-h-[40px] px-1.5 rounded-[10px] text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B] flex items-center justify-center gap-1 ${
                    active
                      ? 'bg-[#FFFDF9] text-[#C86D3B] shadow-[0_2px_8px_rgba(92,70,50,0.12)]'
                      : 'text-[#6E594A] hover:text-[#4A3528]'
                  }`}
                >
                  <span className="truncate">{tab.label}</span>
                  <span className="font-mono-num text-[10px] opacity-75">{tab.countLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body: Responsive Grid + Scrapbook Note Detail */}
        {compactLandscape ? (
          <div className="flex-1 min-h-0 grid grid-cols-[minmax(0,1.28fr)_minmax(0,0.92fr)] gap-3 px-4 py-2.5 overflow-hidden">
            {/* Scrollable Compact Grid */}
            <div className="overflow-y-auto pr-1 grid grid-cols-3 gap-1.5 content-start">
              {filteredFragments.map((frag) => {
                const rec = collectedMemories[frag.id];
                const unlocked = (rec?.count ?? 0) > 0;
                const isSelected = selectedId === frag.id;
                const isNew = newlyDiscoveredIds.includes(frag.id);
                return (
                  <button
                    key={frag.id}
                    type="button"
                    onClick={() => setSelectedId(frag.id)}
                    className={`min-h-[76px] p-1.5 rounded-[16px] border text-center flex flex-col items-center justify-center transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B] ${
                      isSelected
                        ? 'bg-[#FFF7E8] border-[#D67844] shadow-[0_3px_10px_rgba(214,120,68,0.16)]'
                        : unlocked
                          ? 'bg-[#FAF4EB] border-[#EAE0D0] hover:border-[#D9C6AE]'
                          : 'bg-[#F6F1E9]/70 border-[#EAE0D0]/70 hover:border-[#D9C6AE]'
                    }`}
                  >
                    <MemoryIcon id={frag.id} locked={!unlocked} size={36} />
                    <span
                      className={`mt-1 text-[10px] leading-tight truncate w-full ${
                        unlocked ? 'font-bold text-[#4A3528]' : 'font-medium text-[#9A8879]'
                      }`}
                    >
                      {unlocked ? frag.name : '???'}
                    </span>
                    {isNew && (
                      <span className="text-[9px] font-bold text-[#C86D3B] leading-none mt-0.5">
                        NEW
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right Detail Note Panel */}
            <div className="rounded-[20px] bg-[#FAF4EB] border border-[#EDE2D2] p-3 flex flex-col justify-between min-h-0 overflow-y-auto">
              <div>
                <div className="flex items-center gap-2.5">
                  <MemoryIcon id={selectedFrag.id} locked={!selectedUnlocked} size={46} className="shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-[#5B8773] whitespace-nowrap">
                      {selectedStage.stepLabel} · {selectedStage.name}
                    </p>
                    <h3 className="font-display text-base text-[#4A3528] leading-snug truncate">
                      {selectedUnlocked ? selectedFrag.name : '아직 못 찾은 추억'}
                    </h3>
                  </div>
                </div>

                <p className="mt-2.5 text-xs text-[#6E594A] leading-relaxed">
                  {selectedUnlocked ? selectedFrag.shortNote : selectedFrag.locationHint}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-[#EAE0D0] flex items-center justify-between text-[11px] text-[#7D6858]">
                {selectedUnlocked ? (
                  <>
                    <span>
                      발견 <strong className="font-mono-num text-[#4A3528]">{selectedRecord?.count ?? 0}회</strong>
                    </span>
                    <span className="font-mono-num font-bold text-[#C86D3B]">
                      보너스 +{selectedFrag.bonusPoints}점
                    </span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[#927F70]">
                    <Lock className="w-3 h-3" aria-hidden="true" />
                    <span>산책 중 빛나는 조각을 주워보세요</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-5 py-3.5 gap-3">
            {/* 3-Column Keepsake Grid */}
            <div className="flex-1 overflow-y-auto pr-0.5 grid grid-cols-3 gap-2.5 content-start">
              {filteredFragments.map((frag) => {
                const rec = collectedMemories[frag.id];
                const unlocked = (rec?.count ?? 0) > 0;
                const isSelected = selectedId === frag.id;
                const isNew = newlyDiscoveredIds.includes(frag.id);
                const stageDef = getStageDefinition(frag.stageId);
                return (
                  <button
                    key={frag.id}
                    type="button"
                    onClick={() => setSelectedId(frag.id)}
                    className={`min-h-[108px] p-2.5 rounded-[20px] border text-center flex flex-col items-center justify-center transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B] ${
                      isSelected
                        ? 'bg-[#FFF7E8] border-[#D67844] shadow-[0_4px_14px_rgba(214,120,68,0.16)]'
                        : unlocked
                          ? 'bg-[#FAF4EB] border-[#EAE0D0] hover:border-[#D9C6AE]'
                          : 'bg-[#F6F1E9]/70 border-[#EAE0D0]/70 hover:border-[#D9C6AE]'
                    }`}
                  >
                    <MemoryIcon id={frag.id} locked={!unlocked} size={48} />
                    <span
                      className={`mt-1.5 text-xs leading-tight truncate w-full ${
                        unlocked ? 'font-bold text-[#4A3528]' : 'font-medium text-[#9A8879]'
                      }`}
                    >
                      {unlocked ? frag.name : '???'}
                    </span>
                    <span className="mt-0.5 text-[10px] text-[#8E7B6C] whitespace-nowrap">
                      {isNew ? (
                        <strong className="text-[#C86D3B]">새로 발견!</strong>
                      ) : (
                        `${stageDef.stepLabel} · ${frag.orderInStage}번`
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Keepsake Diary Strip */}
            <div className="shrink-0 rounded-[22px] bg-[#FAF4EB] border border-[#EDE2D2] px-4 py-3">
              <div className="flex items-start gap-3">
                <MemoryIcon
                  id={selectedFrag.id}
                  locked={!selectedUnlocked}
                  size={52}
                  className="shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[#5B8773] whitespace-nowrap">
                        {selectedStage.stepLabel} · {selectedStage.name}
                      </p>
                      <h3 className="font-display text-lg text-[#4A3528] leading-snug truncate">
                        {selectedUnlocked ? selectedFrag.name : '아직 발견하지 못한 추억'}
                      </h3>
                    </div>

                    {selectedUnlocked ? (
                      <div className="text-right text-[11px] text-[#7D6858] whitespace-nowrap shrink-0">
                        <div className="font-mono-num font-bold text-[#C86D3B]">
                          +{selectedFrag.bonusPoints}점
                        </div>
                        <div>
                          누적 <strong className="font-mono-num text-[#4A3528]">{selectedRecord?.count ?? 0}회</strong>
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#927F70] whitespace-nowrap shrink-0">
                        <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>미발견</span>
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs sm:text-[13px] text-[#6E594A] leading-relaxed">
                    {selectedUnlocked ? (
                      selectedFrag.shortNote
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#C86D3B] shrink-0" aria-hidden="true" />
                        <span>{selectedFrag.locationHint}</span>
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
