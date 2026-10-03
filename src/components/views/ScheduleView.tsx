import { useState, useMemo } from 'react';
import {
  Calendar,
  Search,
  Edit2,
  Clock,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { Match, GroupId } from '../../types/tournament';
import { useTournament } from '../../context/TournamentContext';
import { EditMatchModal } from '../modals/EditMatchModal';
import { exportFixturesToCSV } from '../../utils/export';

export const ScheduleView: React.FC = () => {
  const { matches, teams, dispatchToCourt } = useTournament();

  const [courtFilter, setCourtFilter] = useState<'all' | '1' | '2'>('all');
  const [poolFilter, setPoolFilter] = useState<'all' | GroupId>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live_upcoming' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  // Helper map for team names
  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t.name])), [teams]);

  // Filter matches
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      // Court filter
      if (courtFilter === '1' && m.court !== 1) return false;
      if (courtFilter === '2' && m.court !== 2) return false;

      // Pool filter
      if (poolFilter !== 'all' && m.group !== poolFilter) return false;

      // Status filter
      if (statusFilter === 'completed' && m.status !== 'completed') return false;
      if (statusFilter === 'live_upcoming' && m.status === 'completed') return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameA = (teamMap.get(m.teamA_id) || m.teamA_id).toLowerCase();
        const nameB = (teamMap.get(m.teamB_id) || m.teamB_id).toLowerCase();
        const matchIdStr = m.matchId.toLowerCase();
        const numStr = m.matchNumber.toString();
        if (
          !nameA.includes(query) &&
          !nameB.includes(query) &&
          !matchIdStr.includes(query) &&
          !numStr.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [matches, courtFilter, poolFilter, statusFilter, searchQuery, teamMap]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" />
            <span>Tournament Fixtures & Schedule</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            40 round-robin fixtures across Pools A–D on Courts 1 & 2. Tap any match to edit scores.
          </p>
        </div>

        <button
          onClick={() => exportFixturesToCSV(matches, teams)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600" />
          <span>Export Fixtures CSV</span>
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search team name, player, or match #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Court Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setCourtFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                courtFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Courts
            </button>
            <button
              onClick={() => setCourtFilter('1')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                courtFilter === '1' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Court 1
            </button>
            <button
              onClick={() => setCourtFilter('2')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                courtFilter === '2' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Court 2
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('live_upcoming')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                statusFilter === 'live_upcoming' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live / Upcoming
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                statusFilter === 'completed' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed
            </button>
          </div>

          {/* Pool Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['all', 'A', 'B', 'C', 'D'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPoolFilter(p)}
                className={`px-2 py-1 rounded-lg font-semibold transition ${
                  poolFilter === p ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p === 'all' ? 'All' : `P${p}`}
              </button>
            ))}
          </div>

          <div className="ml-auto text-xs font-mono text-slate-500">
            Showing <strong className="text-slate-800">{filteredMatches.length}</strong> of {matches.length}
          </div>
        </div>
      </div>

      {/* Fixtures List */}
      <div className="space-y-2.5">
        {filteredMatches.length > 0 ? (
          filteredMatches.map((m) => {
            const nameA = teamMap.get(m.teamA_id) || m.teamA_id;
            const nameB = teamMap.get(m.teamB_id) || m.teamB_id;
            const isWinnerA = m.winnerId === m.teamA_id;
            const isWinnerB = m.winnerId === m.teamB_id;

            return (
              <div
                key={m.matchId}
                onClick={() => setEditingMatch(m)}
                className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer hover:border-slate-300 shadow-xs hover:shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  m.status === 'live'
                    ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
                    : m.status === 'completed'
                    ? 'bg-white border-slate-200'
                    : 'bg-white border-slate-200/90'
                }`}
              >
                {/* Match Meta Information */}
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center border border-slate-200">
                    #{m.matchNumber}
                  </span>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">Pool {m.group}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500">Round {m.round}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase w-fit mt-0.5 ${
                        m.court === 1
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      Court {m.court}
                    </span>
                  </div>
                </div>

                {/* Teams & Scores */}
                <div className="flex-1 grid grid-cols-5 items-center gap-2 min-w-0 py-1 sm:py-0">
                  {/* Team A */}
                  <div className="col-span-2 text-right truncate">
                    <span
                      className={`text-xs sm:text-sm font-semibold truncate block ${
                        isWinnerA ? 'text-emerald-700 font-extrabold' : 'text-slate-800'
                      }`}
                    >
                      {nameA.split(' (')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate block">
                      {nameA.split(' (')[1]?.replace(')', '') || m.teamA_id}
                    </span>
                  </div>

                  {/* Score Pill */}
                  <div className="col-span-1 flex flex-col items-center justify-center">
                    <div className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono font-bold text-sm tracking-wider flex items-center gap-1.5 shadow-xs">
                      <span className={isWinnerA ? 'text-emerald-700 font-extrabold' : 'text-slate-800'}>
                        {m.scoreA}
                      </span>
                      <span className="text-slate-400">-</span>
                      <span className={isWinnerB ? 'text-emerald-700 font-extrabold' : 'text-slate-800'}>
                        {m.scoreB}
                      </span>
                    </div>
                  </div>

                  {/* Team B */}
                  <div className="col-span-2 text-left truncate">
                    <span
                      className={`text-xs sm:text-sm font-semibold truncate block ${
                        isWinnerB ? 'text-emerald-700 font-extrabold' : 'text-slate-800'
                      }`}
                    >
                      {nameB.split(' (')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate block">
                      {nameB.split(' (')[1]?.replace(')', '') || m.teamB_id}
                    </span>
                  </div>
                </div>

                {/* Status Pill & Edit Trigger */}
                <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  {m.status === 'live' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                      Live Now
                    </span>
                  ) : m.status === 'completed' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Completed
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[11px] font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Scheduled
                    </span>
                  )}

                  {/* Direct dispatch button if scheduled */}
                  {m.status === 'scheduled' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatchToCourt(m.matchId, m.court);
                      }}
                      title={`Send directly to Court ${m.court}`}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold border border-slate-200 transition flex items-center gap-1"
                    >
                      <span>Send to C{m.court}</span>
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingMatch(m);
                    }}
                    title="Edit match score / details"
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-800 font-bold text-sm">No matches found</p>
            <p className="text-xs text-slate-500 mt-1">Try changing your filters or search terms.</p>
          </div>
        )}
      </div>

      {/* Manual Override Modal */}
      <EditMatchModal
        match={editingMatch}
        isOpen={Boolean(editingMatch)}
        onClose={() => setEditingMatch(null)}
      />
    </div>
  );
};
