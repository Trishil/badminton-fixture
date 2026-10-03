import { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  CheckCircle,
  Clock,
  ArrowRight,
  AlertCircle,
  Zap,
  Eye,
  Key,
} from 'lucide-react';
import { Match, KnockoutMatch } from '../../types/tournament';
import { useTournament } from '../../context/TournamentContext';

interface CourtCardProps {
  courtNumber: 1 | 2;
  liveMatch: Match | KnockoutMatch | null;
  upNextMatch: Match | KnockoutMatch | null;
}

export const CourtCard: React.FC<CourtCardProps> = ({
  courtNumber,
  liveMatch,
  upNextMatch,
}) => {
  const {
    teams,
    court1Timer,
    court2Timer,
    updateScore,
    quickFinishMatch,
    finishAndAdvanceMatch,
    isCoach,
    setShowAuthModal,
  } = useTournament();

  const [actionError, setActionError] = useState<string | null>(null);

  const timer = courtNumber === 1 ? court1Timer : court2Timer;
  const isCourt1 = courtNumber === 1;

  // Helper to find team name
  const getTeamName = (teamId: string | null | undefined, placeholder?: string) => {
    if (!teamId) return placeholder || 'TBD';
    const found = teams.find((t) => t.id === teamId);
    return found ? found.name : teamId;
  };

  const getTeamShort = (teamId: string | null | undefined, placeholder?: string) => {
    const full = getTeamName(teamId, placeholder);
    return full.split(' (')[0];
  };

  // Match details
  const matchId = liveMatch ? ('matchId' in liveMatch ? liveMatch.matchId : liveMatch.id) : null;
  const teamAId = liveMatch ? ('teamA_id' in liveMatch ? liveMatch.teamA_id : liveMatch.teamAId) : null;
  const teamBId = liveMatch ? ('teamB_id' in liveMatch ? liveMatch.teamB_id : liveMatch.teamBId) : null;
  const scoreA = liveMatch?.scoreA ?? 0;
  const scoreB = liveMatch?.scoreB ?? 0;

  // Match title / label
  const matchTitle = liveMatch
    ? 'label' in liveMatch
      ? liveMatch.label
      : `Pool ${liveMatch.group} • Match #${liveMatch.matchNumber} (Round ${liveMatch.round})`
    : `Court ${courtNumber} Available`;

  // Up Next match details
  const upNextMatchId = upNextMatch
    ? 'matchId' in upNextMatch
      ? upNextMatch.matchId
      : upNextMatch.id
    : null;
  const upNextTeamA = upNextMatch
    ? 'teamA_id' in upNextMatch
      ? upNextMatch.teamA_id
      : upNextMatch.teamAId
    : null;
  const upNextTeamB = upNextMatch
    ? 'teamB_id' in upNextMatch
      ? upNextMatch.teamB_id
      : upNextMatch.teamBId
    : null;
  const upNextLabel = upNextMatch
    ? 'label' in upNextMatch
      ? upNextMatch.label
      : `Pool ${upNextMatch.group} • Match #${upNextMatch.matchNumber}`
    : 'No matches in queue';

  // Format timer
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer visual states: normal, warning (<2min), expired (0:00)
  const isExpired = timer.secondsRemaining <= 0;
  const isWarning = timer.secondsRemaining <= 120 && !isExpired;

  const timerColorClass = isExpired
    ? 'text-rose-700 bg-rose-50 border-rose-300 animate-urgent shadow-xs'
    : isWarning
    ? 'text-amber-800 bg-amber-50 border-amber-300 animate-pulse'
    : 'text-emerald-700 bg-emerald-50 border-emerald-200';

  // Finish match handler
  const handleFinishMatch = () => {
    if (!matchId) return;
    setActionError(null);
    const result = finishAndAdvanceMatch(matchId);
    if (!result.success && result.error) {
      setActionError(result.error);
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col bg-white shadow-sm hover:shadow-md ${
        isCourt1
          ? 'border-blue-200 hover:border-blue-300'
          : 'border-purple-200 hover:border-purple-300'
      }`}
    >
      {/* Court Header & Timer Bar */}
      <div
        className={`px-3.5 py-3 sm:px-4 sm:py-3 border-b flex items-center justify-between gap-2 ${
          isCourt1 ? 'bg-blue-50/70 border-blue-100' : 'bg-purple-50/70 border-purple-100'
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white shadow-xs flex-shrink-0 ${
              isCourt1 ? 'bg-blue-600' : 'bg-purple-600'
            }`}
          >
            C{courtNumber}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Court {courtNumber}</h2>
              {liveMatch ? (
                <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  LIVE
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">
                  Idle
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate max-w-[180px] sm:max-w-none">{matchTitle}</p>
          </div>
        </div>

        {/* 7-min Match Countdown Timer */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div
            className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-xl border font-mono font-bold text-sm sm:text-base tracking-wider flex items-center gap-1.5 ${timerColorClass}`}
          >
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{formatTimer(timer.secondsRemaining)}</span>
          </div>

          {/* Timer Controls (Coach Only) */}
          {isCoach && (
            <div className="flex items-center gap-1">
              {timer.isRunning ? (
                <button
                  onClick={timer.pause}
                  title="Pause Match Timer"
                  className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition"
                >
                  <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              ) : (
                <button
                  onClick={timer.start}
                  title="Start Match Timer"
                  className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
                </button>
              )}
              <button
                onClick={() => timer.reset(420)}
                title="Reset Timer to 7:00"
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={timer.addMinute}
                title="Add +1 Minute"
                className="px-1.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-mono font-bold"
              >
                +1m
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Scoreboard Area */}
      {liveMatch && matchId && teamAId && teamBId ? (
        <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
          {/* Deuce & Rule Indicator */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-600 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <strong className="text-slate-800">Race to 5:</strong> Sudden-death at 4-4 (First to 5 wins).
            </span>
            {(scoreA === 4 && scoreB === 4) && (
              <span className="text-[11px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 animate-pulse">
                Sudden Death Point!
              </span>
            )}
          </div>

          {/* Action error banner if finish fails due to tie */}
          {actionError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Two Teams Scoreboard Split */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
            {/* Team A Card */}
            <div
              className={`p-3 sm:p-4 rounded-xl border flex flex-col items-center justify-between transition-all ${
                scoreA >= 5 && scoreA > scoreB
                  ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50/80 border-slate-200'
              }`}
            >
              <div className="text-center w-full mb-1 sm:mb-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Side A
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 truncate" title={getTeamName(teamAId)}>
                  {getTeamShort(teamAId)}
                </h3>
                <p className="text-[11px] text-slate-500 truncate max-w-full">
                  {teams.find((t) => t.id === teamAId)?.name.split(' (')[1]?.replace(')', '') || teamAId}
                </p>
              </div>

              {/* Huge Live Score Counter */}
              <div className="my-1 sm:my-3">
                <span
                  className={`text-5xl sm:text-6xl font-black font-mono tracking-tight ${
                    scoreA >= 5 ? 'text-emerald-600' : 'text-slate-900'
                  }`}
                >
                  {scoreA}
                </span>
              </div>

              {/* Large Touch Buttons for Mobile Ground Coordinators (Coach Only) */}
              {isCoach && (
                <div className="w-full flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => updateScore(matchId, 'A', -1)}
                    disabled={scoreA <= 0}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white hover:bg-slate-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-slate-700 flex items-center justify-center transition border border-slate-300 shadow-xs"
                    aria-label="Decrease Team A score"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => updateScore(matchId, 'A', 1)}
                    className="flex-1 h-11 sm:h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-lg flex items-center justify-center gap-1 transition shadow-sm shadow-emerald-600/30"
                    aria-label="Increase Team A score"
                  >
                    <Plus className="w-5 h-5" />
                    <span>+1</span>
                  </button>
                </div>
              )}
            </div>

            {/* Team B Card */}
            <div
              className={`p-3 sm:p-4 rounded-xl border flex flex-col items-center justify-between transition-all ${
                scoreB >= 5 && scoreB > scoreA
                  ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50/80 border-slate-200'
              }`}
            >
              <div className="text-center w-full mb-1 sm:mb-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Side B
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 truncate" title={getTeamName(teamBId)}>
                  {getTeamShort(teamBId)}
                </h3>
                <p className="text-[11px] text-slate-500 truncate max-w-full">
                  {teams.find((t) => t.id === teamBId)?.name.split(' (')[1]?.replace(')', '') || teamBId}
                </p>
              </div>

              {/* Huge Live Score Counter */}
              <div className="my-1 sm:my-3">
                <span
                  className={`text-5xl sm:text-6xl font-black font-mono tracking-tight ${
                    scoreB >= 5 ? 'text-emerald-600' : 'text-slate-900'
                  }`}
                >
                  {scoreB}
                </span>
              </div>

              {/* Large Touch Buttons for Mobile Ground Coordinators (Coach Only) */}
              {isCoach && (
                <div className="w-full flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => updateScore(matchId, 'B', -1)}
                    disabled={scoreB <= 0}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white hover:bg-slate-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-slate-700 flex items-center justify-center transition border border-slate-300 shadow-xs"
                    aria-label="Decrease Team B score"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => updateScore(matchId, 'B', 1)}
                    className="flex-1 h-11 sm:h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-lg flex items-center justify-center gap-1 transition shadow-sm shadow-emerald-600/30"
                    aria-label="Increase Team B score"
                  >
                    <Plus className="w-5 h-5" />
                    <span>+1</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Finish Shortcuts & Finish Match CTA vs Spectator View */}
          {isCoach ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs overflow-x-auto pb-1 sm:pb-0">
                <span className="text-slate-500 font-semibold whitespace-nowrap hidden sm:inline">Quick Score:</span>
                <button
                  onClick={() => quickFinishMatch(matchId, teamAId, 5, 3)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs truncate border border-slate-200 transition text-center"
                >
                  {getTeamShort(teamAId)} 5-3
                </button>
                <button
                  onClick={() => quickFinishMatch(matchId, teamBId, 5, 3)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs truncate border border-slate-200 transition text-center"
                >
                  {getTeamShort(teamBId)} 5-3
                </button>
                <button
                  onClick={() => quickFinishMatch(matchId, teamAId, 5, 4)}
                  className="py-1.5 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium text-xs border border-amber-200 transition"
                  title="5-4 Sudden Death Win for Side A"
                >
                  5-4 (A)
                </button>
                <button
                  onClick={() => quickFinishMatch(matchId, teamBId, 5, 4)}
                  className="py-1.5 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium text-xs border border-amber-200 transition"
                  title="5-4 Sudden Death Win for Side B"
                >
                  5-4 (B)
                </button>
              </div>

              {/* Primary Action Button: Finish Match & Free Court */}
              <button
                onClick={handleFinishMatch}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] ${
                  scoreA !== scoreB
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold shadow-emerald-600/25'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                <CheckCircle className="w-5 h-5 text-current" />
                <span className="truncate">
                  {scoreA !== scoreB
                    ? `Finish Match & Call Next (${scoreA > scoreB ? getTeamShort(teamAId) : getTeamShort(teamBId)} Wins)`
                    : 'Finish Match (A winner is required)'}
                </span>
              </button>
            </div>
          ) : (
            /* Spectator Read-only View Banner */
            <div className="pt-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Eye className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <p className="text-xs text-slate-600 truncate">
                    <strong className="text-slate-800">Spectator View:</strong> Live scores synced across devices.
                  </p>
                </div>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 rounded-lg border border-slate-200 shadow-xs flex items-center gap-1 flex-shrink-0 transition"
                >
                  <Key className="w-3 h-3 text-amber-600" />
                  <span>Coach Unlock</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty / Idle Court State */
        <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
            <CheckCircle className="w-6 h-6" />
          </div>
          <p className="text-slate-800 font-bold">No match currently on Court {courtNumber}</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            All assigned matches for this court are completed or waiting for playoff fixtures.
          </p>
        </div>
      )}

      {/* "Up Next" Queue Banner (Beneath Court Card) */}
      <div
        className={`p-3 sm:p-3.5 border-t flex items-center justify-between gap-2 ${
          isCourt1 ? 'bg-blue-50/40 border-blue-100' : 'bg-purple-50/40 border-purple-100'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-black uppercase text-amber-700 tracking-wider flex-shrink-0">
            ON DECK
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">
              {upNextTeamA && upNextTeamB
                ? `${getTeamShort(upNextTeamA)} vs ${getTeamShort(upNextTeamB)}`
                : upNextLabel}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {upNextMatch ? upNextLabel : 'Court queue is clear'}
            </p>
          </div>
        </div>

        {isCoach && upNextMatch && upNextMatchId && (
          <button
            onClick={() => {
              if (liveMatch && matchId) {
                finishAndAdvanceMatch(matchId);
              } else {
                finishAndAdvanceMatch(upNextMatchId);
              }
            }}
            title="Call On-Deck match to court now"
            className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1 transition border border-slate-200 shadow-xs"
          >
            <span>Call to Court</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
          </button>
        )}
      </div>
    </div>
  );
};
