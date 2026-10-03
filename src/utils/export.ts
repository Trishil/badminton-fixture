import { Team, Match, GroupStanding, GroupId } from '../types/tournament';

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportTournamentToJSON(data: unknown, filename = 'badminton_tournament_backup.json'): void {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, filename, 'application/json');
}

export function exportStandingsToCSV(
  standings: Record<GroupId, GroupStanding[]>,
  teams: Team[],
  filename = 'badminton_standings.csv'
): void {
  const teamMap = new Map(teams.map((t) => [t.id, t.name]));
  const headers = ['Pool', 'Rank', 'Team ID', 'Team Name', 'Played', 'Won', 'Lost', 'Points For (PF)', 'Points Against (PA)', 'Point Diff', 'Tiebreaker Note'];

  const rows: string[] = [headers.join(',')];

  (['A', 'B', 'C', 'D'] as GroupId[]).forEach((group) => {
    const list = standings[group] || [];
    list.forEach((s) => {
      const teamName = `"${(teamMap.get(s.teamId) || s.teamId).replace(/"/g, '""')}"`;
      const note = `"${(s.tiebreakerNote || '').replace(/"/g, '""')}"`;
      rows.push([
        s.group,
        s.rank,
        s.teamId,
        teamName,
        s.played,
        s.won,
        s.lost,
        s.pointsFor,
        s.pointsAgainst,
        s.pointDiff,
        note,
      ].join(','));
    });
  });

  downloadFile(rows.join('\n'), filename, 'text/csv;charset=utf-8;');
}

export function exportFixturesToCSV(
  matches: Match[],
  teams: Team[],
  filename = 'badminton_fixtures.csv'
): void {
  const teamMap = new Map(teams.map((t) => [t.id, t.name]));
  const headers = ['Match ID', 'Number', 'Stage', 'Pool', 'Court', 'Round', 'Team A', 'Team B', 'Score A', 'Score B', 'Status', 'Winner'];

  const rows: string[] = [headers.join(',')];

  matches.forEach((m) => {
    const nameA = `"${(teamMap.get(m.teamA_id) || m.teamA_id).replace(/"/g, '""')}"`;
    const nameB = `"${(teamMap.get(m.teamB_id) || m.teamB_id).replace(/"/g, '""')}"`;
    const winnerName = m.winnerId ? `"${(teamMap.get(m.winnerId) || m.winnerId).replace(/"/g, '""')}"` : '""';

    rows.push([
      m.matchId,
      m.matchNumber,
      m.stage,
      m.group,
      m.court,
      m.round,
      nameA,
      nameB,
      m.scoreA,
      m.scoreB,
      m.status,
      winnerName,
    ].join(','));
  });

  downloadFile(rows.join('\n'), filename, 'text/csv;charset=utf-8;');
}
