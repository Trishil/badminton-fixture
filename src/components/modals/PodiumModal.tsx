import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, X } from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';
import { playPodiumFanfare } from '../../utils/audio';

export const PodiumModal: React.FC = () => {
  const {
    showPodiumModal,
    setShowPodiumModal,
    championTeam,
    runnerUpTeam,
    semiFinalistTeams,
    settings,
  } = useTournament();

  useEffect(() => {
    if (showPodiumModal) {
      // Confetti burst on open
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
      });
    }
  }, [showPodiumModal]);

  if (!showPodiumModal || !championTeam) return null;

  const triggerMoreConfetti = () => {
    playPodiumFanfare(settings.soundEnabled);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white border border-amber-300 rounded-3xl shadow-2xl overflow-hidden text-center relative">
        {/* Close Button */}
        <button
          onClick={() => setShowPodiumModal(false)}
          className="absolute right-4 top-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Ribbon */}
        <div className="pt-8 pb-4 px-6 bg-gradient-to-b from-amber-50 to-white">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 p-1 shadow-md shadow-amber-400/30 flex items-center justify-center mb-3 animate-bounce">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <Trophy className="w-10 h-10 text-amber-500 fill-amber-400" />
            </div>
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-amber-800 px-3 py-1 rounded-full bg-amber-100 border border-amber-200">
            Tournament Champions
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {championTeam.name.split(' (')[0]}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {championTeam.name.split(' (')[1]?.replace(')', '') || championTeam.id}
          </p>
        </div>

        {/* Podium Standings (1st, 2nd, 3rd) */}
        <div className="px-6 py-4 space-y-3">
          {/* 1st Place Card */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-black text-lg flex items-center justify-center shadow-xs">
                🥇
              </span>
              <div>
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
                  1st Place • Champions
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm">{championTeam.name.split(' (')[0]}</h4>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2 py-1 rounded-lg border border-amber-200">
              Gold
            </span>
          </div>

          {/* 2nd Place Card */}
          {runnerUpTeam && (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 font-black text-base flex items-center justify-center shadow-xs">
                  🥈
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    2nd Place • Runner-Up
                  </span>
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                    {runnerUpTeam.name.split(' (')[0]}
                  </h4>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                Silver
              </span>
            </div>
          )}

          {/* Semi-Finalists (Joint 3rd) */}
          {semiFinalistTeams.length > 0 && (
            <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-200 flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-black text-base flex items-center justify-center shadow-xs">
                  🥉
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider">
                    Joint 3rd Place • Semi-Finalists
                  </span>
                  <div className="text-xs font-semibold text-slate-700 flex flex-wrap gap-x-2">
                    {semiFinalistTeams.map((t) => (
                      <span key={t.id}>{t.name.split(' (')[0]}</span>
                    ))}
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-800 bg-white border border-amber-200 px-2 py-1 rounded-lg">
                Bronze
              </span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-6 pt-2 flex items-center justify-center gap-3">
          <button
            onClick={triggerMoreConfetti}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-sm active:scale-95 transition"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Celebrate Again!</span>
          </button>
          <button
            onClick={() => setShowPodiumModal(false)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
