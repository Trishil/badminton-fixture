import { useState } from 'react';
import {
  Trophy,
  CheckCircle,
  Sparkles,
  AlertCircle,
  Plus,
  Minus,
  Play,
} from 'lucide-react';
import { KnockoutMatch } from '../../types/tournament';
import { useTournament } from '../../context/TournamentContext';
import { PodiumModal } from '../modals/PodiumModal';
import { EditMatchModal } from '../modals/EditMatchModal';

export const KnockoutView: React.FC = () => {
  const {
    knockoutMatches,
    teams,
    settings,
    setKnockoutMode,
    updateScore,
    quickFinishMatch,
    finishAndAdvanceMatch,
    dispatchToCourt,
    setShowPodiumModal,
    isTournamentFinished,
    championTeam,
    setActiveTab,
  } = useTournament();

  const [editingMatch, setEditingMatch] = useState<KnockoutMatch | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const teamMap = new Map(teams.map((t) => [t.id, t.name]));

  const getTeamName = (teamId: string | null, placeholder: string) => {
    if (!teamId) return placeholder;
    const full = teamMap.get(teamId) || teamId;
    return full.split(' (')[0];
  };

  const getTeamSub = (teamId: string | null) => {
    if (!teamId) return '';
    const full = teamMap.get(teamId) || teamId;
    return full.split(' (')[1]?.replace(')', '') || teamId;
  };

  // Group matches by stage
  const qfMatches = knockoutMatches.filter((m) => m.stage === 'qf');
  const semiMatches = knockoutMatches.filter((m) => m.stage === 'semi');
  const finalMatch = knockoutMatches.find((m) => m.stage === 'final');

  const handleFinishPlayoffMatch = (matchId: string) => {
    setErrorMessage(null);
    const result = finishAndAdvanceMatch(matchId);
    if (!result.success && result.error) {
      setErrorMessage(result.error);
    }
  };

  const renderMatchCard = (m: KnockoutMatch) => {
    const isReady = Boolean(m.teamAId && m.teamBId);
    const isCompleted = m.status === 'completed';
    const isLive = m.status === 'live';
    const isWinnerA = isCompleted && m.winnerId === m.teamAId;
    const isWinnerB = isCompleted && m.winnerId === m.teamBId;

    return (
      <div
        key={m.id}
        className={`rounded-2xl border transition-all overflow-hidden flex flex-col bg-white shadow-sm hover:shadow-md ${
          isLive
            ? 'border-emerald-400 ring-2 ring-emerald-500/20'
            : isCompleted
            ? 'border-slate-200'
            : 'border-slate-200/90'
        }`}
      >
        {/* Card Header */}
        <div className="px-3.5 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                m.court === 1
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-purple-50 text-purple-700 border border-purple-200'
              }`}
            >
              Court {m.court}
            </span>
            <span className="text-xs font-bold text-slate-800">{m.label.split(' (')[0]}</span>
          </div>

          <div>
            {isLive ? (
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                Live
              </span>
            ) : isCompleted ? (
              <span className="text-[10px] font-semibold text-slate-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                Final
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium">Scheduled</span>
            )}
          </div>
        </div>

        {/* Teams & Score Interaction */}
        <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
          {/* Side A */}
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
              isWinnerA
                ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-500/20'
                : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Side A</span>
              <p
                className={`text-xs font-bold truncate ${
                  isWinnerA ? 'text-emerald-800 font-black' : m.teamAId ? 'text-slate-900' : 'text-slate-400 italic'
                }`}
              >
                {getTeamName(m.teamAId, m.teamAPlaceholder)}
              </p>
              {m.teamAId && (
                <p className="text-[10px] text-slate-500 truncate">{getTeamSub(m.teamAId)}</p>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isReady && !isCompleted && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateScore(m.id, 'A', -1)}
                    disabled={m.scoreA <= 0}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-30 text-slate-700 border border-slate-300 flex items-center justify-center text-xs shadow-xs"
                    aria-label="Decrease score Side A"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateScore(m.id, 'A', 1)}
                    className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shadow-xs"
                    aria-label="Increase score Side A"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <span
                className={`font-mono text-xl font-black w-8 text-center ${
                  isWinnerA ? 'text-emerald-700' : 'text-slate-900'
                }`}
              >
                {m.scoreA}
              </span>
            </div>
          </div>

          {/* Side B */}
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
              isWinnerB
                ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-500/20'
                : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Side B</span>
              <p
                className={`text-xs font-bold truncate ${
                  isWinnerB ? 'text-emerald-800 font-black' : m.teamBId ? 'text-slate-900' : 'text-slate-400 italic'
                }`}
              >
                {getTeamName(m.teamBId, m.teamBPlaceholder)}
              </p>
              {m.teamBId && (
                <p className="text-[10px] text-slate-500 truncate">{getTeamSub(m.teamBId)}</p>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isReady && !isCompleted && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateScore(m.id, 'B', -1)}
                    disabled={m.scoreB <= 0}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-30 text-slate-700 border border-slate-300 flex items-center justify-center text-xs shadow-xs"
                    aria-label="Decrease score Side B"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateScore(m.id, 'B', 1)}
                    className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shadow-xs"
                    aria-label="Increase score Side B"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <span
                className={`font-mono text-xl font-black w-8 text-center ${
                  isWinnerB ? 'text-emerald-700' : 'text-slate-900'
                }`}
              >
                {m.scoreB}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          {isReady && !isCompleted && (
            <div className="pt-1 flex flex-col gap-1.5">
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => quickFinishMatch(m.id, m.teamAId!, 5, 3)}
                  className="flex-1 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium truncate border border-slate-200"
                >
                  {getTeamName(m.teamAId, 'A')} 5-3
                </button>
                <button
                  onClick={() => quickFinishMatch(m.id, m.teamBId!, 5, 3)}
                  className="flex-1 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium truncate border border-slate-200"
                >
                  {getTeamName(m.teamBId, 'B')} 5-3
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    dispatchToCourt(m.id, m.court);
                    setActiveTab('courts');
                  }}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition shadow-xs"
                  title="Run this match on live court dashboard timer"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Send to C{m.court}</span>
                </button>

                <button
                  onClick={() => handleFinishPlayoffMatch(m.id)}
                  disabled={m.scoreA === m.scoreB}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs flex items-center justify-center gap-1 transition shadow-xs"
                >
                  <CheckCircle className="w-3 h-3" />
                  <span>Confirm Winner</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <span>Championship Knockout Playoff</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Single-elimination playoff tree seeded directly from Group Stage standings.
          </p>
        </div>

        {/* Mode Switcher Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs self-start sm:self-auto">
          <button
            onClick={() => setKnockoutMode('top1_semis')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              settings.knockoutMode === 'top1_semis'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Top 1 (4-Team Semis)
          </button>
          <button
            onClick={() => setKnockoutMode('top2_quarters')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              settings.knockoutMode === 'top2_quarters'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Top 2 (8-Team Quarters)
          </button>
        </div>
      </div>

      {/* Champion Banner if finished */}
      {isTournamentFinished && championTeam && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm glow-amber">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center font-black text-2xl shadow-sm">
              🏆
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                Tournament Champions Crowned!
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {championTeam.name.split(' (')[0]}
              </h3>
              <p className="text-xs text-slate-600">
                {championTeam.name.split(' (')[1]?.replace(')', '') || championTeam.id}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPodiumModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs sm:text-sm shadow-sm flex items-center gap-2 active:scale-95 transition"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Open Winner Podium</span>
          </button>
        </div>
      )}

      {/* Error alert if tie happens */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Visual Bracket Grid */}
      <div className="space-y-6">
        {/* If Quarter-Finals exist */}
        {settings.knockoutMode === 'top2_quarters' && qfMatches.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Quarter-Finals (8 Teams)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {qfMatches.map((m) => renderMatchCard(m))}
            </div>
          </div>
        )}

        {/* Semi-Finals */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Semi-Finals
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {semiMatches.map((m) => renderMatchCard(m))}
          </div>
        </div>

        {/* Grand Final Card */}
        {finalMatch && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                Grand Championship Final (Court 1)
              </h3>
            </div>
            <div className="max-w-xl mx-auto">
              {renderMatchCard(finalMatch)}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <PodiumModal />
      <EditMatchModal
        match={editingMatch}
        isOpen={Boolean(editingMatch)}
        onClose={() => setEditingMatch(null)}
      />
    </div>
  );
};
