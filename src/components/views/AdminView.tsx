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
  Shield,
  Key,
  Lock,
  Unlock,
  Eye,
  Copy,
  Check,
  Clock,
  RotateCcw,
  Play,
  AlertTriangle,
} from 'lucide-react';
import { GroupId } from '../../types/tournament';
import { useTournament } from '../../context/TournamentContext';
import { exportTournamentToJSON, exportStandingsToCSV, exportFixturesToCSV } from '../../utils/export';
import { ResetConfirmModal } from '../modals/ResetConfirmModal';
import { formatClockTime, formatDurationHuman } from '../../utils/timing';

export const AdminView: React.FC = () => {
  const {
    teams,
    matches,
    standings,
    knockoutMatches,
    settings,
    updateTeamName,
    loadStarPlayers,
    loadGroundTeams,
    simulateRemainingGroupMatches,
    importTournamentJSON,
    isCoach,
    coachKey,
    updateCoachKey,
    cloudSyncStatus,
    triggerManualCloudSync,
    setShowAuthModal,
    startTournamentNow,
    setTournamentStartTime,
    resetTournamentClock,
    tournamentClockStatus,
    secondsUntilStart,
    overtimeSeconds,
    masterSecondsRemaining,
    matchTimings,
  } = useTournament();

  const [filterGroup, setFilterGroup] = useState<'all' | GroupId>('all');
  const [showResetModal, setShowResetModal] = useState(false);
  const [importNotice, setImportNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const [copiedLink, setCopiedLink] = useState<'spectator' | 'coach' | null>(null);
  const [customCoachKeyInput, setCustomCoachKeyInput] = useState('');
  const [customStartTime, setCustomStartTime] = useState(() => {
    const d = new Date(settings.tournamentStartTime);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  });

  const overdueMatchesCount = Array.from(matchTimings.values()).filter((t) => t.isOverdue).length;

  const handleApplyCustomStartTime = () => {
    if (!customStartTime) return;
    const [hStr, mStr] = customStartTime.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) return;
    const now = new Date();
    const newDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    requireCoach(() => {
      setTournamentStartTime(newDate.getTime());
    });
  };

  const getSpectatorUrl = () => {
    if (typeof window === 'undefined') return '';
    return window.location.origin + window.location.pathname;
  };

  const getCoachUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${window.location.pathname}?key=${encodeURIComponent(coachKey)}`;
  };

  const copyLink = (url: string, type: 'spectator' | 'coach') => {
    navigator.clipboard.writeText(url);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const requireCoach = (action: () => void) => {
    if (!isCoach) {
      setShowAuthModal(true);
      return;
    }
    action();
  };

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
            onClick={() => requireCoach(loadGroundTeams)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200 transition"
            title="Load your 15 Tournament Ground Teams"
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Load Ground Teams</span>
          </button>

          <button
            onClick={() => requireCoach(loadStarPlayers)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Load Pro Pairs</span>
          </button>

          <button
            onClick={() => requireCoach(simulateRemainingGroupMatches)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-200 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Auto-Simulate</span>
          </button>

          <button
            onClick={() => requireCoach(() => setShowResetModal(true))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Reset All Data</span>
          </button>
        </div>
      </div>

      {/* Access Keys & Real-time Cloud Sync Hub */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isCoach ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
              }`}
            >
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Database & Access Key Management
              </h3>
              <p className="text-xs text-slate-500">
                Multi-device Firestore synchronization with Coach Editor vs Spectator roles.
              </p>
            </div>
          </div>

          {/* Cloud Sync Status & Sync Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700">
              <span
                className={`w-2 h-2 rounded-full ${
                  cloudSyncStatus === 'synced'
                    ? 'bg-emerald-500 animate-pulse'
                    : cloudSyncStatus === 'syncing'
                    ? 'bg-sky-500 animate-spin'
                    : 'bg-rose-500'
                }`}
              />
              <span>
                Status: {cloudSyncStatus === 'synced' ? 'Cloud Connected' : cloudSyncStatus}
              </span>
            </div>
            <button
              onClick={triggerManualCloudSync}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition flex items-center gap-1.5"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-emerald-600 ${
                  cloudSyncStatus === 'syncing' ? 'animate-spin' : ''
                }`}
              />
              <span>Sync Now</span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Share Links Card */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Shareable Tournament Links
            </h4>

            {/* Spectator Link */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-xs">
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>Public Spectator Link (Read-Only)</span>
                </div>
                <p className="text-xs font-mono text-slate-800 truncate mt-0.5">
                  {getSpectatorUrl()}
                </p>
              </div>
              <button
                onClick={() => copyLink(getSpectatorUrl(), 'spectator')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition flex items-center gap-1 flex-shrink-0"
              >
                {copiedLink === 'spectator' ? (
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
            <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200 flex items-center justify-between gap-2 shadow-xs">
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>Coach Direct Link (Auto-Unlocks Scoring)</span>
                </div>
                <p className="text-xs font-mono text-slate-800 truncate mt-0.5">
                  {getCoachUrl()}
                </p>
              </div>
              <button
                onClick={() => copyLink(getCoachUrl(), 'coach')}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 transition flex items-center gap-1 flex-shrink-0"
              >
                {copiedLink === 'coach' ? (
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
          </div>

          {/* Role Status & Key Config */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Your Device Access Level
              </h4>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2.5">
                  {isCoach ? (
                    <Unlock className="w-5 h-5 text-amber-600" />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-400" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {isCoach ? 'Coach Mode (Editor Access)' : 'Spectator Mode (View Only)'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {isCoach
                        ? 'Full rights to score matches, advance fixtures, and change rosters.'
                        : 'Unlock coach mode with editor key to make changes.'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border shadow-xs transition ${
                    isCoach
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                  }`}
                >
                  {isCoach ? 'Manage Key' : 'Unlock Coach'}
                </button>
              </div>
            </div>

            {/* Coach Key customization (visible if coach) */}
            {isCoach && (
              <div className="pt-2 border-t border-slate-200">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Active Coach Key:{' '}
                  <code className="font-mono text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    {coachKey}
                  </code>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Set new coach key..."
                    value={customCoachKeyInput}
                    onChange={(e) => setCustomCoachKeyInput(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => {
                      if (customCoachKeyInput.trim()) {
                        updateCoachKey(customCoachKeyInput.trim());
                        setCustomCoachKeyInput('');
                      }
                    }}
                    disabled={!customCoachKeyInput.trim()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold disabled:opacity-40 transition"
                  >
                    Update
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tournament Clock & Schedule Timing Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-100 text-indigo-700">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Tournament Clock & Schedule Controls
              </h3>
              <p className="text-xs text-slate-500">
                Manage tournament start time, parallel 8-minute court slots, and overdue match tracking.
              </p>
            </div>
          </div>

          {/* Clock Status Badge */}
          <div className="flex items-center gap-2">
            {tournamentClockStatus === 'upcoming' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Starts in {formatDurationHuman(secondsUntilStart)} ({formatClockTime(settings.tournamentStartTime)})
              </span>
            )}
            {tournamentClockStatus === 'running' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Tournament Active ({Math.floor(masterSecondsRemaining / 3600)}h {Math.floor((masterSecondsRemaining % 3600) / 60)}m left)
              </span>
            )}
            {tournamentClockStatus === 'overtime' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Overtime (+{formatDurationHuman(overtimeSeconds)})
              </span>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Overdue / Behind Schedule Notice if any */}
          {overdueMatchesCount > 0 && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-900">
                  {overdueMatchesCount} Match{overdueMatchesCount > 1 ? 'es are' : ' is'} Running Behind Schedule!
                </h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  Matches have exceeded their estimated finish window. Check the Schedule timetable to view overdue minutes and expedite court turnarounds.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quick Start / Immediate Trigger */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Match Window (3 Hours)
                </span>
                <p className="text-sm font-extrabold text-slate-800 mt-1">
                  {tournamentClockStatus === 'upcoming'
                    ? 'Armed & Ready (Starts at 2:00 PM)'
                    : tournamentClockStatus === 'running'
                    ? '3-Hour Match Window in Progress'
                    : 'Window Ended (In Overtime)'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Starts clock immediately so 3:00:00 countdown begins right now.
                </p>
              </div>
              <button
                onClick={() => requireCoach(startTournamentNow)}
                disabled={tournamentClockStatus === 'running'}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{tournamentClockStatus === 'running' ? 'Clock Running' : 'Start Tournament Now'}</span>
              </button>
            </div>

            {/* Custom Schedule Start Time */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Scheduled Start Time
                </span>
                <p className="text-sm font-extrabold text-slate-800 mt-1">
                  {formatClockTime(settings.tournamentStartTime)} (Today)
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Default is 2:00 PM. Change time to auto-adjust all 40 fixture time slots.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleApplyCustomStartTime}
                  className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition"
                >
                  Set Time
                </button>
              </div>
            </div>

            {/* Reset Clock & Timetable */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Reset Tournament Clock
                </span>
                <p className="text-sm font-extrabold text-slate-800 mt-1">
                  Restore 2:00 PM Default
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Restores countdown to 2:00 PM today without deleting any scored match results.
                </p>
              </div>
              <button
                onClick={() => requireCoach(resetTournamentClock)}
                className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset to 2:00 PM Today</span>
              </button>
            </div>
          </div>
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
            onClick={() => exportFixturesToCSV(matches, teams, matchTimings)}
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

            <label
              onClick={(e) => {
                if (!isCoach) {
                  e.preventDefault();
                  setShowAuthModal(true);
                }
              }}
              className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1 transition cursor-pointer"
            >
              <Upload className="w-3 h-3 text-purple-600" />
              <span>Restore</span>
              <input
                type="file"
                accept=".json"
                disabled={!isCoach}
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
                  readOnly={!isCoach}
                  onClick={() => {
                    if (!isCoach) setShowAuthModal(true);
                  }}
                  onChange={(e) => {
                    if (!isCoach) {
                      setShowAuthModal(true);
                      return;
                    }
                    updateTeamName(team.id, e.target.value);
                  }}
                  className={`w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium shadow-xs transition ${
                    isCoach
                      ? 'focus:outline-none focus:border-emerald-500'
                      : 'cursor-not-allowed bg-slate-100/70 text-slate-600'
                  }`}
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
