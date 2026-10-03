import { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { Match, KnockoutMatch } from '../../types/tournament';
import { useTournament } from '../../context/TournamentContext';

interface EditMatchModalProps {
  match: Match | KnockoutMatch | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditMatchModal: React.FC<EditMatchModalProps> = ({
  match,
  isOpen,
  onClose,
}) => {
  const { teams, overrideMatch } = useTournament();

  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [status, setStatus] = useState<Match['status']>('scheduled');
  const [court, setCourt] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (match) {
      setScoreA(match.scoreA);
      setScoreB(match.scoreB);
      setStatus(match.status);
      setCourt(match.court);
      setError(null);
    }
  }, [match]);

  if (!isOpen || !match) return null;

  const matchId = 'matchId' in match ? match.matchId : match.id;
  const teamAId = 'teamA_id' in match ? match.teamA_id : match.teamAId;
  const teamBId = 'teamB_id' in match ? match.teamB_id : match.teamBId;

  const teamAName = teams.find((t) => t.id === teamAId)?.name || teamAId || 'Team A';
  const teamBName = teams.find((t) => t.id === teamBId)?.name || teamBId || 'Team B';

  const handleSave = () => {
    if (status === 'completed' && scoreA === scoreB) {
      setError('Cannot mark match as Completed with tied scores! Badminton requires a winner (sudden death).');
      return;
    }

    let winnerId: string | null = null;
    if (status === 'completed') {
      winnerId = scoreA > scoreB ? teamAId : teamBId;
    }

    overrideMatch(matchId, {
      scoreA,
      scoreB,
      status,
      court,
      winnerId,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Edit Match #{'matchNumber' in match ? match.matchNumber : match.id}</h3>
            <p className="text-xs text-slate-500">Manual Coordinator Override</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Teams & Scores Inputs */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Side A
              </label>
              <div className="text-xs font-bold text-slate-900 truncate mb-2">{teamAName}</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={scoreA}
                  onChange={(e) => setScoreA(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-center text-lg font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Side B
              </label>
              <div className="text-xs font-bold text-slate-900 truncate mb-2">{teamBName}</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={scoreB}
                  onChange={(e) => setScoreB(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-center text-lg font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 text-[11px]">Presets:</span>
            <button
              onClick={() => { setScoreA(5); setScoreB(3); }}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium border border-slate-200"
            >
              5 - 3
            </button>
            <button
              onClick={() => { setScoreA(3); setScoreB(5); }}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium border border-slate-200"
            >
              3 - 5
            </button>
            <button
              onClick={() => { setScoreA(5); setScoreB(4); }}
              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 rounded-lg text-amber-800 font-medium border border-amber-200"
            >
              5 - 4 (Sudden death)
            </button>
          </div>

          {/* Status Selection */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Match Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['scheduled', 'live', 'completed'] as Match['status'][]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold capitalize transition border ${
                    status === s
                      ? s === 'completed'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : s === 'live'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-800 text-white border-slate-800 shadow-xs'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Court Assignment */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Court Assignment
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCourt(1)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                  court === 1
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                Court 1
              </button>
              <button
                type="button"
                onClick={() => setCourt(2)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                  court === 2
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                Court 2
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/30"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Override</span>
          </button>
        </div>
      </div>
    </div>
  );
};
