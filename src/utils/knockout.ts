import { KnockoutMatch, KnockoutMode, GroupStanding, GroupId } from '../types/tournament';

export function initializeKnockoutMatches(mode: KnockoutMode): KnockoutMatch[] {
  if (mode === 'top1_semis') {
    return [
      {
        id: 'semi1',
        label: 'Semi-Final 1 (Court 1)',
        stage: 'semi',
        court: 1,
        teamAId: null,
        teamBId: null,
        teamAPlaceholder: 'Winner Pool A',
        teamBPlaceholder: 'Winner Pool C',
        scoreA: 0,
        scoreB: 0,
        status: 'scheduled',
        winnerId: null,
      },
      {
        id: 'semi2',
        label: 'Semi-Final 2 (Court 2)',
        stage: 'semi',
        court: 2,
        teamAId: null,
        teamBId: null,
        teamAPlaceholder: 'Winner Pool B',
        teamBPlaceholder: 'Winner Pool D',
        scoreA: 0,
        scoreB: 0,
        status: 'scheduled',
        winnerId: null,
      },
      {
        id: 'final',
        label: 'Grand Championship Final (Court 1)',
        stage: 'final',
        court: 1,
        teamAId: null,
        teamBId: null,
        teamAPlaceholder: 'Winner Semi 1',
        teamBPlaceholder: 'Winner Semi 2',
        scoreA: 0,
        scoreB: 0,
        status: 'scheduled',
        winnerId: null,
      },
    ];
  } else {
    // Top 2 Quarters mode
    return [
      {
        id: 'qf1',
        label: 'Quarter-Final 1 (Court 1)',
        stage: 'qf',
        court: 1,
        teamAId: null,
        teamBId: null,
        teamAPlaceholder: 'Pool A Winner (A1)',
        teamBPlaceholder: 'Pool C Runner-up (C2)',
        scoreA: 0,
        scoreB: 0,
        status: 'scheduled',
        winnerId: null,
      },
      {
        id: 'qf2',
        label: 'Quarter-Final 2 (Court 2)',
        stage: 'qf',
        court: 2,
        teamAId: null,
        teamBId: null,
        teamAPlaceholder: 'Pool B Winner (B1)',
        teamBPlaceholder: 'Pool D Runner-up (D2)',
        scoreA: 0,
        scoreB: 0,
        status: 'scheduled',
        winnerId: null,
      },
      {
        id: 'qf3',
        label: 'Quarter-Final 3 (Court 1)',
        stage: 'qf',
        court: 1,
        teamAId: null,
        teamBId: null,
        teamAPlaceholder: 'Pool C Winner (C1)',
        teamBPlaceholder: 'Pool A Runner-up (A2)',
        scoreA: 0,
        scoreB: 0,
        status: 'scheduled',
        winnerId: null,
      },
      {
        id: 'qf4',
        label: 'Quarter-Final 4 (Court 2)',
        stage: 'qf',
        court: 2,
        teamAId: null,
        teamBId: null,
        teamAPlaceholder: 'Pool D Winner (D1)',
        teamBPlaceholder: 'Pool B Runner-up (B2)',
        scoreA: 0,
        scoreB: 0,
        status: 'scheduled',
        winnerId: null,
      },
      {
        id: 'semi1',
        label: 'Semi-Final 1 (Court 1)',
        stage: 'semi',
        court: 1,
        teamAId: null,
        teamBId: null,
        teamAPlaceholder: 'Winner QF1',
        teamBPlaceholder: 'Winner QF2',
        scoreA: 0,
        scoreB: 0,
        status: 'scheduled',
        winnerId: null,
      },
      {
        id: 'semi2',
        label: 'Semi-Final 2 (Court 2)',
        stage: 'semi',
        court: 2,
        teamAId: null,
        teamBId: null,
        teamAPlaceholder: 'Winner QF3',
        teamBPlaceholder: 'Winner QF4',
        scoreA: 0,
        scoreB: 0,
        status: 'scheduled',
        winnerId: null,
      },
      {
        id: 'final',
        label: 'Grand Championship Final (Court 1)',
        stage: 'final',
        court: 1,
        teamAId: null,
        teamBId: null,
        teamAPlaceholder: 'Winner Semi 1',
        teamBPlaceholder: 'Winner Semi 2',
        scoreA: 0,
        scoreB: 0,
        status: 'scheduled',
        winnerId: null,
      },
    ];
  }
}

/**
 * Updates knockout matches with teams determined by group stage standings
 * and advances winners through the bracket stages
 */
export function resolveKnockoutSeeds(
  currentMatches: KnockoutMatch[],
  standings: Record<GroupId, GroupStanding[]>,
  mode: KnockoutMode
): KnockoutMatch[] {
  // If pool matches aren't underway or need updating
  const getRankTeam = (group: GroupId, rank: number): string | null => {
    const list = standings[group];
    const found = list.find((s) => s.rank === rank);
    return found ? found.teamId : null;
  };

  const a1 = getRankTeam('A', 1);
  const a2 = getRankTeam('A', 2);
  const b1 = getRankTeam('B', 1);
  const b2 = getRankTeam('B', 2);
  const c1 = getRankTeam('C', 1);
  const c2 = getRankTeam('C', 2);
  const d1 = getRankTeam('D', 1);
  const d2 = getRankTeam('D', 2);

  const updated = currentMatches.map((m) => ({ ...m }));

  if (mode === 'top1_semis') {
    const s1 = updated.find((m) => m.id === 'semi1');
    const s2 = updated.find((m) => m.id === 'semi2');
    const fin = updated.find((m) => m.id === 'final');

    if (s1) {
      if (a1 && s1.teamAId !== a1) s1.teamAId = a1;
      if (c1 && s1.teamBId !== c1) s1.teamBId = c1;
    }
    if (s2) {
      if (b1 && s2.teamAId !== b1) s2.teamAId = b1;
      if (d1 && s2.teamBId !== d1) s2.teamBId = d1;
    }
    if (fin) {
      if (s1?.winnerId && fin.teamAId !== s1.winnerId) fin.teamAId = s1.winnerId;
      if (s2?.winnerId && fin.teamBId !== s2.winnerId) fin.teamBId = s2.winnerId;
    }
  } else {
    // top2_quarters
    const q1 = updated.find((m) => m.id === 'qf1');
    const q2 = updated.find((m) => m.id === 'qf2');
    const q3 = updated.find((m) => m.id === 'qf3');
    const q4 = updated.find((m) => m.id === 'qf4');
    const s1 = updated.find((m) => m.id === 'semi1');
    const s2 = updated.find((m) => m.id === 'semi2');
    const fin = updated.find((m) => m.id === 'final');

    if (q1) {
      if (a1) q1.teamAId = a1;
      if (c2) q1.teamBId = c2;
    }
    if (q2) {
      if (b1) q2.teamAId = b1;
      if (d2) q2.teamBId = d2;
    }
    if (q3) {
      if (c1) q3.teamAId = c1;
      if (a2) q3.teamBId = a2;
    }
    if (q4) {
      if (d1) q4.teamAId = d1;
      if (b2) q4.teamBId = b2;
    }

    if (s1) {
      if (q1?.winnerId) s1.teamAId = q1.winnerId;
      if (q2?.winnerId) s1.teamBId = q2.winnerId;
    }
    if (s2) {
      if (q3?.winnerId) s2.teamAId = q3.winnerId;
      if (q4?.winnerId) s2.teamBId = q4.winnerId;
    }
    if (fin) {
      if (s1?.winnerId) fin.teamAId = s1.winnerId;
      if (s2?.winnerId) fin.teamBId = s2.winnerId;
    }
  }

  return updated;
}
