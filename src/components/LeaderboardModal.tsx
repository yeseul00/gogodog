import { Award, LogIn, LogOut, Trophy, X } from 'lucide-react';
import { useMemo } from 'react';
import {
  buildLeaderboard,
  sanitizeCharacterName,
  type RankingEntry,
  type RankingTab,
} from '../game/ranking';
import { getStageDefinition, STAGE_LIST } from '../game/stages';

interface LeaderboardModalProps {
  open: boolean;
  activeTab: RankingTab;
  entries: RankingEntry[];
  loading: boolean;
  error: string | null;
  currentCharacterName: string;
  isSignedIn: boolean;
  authBusy: boolean;
  compactLandscape?: boolean;
  onChangeTab: (tab: RankingTab) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onClose: () => void;
}

export function LeaderboardModal({
  open,
  activeTab,
  entries,
  loading,
  error,
  currentCharacterName,
  isSignedIn,
  authBusy,
  compactLandscape = false,
  onChangeTab,
  onSignIn,
  onSignOut,
  onClose,
}: LeaderboardModalProps) {
  const rows = useMemo(() => buildLeaderboard(entries, activeTab), [entries, activeTab]);
  const normalizedCurrent = sanitizeCharacterName(currentCharacterName).toLowerCase();

  if (!open) return null;

  const tabs: { id: RankingTab; label: string }[] = [
    { id: 'all', label: '전체' },
    ...STAGE_LIST.map((s) => ({
      id: s.id as RankingTab,
      label: compactLandscape ? `${s.stepLabel} ${s.name}` : `${s.stepLabel} · ${s.name}`,
    })),
  ];

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center p-2.5 sm:p-5 safe-px bg-[#3A2C22]/38 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-label="온라인 산책 랭킹"
    >
      <div
        className={`w-full max-h-full flex flex-col overflow-hidden bg-[#FFFDF9]/98 backdrop-blur-md border border-white/95 shadow-[0_22px_54px_rgba(52,36,24,0.3)] ${
          compactLandscape ? 'max-w-[600px] rounded-[24px]' : 'max-w-[440px] rounded-[30px]'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between gap-2 border-b border-[#EFE6D8] shrink-0 ${
            compactLandscape ? 'px-4 py-2.5' : 'px-5 py-3.5'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-2xl bg-[#FCECE0] flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4 text-[#C86D3B]" strokeWidth={2.4} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2
                className={`font-display text-[#4A3528] leading-tight whitespace-nowrap ${
                  compactLandscape ? 'text-lg' : 'text-xl'
                }`}
              >
                산책 랭킹
              </h2>
              <p className="text-[11px] text-[#847060] truncate">
                전체 통합 및 단계별 최고 점수 순위
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="랭킹 닫기"
            className="min-h-[44px] min-w-[44px] rounded-2xl bg-[#F5EFE4] hover:bg-[#EAE0D0] active:scale-95 text-[#5C4638] flex items-center justify-center transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B]"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* 4 Tabs: All + Stage 1, 2, 3 */}
        <div className={`shrink-0 ${compactLandscape ? 'px-4 pt-2 pb-1.5' : 'px-5 pt-3 pb-2'}`}>
          <div
            role="tablist"
            aria-label="랭킹 구간 선택"
            className="flex items-center gap-1 p-1 rounded-[16px] bg-[#F3ECE0] border border-[#E7DCCB] overflow-x-auto"
          >
            {tabs.map((tab) => {
              const selected = tab.id === activeTab;
              return (
                <button
                  key={String(tab.id)}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => onChangeTab(tab.id)}
                  className={`flex-1 min-h-[40px] px-2.5 rounded-[12px] text-xs whitespace-nowrap transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86D3B] ${
                    selected
                      ? 'bg-[#FFFDF9] text-[#C86D3B] font-bold shadow-[0_2px_8px_rgba(92,70,50,0.12)]'
                      : 'text-[#745E4E] font-medium hover:text-[#4A3528]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ranking Rows */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto ${
            compactLandscape ? 'px-4 py-1.5' : 'px-5 py-2'
          }`}
        >
          {loading ? (
            <div className="py-10 text-center text-xs sm:text-sm text-[#847060]">
              온라인 랭킹을 불러오는 중이에요...
            </div>
          ) : error ? (
            <div className="py-8 text-center text-xs sm:text-sm text-[#B84A42]">{error}</div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center">
              <Award className="w-8 h-8 text-[#D8C4AC] mx-auto" aria-hidden="true" />
              <p className="mt-2 text-sm font-bold text-[#6E594A]">아직 등록된 기록이 없어요</p>
              <p className="mt-0.5 text-xs text-[#8C7868]">
                첫 번째 산책을 마치고 1등 자리에 이름을 올려보세요!
              </p>
            </div>
          ) : (
            <ol className="divide-y divide-[#F0E8DA]">
              {rows.slice(0, 50).map((row) => {
                const isMine =
                  Boolean(normalizedCurrent) &&
                  row.entry.characterName.toLowerCase() === normalizedCurrent;
                const stage = getStageDefinition(row.entry.stageId);
                const rankBadgeClass =
                  row.rank === 1
                    ? 'bg-[#F8D66D] text-[#6B4308]'
                    : row.rank === 2
                      ? 'bg-[#DFE5EC] text-[#45505C]'
                      : row.rank === 3
                        ? 'bg-[#E9BC94] text-[#663A17]'
                        : 'bg-[#F3ECE0] text-[#7A6555]';

                return (
                  <li
                    key={row.entry.id}
                    className={`flex items-center justify-between gap-2.5 rounded-2xl px-2.5 transition-colors ${
                      compactLandscape ? 'py-2' : 'py-2.5'
                    } ${isMine ? 'bg-[#FDF1E6]' : ''}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-xl font-mono-num text-xs font-bold flex items-center justify-center shrink-0 ${rankBadgeClass}`}
                      >
                        {row.rank}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm font-bold text-[#4A3528] truncate">
                            {row.entry.characterName}
                          </span>
                          {isMine && (
                            <span className="text-[10px] font-bold text-[#C86D3B] whitespace-nowrap">
                              나
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#847060] whitespace-nowrap">
                          {activeTab === 'all' && (
                            <>
                              <span className="font-medium text-[#5B8773]">
                                {stage.stepLabel} {stage.name}
                              </span>
                              <span aria-hidden="true">·</span>
                            </>
                          )}
                          <span className="font-mono-num">{row.entry.distance}m</span>
                          <span aria-hidden="true">·</span>
                          <span>{row.entry.outcome === 'completed' ? '완주' : '중도 귀가'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono-num text-sm sm:text-base font-bold text-[#4A3528]">
                        {row.entry.score.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-[#968272]">점</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Footer: Account status for ranking registration */}
        <div
          className={`border-t border-[#EFE6D8] bg-[#FAF5EC]/80 shrink-0 flex items-center justify-between gap-2 ${
            compactLandscape ? 'px-4 py-2' : 'px-5 py-3'
          }`}
        >
          {isSignedIn ? (
            <>
              <span className="text-[11px] text-[#6E594A] truncate">
                Google 로그인 연결됨 · 산책 종료 시 자동 등록
              </span>
              <button
                type="button"
                disabled={authBusy}
                onClick={onSignOut}
                className="min-h-[40px] px-3 rounded-xl text-xs font-bold text-[#7A6555] hover:text-[#4A3528] hover:bg-[#EFE6D8] flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>로그아웃</span>
              </button>
            </>
          ) : (
            <>
              <span className="text-[11px] text-[#745E4E] truncate">
                내 점수를 온라인 랭킹에 올리려면 로그인해 주세요.
              </span>
              <button
                type="button"
                disabled={authBusy}
                onClick={onSignIn}
                className="min-h-[40px] px-3 rounded-xl bg-[#D67844] hover:bg-[#C46936] text-[#FFFDF9] text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm cursor-pointer disabled:opacity-60"
              >
                <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{authBusy ? '연결 중...' : 'Google 로그인'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
