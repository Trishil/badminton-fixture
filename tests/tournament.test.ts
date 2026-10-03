import assert from 'node:assert';
import { DEFAULT_TEAMS } from '../src/utils/initialData.ts';
import { generateGroupMatches } from '../src/utils/scheduler.ts';
import { calculateGroupStandings } from '../src/utils/standings.ts';
import { initializeKnockoutMatches, resolveKnockoutSeeds } from '../src/utils/knockout.ts';
import { Match, GroupStanding } from '../src/types/tournament.ts';
import { calculateMatchTimings, formatClockTime, formatDurationHuman, getToday2PMTimestamp } from '../src/utils/timing.ts';

console.log('🧪 RUNNING TOURNAMENT OPERATIONS TEST SUITE...\n');

// ==========================================
// TEST 1: Schedule Generation & Court Interleaving
// ==========================================
console.log('Test 1: Schedule Generation & Court Interleaving');
const matches = generateGroupMatches(DEFAULT_TEAMS);

assert.strictEqual(matches.length, 40, 'Should generate exactly 40 group matches for 20 teams');

const court1Matches = matches.filter((m) => m.court === 1);
const court2Matches = matches.filter((m) => m.court === 2);
assert.strictEqual(court1Matches.length, 20, 'Court 1 should have exactly 20 matches');
assert.strictEqual(court2Matches.length, 20, 'Court 2 should have exactly 20 matches');

// Verify Court 1 hosts Pools A and C only
court1Matches.forEach((m) => {
  assert(['A', 'C'].includes(m.group), `Court 1 should only host Pools A and C, found Pool ${m.group}`);
});

// Verify Court 2 hosts Pools B and D only
court2Matches.forEach((m) => {
  assert(['B', 'D'].includes(m.group), `Court 2 should only host Pools B and D, found Pool ${m.group}`);
});

// Verify each team is scheduled for 4 matches in group stage
DEFAULT_TEAMS.forEach((team) => {
  const teamMatches = matches.filter((m) => m.teamA_id === team.id || m.teamB_id === team.id);
  assert.strictEqual(teamMatches.length, 4, `Team ${team.id} should play 4 matches in round-robin, got ${teamMatches.length}`);
});

console.log('  ✅ 40 group matches validated across Courts 1 & 2 (20 matches each, 4 per team).\n');

// ==========================================
// TEST 2: Standings Calculation & 2-Way Head-to-Head Tiebreaker
// ==========================================
console.log('Test 2: Standings Calculation & 2-Way Head-to-Head Tiebreaker');

// Simulate Pool A where T1 and T2 both finish with 3 wins and 1 loss
// In their direct match: T2 defeats T1 5-4.
// By Rule 2 (Head-to-Head), T2 MUST be ranked #1, and T1 ranked #2 even if T1 scored more points in other games!
const simulatedPoolAMatches: Match[] = [
  // T1 vs T4: T1 wins 5-0
  { matchId: 'm1', matchNumber: 1, court: 1, group: 'A', stage: 'group', round: 1, teamA_id: 'T1', teamB_id: 'T4', scoreA: 5, scoreB: 0, status: 'completed', winnerId: 'T1' },
  // T2 vs T3: T2 wins 5-3
  { matchId: 'm2', matchNumber: 2, court: 1, group: 'A', stage: 'group', round: 1, teamA_id: 'T2', teamB_id: 'T3', scoreA: 5, scoreB: 3, status: 'completed', winnerId: 'T2' },
  // T1 vs T2: T2 wins 5-4 (Head-to-head match!)
  { matchId: 'm3', matchNumber: 3, court: 1, group: 'A', stage: 'group', round: 2, teamA_id: 'T1', teamB_id: 'T2', scoreA: 4, scoreB: 5, status: 'completed', winnerId: 'T2' },
  // T5 vs T3: T5 wins 5-2
  { matchId: 'm4', matchNumber: 4, court: 1, group: 'A', stage: 'group', round: 2, teamA_id: 'T5', teamB_id: 'T3', scoreA: 5, scoreB: 2, status: 'completed', winnerId: 'T5' },
  // T4 vs T2: T2 wins 5-2
  { matchId: 'm5', matchNumber: 5, court: 1, group: 'A', stage: 'group', round: 3, teamA_id: 'T4', teamB_id: 'T2', scoreA: 2, scoreB: 5, status: 'completed', winnerId: 'T2' },
  // T5 vs T1: T1 wins 5-0
  { matchId: 'm6', matchNumber: 6, court: 1, group: 'A', stage: 'group', round: 3, teamA_id: 'T5', teamB_id: 'T1', scoreA: 0, scoreB: 5, status: 'completed', winnerId: 'T1' },
  // T3 vs T1: T1 wins 5-0
  { matchId: 'm7', matchNumber: 7, court: 1, group: 'A', stage: 'group', round: 4, teamA_id: 'T3', teamB_id: 'T1', scoreA: 0, scoreB: 5, status: 'completed', winnerId: 'T1' },
  // T4 vs T5: T5 wins 5-1
  { matchId: 'm8', matchNumber: 8, court: 1, group: 'A', stage: 'group', round: 4, teamA_id: 'T4', teamB_id: 'T5', scoreA: 1, scoreB: 5, status: 'completed', winnerId: 'T5' },
  // T2 vs T5: T5 wins 5-3 (T2 loses to T5)
  { matchId: 'm9', matchNumber: 9, court: 1, group: 'A', stage: 'group', round: 5, teamA_id: 'T2', teamB_id: 'T5', scoreA: 3, scoreB: 5, status: 'completed', winnerId: 'T5' },
  // T3 vs T4: T3 wins 5-3
  { matchId: 'm10', matchNumber: 10, court: 1, group: 'A', stage: 'group', round: 5, teamA_id: 'T3', teamB_id: 'T4', scoreA: 5, scoreB: 3, status: 'completed', winnerId: 'T3' },
];

// In this group:
// T1: 3 wins (beat T4, T5, T3; lost to T2). PF: 19, PA: 5, Diff: +14
// T2: 3 wins (beat T3, T1, T4; lost to T5). PF: 18, PA: 14, Diff: +4
// T5: 3 wins (beat T3, T4, T2; lost to T1). PF: 15, PA: 11, Diff: +4
// Notice here 3 teams (T1, T2, T5) have 3 wins!
// By Rule 3 (Point Diff for 3-way tie):
// T1 has Diff +14 -> Ranks #1
// Between T2 and T5: both have Diff +4!
// By Rule 4 (Total Points For): T2 has 18 PF, T5 has 15 PF -> T2 ranks #2, T5 ranks #3!

const standings3Way = calculateGroupStandings('A', DEFAULT_TEAMS, simulatedPoolAMatches, 'top1_semis');

assert.strictEqual(standings3Way[0].teamId, 'T1', 'T1 should rank 1st with highest point diff (+14) in 3-way tie');
assert.strictEqual(standings3Way[0].rank, 1);
assert.strictEqual(standings3Way[0].qualifiesKnockout, true);

assert.strictEqual(standings3Way[1].teamId, 'T2', 'T2 should rank 2nd with higher points for (18 vs 15) in tiebreaker');
assert.strictEqual(standings3Way[1].rank, 2);

assert.strictEqual(standings3Way[2].teamId, 'T5', 'T5 should rank 3rd');

console.log('  ✅ 3-way tiebreaker correctly resolved via Point Difference (+14) and Points For (18 vs 15).\n');

// Test strict 2-way tiebreaker:
// Suppose T1 and T2 are the only two teams tied on 2 wins each
const twoWayMatches: Match[] = [
  // T1 beats T3: 5-0
  { matchId: 'tw1', matchNumber: 1, court: 1, group: 'A', stage: 'group', round: 1, teamA_id: 'T1', teamB_id: 'T3', scoreA: 5, scoreB: 0, status: 'completed', winnerId: 'T1' },
  // T2 beats T4: 5-4
  { matchId: 'tw2', matchNumber: 2, court: 1, group: 'A', stage: 'group', round: 1, teamA_id: 'T2', teamB_id: 'T4', scoreA: 5, scoreB: 4, status: 'completed', winnerId: 'T2' },
  // T2 beats T1: 5-4 (T2 won H2H against T1)
  { matchId: 'tw3', matchNumber: 3, court: 1, group: 'A', stage: 'group', round: 2, teamA_id: 'T2', teamB_id: 'T1', scoreA: 5, scoreB: 4, status: 'completed', winnerId: 'T2' },
  // T1 beats T5: 5-0
  { matchId: 'tw4', matchNumber: 4, court: 1, group: 'A', stage: 'group', round: 2, teamA_id: 'T1', teamB_id: 'T5', scoreA: 5, scoreB: 0, status: 'completed', winnerId: 'T1' },
];

const standings2Way = calculateGroupStandings('A', DEFAULT_TEAMS, twoWayMatches, 'top1_semis');
// T1: 2 wins, 1 loss, PF 14, PA 5, Diff +9
// T2: 2 wins, 0 losses, but suppose T2 played 2 games and won both.
// Let's ensure when both have 2 wins, T2 ranks above T1 due to H2H:
const t1Stand = standings2Way.find((s) => s.teamId === 'T1')!;
const t2Stand = standings2Way.find((s) => s.teamId === 'T2')!;
assert(t2Stand.rank < t1Stand.rank, 'T2 should rank above T1 because T2 won Head-to-Head vs T1');

console.log('  ✅ 2-way tiebreaker correctly prioritizes Head-to-Head match winner.\n');

// ==========================================
// TEST 3: Knockout Seeding Engine
// ==========================================
console.log('Test 3: Knockout Seeding Engine');

const mockStandings: Record<'A'|'B'|'C'|'D', GroupStanding[]> = {
  A: [{ teamId: 'T1', group: 'A', played: 4, won: 4, lost: 0, pointsFor: 20, pointsAgainst: 8, pointDiff: 12, rank: 1 }, { teamId: 'T2', group: 'A', played: 4, won: 3, lost: 1, pointsFor: 18, pointsAgainst: 12, pointDiff: 6, rank: 2 }],
  B: [{ teamId: 'T6', group: 'B', played: 4, won: 4, lost: 0, pointsFor: 20, pointsAgainst: 5, pointDiff: 15, rank: 1 }, { teamId: 'T7', group: 'B', played: 4, won: 3, lost: 1, pointsFor: 17, pointsAgainst: 10, pointDiff: 7, rank: 2 }],
  C: [{ teamId: 'T11', group: 'C', played: 4, won: 4, lost: 0, pointsFor: 20, pointsAgainst: 9, pointDiff: 11, rank: 1 }, { teamId: 'T12', group: 'C', played: 4, won: 3, lost: 1, pointsFor: 16, pointsAgainst: 11, pointDiff: 5, rank: 2 }],
  D: [{ teamId: 'T16', group: 'D', played: 4, won: 4, lost: 0, pointsFor: 20, pointsAgainst: 7, pointDiff: 13, rank: 1 }, { teamId: 'T17', group: 'D', played: 4, won: 3, lost: 1, pointsFor: 17, pointsAgainst: 13, pointDiff: 4, rank: 2 }],
};

// Mode 1: Top 1 Semifinals
const ko4 = initializeKnockoutMatches('top1_semis');
const resolved4 = resolveKnockoutSeeds(ko4, mockStandings, 'top1_semis');

const semi1_4 = resolved4.find((m) => m.id === 'semi1')!;
const semi2_4 = resolved4.find((m) => m.id === 'semi2')!;

assert.strictEqual(semi1_4.teamAId, 'T1', 'Semi 1 Side A must be Pool A Winner (T1)');
assert.strictEqual(semi1_4.teamBId, 'T11', 'Semi 1 Side B must be Pool C Winner (T11)');
assert.strictEqual(semi1_4.court, 1, 'Semi 1 must be scheduled on Court 1');

assert.strictEqual(semi2_4.teamAId, 'T6', 'Semi 2 Side A must be Pool B Winner (T6)');
assert.strictEqual(semi2_4.teamBId, 'T16', 'Semi 2 Side B must be Pool D Winner (T16)');
assert.strictEqual(semi2_4.court, 2, 'Semi 2 must be scheduled on Court 2');

console.log('  ✅ 4-Team Semifinals correctly seeded (Semi 1: A1 vs C1 on Court 1, Semi 2: B1 vs D1 on Court 2).\n');

// Mode 2: Top 2 Quarterfinals
const ko8 = initializeKnockoutMatches('top2_quarters');
const resolved8 = resolveKnockoutSeeds(ko8, mockStandings, 'top2_quarters');

const qf1 = resolved8.find((m) => m.id === 'qf1')!;
const qf2 = resolved8.find((m) => m.id === 'qf2')!;
const qf3 = resolved8.find((m) => m.id === 'qf3')!;
const qf4 = resolved8.find((m) => m.id === 'qf4')!;

assert.strictEqual(qf1.teamAId, 'T1', 'QF1 must be A1');
assert.strictEqual(qf1.teamBId, 'T12', 'QF1 must be C2');
assert.strictEqual(qf2.teamAId, 'T6', 'QF2 must be B1');
assert.strictEqual(qf2.teamBId, 'T17', 'QF2 must be D2');
assert.strictEqual(qf3.teamAId, 'T11', 'QF3 must be C1');
assert.strictEqual(qf3.teamBId, 'T2', 'QF3 must be A2');
assert.strictEqual(qf4.teamAId, 'T16', 'QF4 must be D1');
assert.strictEqual(qf4.teamBId, 'T7', 'QF4 must be B2');

console.log('  ✅ 8-Team Quarterfinals correctly seeded (A1 vs C2, B1 vs D2, C1 vs A2, D1 vs B2).\n');

// ==========================================
// TEST 4: Team Rest Intervals on Court
// ==========================================
console.log('Test 4: Team Rest Intervals on Court');
// For each court, check the sequence of matches
[1, 2].forEach((courtNum) => {
  const courtMatches = matches.filter((m) => m.court === courtNum);
  const teamPositions = new Map<string, number[]>();

  courtMatches.forEach((m, idx) => {
    for (const tid of [m.teamA_id, m.teamB_id]) {
      if (!teamPositions.has(tid)) teamPositions.set(tid, []);
      teamPositions.get(tid)!.push(idx);
    }
  });

  teamPositions.forEach((indices, tid) => {
    for (let k = 0; k < indices.length - 1; k++) {
      const gap = indices[k + 1] - indices[k];
      assert(
        gap >= 4,
        `Team ${tid} on Court ${courtNum} has insufficient rest interval of ${gap} matches (minimum required: 4)`
      );
    }
  });
});

console.log('  ✅ Guaranteed rest intervals validated: Every team rests at least 3 full matches (~25-35 min) on court between games.\n');

// ==========================================
// TEST 5: Match Timing, Parallel Spacing & Delay Calculations
// ==========================================
console.log('Test 5: Match Timing, Parallel Spacing & Delay Calculations');

const baseTime = new Date(2026, 9, 4, 14, 0, 0, 0).getTime(); // 2:00:00 PM
const slotMinutes = 8;
const matchDurationMinutes = 7;
const nowSimulated = baseTime + 25 * 60 * 1000; // 2:25 PM

const timings = calculateMatchTimings(matches, baseTime, slotMinutes, matchDurationMinutes, nowSimulated);

assert.strictEqual(timings.size, matches.length, 'Every match must have a computed timing entry');

// Check Court 1 match 0: start at 2:00 PM, end at 2:07 PM
const court1_m0 = matches.find((m) => m.court === 1)!;
const timing_c1_m0 = timings.get(court1_m0.matchId)!;
assert.strictEqual(timing_c1_m0.formattedStartTime, '2:00 PM', 'First match on Court 1 should start at 2:00 PM');
assert.strictEqual(timing_c1_m0.formattedEndTime, '2:07 PM', 'First match on Court 1 should end at 2:07 PM (7-min game)');
assert.strictEqual(timing_c1_m0.formattedTimeWindow, '2:00 PM – 2:07 PM');

// Check Court 2 match 0 (runs in parallel!)
const court2_m0 = matches.find((m) => m.court === 2)!;
const timing_c2_m0 = timings.get(court2_m0.matchId)!;
assert.strictEqual(timing_c2_m0.formattedStartTime, '2:00 PM', 'First match on Court 2 should also start at 2:00 PM (parallel)');
assert.strictEqual(timing_c2_m0.formattedEndTime, '2:07 PM');

// Check Court 1 match 1: should be 8 minutes later (2:08 PM - 2:15 PM)
const court1MatchesAll = matches.filter((m) => m.court === 1);
const court1_m1 = court1MatchesAll[1];
const timing_c1_m1 = timings.get(court1_m1.matchId)!;
assert.strictEqual(timing_c1_m1.formattedStartTime, '2:08 PM');
assert.strictEqual(timing_c1_m1.formattedEndTime, '2:15 PM');

// Check Court 1 match 2: should be 16 minutes later (2:16 PM - 2:23 PM)
const court1_m2 = court1MatchesAll[2];
const timing_c1_m2 = timings.get(court1_m2.matchId)!;
assert.strictEqual(timing_c1_m2.formattedStartTime, '2:16 PM');
assert.strictEqual(timing_c1_m2.formattedEndTime, '2:23 PM');

// At 2:25 PM:
// c1_m0 (ended at 2:07 PM) is scheduled (uncompleted) -> it should be overdue by 18 minutes!
assert.strictEqual(timing_c1_m0.isOverdue, true, 'Match 0 should be overdue at 2:25 PM if still uncompleted');
assert.strictEqual(timing_c1_m0.overdueMinutes, 18, 'Match 0 should be overdue by exactly 18 minutes');

// c1_m2 (ended at 2:23 PM) is scheduled -> overdue by 2 minutes
assert.strictEqual(timing_c1_m2.isOverdue, true, 'Match 2 should be overdue at 2:25 PM');
assert.strictEqual(timing_c1_m2.overdueMinutes, 2);

// Check completed match: If c1_m0 had status 'completed', it must NOT be overdue
const matchesWithCompleted = matches.map((m) =>
  m.matchId === court1_m0.matchId ? { ...m, status: 'completed' as const } : m
);
const timingsWithCompleted = calculateMatchTimings(matchesWithCompleted, baseTime, slotMinutes, matchDurationMinutes, nowSimulated);
assert.strictEqual(timingsWithCompleted.get(court1_m0.matchId)!.isOverdue, false, 'Completed match must not be flagged overdue');

// Helper formatters
assert.strictEqual(formatDurationHuman(120), '2m');
assert.strictEqual(formatDurationHuman(3660), '1h 1m');

console.log('  ✅ Timing engine verified: 8-minute parallel court spacing, 7-minute match windows, and exact overdue tracking.\n');

console.log('🎉 ALL UNIT TESTS PASSED SUCCESSFULLY! 100% OPERATIONAL.\n');


