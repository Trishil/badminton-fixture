import { Match, GroupId, Team } from '../types/tournament';

// Berger pairing indices (1-indexed team indices in 5-team group)
// 5 rounds, 2 matches per round
const GROUP_ROUND_PAIRINGS: [number, number][][] = [
  // Round 1 (Team 5 bye)
  [[1, 4], [2, 3]],
  // Round 2 (Team 4 bye)
  [[5, 3], [1, 2]],
  // Round 3 (Team 3 bye)
  [[4, 2], [5, 1]],
  // Round 4 (Team 2 bye)
  [[3, 1], [4, 5]],
  // Round 5 (Team 1 bye)
  [[2, 5], [3, 4]],
];

/**
 * Generates all 40 group stage matches interleaved across Court 1 and Court 2
 * Court 1 hosts alternating Pool A and Pool C matches
 * Court 2 hosts alternating Pool B and Pool D matches
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

  // We iterate through all 5 rounds
  for (let rIndex = 0; rIndex < 5; rIndex++) {
    const roundNumber = rIndex + 1;
    const pairings = GROUP_ROUND_PAIRINGS[rIndex];

    // For Court 1: alternate Pool A and Pool C
    // Pair 1 Pool A
    const tA1_1 = poolA[pairings[0][0] - 1];
    const tA1_2 = poolA[pairings[0][1] - 1];
    if (tA1_1 && tA1_2) {
      matches.push({
        matchId: `M${globalMatchCounter}`,
        matchNumber: globalMatchCounter++,
        court: 1,
        courtAssigned: 1,
        group: 'A',
        stage: 'group',
        round: roundNumber,
        teamA_id: tA1_1.id,
        teamB_id: tA1_2.id,
        scoreA: 0,
        scoreB: 0,
        status: matches.length === 0 ? 'live' : 'scheduled',
        winnerId: null,
      });
    }

    // Pair 1 Pool C (Court 1)
    const tC1_1 = poolC[pairings[0][0] - 1];
    const tC1_2 = poolC[pairings[0][1] - 1];
    if (tC1_1 && tC1_2) {
      matches.push({
        matchId: `M${globalMatchCounter}`,
        matchNumber: globalMatchCounter++,
        court: 1,
        courtAssigned: 1,
        group: 'C',
        stage: 'group',
        round: roundNumber,
        teamA_id: tC1_1.id,
        teamB_id: tC1_2.id,
        scoreA: 0,
        scoreB: 0,
        status: 'scheduled',
        winnerId: null,
      });
    }

    // Pair 2 Pool A (Court 1)
    const tA2_1 = poolA[pairings[1][0] - 1];
    const tA2_2 = poolA[pairings[1][1] - 1];
    if (tA2_1 && tA2_2) {
      matches.push({
        matchId: `M${globalMatchCounter}`,
        matchNumber: globalMatchCounter++,
        court: 1,
        courtAssigned: 1,
        group: 'A',
        stage: 'group',
        round: roundNumber,
        teamA_id: tA2_1.id,
        teamB_id: tA2_2.id,
        scoreA: 0,
        scoreB: 0,
        status: 'scheduled',
        winnerId: null,
      });
    }

    // Pair 2 Pool C (Court 1)
    const tC2_1 = poolC[pairings[1][0] - 1];
    const tC2_2 = poolC[pairings[1][1] - 1];
    if (tC2_1 && tC2_2) {
      matches.push({
        matchId: `M${globalMatchCounter}`,
        matchNumber: globalMatchCounter++,
        court: 1,
        courtAssigned: 1,
        group: 'C',
        stage: 'group',
        round: roundNumber,
        teamA_id: tC2_1.id,
        teamB_id: tC2_2.id,
        scoreA: 0,
        scoreB: 0,
        status: 'scheduled',
        winnerId: null,
      });
    }

    // For Court 2: alternate Pool B and Pool D
    // Pair 1 Pool B
    const tB1_1 = poolB[pairings[0][0] - 1];
    const tB1_2 = poolB[pairings[0][1] - 1];
    if (tB1_1 && tB1_2) {
      matches.push({
        matchId: `M${globalMatchCounter}`,
        matchNumber: globalMatchCounter++,
        court: 2,
        courtAssigned: 2,
        group: 'B',
        stage: 'group',
        round: roundNumber,
        teamA_id: tB1_1.id,
        teamB_id: tB1_2.id,
        scoreA: 0,
        scoreB: 0,
        status: roundNumber === 1 && pairings[0][0] === 1 ? 'live' : 'scheduled',
        winnerId: null,
      });
    }

    // Pair 1 Pool D (Court 2)
    const tD1_1 = poolD[pairings[0][0] - 1];
    const tD1_2 = poolD[pairings[0][1] - 1];
    if (tD1_1 && tD1_2) {
      matches.push({
        matchId: `M${globalMatchCounter}`,
        matchNumber: globalMatchCounter++,
        court: 2,
        courtAssigned: 2,
        group: 'D',
        stage: 'group',
        round: roundNumber,
        teamA_id: tD1_1.id,
        teamB_id: tD1_2.id,
        scoreA: 0,
        scoreB: 0,
        status: 'scheduled',
        winnerId: null,
      });
    }

    // Pair 2 Pool B (Court 2)
    const tB2_1 = poolB[pairings[1][0] - 1];
    const tB2_2 = poolB[pairings[1][1] - 1];
    if (tB2_1 && tB2_2) {
      matches.push({
        matchId: `M${globalMatchCounter}`,
        matchNumber: globalMatchCounter++,
        court: 2,
        courtAssigned: 2,
        group: 'B',
        stage: 'group',
        round: roundNumber,
        teamA_id: tB2_1.id,
        teamB_id: tB2_2.id,
        scoreA: 0,
        scoreB: 0,
        status: 'scheduled',
        winnerId: null,
      });
    }

    // Pair 2 Pool D (Court 2)
    const tD2_1 = poolD[pairings[1][0] - 1];
    const tD2_2 = poolD[pairings[1][1] - 1];
    if (tD2_1 && tD2_2) {
      matches.push({
        matchId: `M${globalMatchCounter}`,
        matchNumber: globalMatchCounter++,
        court: 2,
        courtAssigned: 2,
        group: 'D',
        stage: 'group',
        round: roundNumber,
        teamA_id: tD2_1.id,
        teamB_id: tD2_2.id,
        scoreA: 0,
        scoreB: 0,
        status: 'scheduled',
        winnerId: null,
      });
    }
  }

  // Ensure exactly one match is marked 'live' for Court 1 and Court 2
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
