import { useState } from 'react';
import {
  Layers,
  Info,
  Download,
  HelpCircle,
} from 'lucide-react';
import { GroupId } from '../../types/tournament';
import { useTournament } from '../../context/TournamentContext';
import { exportStandingsToCSV } from '../../utils/export';

export const StandingsView: React.FC = () => {
  const { standings, teams, settings } = useTournament();
  const [selectedPool, setSelectedPool] = useState<'all' | GroupId>('all');
  const [showRuleInfo, setShowRuleInfo] = useState(false);

  const teamMap = new Map(teams.map((t) => [t.id, t.name]));

  const pools: GroupId[] = ['A', 'B', 'C', 'D'];
  const qualifyingSlots = settings.knockoutMode === 'top1_semis' ? 1 : 2;

  const displayedPools: GroupId[] = selectedPool === 'all' ? pools : [selectedPool];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-600" />
            <span>Live Group Standings & Tiebreakers</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Auto-ranked via: 1. Wins → 2. Head-to-Head → 3. Point Diff (PF–PA) → 4. Points For.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowRuleInfo(!showRuleInfo)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Tiebreaker Rules</span>
          </button>

          <button
            onClick={() => exportStandingsToCSV(standings, teams)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tiebreaker Rules Explainer Box (collapsible) */}
      {showRuleInfo && (
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-2 text-slate-700 shadow-xs">
          <h4 className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
            <Info className="w-4 h-4 text-amber-600" />
            Official Badminton Tournament Tiebreaker Hierarchy
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-slate-700">
            <li>
              <strong className="text-slate-900">Most Match Wins (W):</strong> Primary ranking criterion.
            </li>
            <li>
              <strong className="text-slate-900">Head-to-Head Result:</strong> If exactly two teams tie on wins, the winner of their mutual pool match ranks higher.
            </li>
            <li>
              <strong className="text-slate-900">Point Difference (PF - PA):</strong> If 3 or more teams tie on wins (or in triangular ties), superior net points scored vs conceded decides ranking.
            </li>
            <li>
              <strong className="text-slate-900">Total Points For (PF):</strong> If point differences are also equal, the team with more total points scored advances.
            </li>
          </ol>
          <div className="mt-2 pt-2 border-t border-amber-200 text-[11px] text-slate-600 flex items-center gap-2">
            <span>Current Playoff Qualification:</span>
            <span className="font-bold text-emerald-700">
              {settings.knockoutMode === 'top1_semis'
                ? 'Top 1 Team per Pool advances to Semifinals'
                : 'Top 2 Teams per Pool advance to Quarterfinals'}
            </span>
          </div>
        </div>
      )}

      {/* Pool Filter Buttons & Qualification Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setSelectedPool('all')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              selectedPool === 'all' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Pools
          </button>
          {pools.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPool(p)}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                selectedPool === p ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pool {p}
            </button>
          ))}
        </div>

        {/* Mode indicator */}
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span className="hidden sm:inline">Qualification Target:</span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
            {settings.knockoutMode === 'top1_semis' ? 'Top 1 (Semifinals)' : 'Top 2 (Quarterfinals)'}
          </span>
        </div>
      </div>

      {/* Pool Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {displayedPools.map((poolId) => {
          const tableData = standings[poolId] || [];

          return (
            <div
              key={poolId}
              className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm flex flex-col"
            >
              {/* Pool Header */}
              <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800 font-black text-xs flex items-center justify-center">
                    {poolId}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-base">Pool {poolId} Table</h3>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  5 Teams • 10 Matches
                </span>
              </div>

              {/* Responsive Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">#</th>
                      <th className="py-2.5 px-3">Team</th>
                      <th className="py-2.5 px-2 text-center" title="Played">P</th>
                      <th className="py-2.5 px-2 text-center text-emerald-700" title="Won">W</th>
                      <th className="py-2.5 px-2 text-center text-rose-600" title="Lost">L</th>
                      <th className="py-2.5 px-2 text-center" title="Points For">PF</th>
                      <th className="py-2.5 px-2 text-center" title="Points Against">PA</th>
                      <th className="py-2.5 px-2 text-center font-mono" title="Point Difference (+/-)">Diff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {tableData.map((row) => {
                      const fullName = teamMap.get(row.teamId) || row.teamId;
                      const shortName = fullName.split(' (')[0];
                      const players = fullName.split(' (')[1]?.replace(')', '');
                      const isQualifying = row.rank <= qualifyingSlots;

                      return (
                        <tr
                          key={row.teamId}
                          className={`transition-colors ${
                            isQualifying
                              ? 'bg-emerald-50/50 hover:bg-emerald-50/80'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* Rank with qualification indicator */}
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                                isQualifying
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {row.rank}
                            </span>
                          </td>

                          {/* Team Name & Tiebreaker note */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-bold truncate text-sm ${isQualifying ? 'text-slate-900 font-extrabold' : 'text-slate-800'}`}>
                                {shortName}
                              </span>
                              {isQualifying && (
                                <span
                                  className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap"
                                  title="Currently in playoff qualifying position"
                                >
                                  Q
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[150px] sm:max-w-[200px]">
                              {players || row.teamId}
                            </div>
                            {row.tiebreakerNote && (
                              <div className="text-[9px] text-amber-700 font-mono mt-0.5 truncate max-w-[180px]">
                                {row.tiebreakerNote}
                              </div>
                            )}
                          </td>

                          {/* Stats */}
                          <td className="py-2.5 px-2 text-center font-mono text-slate-700">{row.played}</td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-700">{row.won}</td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-500">{row.lost}</td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-700">{row.pointsFor}</td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-500">{row.pointsAgainst}</td>
                          <td
                            className={`py-2.5 px-2 text-center font-mono font-bold ${
                              row.pointDiff > 0
                                ? 'text-emerald-700'
                                : row.pointDiff < 0
                                ? 'text-rose-600'
                                : 'text-slate-500'
                            }`}
                          >
                            {row.pointDiff > 0 ? `+${row.pointDiff}` : row.pointDiff}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pool Footer info */}
              <div className="p-2.5 bg-slate-50/70 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Green rows qualify for Knockout Playoff
                </span>
                <span>Race to 5 pts</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
