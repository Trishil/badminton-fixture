export type GroupId = 'A' | 'B' | 'C' | 'D';

export interface Team {
  id: string; // e.g. "T1" to "T20"
  name: string; // e.g. "Team 1 (Player A & Player B)"
  group: GroupId;
  seed?: number;
}

export type MatchStatus = 'scheduled' | 'live' | 'completed';
export type MatchStage = 'group' | 'qf' | 'semi' | 'final';

export interface Match {
  matchId: string;
  court: 1 | 2;
  group: GroupId | 'Knockout';
  stage: MatchStage;
  round: number; // 1 to 5 for group stage, 1 for QF, 2 for Semi, 3 for Final
  matchNumber: number; // 1 to 40 for group stage, or KO match #
  teamA_id: string;
  teamB_id: string;
  scoreA: number;
  scoreB: number;
  status: MatchStatus;
  winnerId: string | null;
  startedAt?: number | null;
  completedAt?: number | null;
  courtAssigned?: 1 | 2;
}

export interface GroupStanding {
  teamId: string;
  group: GroupId;
  played: number;
  won: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  rank: number;
  tiebreakerNote?: string;
  qualifiesKnockout?: boolean;
}

export interface KnockoutMatch {
  id: string; // 'qf1', 'qf2', 'qf3', 'qf4', 'semi1', 'semi2', 'final'
  label: string; // e.g., "Semi-Final 1 (Court 1)"
  stage: 'qf' | 'semi' | 'final';
  court: 1 | 2;
  teamAId: string | null; // null if waiting for qualification
  teamBId: string | null;
  teamAPlaceholder: string; // e.g. "Winner Pool A"
  teamBPlaceholder: string; // e.g. "Winner Pool C"
  scoreA: number;
  scoreB: number;
  status: MatchStatus;
  winnerId: string | null;
}

export type KnockoutMode = 'top1_semis' | 'top2_quarters';

export interface CourtTimerState {
  secondsRemaining: number;
  isRunning: boolean;
  targetEndTime: number | null; // epoch timestamp when timer reaches 0
}

export interface TournamentSettings {
  tournamentStartTime: number; // timestamp when tournament began
  targetDurationMinutes: number; // 180 min (3 hours)
  matchTargetDurationMinutes: number; // 7 min
  pointsToWin: number; // 5
  suddenDeathAt: number; // 4
  knockoutMode: KnockoutMode;
  soundEnabled: boolean;
}

export type UserRole = 'coach' | 'spectator';
export type CloudSyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

