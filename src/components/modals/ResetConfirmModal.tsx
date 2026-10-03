import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({ isOpen, onClose }) => {
  const { resetTournament } = useTournament();
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    resetTournament();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white border border-rose-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/70">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <h3 className="font-extrabold text-base text-slate-900">Reset All Tournament Data?</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3 text-xs text-slate-600">
          <p>
            This action will wipe all scores, match records, group rankings, playoff brackets, and reset court timers to zero.
          </p>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-600">
            Type <strong className="text-rose-600">RESET</strong> below to confirm:
          </div>
          <input
            type="text"
            placeholder="Type RESET"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-center font-bold tracking-widest focus:outline-none focus:border-rose-500 uppercase shadow-xs"
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirmText !== 'RESET'}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1.5 shadow-sm shadow-rose-600/30"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirm Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
