import { Match, GroupId, Team } from '../types/tournament';

/**
 * Optimal 10-match round-robin sequence for a 5-team pool (1-indexed).
 *
 * Team appearance indices in pool sequence:
 * - Team 1: [0, 2, 5, 8] -> pool gaps: 2, 3, 3
 * - Team 2: [0, 3, 6, 9] -> pool gaps: 3, 3, 3
 * - Team 3: [1, 3, 5, 7] -> pool gaps: 2, 2, 2
 * - Team 4: [1, 4, 6, 8] -> pool gaps: 3, 2, 2
 * - Team 5: [2, 4, 7, 9] -> pool gaps: 2, 3, 2
 *
 * Every team has at least 1 intervening pool match (pool gap >= 2).
 * When interleaved on court with another pool (Pool A alternating with Pool C on Court 1),
 * the court interval is at least 4 matches!
 * That guarantees a minimum of 3 full matches (approx. 21 to 35 minutes) of rest
 * between every appearance for every single team.
 */
const OPTIMAL_ROUND_ROBIN_PAIRS: [number, number][] = [
  [1, 2],
  [3, 4],
  [1, 5],
  [2, 3],
  [4, 5],
  [1, 3],
  [2, 4],
  [3, 5],
  [1, 4],
  [2, 5],
];

/**
 * Generates all 40 group stage matches with guaranteed rest intervals.
 * - Court 1 hosts alternating Pool A and Pool C matches.
 * - Court 2 hosts alternating Pool B and Pool D matches.
 * - Matches on Court 1 and Court 2 run in parallel time slots.
 * - No team ever plays back-to-back or in the next match.
 */
export function generateGroupMatches(teams: Team[]): Match[] {
  const getTeamsInGroup = (groupId: GroupId): Team[] => {
    return teams.filter((t) => t.group === groupId);
  };

  const poolA = getTeamsInGroup('A');
  const poolB = getTeamsInGroup('B');
  const poolC = getTeamsInGroup('C');
  const poolD = getTeamsInGroup('D');

  const matches: Match[] = [];
  let globalMatchCounter = 1;

  for (let slot = 0; slot < 10; slot++) {
    const pair = OPTIMAL_ROUND_ROBIN_PAIRS[slot];
    const roundNumber = Math.floor(slot / 2) + 1; // Rounds 1 to 5

    // Court 1: Pool A match
    const tA1 = poolA[pair[0] - 1];
    const tA2 = poolA[pair[1] - 1];
    if (tA1 && tA2) {
      matches.push({
        matchId: `M${globalMatchCounter}`,
        matchNumber: globalMatchCounter++,
        court: 1,
        courtAssigned: 1,
        group: 'A',
        stage: 'group',
        round: roundNumber,
        teamA_id: tA1.id,
        teamB_id: tA2.id,
        scoreA: 0,
        scoreB: 0,
        status: matches.length === 0 ? 'live' : 'scheduled',
        winnerId: null,
      });
    }

    // Court 2: Pool B match (runs simultaneously with Pool A on Court 1)
    const tB1 = poolB[pair[0] - 1];
    const tB2 = poolB[pair[1] - 1];
    if (tB1 && tB2) {
      matches.push({
        matchId: `M${globalMatchCounter}`,
        matchNumber: globalMatchCounter++,
        court: 2,
        courtAssigned: 2,
        group: 'B',
        stage: 'group',
        round: roundNumber,
        teamA_id: tB1.id,
        teamB_id: tB2.id,
        scoreA: 0,
        scoreB: 0,
        status: matches.length === 1 ? 'live' : 'scheduled',
        winnerId: null,
      });
    }

    // Court 1: Pool C match
    const tC1 = poolC[pair[0] - 1];
    const tC2 = poolC[pair[1] - 1];
    if (tC1 && tC2) {
      matches.push({
        matchId: `M${globalMatchCounter}`,
        matchNumber: globalMatchCounter++,
        court: 1,
        courtAssigned: 1,
        group: 'C',
        stage: 'group',
        round: roundNumber,
        teamA_id: tC1.id,
        teamB_id: tC2.id,
        scoreA: 0,
        scoreB: 0,
        status: 'scheduled',
        winnerId: null,
      });
    }

    // Court 2: Pool D match (runs simultaneously with Pool C on Court 1)
    const tD1 = poolD[pair[0] - 1];
    const tD2 = poolD[pair[1] - 1];
    if (tD1 && tD2) {
      matches.push({
        matchId: `M${globalMatchCounter}`,
        matchNumber: globalMatchCounter++,
        court: 2,
        courtAssigned: 2,
        group: 'D',
        stage: 'group',
        round: roundNumber,
        teamA_id: tD1.id,
        teamB_id: tD2.id,
        scoreA: 0,
        scoreB: 0,
        status: 'scheduled',
        winnerId: null,
      });
    }
  }

  // Ensure exactly the first match on Court 1 and Court 2 is 'live'
  let foundCourt1Live = false;
  let foundCourt2Live = false;
  for (const m of matches) {
    if (m.court === 1 && !foundCourt1Live) {
      m.status = 'live';
      foundCourt1Live = true;
    } else if (m.court === 2 && !foundCourt2Live) {
      m.status = 'live';
      foundCourt2Live = true;
    } else {
      m.status = 'scheduled';
    }
  }

  return matches;
}
