import { useState } from 'react';
import { Shield, Key, Eye, Check, Copy, Unlock, X, AlertCircle } from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';

interface AuthKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthKeyModal: React.FC<AuthKeyModalProps> = ({ isOpen, onClose }) => {
  const {
    isCoach,
    coachKey,
    unlockCoachMode,
    lockCoachMode,
    cloudSyncStatus,
  } = useTournament();

  const [inputKey, setInputKey] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<'spectator' | 'coach' | null>(null);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const success = unlockCoachMode(inputKey);
    if (success) {
      setInputKey('');
      onClose();
    } else {
      setErrorMessage('Invalid Key! Please check with the tournament organizer or coach.');
    }
  };

  const handleLock = () => {
    lockCoachMode();
    setInputKey('');
    onClose();
  };

  const getShareUrl = (keyParam?: string) => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin + window.location.pathname;
    return keyParam ? `${base}?key=${encodeURIComponent(keyParam)}` : base;
  };

  const copyToClipboard = (text: string, type: 'spectator' | 'coach') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isCoach ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
            }`}>
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                {isCoach ? 'Coach / Editor Access' : 'Spectator vs Coach Access'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isCoach ? 'Full scoring, timer, and tournament controls active' : 'Live viewing mode (read-only)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4">
          {/* Current Status Badge */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
            isCoach
              ? 'bg-amber-50/80 border-amber-200 text-amber-900'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-2.5">
              {isCoach ? (
                <Unlock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              ) : (
                <Eye className="w-5 h-5 text-slate-500 flex-shrink-0" />
              )}
              <div>
                <span className="text-xs font-bold block">
                  {isCoach ? 'Editor Access: UNLOCKED' : 'Current Mode: SPECTATOR'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {isCoach
                    ? 'You can add points, pause timers, and advance matches'
                    : 'Scores are live and auto-updating in read-only mode'}
                </span>
              </div>
            </div>
            {isCoach && (
              <button
                onClick={handleLock}
                className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 shadow-xs transition"
              >
                Lock
              </button>
            )}
          </div>

          {/* If NOT coach, show Unlock Form */}
          {!isCoach && (
            <form onSubmit={handleUnlock} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Enter Coach / Editor Key
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Enter editor key (e.g. coach2026)"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition"
              >
                Unlock Coach Controls
              </button>
            </form>
          )}

          {/* Share Links Card */}
          <div className="pt-2 border-t border-slate-200 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Shareable Tournament Links
            </span>

            {/* Spectator Link */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Spectator Link (Public / Live View Only)
                </span>
                <p className="text-xs font-mono text-slate-700 truncate">
                  {getShareUrl()}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(getShareUrl(), 'spectator')}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition flex items-center gap-1 flex-shrink-0"
              >
                {copiedType === 'spectator' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Coach Direct Link */}
            {isCoach && (
              <div className="p-2.5 bg-amber-50/50 border border-amber-200 rounded-xl flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    Coach Direct Link (Auto-Unlocks Scoring)
                  </span>
                  <p className="text-xs font-mono text-slate-700 truncate">
                    {getShareUrl(coachKey)}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(getShareUrl(coachKey), 'coach')}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200 shadow-xs transition flex items-center gap-1 flex-shrink-0"
                >
                  {copiedType === 'coach' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-amber-600" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Cloud Sync Status Note */}
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                cloudSyncStatus === 'synced'
                  ? 'bg-emerald-500'
                  : cloudSyncStatus === 'syncing'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-slate-400'
              }`} />
              <span>Database: {cloudSyncStatus === 'synced' ? 'Live Cloud Connected' : cloudSyncStatus}</span>
            </span>
            <span className="text-slate-400">Multi-device real-time sync</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
