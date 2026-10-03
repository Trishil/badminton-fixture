import React, { useState } from 'react';
import { CourtCard } from './CourtCard';
import { useTournament } from '../../context/TournamentContext';
import { Sparkles, Trophy, CheckCircle2 } from 'lucide-react';

export const LiveCourtDashboard: React.FC = () => {
  const {
    court1Match,
    court1UpNext,
    court2Match,
    court2UpNext,
    completedMatchesCount,
    totalGroupMatchesCount,
    setActiveTab,
    simulateRemainingGroupMatches,
  } = useTournament();

  const [mobileCourtFilter, setMobileCourtFilter] = useState<'both' | '1' | '2'>('both');

  const allGroupCompleted = completedMatchesCount >= totalGroupMatchesCount;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Quick Status & Mobile Filter Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Live Courts Dashboard</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time court dispatching, 7-minute countdowns & sudden-death scoring.
          </p>
        </div>

        {/* Mobile View Toggle Buttons & Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Mobile Segmented Filter: Court 1 / Court 2 / Both */}
          <div className="sm:hidden flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold w-full justify-between">
            <button
              onClick={() => setMobileCourtFilter('both')}
              className={`flex-1 py-1.5 rounded-lg text-center transition ${
                mobileCourtFilter === 'both'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Both Courts
            </button>
            <button
              onClick={() => setMobileCourtFilter('1')}
              className={`flex-1 py-1.5 rounded-lg text-center transition ${
                mobileCourtFilter === '1'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Court 1
            </button>
            <button
              onClick={() => setMobileCourtFilter('2')}
              className={`flex-1 py-1.5 rounded-lg text-center transition ${
                mobileCourtFilter === '2'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Court 2
            </button>
          </div>

          {/* Quick shortcuts */}
          {!allGroupCompleted ? (
            <button
              onClick={simulateRemainingGroupMatches}
              title="Fast simulate all group matches to test playoffs"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Simulate Matches</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('knockout')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 text-xs font-black shadow-sm shadow-amber-400/30 transition hover:opacity-95"
            >
              <Trophy className="w-3.5 h-3.5 fill-slate-950" />
              <span>Go to Knockouts</span>
            </button>
          )}
        </div>
      </div>

      {/* When all group matches are done, show banner */}
      {allGroupCompleted && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">All 40 Group Matches Completed!</h4>
              <p className="text-xs text-slate-600">
                Top teams have qualified. Switch to the Knockout Playoff bracket to crown the champion.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('knockout')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition whitespace-nowrap shadow-sm shadow-emerald-600/30 self-stretch sm:self-auto text-center"
          >
            Open Bracket →
          </button>
        </div>
      )}

      {/* Court 1 & Court 2 Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {(mobileCourtFilter === 'both' || mobileCourtFilter === '1') && (
          <CourtCard
            courtNumber={1}
            liveMatch={court1Match}
            upNextMatch={court1UpNext}
          />
        )}
        {(mobileCourtFilter === 'both' || mobileCourtFilter === '2') && (
          <CourtCard
            courtNumber={2}
            liveMatch={court2Match}
            upNextMatch={court2UpNext}
          />
        )}
      </div>
    </div>
  );
};
