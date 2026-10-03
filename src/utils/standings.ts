import { Team, Match, GroupStanding, GroupId, KnockoutMode } from '../types/tournament';

/**
 * Calculates standings for a specific group according to official tournament rules:
 * 1. Most Wins
 * 2. Head-to-Head (if exactly 2 teams tie on wins)
 * 3. Highest Point Difference (PF - PA) (if 3+ teams tie on wins, or H2H equal/unplayed)
 * 4. Highest Total Points For (PF)
 * 5. Deterministic fallback (Team ID)
 */
export function calculateGroupStandings(
  groupId: GroupId,
  teams: Team[],
  matches: Match[],
  knockoutMode: KnockoutMode = 'top1_semis'
): GroupStanding[] {
  const groupTeams = teams.filter((t) => t.group === groupId);
  const groupMatches = matches.filter(
    (m) => m.group === groupId && m.status === 'completed'
  );

  // 1. Calculate raw stats for each team
  const statsMap = new Map<string, GroupStanding>();

  groupTeams.forEach((t) => {
    statsMap.set(t.id, {
      teamId: t.id,
      group: groupId,
      played: 0,
      won: 0,
      lost: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDiff: 0,
      rank: 1,
      tiebreakerNote: '',
      qualifiesKnockout: false,
    });
  });

  groupMatches.forEach((m) => {
    const statA = statsMap.get(m.teamA_id);
    const statB = statsMap.get(m.teamB_id);

    if (statA && statB) {
      statA.played += 1;
      statB.played += 1;

      statA.pointsFor += m.scoreA;
      statA.pointsAgainst += m.scoreB;
      statB.pointsFor += m.scoreB;
      statB.pointsAgainst += m.scoreA;

      if (m.winnerId === m.teamA_id) {
        statA.won += 1;
        statB.lost += 1;
      } else if (m.winnerId === m.teamB_id) {
        statB.won += 1;
        statA.lost += 1;
      }
    }
  });

  // Calculate point diffs
  statsMap.forEach((stat) => {
    stat.pointDiff = stat.pointsFor - stat.pointsAgainst;
  });

  const standingsList = Array.from(statsMap.values());

  // Count how many teams have each number of wins
  const winCounts = new Map<number, string[]>();
  standingsList.forEach((s) => {
    const list = winCounts.get(s.won) || [];
    list.push(s.teamId);
    winCounts.set(s.won, list);
  });

  // Helper to find head-to-head match between two teams
  const findHeadToHead = (teamId1: string, teamId2: string): Match | undefined => {
    return groupMatches.find(
      (m) =>
        (m.teamA_id === teamId1 && m.teamB_id === teamId2) ||
        (m.teamA_id === teamId2 && m.teamB_id === teamId1)
    );
  };

  // Sort comparator
  standingsList.sort((a, b) => {
    // 1. Most Wins
    if (a.won !== b.won) {
      return b.won - a.won;
    }

    const tiedTeamIds = winCounts.get(a.won) || [];

    // 2. Head-to-Head (if exactly 2 teams tie on wins)
    if (tiedTeamIds.length === 2) {
      const h2h = findHeadToHead(a.teamId, b.teamId);
      if (h2h && h2h.winnerId) {
        if (h2h.winnerId === a.teamId) {
          a.tiebreakerNote = `Won H2H vs ${teams.find((t) => t.id === b.teamId)?.name.split(' (')[0] || b.teamId}`;
          b.tiebreakerNote = `Lost H2H vs ${teams.find((t) => t.id === a.teamId)?.name.split(' (')[0] || a.teamId}`;
          return -1;
        } else if (h2h.winnerId === b.teamId) {
          b.tiebreakerNote = `Won H2H vs ${teams.find((t) => t.id === a.teamId)?.name.split(' (')[0] || a.teamId}`;
          a.tiebreakerNote = `Lost H2H vs ${teams.find((t) => t.id === b.teamId)?.name.split(' (')[0] || b.teamId}`;
          return 1;
        }
      }
    }

    // 3. Highest Point Difference (PF - PA)
    if (a.pointDiff !== b.pointDiff) {
      if (tiedTeamIds.length >= 3) {
        a.tiebreakerNote = `Point Diff: ${a.pointDiff > 0 ? '+' : ''}${a.pointDiff}`;
        b.tiebreakerNote = `Point Diff: ${b.pointDiff > 0 ? '+' : ''}${b.pointDiff}`;
      }
      return b.pointDiff - a.pointDiff;
    }

    // 4. Highest Total Points For (PF)
    if (a.pointsFor !== b.pointsFor) {
      a.tiebreakerNote = `Total Points: ${a.pointsFor} PF`;
      b.tiebreakerNote = `Total Points: ${b.pointsFor} PF`;
      return b.pointsFor - a.pointsFor;
    }

    // 5. Fallback deterministic
    return a.teamId.localeCompare(b.teamId);
  });

  // Assign ranks & qualification flags
  const qualifyingSlots = knockoutMode === 'top1_semis' ? 1 : 2;
  standingsList.forEach((stat, index) => {
    stat.rank = index + 1;
    stat.qualifiesKnockout = stat.rank <= qualifyingSlots;
  });

  return standingsList;
}

/**
 * Calculates standings across all 4 pools
 */
export function calculateAllStandings(
  teams: Team[],
  matches: Match[],
  knockoutMode: KnockoutMode = 'top1_semis'
): Record<GroupId, GroupStanding[]> {
  return {
    A: calculateGroupStandings('A', teams, matches, knockoutMode),
    B: calculateGroupStandings('B', teams, matches, knockoutMode),
    C: calculateGroupStandings('C', teams, matches, knockoutMode),
    D: calculateGroupStandings('D', teams, matches, knockoutMode),
  };
}
