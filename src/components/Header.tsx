import React from 'react';
import {
  Volume2,
  VolumeX,
  Clock,
  Trophy,
  Activity,
} from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import { useWakeLock } from '../hooks/useWakeLock';

export const Header: React.FC = () => {
  const {
    settings,
    toggleSound,
    masterSecondsRemaining,
    completedMatchesCount,
    totalGroupMatchesCount,
    isTournamentFinished,
    championTeam,
    setShowPodiumModal,
  } = useTournament();

  const { isLocked, isSupported, requestWakeLock } = useWakeLock();

  // Format master clock
  const formatMasterTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min(
    100,
    Math.round((completedMatchesCount / (totalGroupMatchesCount || 40)) * 100)
  );

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-600/30 text-white font-black flex-shrink-0">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 stroke-white"
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5Z" />
                <path d="M7 10h10" />
                <path d="M12 15v7" />
                <path d="M8 22h8" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold tracking-tight text-base sm:text-lg text-slate-900">
                  SmashFlow
                </span>
                <span className="hidden xs:inline-block px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  2 Courts
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Badminton Tournament Operations Hub
              </p>
            </div>
          </div>

          {/* Master Countdown Clock & Progress */}
          <div className="flex items-center gap-1.5 sm:gap-4">
            <div className="bg-slate-100/90 border border-slate-200 rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 flex items-center gap-1.5 sm:gap-2.5 shadow-xs">
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <Clock className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span className="hidden md:inline font-semibold">Clock:</span>
              </div>
              <div className="font-mono text-xs sm:text-base font-bold text-slate-800 tracking-wider">
                {formatMasterTime(masterSecondsRemaining)}
              </div>
              <div className="hidden lg:flex items-center gap-2 border-l border-slate-200 pl-3">
                <div className="w-20 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono font-semibold text-slate-600">
                  {completedMatchesCount}/{totalGroupMatchesCount}
                </span>
              </div>
            </div>

            {/* Champion Banner if won */}
            {isTournamentFinished && championTeam && (
              <button
                onClick={() => setShowPodiumModal(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-400/25 animate-bounce"
              >
                <Trophy className="w-4 h-4 fill-slate-950" />
                <span>Champion: {championTeam.name.split(' (')[0]}</span>
              </button>
            )}

            {/* Control Icons: Wake Lock & Sound Toggle */}
            <div className="flex items-center gap-1">
              {isSupported && (
                <button
                  onClick={requestWakeLock}
                  title={isLocked ? 'Screen Wake Lock Active (Phone stays awake)' : 'Keep Phone Screen Awake'}
                  className={`p-2 rounded-lg transition-colors border ${
                    isLocked
                      ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  aria-label="Toggle screen wake lock"
                >
                  <Activity className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={toggleSound}
                title={settings.soundEnabled ? 'Mute audio' : 'Unmute audio'}
                className={`p-2 rounded-lg transition-colors border ${
                  settings.soundEnabled
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border-rose-200 text-rose-600'
                }`}
                aria-label="Toggle sound buzzer"
              >
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
