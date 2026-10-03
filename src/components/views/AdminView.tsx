import { useState } from 'react';
import {
  Settings,
  Sparkles,
  Download,
  Upload,
  Trash2,
  FileSpreadsheet,
  FileCode,
  RefreshCw,
  Users,
} from 'lucide-react';
import { GroupId } from '../../types/tournament';
import { useTournament } from '../../context/TournamentContext';
import { exportTournamentToJSON, exportStandingsToCSV, exportFixturesToCSV } from '../../utils/export';
import { ResetConfirmModal } from '../modals/ResetConfirmModal';

export const AdminView: React.FC = () => {
  const {
    teams,
    matches,
    standings,
    knockoutMatches,
    settings,
    updateTeamName,
    loadStarPlayers,
    simulateRemainingGroupMatches,
    importTournamentJSON,
  } = useTournament();

  const [filterGroup, setFilterGroup] = useState<'all' | GroupId>('all');
  const [showResetModal, setShowResetModal] = useState(false);
  const [importNotice, setImportNotice] = useState<{ text: string; error?: boolean } | null>(null);

  const displayedTeams =
    filterGroup === 'all' ? teams : teams.filter((t) => t.group === filterGroup);

  const handleExportJSON = () => {
    const fullState = {
      teams,
      matches,
      knockoutMatches,
      settings,
      exportedAt: new Date().toISOString(),
    };
    exportTournamentToJSON(fullState, `smashflow_badminton_backup_${Date.now()}.json`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importTournamentJSON(content);
        if (ok) {
          setImportNotice({ text: 'Tournament data imported successfully!' });
        } else {
          setImportNotice({ text: 'Failed to import JSON file. Please check format.', error: true });
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" />
            <span>Admin & Tournament Setup</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure player names, test simulations, export data, and manage tournament resets.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadStarPlayers}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Load Pro Pairs</span>
          </button>

          <button
            onClick={simulateRemainingGroupMatches}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-200 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Auto-Simulate</span>
          </button>

          <button
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Reset All Data</span>
          </button>
        </div>
      </div>

      {/* Import / Export Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CSV Fixtures */}
        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Fixtures & Results</span>
          </div>
          <p className="text-xs text-slate-500">
            Export all 40+ match records with scores, courts, rounds, and winners to CSV.
          </p>
          <button
            onClick={() => exportFixturesToCSV(matches, teams)}
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Fixtures CSV</span>
          </button>
        </div>

        {/* CSV Standings */}
        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>Standings & Tables</span>
          </div>
          <p className="text-xs text-slate-500">
            Export official group standings, PF/PA differential, and tiebreaker notes to CSV.
          </p>
          <button
            onClick={() => exportStandingsToCSV(standings, teams)}
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export Standings CSV</span>
          </button>
        </div>

        {/* JSON Full Backup & Restore */}
        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <FileCode className="w-4 h-4 text-purple-600" />
            <span>JSON Backup & Restore</span>
          </div>
          <p className="text-xs text-slate-500">
            Download full tournament backup file or upload to restore on another device.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportJSON}
              className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1 transition"
            >
              <Download className="w-3 h-3 text-purple-600" />
              <span>Backup JSON</span>
            </button>

            <label className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1 transition cursor-pointer">
              <Upload className="w-3 h-3 text-purple-600" />
              <span>Restore</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {importNotice && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            importNotice.error
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <span>{importNotice.text}</span>
          <button
            onClick={() => setImportNotice(null)}
            className="text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Team Roster Customization Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Rename Teams & Players</h3>
              <p className="text-xs text-slate-500">
                Edits synchronize instantly across all fixtures, scoreboards, and standings.
              </p>
            </div>
          </div>

          {/* Group Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setFilterGroup('all')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                filterGroup === 'all' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All 20 Teams
            </button>
            {(['A', 'B', 'C', 'D'] as GroupId[]).map((g) => (
              <button
                key={g}
                onClick={() => setFilterGroup(g)}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  filterGroup === g ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pool {g}
              </button>
            ))}
          </div>
        </div>

        {/* Editable Teams Grid */}
        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {displayedTeams.map((team) => (
            <div
              key={team.id}
              className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex flex-col items-center justify-center flex-shrink-0 shadow-xs">
                <span className="text-[10px] font-mono text-slate-500 font-bold">{team.id}</span>
                <span className="text-[9px] font-black text-emerald-700">P-{team.group}</span>
              </div>

              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={team.name}
                  onChange={(e) => updateTeamName(team.id, e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium shadow-xs"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ResetConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
      />
    </div>
  );
};
