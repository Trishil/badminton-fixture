import { Team, TournamentSettings, GroupId } from '../types/tournament';

export const DEFAULT_TEAMS: Team[] = [
  // Pool A (T1 to T5)
  { id: 'T1', name: 'Mitraj & Yuvraj', group: 'A', seed: 1 },
  { id: 'T2', name: 'Dev & Het', group: 'A', seed: 2 },
  { id: 'T3', name: 'Krish J & Yograj', group: 'A', seed: 3 },
  { id: 'T4', name: 'Adityaraj & Chahat', group: 'A', seed: 4 },
  { id: 'T5', name: 'Priyansh & Ved', group: 'A', seed: 5 },

  // Pool B (T6 to T10)
  { id: 'T6', name: 'Ashvin & Levistan', group: 'B', seed: 1 },
  { id: 'T7', name: 'Vivek & Dhruv', group: 'B', seed: 2 },
  { id: 'T8', name: 'Krishiv & Trishil', group: 'B', seed: 3 },
  { id: 'T9', name: 'Chitrarth & Bhavya', group: 'B', seed: 4 },
  { id: 'T10', name: 'Ronit & Bhavesh', group: 'B', seed: 5 },

  // Pool C (T11 to T15)
  { id: 'T11', name: 'Krish S & Kautilya', group: 'C', seed: 1 },
  { id: 'T12', name: 'Shiv & Jaimin', group: 'C', seed: 2 },
  { id: 'T13', name: 'Hitesh & Nikhil', group: 'C', seed: 3 },
  { id: 'T14', name: 'Naimish & Tirth', group: 'C', seed: 4 },
  { id: 'T15', name: 'Aditya V & Om R', group: 'C', seed: 5 },

  // Pool D (T16 to T20)
  { id: 'T16', name: 'Team 16', group: 'D', seed: 1 },
  { id: 'T17', name: 'Team 17', group: 'D', seed: 2 },
  { id: 'T18', name: 'Team 18', group: 'D', seed: 3 },
  { id: 'T19', name: 'Team 19', group: 'D', seed: 4 },
  { id: 'T20', name: 'Team 20', group: 'D', seed: 5 },
];

export const PRO_PAIRS_PRESET: Array<{ id: string; name: string; group: GroupId }> = [
  // Pool A
  { id: 'T1', name: 'Mitraj & Yuvraj', group: 'A' },
  { id: 'T2', name: 'Dev & Het', group: 'A' },
  { id: 'T3', name: 'Krish J & Yograj', group: 'A' },
  { id: 'T4', name: 'Adityaraj & Chahat', group: 'A' },
  { id: 'T5', name: 'Priyansh & Ved', group: 'A' },

  // Pool B
  { id: 'T6', name: 'Ashvin & Levistan', group: 'B' },
  { id: 'T7', name: 'Vivek & Dhruv', group: 'B' },
  { id: 'T8', name: 'Krishiv & Trishil', group: 'B' },
  { id: 'T9', name: 'Chitrarth & Bhavya', group: 'B' },
  { id: 'T10', name: 'Ronit & Bhavesh', group: 'B' },

  // Pool C
  { id: 'T11', name: 'Krish S & Kautilya', group: 'C' },
  { id: 'T12', name: 'Shiv & Jaimin', group: 'C' },
  { id: 'T13', name: 'Hitesh & Nikhil', group: 'C' },
  { id: 'T14', name: 'Naimish & Tirth', group: 'C' },
  { id: 'T15', name: 'Aditya V & Om R', group: 'C' },

  // Pool D
  { id: 'T16', name: 'Team 16', group: 'D' },
  { id: 'T17', name: 'Team 17', group: 'D' },
  { id: 'T18', name: 'Team 18', group: 'D' },
  { id: 'T19', name: 'Team 19', group: 'D' },
  { id: 'T20', name: 'Team 20', group: 'D' },
];

import { getToday2PMTimestamp } from './timing';

export const DEFAULT_SETTINGS: TournamentSettings = {
  tournamentStartTime: getToday2PMTimestamp(), // Today at 2:00 PM
  isTournamentStarted: false,
  targetDurationMinutes: 180, // 3 hours total tournament window
  matchTargetDurationMinutes: 7, // 7 min countdown
  matchSlotMinutes: 8, // 8 min slot (7 min match + 1 min turnaround)
  pointsToWin: 5,
  suddenDeathAt: 4,
  knockoutMode: 'top1_semis',
  soundEnabled: true,
};
